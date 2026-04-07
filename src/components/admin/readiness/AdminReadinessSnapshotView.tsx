import type { AdminInventoryOverview } from "@/lib/admin-inventory-api";
import {
  formatAlertTypeLabel,
  formatComponentStatusLabel,
  formatIssueStatusLabel,
  formatLagosDateTime,
  formatReadinessStatusLabel,
  getReadinessStatusClassName,
  getSeverityClassName,
} from "../inventory/admin-inventory-view-model";

interface AdminReadinessSnapshotViewProps {
  overview: AdminInventoryOverview | null | undefined;
}

export function AdminReadinessSnapshotView(input: AdminReadinessSnapshotViewProps) {
  const readinessEntries = Array.isArray(input.overview?.readiness) ? input.overview.readiness : [];
  const activeAlerts = Array.isArray(input.overview?.activeAlerts) ? input.overview.activeAlerts : [];
  const maintenanceIssues = Array.isArray(input.overview?.maintenanceIssues)
    ? input.overview.maintenanceIssues
    : [];

  return (
    <div className="admin-readiness-snapshot">
      <section className="admin-bookings-section" aria-labelledby="readiness-dashboard-heading">
        <div className="admin-bookings-section-header">
          <h3 id="readiness-dashboard-heading" className="heading-sm" style={{ margin: 0 }}>
            Readiness Dashboard
          </h3>
          <span className="admin-count-pill">{readinessEntries.length} flats</span>
        </div>

        {readinessEntries.length === 0 ? (
          <p className="text-secondary">No readiness records available yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {readinessEntries.map((entry, index) => {
              const readiness = entry.readiness ?? null;
              const entryAlerts = Array.isArray(entry.activeAlerts) ? entry.activeAlerts : [];
              const entryIssues = Array.isArray(entry.activeIssues) ? entry.activeIssues : [];
              const flatLabel = entry.flatName?.trim() || entry.flatId || `Flat ${index + 1}`;

              return (
                <article key={entry.flatId || `readiness-${index}`} className="admin-bookings-card">
                  <div className="admin-bookings-card-header">
                    <p className="admin-card-title">{flatLabel}</p>
                    <span className={getReadinessStatusClassName(readiness?.readinessStatus ?? "needs_attention")}>
                      {formatReadinessStatusLabel(readiness?.readinessStatus ?? "needs_attention")}
                    </span>
                  </div>

                  {readiness ? (
                    <div className="admin-notifications-meta-grid">
                      <div>
                        <p className="admin-meta-label">Cleaning</p>
                        <p>{formatComponentStatusLabel(readiness.cleaningStatus)}</p>
                      </div>
                      <div>
                        <p className="admin-meta-label">Linen</p>
                        <p>{formatComponentStatusLabel(readiness.linenStatus)}</p>
                      </div>
                      <div>
                        <p className="admin-meta-label">Consumables</p>
                        <p>{formatComponentStatusLabel(readiness.consumablesStatus)}</p>
                      </div>
                      <div>
                        <p className="admin-meta-label">Maintenance</p>
                        <p>{formatComponentStatusLabel(readiness.maintenanceStatus)}</p>
                      </div>
                      <div>
                        <p className="admin-meta-label">Critical Assets</p>
                        <p>{formatComponentStatusLabel(readiness.criticalAssetStatus)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary">Readiness has not been computed yet.</p>
                  )}

                  <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                    Active Alerts: {entryAlerts.length} | Active Issues: {entryIssues.length}
                  </p>

                  {readiness?.overrideStatus ? (
                    <div className="booking-inline-note booking-inline-note-soft">
                      Override: {formatReadinessStatusLabel(readiness.overrideStatus)}
                      {readiness.overrideReason ? ` - ${readiness.overrideReason}` : ""}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="maintenance-alerts-heading">
        <div className="admin-bookings-section-header">
          <h3 id="maintenance-alerts-heading" className="heading-sm" style={{ margin: 0 }}>
            Maintenance and Alerts
          </h3>
          <span className="admin-count-pill">
            {maintenanceIssues.length} issues / {activeAlerts.length} alerts
          </span>
        </div>

        <div className="admin-grid-two">
          <div>
            <p className="admin-meta-label">Open Alerts</p>
            {activeAlerts.length === 0 ? (
              <p className="text-secondary">No active alerts.</p>
            ) : (
              <div className="admin-bookings-list">
                {activeAlerts.map((alert, index) => (
                  <article key={alert.id || `alert-${index}`} className="admin-bookings-card">
                    <div className="admin-bookings-card-header">
                      <p className="admin-card-title">{formatAlertTypeLabel(alert.alertType)}</p>
                      <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
                    </div>
                    <p className="admin-notification-summary">{alert.message || "Alert details unavailable."}</p>
                    <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                      {alert.flatId ?? "All flats"} - {formatLagosDateTime(alert.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="admin-meta-label">Maintenance Issues</p>
            {maintenanceIssues.length === 0 ? (
              <p className="text-secondary">No maintenance issues recorded.</p>
            ) : (
              <div className="admin-bookings-list">
                {maintenanceIssues.map((issue, index) => (
                  <article key={issue.id || `issue-${index}`} className="admin-bookings-card">
                    <div className="admin-bookings-card-header">
                      <p className="admin-card-title">{issue.title || `Issue ${index + 1}`}</p>
                      <span className="admin-status-pill">{formatIssueStatusLabel(issue.status)}</span>
                    </div>
                    <p className="admin-notification-summary">{issue.notes ?? "No notes provided."}</p>
                    <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                      {issue.flatId || "Flat unavailable"} - {issue.severity} - {formatLagosDateTime(issue.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
