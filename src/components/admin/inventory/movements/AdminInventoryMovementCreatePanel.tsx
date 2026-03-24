"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminInventoryOverview,
  submitCreateStockMovement,
  submitTransferStock,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import {
  AdminInventoryMovementCreateSnapshotView,
  type AdminInventoryMovementFormState,
  type AdminInventoryTransferFormState,
} from "./AdminInventoryMovementCreateSnapshotView";

function parsePositiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to create stock movement right now.";
}

export function AdminInventoryMovementCreatePanel() {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const [movementForm, setMovementForm] = useState<AdminInventoryMovementFormState>({
    movementType: "add",
    inventoryItemId: "",
    quantity: "",
    adjustToQuantity: "",
    flatId: "",
    reason: "",
    notes: "",
  });

  const [transferForm, setTransferForm] = useState<AdminInventoryTransferFormState>({
    inventoryItemId: "",
    quantity: "",
    fromFlatId: "",
    toFlatId: "",
    reason: "",
    notes: "",
  });

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);

      const defaultItemId = next.inventoryCatalog[0]?.id ?? "";
      setMovementForm((current) => ({
        ...current,
        inventoryItemId: current.inventoryItemId || defaultItemId,
      }));
      setTransferForm((current) => ({
        ...current,
        inventoryItemId: current.inventoryItemId || defaultItemId,
      }));
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const itemOptions = useMemo(
    () =>
      (overview?.inventoryCatalog ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      })),
    [overview]
  );

  async function handleCreateMovement(): Promise<void> {
    if (isSubmitting || movementForm.inventoryItemId.length === 0 || movementForm.reason.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const quantity = parsePositiveInteger(movementForm.quantity);
      const adjustToQuantity = parseNonNegativeInteger(movementForm.adjustToQuantity);

      await submitCreateStockMovement({
        movementType: movementForm.movementType,
        inventoryItemId: movementForm.inventoryItemId,
        quantity,
        adjustToQuantity,
        flatId: movementForm.flatId || null,
        reason: movementForm.reason,
        notes: movementForm.notes.trim().length > 0 ? movementForm.notes.trim() : null,
        actorId: null,
      });

      setNotice({ tone: "ok", message: "Stock movement recorded." });
      setMovementForm((current) => ({
        ...current,
        quantity: "",
        adjustToQuantity: "",
        notes: "",
      }));
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateTransfer(): Promise<void> {
    if (isSubmitting || transferForm.inventoryItemId.length === 0 || transferForm.reason.trim().length === 0) {
      return;
    }

    const quantity = parsePositiveInteger(transferForm.quantity);
    if (quantity === null) {
      setNotice({ tone: "error", message: "Transfer quantity must be a positive integer." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitTransferStock({
        inventoryItemId: transferForm.inventoryItemId,
        quantity,
        fromFlatId: transferForm.fromFlatId || null,
        toFlatId: transferForm.toFlatId || null,
        reason: transferForm.reason,
        notes: transferForm.notes.trim().length > 0 ? transferForm.notes.trim() : null,
        actorId: null,
      });

      setNotice({ tone: "ok", message: "Stock transfer recorded." });
      setTransferForm((current) => ({
        ...current,
        quantity: "",
        notes: "",
      }));
      await loadOverview();
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Movement Actions
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Record add, consume, adjust, and transfer actions through the stock movement service.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <button type="button" className="btn btn-outline-primary" onClick={() => void loadOverview()} disabled={isLoading || isSubmitting}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading movement form...</div>
      ) : itemOptions.length === 0 ? (
        <div className="booking-inline-note booking-inline-note-muted">
          Add inventory catalog items before recording movements.
        </div>
      ) : (
        <AdminInventoryMovementCreateSnapshotView
          itemOptions={itemOptions}
          movementForm={movementForm}
          transferForm={transferForm}
          isSubmitting={isSubmitting}
          onMovementChange={(field, value) => {
            setMovementForm((current) => ({
              ...current,
              [field]: value,
            }));
          }}
          onTransferChange={(field, value) => {
            setTransferForm((current) => ({
              ...current,
              [field]: value,
            }));
          }}
          onCreateMovement={handleCreateMovement}
          onCreateTransfer={handleCreateTransfer}
        />
      )}
    </div>
  );
}
