"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchAdminInventoryOverview,
  submitClearFlatReadinessOverride,
  submitFlatInventoryReconciliationAction,
  submitSetFlatReadinessOverride,
  type AdminFlatInventoryEntry,
  type AdminFlatInventoryReconciliationAction,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import { parseNonNegativeInteger } from "./admin-flat-inventory-view-model";
import { AdminInventoryFlatDetailSnapshotView } from "./AdminInventoryFlatDetailSnapshotView";
import type { FlatId } from "@/types/booking";

interface AdminInventoryFlatDetailPanelProps {
  flatId: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete flat inventory action right now.";
}

function normalizeFlatId(value: string): FlatId | null {
  if (value === "mayfair" || value === "windsor" || value === "kensington") {
    return value;
  }

  return null;
}

export function AdminInventoryFlatDetailPanel({ flatId }: AdminInventoryFlatDetailPanelProps) {
  const normalizedFlatId = normalizeFlatId(flatId);

  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [overrideStatusDraft, setOverrideStatusDraft] = useState<"ready" | "needs_attention" | "out_of_service">(
    "needs_attention"
  );
  const [overrideReasonDraft, setOverrideReasonDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchAdminInventoryOverview();
      const flatInventory = Array.isArray(next?.flatInventory) ? next.flatInventory : [];
      const readinessEntries = Array.isArray(next?.readiness) ? next.readiness : [];

      setOverview(next);

      if (normalizedFlatId) {
        const flatRecordCandidate = flatInventory.find((entry) => entry.flatId === normalizedFlatId)?.records;
        const flatRecords = Array.isArray(flatRecordCandidate) ? flatRecordCandidate : [];

        setQuantityDrafts(
          Object.fromEntries(flatRecords.map((record) => [record.id, String(record.currentQuantity)]))
        );
        setNoteDrafts(
          Object.fromEntries(flatRecords.map((record) => [record.id, record.notes ?? ""]))
        );

        const readiness = readinessEntries.find((entry) => entry.flatId === normalizedFlatId)?.readiness ?? null;
        if (readiness?.overrideStatus) {
          setOverrideStatusDraft(readiness.overrideStatus);
          setOverrideReasonDraft(readiness.overrideReason ?? "");
        }
      }

      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [normalizedFlatId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleAction(input: {
    record: AdminFlatInventoryEntry;
    action: AdminFlatInventoryReconciliationAction;
  }): Promise<void> {
    if (!normalizedFlatId) {
      return;
    }

    const quantityDraft = quantityDrafts[input.record.id] ?? String(input.record.currentQuantity);
    const noteDraft = noteDrafts[input.record.id] ?? "";

    const parsedQuantity = parseNonNegativeInteger(quantityDraft);

    let quantityForAction: number | undefined;
    if (input.action === "adjust_quantity") {
      quantityForAction = parsedQuantity === null ? undefined : parsedQuantity;
    }

    if (input.action === "restocked_now") {
      quantityForAction =
        parsedQuantity !== null && parsedQuantity !== input.record.currentQuantity ? parsedQuantity : undefined;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitFlatInventoryReconciliationAction({
        flatId: normalizedFlatId,
        flatInventoryId: input.record.id,
        action: input.action,
        quantity: quantityForAction,
        note: noteDraft.trim().length > 0 ? noteDraft : null,
      });

      setNotice({ tone: "ok", message: "Flat inventory reconciliation saved." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetOverride(): Promise<void> {
    if (!normalizedFlatId) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitSetFlatReadinessOverride({
        flatId: normalizedFlatId,
        overrideStatus: overrideStatusDraft,
        reason: overrideReasonDraft,
      });

      setNotice({ tone: "ok", message: "Readiness override applied." });
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClearOverride(): Promise<void> {
    if (!normalizedFlatId) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitClearFlatReadinessOverride({
        flatId: normalizedFlatId,
      });

      setNotice({ tone: "ok", message: "Readiness override cleared." });
      setOverrideReasonDraft("");
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!normalizedFlatId) {
    return <div className="booking-inline-note booking-inline-note-muted">Invalid flat id.</div>;
  }

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Flat Inventory Reconciliation
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Reconcile expected versus observed inventory, record provenance, and keep readiness state operationally truthful.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              void loadOverview();
            }}
            disabled={isLoading || isSubmitting}
          >
            {isLoading ? "Refreshing..." : "Refresh Flat"}
          </button>
        </div>
      </section>

      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading flat inventory detail...</div>
      ) : !overview ? (
        <div className="booking-inline-note booking-inline-note-muted">Flat inventory detail is unavailable.</div>
      ) : (
        <AdminInventoryFlatDetailSnapshotView
          overview={overview}
          flatId={normalizedFlatId}
          quantityDrafts={quantityDrafts}
          noteDrafts={noteDrafts}
          overrideStatusDraft={overrideStatusDraft}
          overrideReasonDraft={overrideReasonDraft}
          isSubmitting={isSubmitting}
          onQuantityDraftChange={(recordId, value) => {
            setQuantityDrafts((current) => ({
              ...current,
              [recordId]: value,
            }));
          }}
          onNoteDraftChange={(recordId, value) => {
            setNoteDrafts((current) => ({
              ...current,
              [recordId]: value,
            }));
          }}
          onOverrideStatusDraftChange={setOverrideStatusDraft}
          onOverrideReasonDraftChange={setOverrideReasonDraft}
          onAction={handleAction}
          onSetOverride={handleSetOverride}
          onClearOverride={handleClearOverride}
        />
      )}
    </div>
  );
}



