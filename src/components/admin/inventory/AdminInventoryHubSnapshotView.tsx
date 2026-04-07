import Link from "next/link";

import type { AdminInventoryOverview, AdminWorkerTask } from "@/lib/admin-inventory-api";

interface AdminInventoryHubSnapshotViewProps {
  overview: AdminInventoryOverview | null | undefined;
}

function formatCountLabel(value: number, singular: string, plural: string): string {
  if (value === 1) {
    return `1 ${singular}`;
  }

  return `${value} ${plural}`;
}

function countOpenTasks(tasks: readonly AdminWorkerTask[]): number {
  return tasks.filter((task) => {
    return (
      task.status === "pending" ||
      task.status === "in_progress" ||
      task.status === "blocked" ||
      task.status === "escalated" ||
      task.status === "open"
    );
  }).length;
}

export function AdminInventoryHubSnapshotView({ overview }: AdminInventoryHubSnapshotViewProps) {
  const inventoryCatalog = Array.isArray(overview?.inventoryCatalog) ? overview.inventoryCatalog : [];
  const templates = Array.isArray(overview?.templates) ? overview.templates : [];
  const stockMovements = Array.isArray(overview?.stockMovements) ? overview.stockMovements : [];
  const flats = Array.isArray(overview?.flats) ? overview.flats : [];
  const readiness = Array.isArray(overview?.readiness) ? overview.readiness : [];
  const activeAlerts = Array.isArray(overview?.activeAlerts) ? overview.activeAlerts : [];
  const maintenanceIssues = Array.isArray(overview?.maintenanceIssues) ? overview.maintenanceIssues : [];
  const workerTasks = Array.isArray(overview?.workerTasks) ? overview.workerTasks : [];
  const centralStock = Array.isArray(overview?.centralStock) ? overview.centralStock : [];

  const openAlertCount = activeAlerts.filter((alert) => alert.status === "open").length;
  const openIssueCount = maintenanceIssues.filter(
    (issue) => issue.status === "open" || issue.status === "in_progress"
  ).length;
  const openTaskCount = countOpenTasks(workerTasks);
  const centralStockTrackedCount = centralStock.length;

  const readyFlats = readiness.filter((entry) => entry.readiness?.readinessStatus === "ready").length;
  const needsAttentionFlats = readiness.filter(
    (entry) => entry.readiness?.readinessStatus === "needs_attention"
  ).length;
  const outOfServiceFlats = readiness.filter(
    (entry) => entry.readiness?.readinessStatus === "out_of_service"
  ).length;

  return (
    <div className="admin-inventory-panel">
      <section className="admin-bookings-section" aria-labelledby="inventory-hub-navigation-heading">
        <div className="admin-bookings-section-header">
          <h2 id="inventory-hub-navigation-heading" className="heading-sm" style={{ margin: 0 }}>
            Inventory Operations Hub
          </h2>
          <span className="admin-count-pill">Supervisor View</span>
        </div>

        <div className="admin-hub-grid">
          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Inventory Catalog</p>
              <span className="admin-count-pill">{formatCountLabel(inventoryCatalog.length, "total item", "total items")}</span>
            </div>
            <p className="text-secondary">Create and maintain item definitions used across templates and flats.</p>
            <div className="admin-hub-actions">
              <Link href="/admin/inventory/items/new" className="btn btn-primary">
                New Item
              </Link>
              <Link href="/admin/inventory" className="btn btn-outline-primary">
                View Snapshot
              </Link>
            </div>
            {inventoryCatalog.length === 0 ? (
              <p className="admin-hub-note">No inventory catalog items yet. Start by creating your first item.</p>
            ) : null}
          </article>

          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Templates</p>
              <span className="admin-count-pill">{formatCountLabel(templates.length, "active template", "active templates")}</span>
            </div>
            <p className="text-secondary">Manage baseline setup standards and push expected quantities to flats.</p>
            <div className="admin-hub-actions">
              <Link href="/admin/inventory/templates" className="btn btn-outline-primary">
                View Templates
              </Link>
              <Link href="/admin/inventory/templates/new" className="btn btn-primary">
                New Template
              </Link>
            </div>
            {templates.length === 0 ? <p className="admin-hub-note">No templates configured yet.</p> : null}
          </article>

          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Central Stock</p>
              <span className="admin-count-pill">{formatCountLabel(centralStockTrackedCount, "tracked item", "tracked items")}</span>
            </div>
            <p className="text-secondary">Use stock and transfer actions to keep flat replenishment operational.</p>
            <div className="admin-hub-actions">
              <Link href="/admin/inventory/stock" className="btn btn-outline-primary">
                Open Stock
              </Link>
              <Link href="/admin/inventory/movements/new" className="btn btn-primary">
                Record Movement
              </Link>
            </div>
          </article>

          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Stock Movements</p>
              <span className="admin-count-pill">{formatCountLabel(stockMovements.length, "entry", "entries")}</span>
            </div>
            <p className="text-secondary">Review movement history and reconcile transfer/damage/replace actions.</p>
            <div className="admin-hub-actions">
              <Link href="/admin/inventory/movements" className="btn btn-outline-primary">
                Movement Log
              </Link>
              <Link href="/admin/inventory/movements/new" className="btn btn-primary">
                New Entry
              </Link>
            </div>
          </article>

          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Alerts Snapshot</p>
              <span className="admin-count-pill">{formatCountLabel(openAlertCount, "open alert", "open alerts")}</span>
            </div>
            <p className="text-secondary">
              {formatCountLabel(openIssueCount, "open issue", "open issues")} / {formatCountLabel(openTaskCount, "open task", "open tasks")}
            </p>
            <div className="admin-hub-actions">
              <Link href="/admin/inventory/alerts" className="btn btn-outline-primary">
                Review Alerts
              </Link>
              <Link href="/admin/inventory/maintenance" className="btn btn-primary">
                Open Maintenance
              </Link>
            </div>
            {openAlertCount === 0 ? <p className="admin-hub-note">No open alerts right now.</p> : null}
          </article>

          <article className="admin-hub-card">
            <div className="admin-bookings-card-header">
              <p className="admin-card-title">Readiness and Flats</p>
              <span className="admin-count-pill">{formatCountLabel(flats.length, "flat", "flats")}</span>
            </div>
            <p className="text-secondary">
              Ready: {readyFlats} | Needs Attention: {needsAttentionFlats} | Out of Service: {outOfServiceFlats}
            </p>
            <div className="admin-hub-actions">
              <Link href="/admin/readiness" className="btn btn-outline-primary">
                Readiness Dashboard
              </Link>
              <Link href="/admin/tasks" className="btn btn-primary">
                Task Oversight
              </Link>
            </div>
            <div className="admin-hub-flat-links">
              {flats.length === 0 ? (
                <p className="admin-hub-note">No flats configured yet.</p>
              ) : (
                flats.map((flat, index) => (
                  <Link key={flat.id || `flat-${index}`} href={`/admin/inventory/flats/${flat.id}`} className="admin-hub-flat-link">
                    {flat.name || flat.id || `Flat ${index + 1}`}
                  </Link>
                ))
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
