"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminInventoryOverview,
  submitUpdateInventoryItem,
  type AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import { formatLagosDateTime, formatMovementTypeLabel } from "@/components/admin/inventory/admin-inventory-view-model";
import {
  AdminInventoryItemCreateSnapshotView,
  type AdminInventoryItemFormState,
} from "./AdminInventoryItemCreateSnapshotView";

interface AdminInventoryItemDetailPanelProps {
  itemId: string;
}

function parseOptionalInteger(value: string): number | null {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to update inventory item right now.";
}

function toFormState(overview: AdminInventoryOverview, itemId: string): AdminInventoryItemFormState | null {
  const item = overview.inventoryCatalog.find((entry) => entry.id === itemId);
  if (!item) {
    return null;
  }

  return {
    name: item.name,
    category: item.category,
    unitOfMeasure: item.unitOfMeasure,
    internalCode: item.internalCode ?? "",
    reorderThreshold: item.reorderThreshold === null ? "" : String(item.reorderThreshold),
    parLevel: item.parLevel === null ? "" : String(item.parLevel),
    criticality: item.criticality,
  };
}

export function AdminInventoryItemDetailPanel({ itemId }: AdminInventoryItemDetailPanelProps) {
  const [overview, setOverview] = useState<AdminInventoryOverview | null>(null);
  const [form, setForm] = useState<AdminInventoryItemFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);

    try {
      const next = await fetchAdminInventoryOverview();
      setOverview(next);
      setForm(toFormState(next, itemId));
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const flatUsage = useMemo(() => {
    if (!overview) {
      return [] as Array<{
        flatId: string;
        flatName: string;
        expectedQuantity: number;
        currentQuantity: number;
        conditionStatus: string;
      }>;
    }

    const entries: Array<{
      flatId: string;
      flatName: string;
      expectedQuantity: number;
      currentQuantity: number;
      conditionStatus: string;
    }> = [];

    for (const flat of overview.flatInventory) {
      const record = flat.records.find((entry) => entry.inventoryItemId === itemId);
      if (!record) {
        continue;
      }

      entries.push({
        flatId: flat.flatId,
        flatName: flat.flatName,
        expectedQuantity: record.expectedQuantity,
        currentQuantity: record.currentQuantity,
        conditionStatus: record.conditionStatus,
      });
    }

    return entries;
  }, [itemId, overview]);

  const recentMovements = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.stockMovements.filter((movement) => movement.inventoryItemId === itemId).slice(0, 12);
  }, [itemId, overview]);

  async function handleSave(): Promise<void> {
    if (!form || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitUpdateInventoryItem({
        itemId,
        name: form.name,
        category: form.category,
        unitOfMeasure: form.unitOfMeasure,
        internalCode: form.internalCode.trim().length > 0 ? form.internalCode.trim() : null,
        reorderThreshold: parseOptionalInteger(form.reorderThreshold),
        parLevel: parseOptionalInteger(form.parLevel),
        criticality: form.criticality,
      });

      setNotice({ tone: "ok", message: "Inventory item updated." });
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
            Item Operations
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Keep item definitions current and review where this item affects flat readiness work.
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
        <div className="booking-inline-note booking-inline-note-soft">Loading item detail...</div>
      ) : !overview || !form ? (
        <div className="booking-inline-note booking-inline-note-muted">Inventory item not found.</div>
      ) : (
        <>
          <AdminInventoryItemCreateSnapshotView
            form={form}
            isSubmitting={isSubmitting}
            onChange={(field, value) => {
              setForm((current) => {
                if (!current) {
                  return current;
                }

                return {
                  ...current,
                  [field]: value,
                };
              });
            }}
            onSubmit={handleSave}
            heading="Edit Inventory Item"
            submitLabel="Save Item"
          />

          <section className="admin-bookings-section" aria-labelledby="item-flat-usage-heading">
            <div className="admin-bookings-section-header">
              <h2 id="item-flat-usage-heading" className="heading-sm" style={{ margin: 0 }}>
                Flat Usage
              </h2>
              <span className="admin-count-pill">{flatUsage.length} flats</span>
            </div>

            {flatUsage.length === 0 ? (
              <p className="text-secondary">This item is not assigned to flat inventory yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Flat</th>
                      <th>Expected</th>
                      <th>Current</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatUsage.map((entry) => (
                      <tr key={entry.flatId}>
                        <td>{entry.flatName}</td>
                        <td>{entry.expectedQuantity}</td>
                        <td>{entry.currentQuantity}</td>
                        <td>{entry.conditionStatus.replaceAll("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-bookings-section" aria-labelledby="item-movement-history-heading">
            <div className="admin-bookings-section-header">
              <h2 id="item-movement-history-heading" className="heading-sm" style={{ margin: 0 }}>
                Recent Movements
              </h2>
              <span className="admin-count-pill">{recentMovements.length} entries</span>
            </div>

            {recentMovements.length === 0 ? (
              <p className="text-secondary">No movement history for this item yet.</p>
            ) : (
              <div className="admin-bookings-list">
                {recentMovements.map((movement) => (
                  <article key={movement.id} className="admin-bookings-card">
                    <div className="admin-bookings-card-header">
                      <p className="admin-card-title">{formatMovementTypeLabel(movement.movementType)}</p>
                      <span className="admin-status-pill">{movement.quantity}</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                      {movement.contextLabel} � {movement.reason}
                    </p>
                    <p className="text-secondary" style={{ fontSize: "0.78rem" }}>
                      {formatLagosDateTime(movement.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
