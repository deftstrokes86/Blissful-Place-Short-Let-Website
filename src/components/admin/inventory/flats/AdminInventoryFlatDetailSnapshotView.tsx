import type {
  AdminFlatInventoryEntry,
  AdminFlatInventoryReconciliationAction,
  AdminInventoryOverview,
} from "@/lib/admin-inventory-api";
import {
  formatConditionStatusLabel,
  formatLagosDateTime,
  formatMovementTypeLabel,
  formatReadinessStatusLabel,
  getReadinessStatusClassName,
  getSeverityClassName,
} from "../admin-inventory-view-model";
import { canRestock, formatNonReadyReasons, parseNonNegativeInteger } from "./admin-flat-inventory-view-model";

interface AdminInventoryFlatDetailSnapshotViewProps {
  overview: AdminInventoryOverview;
  flatId: "windsor" | "kensington" | "mayfair";
  quantityDrafts: Record<string, string>;
  noteDrafts: Record<string, string>;
  overrideStatusDraft: "ready" | "needs_attention" | "out_of_service";
  overrideReasonDraft: string;
  isSubmitting: boolean;
  onQuantityDraftChange: (recordId: string, value: string) => void;
  onNoteDraftChange: (recordId: string, value: string) => void;
  onOverrideStatusDraftChange: (value: "ready" | "needs_attention" | "out_of_service") => void;
  onOverrideReasonDraftChange: (value: string) => void;
  onAction: (input: {
    record: AdminFlatInventoryEntry;
    action: AdminFlatInventoryReconciliationAction;
  }) => Promise<void>;
  onSetOverride: () => Promise<void>;
  onClearOverride: () => Promise<void>;
}

function countMissing(records: readonly AdminFlatInventoryEntry[]): number {
  return records.filter((record) => record.conditionStatus === "missing" || record.currentQuantity < record.expectedQuantity).length;
}

function countDamaged(records: readonly AdminFlatInventoryEntry[]): number {
  return records.filter((record) => record.conditionStatus === "damaged" || record.conditionStatus === "needs_replacement").length;
}

function countConsumables(records: readonly AdminFlatInventoryEntry[]): number {
  return records.filter((record) => record.category === "consumable").length;
}

function isActionDisabled(input: {
  action: AdminFlatInventoryReconciliationAction;
  record: AdminFlatInventoryEntry;
  quantityDraft: string;
  noteDraft: string;
  isSubmitting: boolean;
}): boolean {
  if (input.isSubmitting) {
    return true;
  }

  if (input.action === "note_discrepancy") {
    return input.noteDraft.trim().length === 0;
  }

  if (input.action === "adjust_quantity") {
    return parseNonNegativeInteger(input.quantityDraft) === null;
  }

  if (input.action === "restocked_now") {
    const parsed = parseNonNegativeInteger(input.quantityDraft);
    if (parsed === null) {
      return true;
    }

    if (!canRestock(input.record.category)) {
      return true;
    }

    return parsed < input.record.currentQuantity;
  }

  return false;
}

export function AdminInventoryFlatDetailSnapshotView(input: AdminInventoryFlatDetailSnapshotViewProps) {
  const flatSummary = input.overview.flats.find((flat) => flat.id === input.flatId) ?? null;
  const flatInventory = input.overview.flatInventory.find((entry) => entry.flatId === input.flatId)?.records ?? [];
  const readinessEntry = input.overview.readiness.find((entry) => entry.flatId === input.flatId) ?? null;

  const activeAlerts = readinessEntry?.activeAlerts ?? input.overview.activeAlerts.filter((alert) => alert.flatId === input.flatId);
  const activeIssues = readinessEntry?.activeIssues ?? input.overview.maintenanceIssues.filter((issue) => issue.flatId === input.flatId);
  const recentMovements = input.overview.stockMovements.filter((movement) => movement.flatId === input.flatId).slice(0, 10);

  const nonReadyReasons = formatNonReadyReasons({
    readiness: readinessEntry?.readiness ?? null,
    activeAlertsCount: activeAlerts.length,
    activeIssuesCount: activeIssues.length,
  });

  const missingRecords = flatInventory.filter((record) => record.conditionStatus === "missing" || record.currentQuantity < record.expectedQuantity);
  const damagedRecords = flatInventory.filter((record) => record.conditionStatus === "damaged" || record.conditionStatus === "needs_replacement");
  const consumableRecords = flatInventory.filter((record) => record.category === "consumable");

  return (
    <div className="admin-inventory-snapshot">
      <section className="admin-bookings-section" aria-labelledby="flat-summary-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-summary-heading" className="heading-sm" style={{ margin: 0 }}>
            Flat Summary
          </h2>
          <span className="admin-count-pill">{flatSummary?.name ?? input.flatId}</span>
        </div>

        <div className="admin-notifications-meta-grid">
          <div>
            <p className="admin-meta-label">Inventory Records</p>
            <p>{flatInventory.length}</p>
          </div>
          <div>
            <p className="admin-meta-label">Missing Items</p>
            <p>{countMissing(flatInventory)}</p>
          </div>
          <div>
            <p className="admin-meta-label">Damaged Items</p>
            <p>{countDamaged(flatInventory)}</p>
          </div>
          <div>
            <p className="admin-meta-label">Consumables</p>
            <p>{countConsumables(flatInventory)}</p>
          </div>
        </div>
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-inventory-states-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-inventory-states-heading" className="heading-sm" style={{ margin: 0 }}>
            Missing, Damaged, and Consumables State
          </h2>
          <span className="admin-count-pill">Focused Review</span>
        </div>

        <div className="admin-grid-two">
          <div>
            <p className="admin-meta-label">Missing Items</p>
            {missingRecords.length === 0 ? (
              <p className="text-secondary">No missing inventory detected.</p>
            ) : (
              <div className="admin-mini-table">
                {missingRecords.map((record) => (
                  <div key={record.id} className="admin-mini-table-row">
                    <p>{record.itemName}</p>
                    <p className="text-secondary">
                      {record.currentQuantity} / {record.expectedQuantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="admin-meta-label">Damaged Items</p>
            {damagedRecords.length === 0 ? (
              <p className="text-secondary">No damaged inventory detected.</p>
            ) : (
              <div className="admin-mini-table">
                {damagedRecords.map((record) => (
                  <div key={record.id} className="admin-mini-table-row">
                    <p>{record.itemName}</p>
                    <p className="text-secondary">{formatConditionStatusLabel(record.conditionStatus)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="admin-meta-label">Consumables State</p>
          {consumableRecords.length === 0 ? (
            <p className="text-secondary">No consumable records for this flat.</p>
          ) : (
            <div className="admin-mini-table">
              {consumableRecords.map((record) => (
                <div key={record.id} className="admin-mini-table-row">
                  <p>{record.itemName}</p>
                  <p className="text-secondary">
                    {record.currentQuantity} / {record.expectedQuantity}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-readiness-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-readiness-heading" className="heading-sm" style={{ margin: 0 }}>
            Readiness Breakdown
          </h2>
          <span className={getReadinessStatusClassName(readinessEntry?.readiness?.readinessStatus ?? "needs_attention")}>
            {formatReadinessStatusLabel(readinessEntry?.readiness?.readinessStatus ?? "needs_attention")}
          </span>
        </div>

        {readinessEntry?.readiness ? (
          <div className="admin-notifications-meta-grid">
            <div>
              <p className="admin-meta-label">Cleaning</p>
              <p>{formatConditionStatusLabel(readinessEntry.readiness.cleaningStatus)}</p>
            </div>
            <div>
              <p className="admin-meta-label">Linen</p>
              <p>{formatConditionStatusLabel(readinessEntry.readiness.linenStatus)}</p>
            </div>
            <div>
              <p className="admin-meta-label">Consumables</p>
              <p>{formatConditionStatusLabel(readinessEntry.readiness.consumablesStatus)}</p>
            </div>
            <div>
              <p className="admin-meta-label">Maintenance</p>
              <p>{formatConditionStatusLabel(readinessEntry.readiness.maintenanceStatus)}</p>
            </div>
            <div>
              <p className="admin-meta-label">Critical Assets</p>
              <p>{formatConditionStatusLabel(readinessEntry.readiness.criticalAssetStatus)}</p>
            </div>
            <div>
              <p className="admin-meta-label">Updated</p>
              <p>{formatLagosDateTime(readinessEntry.readiness.updatedAt)}</p>
            </div>
          </div>
        ) : (
          <p className="text-secondary">Readiness has not been computed yet.</p>
        )}

        <div className="booking-inline-note booking-inline-note-soft">
          <p className="admin-meta-label" style={{ marginBottom: "0.4rem" }}>
            Not Ready Because
          </p>
          {nonReadyReasons.length === 0 ? (
            <p className="text-secondary">No blockers currently identified.</p>
          ) : (
            <ul>
              {nonReadyReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-grid-two">
          <div className="admin-form-grid">
            <p className="admin-meta-label">Readiness Override</p>
            <select
              className="standard-input"
              value={input.overrideStatusDraft}
              onChange={(event) => input.onOverrideStatusDraftChange(event.target.value as "ready" | "needs_attention" | "out_of_service")}
              disabled={input.isSubmitting}
            >
              <option value="ready">Ready</option>
              <option value="needs_attention">Needs Attention</option>
              <option value="out_of_service">Out of Service</option>
            </select>

            <textarea
              className="standard-input"
              rows={2}
              value={input.overrideReasonDraft}
              onChange={(event) => input.onOverrideReasonDraftChange(event.target.value)}
              placeholder="Override reason"
              disabled={input.isSubmitting}
            />

            <div className="admin-bookings-actions-row">
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={input.isSubmitting || input.overrideReasonDraft.trim().length === 0}
                onClick={() => {
                  void input.onSetOverride();
                }}
              >
                Apply Override
              </button>
              <button
                type="button"
                className="btn btn-outline-primary admin-btn-danger"
                disabled={input.isSubmitting || !readinessEntry?.readiness?.overrideStatus}
                onClick={() => {
                  void input.onClearOverride();
                }}
              >
                Clear Override
              </button>
            </div>
          </div>

          <div>
            {readinessEntry?.readiness?.overrideStatus ? (
              <div className="booking-inline-note booking-inline-note-muted">
                Override Active: {formatReadinessStatusLabel(readinessEntry.readiness.overrideStatus)}
                {readinessEntry.readiness.overrideReason ? ` - ${readinessEntry.readiness.overrideReason}` : ""}
              </div>
            ) : (
              <p className="text-secondary">No readiness override active.</p>
            )}
          </div>
        </div>
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-reconciliation-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-reconciliation-heading" className="heading-sm" style={{ margin: 0 }}>
            Inventory Reconciliation
          </h2>
          <span className="admin-count-pill">{flatInventory.length} records</span>
        </div>

        {flatInventory.length === 0 ? (
          <p className="text-secondary">No flat inventory records available for reconciliation.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Expected / Current</th>
                  <th>Condition</th>
                  <th>Last Checked</th>
                  <th>Quantity</th>
                  <th>Discrepancy Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flatInventory.map((record) => {
                  const quantityDraft = input.quantityDrafts[record.id] ?? String(record.currentQuantity);
                  const noteDraft = input.noteDrafts[record.id] ?? record.notes ?? "";

                  return (
                    <tr key={record.id}>
                      <td>
                        <p className="admin-card-title">{record.itemName}</p>
                        <p className="text-secondary" style={{ fontSize: "0.78rem" }}>
                          {record.inventoryItemId}
                        </p>
                      </td>
                      <td>
                        {record.expectedQuantity} / {record.currentQuantity} ({record.unitOfMeasure})
                      </td>
                      <td>{formatConditionStatusLabel(record.conditionStatus)}</td>
                      <td>{formatLagosDateTime(record.lastCheckedAt)}</td>
                      <td>
                        <input
                          className="standard-input"
                          type="number"
                          min={0}
                          step={1}
                          value={quantityDraft}
                          onChange={(event) => input.onQuantityDraftChange(record.id, event.target.value)}
                          disabled={input.isSubmitting}
                          style={{ minWidth: "88px", maxWidth: "120px" }}
                        />
                      </td>
                      <td>
                        <textarea
                          className="standard-input"
                          rows={2}
                          value={noteDraft}
                          onChange={(event) => input.onNoteDraftChange(record.id, event.target.value)}
                          disabled={input.isSubmitting}
                          style={{ minWidth: "180px" }}
                        />
                      </td>
                      <td>
                        <div className="admin-bookings-actions-row" style={{ flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={isActionDisabled({
                              action: "adjust_quantity",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "adjust_quantity",
                              });
                            }}
                          >
                            Adjust Quantity
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary admin-btn-danger"
                            disabled={isActionDisabled({
                              action: "mark_missing",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "mark_missing",
                              });
                            }}
                          >
                            Mark Missing
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary admin-btn-danger"
                            disabled={isActionDisabled({
                              action: "mark_damaged",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "mark_damaged",
                              });
                            }}
                          >
                            Mark Damaged
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={isActionDisabled({
                              action: "mark_replaced",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "mark_replaced",
                              });
                            }}
                          >
                            Mark Replaced
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={isActionDisabled({
                              action: "restocked_now",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "restocked_now",
                              });
                            }}
                          >
                            Restocked Now
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={isActionDisabled({
                              action: "note_discrepancy",
                              record,
                              quantityDraft,
                              noteDraft,
                              isSubmitting: input.isSubmitting,
                            })}
                            onClick={() => {
                              void input.onAction({
                                record,
                                action: "note_discrepancy",
                              });
                            }}
                          >
                            Note Discrepancy
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-movements-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-movements-heading" className="heading-sm" style={{ margin: 0 }}>
            Recent Movements
          </h2>
          <span className="admin-count-pill">{recentMovements.length} recent</span>
        </div>

        {recentMovements.length === 0 ? (
          <p className="text-secondary">No stock movements recorded for this flat yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {recentMovements.map((movement) => (
              <article key={movement.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{movement.itemName}</p>
                  <span className="admin-status-pill">{formatMovementTypeLabel(movement.movementType)}</span>
                </div>
                <p className="admin-notification-summary">{movement.reason}</p>
                <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                  Qty {movement.quantity} - {formatLagosDateTime(movement.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-alerts-issues-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-alerts-issues-heading" className="heading-sm" style={{ margin: 0 }}>
            Active Alerts
          </h2>
          <span className="admin-count-pill">{activeAlerts.length}</span>
        </div>

        {activeAlerts.length === 0 ? (
          <p className="text-secondary">No active alerts for this flat.</p>
        ) : (
          <div className="admin-bookings-list">
            {activeAlerts.map((alert) => (
              <article key={alert.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{alert.alertType}</p>
                  <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
                </div>
                <p className="admin-notification-summary">{alert.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="flat-issues-heading">
        <div className="admin-bookings-section-header">
          <h2 id="flat-issues-heading" className="heading-sm" style={{ margin: 0 }}>
            Active Maintenance Issues
          </h2>
          <span className="admin-count-pill">{activeIssues.length}</span>
        </div>

        {activeIssues.length === 0 ? (
          <p className="text-secondary">No active maintenance issues for this flat.</p>
        ) : (
          <div className="admin-bookings-list">
            {activeIssues.map((issue) => (
              <article key={issue.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{issue.title}</p>
                  <span className="admin-status-pill">{issue.status}</span>
                </div>
                <p className="admin-notification-summary">{issue.notes ?? "No notes provided."}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
