import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryAlertsSnapshotView } from "../../../components/admin/inventory/alerts/AdminInventoryAlertsSnapshotView";
import type { AdminInventoryAlert, AdminMaintenanceIssue } from "../../../lib/admin-inventory-api";

function createAlerts(): AdminInventoryAlert[] {
  return [
    {
      id: "alert_1",
      inventoryItemId: "item_tv",
      flatId: "mayfair",
      alertType: "damaged_critical_asset",
      severity: "critical",
      status: "open",
      message: "Critical asset Smart TV is damaged.",
      createdAt: "2026-11-22T09:00:00.000Z",
      resolvedAt: null,
    },
    {
      id: "alert_2",
      inventoryItemId: null,
      flatId: "windsor",
      alertType: "readiness_issue",
      severity: "important",
      status: "acknowledged",
      message: "Windsor readiness is needs attention.",
      createdAt: "2026-11-22T09:10:00.000Z",
      resolvedAt: null,
    },
  ];
}

function createIssues(): AdminMaintenanceIssue[] {
  return [
    {
      id: "issue_1",
      flatId: "mayfair",
      inventoryItemId: "item_tv",
      title: "Replace TV panel",
      notes: "Urgent replacement",
      severity: "critical",
      status: "open",
      createdAt: "2026-11-22T08:40:00.000Z",
      updatedAt: "2026-11-22T08:40:00.000Z",
      resolvedAt: null,
    },
  ];
}

async function testAlertsListRendersSeverityStatusAndActions(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryAlertsSnapshotView({
      alerts: createAlerts(),
      maintenanceIssues: createIssues(),
      isSubmitting: false,
      onResolveAlert: async () => undefined,
    })
  );

  assert.ok(html.includes("Active Alerts"));
  assert.ok(html.includes("Damaged Critical Asset"));
  assert.ok(html.includes("critical"));
  assert.ok(html.includes("Open"));
  assert.ok(html.includes("Resolve Alert"));
  assert.ok(html.includes("/admin/inventory/flats/mayfair"));
  assert.ok(html.includes("/admin/inventory/maintenance?issueId=issue_1"));
}

async function testAlertsEmptyState(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryAlertsSnapshotView({
      alerts: [],
      maintenanceIssues: [],
      isSubmitting: false,
      onResolveAlert: async () => undefined,
    })
  );

  assert.ok(html.includes("No active alerts right now."));
}

async function run(): Promise<void> {
  await testAlertsListRendersSeverityStatusAndActions();
  await testAlertsEmptyState();

  console.log("admin-inventory-alerts-ui: ok");
}

void run();

