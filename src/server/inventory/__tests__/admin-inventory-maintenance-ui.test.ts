import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryMaintenanceSnapshotView } from "../../../components/admin/inventory/maintenance/AdminInventoryMaintenanceSnapshotView";
import type { AdminInventoryItem, AdminMaintenanceIssue } from "../../../lib/admin-inventory-api";

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

function createItems(): AdminInventoryItem[] {
  return [
    {
      id: "item_tv",
      name: "Smart TV",
      category: "asset",
      unitOfMeasure: "piece",
      reorderThreshold: null,
      parLevel: null,
      criticality: "critical",
    },
  ];
}

async function testMaintenanceListRendersStatusSeverityAndActions(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryMaintenanceSnapshotView({
      issues: createIssues(),
      inventoryItems: createItems(),
      statusDrafts: {
        issue_1: "in_progress",
      },
      noteDrafts: {
        issue_1: "Technician assigned",
      },
      isSubmitting: false,
      onStatusDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onUpdateIssue: async () => undefined,
      onResolveIssue: async () => undefined,
      onEscalateIssue: async () => undefined,
    })
  );

  assert.ok(html.includes("Maintenance Issues"));
  assert.ok(html.includes("Replace TV panel"));
  assert.ok(html.includes("critical"));
  assert.ok(html.includes("Open"));
  assert.ok(html.includes("/admin/inventory/flats/mayfair"));
  assert.ok(html.includes("/admin/inventory/items/item_tv"));
  assert.ok(html.includes("Update Status"));
  assert.ok(html.includes("Resolve Issue"));
  assert.ok(html.includes("Escalate"));
}

async function testMaintenanceEmptyState(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryMaintenanceSnapshotView({
      issues: [],
      inventoryItems: [],
      statusDrafts: {},
      noteDrafts: {},
      isSubmitting: false,
      onStatusDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onUpdateIssue: async () => undefined,
      onResolveIssue: async () => undefined,
      onEscalateIssue: async () => undefined,
    })
  );

  assert.ok(html.includes("No maintenance issues recorded."));
}

async function run(): Promise<void> {
  await testMaintenanceListRendersStatusSeverityAndActions();
  await testMaintenanceEmptyState();

  console.log("admin-inventory-maintenance-ui: ok");
}

void run();


