import Link from "next/link";

import type { AdminInventoryItem, AdminMaintenanceIssue } from "@/lib/admin-inventory-api";
import { formatLagosDateTime, getSeverityClassName } from "../admin-inventory-view-model";

interface AdminInventoryMaintenanceSnapshotViewProps {
  issues: AdminMaintenanceIssue[];
  inventoryItems: AdminInventoryItem[];
  statusDrafts: Record<string, AdminMaintenanceIssue["status"]>;
  noteDrafts: Record<string, string>;
  isSubmitting: boolean;
  onStatusDraftChange: (issueId: string, status: AdminMaintenanceIssue["status"]) => void;
  onNoteDraftChange: (issueId: string, note: string) => void;
  onUpdateIssue: (issueId: string) => Promise<void>;
  onResolveIssue: (issueId: string) => Promise<void>;
  onEscalateIssue: (issueId: string) => Promise<void>;
}

function titleCaseFromSnake(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminInventoryMaintenanceSnapshotView(input: AdminInventoryMaintenanceSnapshotViewProps) {
  const itemNameById = new Map(input.inventoryItems.map((item) => [item.id, item.name]));

  return (
    <section className="admin-bookings-section" aria-labelledby="admin-maintenance-heading">
      <div className="admin-bookings-section-header">
        <h2 id="admin-maintenance-heading" className="heading-sm" style={{ margin: 0 }}>
          Maintenance Issues
        </h2>
        <span className="admin-count-pill">{input.issues.length} issues</span>
      </div>

      {input.issues.length === 0 ? (
        <p className="text-secondary">No maintenance issues recorded.</p>
      ) : (
        <div className="admin-bookings-list">
          {input.issues.map((issue) => {
            const statusDraft = input.statusDrafts[issue.id] ?? issue.status;
            const noteDraft = input.noteDrafts[issue.id] ?? issue.notes ?? "";
            const linkedItemName = issue.inventoryItemId
              ? itemNameById.get(issue.inventoryItemId) ?? issue.inventoryItemId
              : "N/A";

            return (
              <article key={issue.id} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{issue.title}</p>
                  <div className="admin-bookings-actions-row">
                    <span className={getSeverityClassName(issue.severity)}>{issue.severity}</span>
                    <span className="admin-status-pill">{titleCaseFromSnake(issue.status)}</span>
                  </div>
                </div>

                <p className="admin-notification-summary">{issue.notes ?? "No notes provided."}</p>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Flat</p>
                    <p>
                      Flat: <Link href={`/admin/inventory/flats/${issue.flatId}`}>{issue.flatId}</Link>
                    </p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Item</p>
                    <p>
                      Item:{" "}
                      {issue.inventoryItemId ? (
                        <Link href={`/admin/inventory/items/${issue.inventoryItemId}`}>{linkedItemName}</Link>
                      ) : (
                        linkedItemName
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Created</p>
                    <p>{formatLagosDateTime(issue.createdAt)}</p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <select
                    className="standard-input"
                    value={statusDraft}
                    onChange={(event) =>
                      input.onStatusDraftChange(issue.id, event.target.value as AdminMaintenanceIssue["status"])
                    }
                    disabled={input.isSubmitting}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <textarea
                    className="standard-input"
                    rows={2}
                    value={noteDraft}
                    onChange={(event) => input.onNoteDraftChange(issue.id, event.target.value)}
                    placeholder="Update note"
                    disabled={input.isSubmitting}
                  />

                  <div className="admin-bookings-actions-row">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={input.isSubmitting}
                      onClick={() => {
                        void input.onUpdateIssue(issue.id);
                      }}
                    >
                      Update Status
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={input.isSubmitting || issue.status === "resolved" || issue.status === "closed"}
                      onClick={() => {
                        void input.onResolveIssue(issue.id);
                      }}
                    >
                      Resolve Issue
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={input.isSubmitting || issue.status === "resolved" || issue.status === "closed"}
                      onClick={() => {
                        void input.onEscalateIssue(issue.id);
                      }}
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
