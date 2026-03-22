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
  overview: AdminInventoryOverview;
}

export function AdminReadinessSnapshotView(input: AdminReadinessSnapshotViewProps) {
  return (
    <div className="admin-readiness-snapshot">
      <section className="admin-bookings-section" aria-labelledby="readiness-dashboard-heading">
        <div className="admin-bookings-section-header">
          <h3 id="readiness-dashboard-heading" className="heading-sm" style={{ margin: 0 }}>
            Readiness Dashboard
          </h3>
          <span className="admin-count-pill">{input.overview.readiness.length} flats</span>
        </div>

        {input.overview.readiness.length === 0 ? (
          <p className="text-secondary">No readiness records available yet.</p>
        ) : (
          <div className="admin-bookings-list">
            {input.overview.readiness.map((entry) => (
              <article key={entry.flatId} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{entry.flatName}</p>
                  <span className={getReadinessStatusClassName(entry.readiness?.readinessStatus ?? "needs_attention")}>
                    {formatReadinessStatusLabel(entry.readiness?.readinessStatus ?? "needs_attention")}
                  </span>
                </div>

                {entry.readiness ? (
                  <div className="admin-notifications-meta-grid">
                    <div>
                      <p className="admin-meta-label">Cleaning</p>
                      <p>{formatComponentStatusLabel(entry.readiness.cleaningStatus)}</p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Linen</p>
                      <p>{formatComponentStatusLabel(entry.readiness.linenStatus)}</p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Consumables</p>
                      <p>{formatComponentStatusLabel(entry.readiness.consumablesStatus)}</p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Maintenance</p>
                      <p>{formatComponentStatusLabel(entry.readiness.maintenanceStatus)}</p>
                    </div>
                    <div>
                      <p className="admin-meta-label">Critical Assets</p>
                      <p>{formatComponentStatusLabel(entry.readiness.criticalAssetStatus)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary">Readiness has not been computed yet.</p>
                )}

                <p className="text-secondary" style={{ fontSize: "0.84rem" }}>
                  Active Alerts: {entry.activeAlerts.length} | Active Issues: {entry.activeIssues.length}
                </p>

                {entry.readiness?.overrideStatus && (
                  <div className="booking-inline-note booking-inline-note-soft">
                    Override: {formatReadinessStatusLabel(entry.readiness.overrideStatus)}
                    {entry.readiness.overrideReason ? ` - ${entry.readiness.overrideReason}` : ""}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-bookings-section" aria-labelledby="maintenance-alerts-heading">
        <div className="admin-bookings-section-header">
          <h3 id="maintenance-alerts-heading" className="heading-sm" style={{ margin: 0 }}>
            Maintenance and Alerts
          </h3>
          <span className="admin-count-pill">
            {input.overview.maintenanceIssues.length} issues / {input.overview.activeAlerts.length} alerts
          </span>
        </div>

        <div className="admin-grid-two">
          <div>
            <p className="admin-meta-label">Open Alerts</p>
            {input.overview.activeAlerts.length === 0 ? (
              <p className="text-secondary">No active alerts.</p>
            ) : (
              <div className="admin-bookings-list">
                {input.overview.activeAlerts.map((alert) => (
                  <article key={alert.id} className="admin-bookings-card">
                    <div className="admin-bookings-card-header">
                      <p className="admin-card-title">{formatAlertTypeLabel(alert.alertType)}</p>
                      <span className={getSeverityClassName(alert.severity)}>{alert.severity}</span>
                    </div>
                    <p className="admin-notification-summary">{alert.message}</p>
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
            {input.overview.maintenanceIssues.length === 0 ? (
              <p className="text-secondary">No maintenance issues recorded.</p>
            ) : (
              <div className="admin-bookings-list">
                {input.overview.maintenanceIssues.map((issue) => (
                  <article key={issue.id} className="admin-bookings-card">
                    <div className="admin-bookings-card-header">
                      <p className="admin-card-title">{issue.title}</p>
                      <span className="admin-status-pill">{formatIssueStatusLabel(issue.status)}</span>
                    </div>
                    <p className="admin-notification-summary">{issue.notes ?? "No notes provided."}</p>
                    <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                      {issue.flatId} - {issue.severity} - {formatLagosDateTime(issue.createdAt)}
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
