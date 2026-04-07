"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createAdminIdempotencyKey,
  fetchPendingPosReservations,
  fetchPendingTransferReservations,
  submitPosConfirmation,
  submitReservationCancellation,
  submitTransferVerification,
  type AdminPosReservation,
  type AdminTransferReservation,
} from "@/lib/admin-bookings-api";

import {
  buildActionKey,
  formatHoldExpiry,
  formatReservationStatusLabel,
  isActionDisabled,
  type StaffActionIntent,
} from "./admin-bookings-view-model";

interface UiNotice {
  tone: "ok" | "error";
  message: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete the action right now.";
}

function formatLagosDate(value: string): string | null {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatLagosDateRange(checkIn: string, checkOut: string): string {
  const formattedCheckIn = formatLagosDate(checkIn);
  const formattedCheckOut = formatLagosDate(checkOut);

  if (formattedCheckIn && formattedCheckOut) {
    return `${formattedCheckIn} to ${formattedCheckOut}`;
  }

  return "Dates unavailable";
}

function statusClassName(status: string): string {
  if (status === "awaiting_transfer_verification" || status === "pending_transfer_submission") {
    return "admin-status-pill admin-status-pending-transfer";
  }

  if (status === "pending_pos_coordination") {
    return "admin-status-pill admin-status-pending-pos";
  }

  if (status === "confirmed") {
    return "admin-status-pill admin-status-confirmed";
  }

  if (status === "cancelled") {
    return "admin-status-pill admin-status-cancelled";
  }

  return "admin-status-pill";
}

interface StaffActionButtonProps {
  reservationId: string;
  action: StaffActionIntent;
  requiresStaffId: boolean;
  staffId: string;
  inFlightActionKey: string | null;
  isSubmittingAnyAction: boolean;
}

function getActionState(input: StaffActionButtonProps) {
  const actionKey = buildActionKey(input.reservationId, input.action);
  const isSubmittingThisAction = input.inFlightActionKey === actionKey;

  const disabled =
    input.isSubmittingAnyAction ||
    isActionDisabled({
      inFlightActionKey: input.inFlightActionKey,
      action: input.action,
      reservationId: input.reservationId,
      requiresStaffId: input.requiresStaffId,
      staffId: input.staffId,
    });

  return {
    actionKey,
    disabled,
    isSubmittingThisAction,
  };
}

export function AdminBookingsPanel() {
  const [transferReservations, setTransferReservations] = useState<AdminTransferReservation[]>([]);
  const [posReservations, setPosReservations] = useState<AdminPosReservation[]>([]);
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});

  const [staffId, setStaffId] = useState("staff_ops_1");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inFlightActionKey, setInFlightActionKey] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<UiNotice | null>(null);

  const isSubmittingAnyAction = inFlightActionKey !== null;

  async function loadQueues(mode: "initial" | "refresh" = "refresh"): Promise<void> {
    if (mode === "initial") {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [transfer, pos] = await Promise.all([
        fetchPendingTransferReservations(),
        fetchPendingPosReservations(),
      ]);

      setTransferReservations(Array.isArray(transfer) ? transfer : []);
      setPosReservations(Array.isArray(pos) ? pos : []);
      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      if (mode === "initial") {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    void loadQueues("initial");
  }, []);

  async function runAction(input: {
    actionKey: string;
    successMessage: string;
    task: () => Promise<void>;
  }): Promise<void> {
    if (isSubmittingAnyAction) {
      return;
    }

    setNotice(null);
    setInFlightActionKey(input.actionKey);

    try {
      await input.task();
      setNotice({
        tone: "ok",
        message: input.successMessage,
      });
      await loadQueues("refresh");
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setInFlightActionKey(null);
    }
  }

  async function handleVerifyTransfer(reservation: AdminTransferReservation): Promise<void> {
    const action = getActionState({
      reservationId: reservation.reservationId,
      action: "verify_transfer",
      requiresStaffId: true,
      staffId,
      inFlightActionKey,
      isSubmittingAnyAction,
    });

    const idempotencyKey = createAdminIdempotencyKey("staff-transfer-verify");

    await runAction({
      actionKey: action.actionKey,
      successMessage: `Transfer verified for ${reservation.reservationId}.`,
      task: async () => {
        await submitTransferVerification({
          token: reservation.token,
          staffId: staffId.trim(),
          verificationNote: verificationNotes[reservation.reservationId]?.trim() || undefined,
          idempotencyKey,
        });
      },
    });
  }

  async function handleConfirmPos(reservation: AdminPosReservation): Promise<void> {
    const action = getActionState({
      reservationId: reservation.reservationId,
      action: "confirm_pos",
      requiresStaffId: true,
      staffId,
      inFlightActionKey,
      isSubmittingAnyAction,
    });

    const idempotencyKey = createAdminIdempotencyKey("staff-pos-confirm");

    await runAction({
      actionKey: action.actionKey,
      successMessage: `POS payment confirmed for ${reservation.reservationId}.`,
      task: async () => {
        await submitPosConfirmation({
          token: reservation.token,
          staffId: staffId.trim(),
          idempotencyKey,
        });
      },
    });
  }

  async function handleCancelReservation(token: string, reservationId: string): Promise<void> {
    const actionKey = buildActionKey(reservationId, "cancel_reservation");
    const idempotencyKey = createAdminIdempotencyKey("staff-reservation-cancel");

    await runAction({
      actionKey,
      successMessage: `Reservation ${reservationId} cancelled.`,
      task: async () => {
        await submitReservationCancellation({
          token,
          idempotencyKey,
        });
      },
    });
  }

  const transferCountLabel = useMemo(
    () => `${transferReservations.length} pending`,
    [transferReservations.length]
  );
  const posCountLabel = useMemo(() => `${posReservations.length} pending`, [posReservations.length]);

  return (
    <div className="admin-bookings-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Staff Actions
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Verify transfers, confirm POS payments, and cancel reservations without leaving this queue.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <label className="admin-label" htmlFor="staff-id-input">
            Staff ID
          </label>
          <input
            id="staff-id-input"
            className="standard-input admin-staff-input"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            placeholder="staff_ops_1"
          />
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isInitialLoading || isRefreshing || isSubmittingAnyAction}
            onClick={() => void loadQueues("refresh")}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Queues"}
          </button>
        </div>
      </section>

      {notice && (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      )}

      {loadError && <div className="booking-inline-note booking-inline-note-muted">{loadError}</div>}

      <section className="admin-bookings-section" aria-labelledby="pending-transfer-heading">
        <div className="admin-bookings-section-header">
          <h3 id="pending-transfer-heading" className="heading-sm" style={{ margin: 0 }}>
            Pending Transfer Reservations
          </h3>
          <span className="admin-count-pill">{transferCountLabel}</span>
        </div>

        {isInitialLoading ? (
          <p className="text-secondary">Loading transfer queue...</p>
        ) : transferReservations.length === 0 ? (
          <p className="text-secondary">No pending transfer reservations.</p>
        ) : (
          <div className="admin-bookings-list">
            {transferReservations.map((reservation) => {
              const verifyAction = getActionState({
                reservationId: reservation.reservationId,
                action: "verify_transfer",
                requiresStaffId: true,
                staffId,
                inFlightActionKey,
                isSubmittingAnyAction,
              });

              const cancelAction = getActionState({
                reservationId: reservation.reservationId,
                action: "cancel_reservation",
                requiresStaffId: false,
                staffId,
                inFlightActionKey,
                isSubmittingAnyAction,
              });

              const holdExpiry = formatHoldExpiry(reservation.holdExpiresAt);

              return (
                <article key={reservation.reservationId} className="admin-bookings-card">
                  <div className="admin-bookings-card-header">
                    <div>
                      <p className="admin-card-title">{reservation.reservationId}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        Token: {reservation.token}
                      </p>
                    </div>
                    <span className={statusClassName(reservation.status)}>
                      {formatReservationStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="admin-bookings-meta-grid">
                    <div>
                      <p className="admin-meta-label">Guest</p>
                      <p>{reservation.guestName || "Guest"}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {reservation.guestEmail || "Email not provided"}
                      </p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {reservation.guestPhone || "Phone not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Stay</p>
                      <p>{reservation.flatId}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {formatLagosDateRange(reservation.checkIn, reservation.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Hold Expiry</p>
                      <p className={`admin-hold-pill admin-hold-${holdExpiry.tone}`}>{holdExpiry.label}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        Reference: {reservation.transferReference ?? "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="admin-bookings-actions admin-bookings-actions-stack">
                    <input
                      className="standard-input"
                      value={verificationNotes[reservation.reservationId] ?? ""}
                      onChange={(event) =>
                        setVerificationNotes((current) => ({
                          ...current,
                          [reservation.reservationId]: event.target.value,
                        }))
                      }
                      placeholder="Optional verification note"
                    />

                    <div className="admin-bookings-actions-row">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={verifyAction.disabled}
                        onClick={() => void handleVerifyTransfer(reservation)}
                      >
                        {verifyAction.isSubmittingThisAction ? "Verifying..." : "Verify Transfer"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary admin-btn-danger"
                        disabled={cancelAction.disabled}
                        onClick={() => void handleCancelReservation(reservation.token, reservation.reservationId)}
                      >
                        {cancelAction.isSubmittingThisAction ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="pending-pos-heading">
        <div className="admin-bookings-section-header">
          <h3 id="pending-pos-heading" className="heading-sm" style={{ margin: 0 }}>
            Pending POS Reservations
          </h3>
          <span className="admin-count-pill">{posCountLabel}</span>
        </div>

        {isInitialLoading ? (
          <p className="text-secondary">Loading POS queue...</p>
        ) : posReservations.length === 0 ? (
          <p className="text-secondary">No pending POS reservations.</p>
        ) : (
          <div className="admin-bookings-list">
            {posReservations.map((reservation) => {
              const confirmAction = getActionState({
                reservationId: reservation.reservationId,
                action: "confirm_pos",
                requiresStaffId: true,
                staffId,
                inFlightActionKey,
                isSubmittingAnyAction,
              });

              const cancelAction = getActionState({
                reservationId: reservation.reservationId,
                action: "cancel_reservation",
                requiresStaffId: false,
                staffId,
                inFlightActionKey,
                isSubmittingAnyAction,
              });

              return (
                <article key={reservation.reservationId} className="admin-bookings-card">
                  <div className="admin-bookings-card-header">
                    <div>
                      <p className="admin-card-title">{reservation.reservationId}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        Token: {reservation.token}
                      </p>
                    </div>
                    <span className={statusClassName(reservation.status)}>
                      {formatReservationStatusLabel(reservation.status)}
                    </span>
                  </div>

                  <div className="admin-bookings-meta-grid">
                    <div>
                      <p className="admin-meta-label">Guest</p>
                      <p>{reservation.guestName || "Guest"}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {reservation.guestEmail || "Email not provided"}
                      </p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {reservation.guestPhone || "Phone not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Stay</p>
                      <p>{reservation.flatId}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        {formatLagosDateRange(reservation.checkIn, reservation.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Coordination</p>
                      <p>{reservation.contactWindow ?? "Not provided"}</p>
                      <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                        Status: {formatReservationStatusLabel(reservation.coordinationStatus ?? "requested")}
                      </p>
                    </div>
                  </div>

                  <div className="admin-bookings-actions admin-bookings-actions-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={confirmAction.disabled}
                      onClick={() => void handleConfirmPos(reservation)}
                    >
                      {confirmAction.isSubmittingThisAction ? "Confirming..." : "Confirm POS Payment"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary admin-btn-danger"
                      disabled={cancelAction.disabled}
                      onClick={() => void handleCancelReservation(reservation.token, reservation.reservationId)}
                    >
                      {cancelAction.isSubmittingThisAction ? "Cancelling..." : "Cancel Reservation"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
