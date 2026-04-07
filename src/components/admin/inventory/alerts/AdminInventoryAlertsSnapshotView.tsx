import Link from "next/link";

import type { AdminInventoryAlert, AdminMaintenanceIssue } from "@/lib/admin-inventory-api";
import { formatLagosDateTime, getSeverityClassName } from "../admin-inventory-view-model";

interface AdminInventoryAlertsSnapshotViewProps {
  alerts: AdminInventoryAlert[] | null | undefined;
  maintenanceIssues: AdminMaintenanceIssue[] | null | undefined;
  isSubmitting: boolean;
  onResolveAlert: (alertId: string) => Promise<void>;
}

function titleCaseFromSnake(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function findRelatedIssueId(
  alert: AdminInventoryAlert,
  issues: readonly AdminMaintenanceIssue[]
): string | null {
  const linked = issues.find((issue) => {
    if (alert.flatId && issue.flatId !== alert.flatId) {
      return false;
    }

    if (alert.inventoryItemId && issue.inventoryItemId !== alert.inventoryItemId) {
      return false;
    }

    return issue.status === "open" || issue.status === "in_progress";
  });

  return linked?.id ?? null;
}

export function AdminInventoryAlertsSnapshotView(input: AdminInventoryAlertsSnapshotViewProps) {
  const alerts = Array.isArray(input.alerts) ? input.alerts : [];
  const maintenanceIssues = Array.isArray(input.maintenanceIssues) ? input.maintenanceIssues : [];
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const importantCount = alerts.filter((alert) => alert.severity === "important").length;

  return (
    <section className="admin-bookings-section" aria-labelledby="admin-alerts-heading">
      <div className="admin-bookings-section-header">
        <h2 id="admin-alerts-heading" className="heading-sm" style={{ margin: 0 }}>
          Active Alerts
        </h2>
        <span className="admin-count-pill">{alerts.length} active</span>
      </div>

      <div className="admin-notifications-meta-grid" style={{ marginBottom: "1rem" }}>
        <div>
          <p className="admin-meta-label">Critical</p>
          <p>{criticalCount}</p>
        </div>
        <div>
          <p className="admin-meta-label">Important</p>
          <p>{importantCount}</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="text-secondary">No active alerts right now.</p>
      ) : (
        <div className="admin-bookings-list">
          {alerts.map((alert, index) => {
            const relatedIssueId = findRelatedIssueId(alert, maintenanceIssues);
            const alertKey = alert.id?.trim() || `alert-${index}`;

            return (
              <article key={alertKey} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{titleCaseFromSnake(alert.alertType)}</p>
                  <div className="admin-bookings-actions-row">
                    <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
                    <span className="admin-status-pill">{titleCaseFromSnake(alert.status)}</span>
                  </div>
                </div>

                <p className="admin-notification-summary">{alert.message || "Alert details unavailable."}</p>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Flat</p>
                    <p>{alert.flatId ?? "All flats"}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Item</p>
                    <p>{alert.inventoryItemId ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Created</p>
                    <p>{formatLagosDateTime(alert.createdAt)}</p>
                  </div>
                </div>

                <div className="admin-bookings-actions-row">
                  {alert.flatId ? (
                    <Link href={`/admin/inventory/flats/${alert.flatId}`} className="btn btn-outline-primary">
                      Open Flat
                    </Link>
                  ) : null}

                  {relatedIssueId ? (
                    <Link href={`/admin/inventory/maintenance?issueId=${encodeURIComponent(relatedIssueId)}`} className="btn btn-outline-primary">
                      Related Issue
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={input.isSubmitting || alert.status === "resolved"}
                    onClick={() => {
                      void input.onResolveAlert(alert.id);
                    }}
                  >
                    Resolve Alert
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
