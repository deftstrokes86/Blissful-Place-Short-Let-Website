import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminInventoryFlatDetailSnapshotView } from "../../../components/admin/inventory/flats/AdminInventoryFlatDetailSnapshotView";
import type { AdminInventoryOverview } from "../../../lib/admin-inventory-api";

function createOverview(): AdminInventoryOverview {
  return {
    generatedAt: "2026-11-21T09:00:00.000Z",
    flats: [{ id: "mayfair", name: "Mayfair Suite" }],
    inventoryCatalog: [
      {
        id: "item_tv",
        name: "Smart TV",
        category: "asset",
        unitOfMeasure: "piece",
        reorderThreshold: null,
        parLevel: 1,
        criticality: "critical",
      },
      {
        id: "item_water",
        name: "Bottled Water",
        category: "consumable",
        unitOfMeasure: "bottle",
        reorderThreshold: 10,
        parLevel: 20,
        criticality: "important",
      },
    ],
    templates: [],
    flatInventory: [
      {
        flatId: "mayfair",
        flatName: "Mayfair Suite",
        records: [
          {
            id: "flat_inv_tv",
            inventoryItemId: "item_tv",
            itemName: "Smart TV",
            category: "asset",
            criticality: "critical",
            unitOfMeasure: "piece",
            expectedQuantity: 1,
            currentQuantity: 0,
            conditionStatus: "damaged",
            notes: "Screen cracked",
            lastCheckedAt: "2026-11-21T08:00:00.000Z",
          },
          {
            id: "flat_inv_water",
            inventoryItemId: "item_water",
            itemName: "Bottled Water",
            category: "consumable",
            criticality: "important",
            unitOfMeasure: "bottle",
            expectedQuantity: 12,
            currentQuantity: 4,
            conditionStatus: "ok",
            notes: "Lower than expected",
            lastCheckedAt: "2026-11-21T08:10:00.000Z",
          },
        ],
      },
    ],
    stockMovements: [
      {
        id: "movement_1",
        inventoryItemId: "item_tv",
        itemName: "Smart TV",
        flatId: "mayfair",
        contextLabel: "Mayfair Suite",
        movementType: "damage",
        quantity: 1,
        reason: "Damaged during stay",
        notes: null,
        actorId: "staff_1",
        createdAt: "2026-11-21T08:20:00.000Z",
      },
    ],
    readiness: [
      {
        flatId: "mayfair",
        flatName: "Mayfair Suite",
        readiness: {
          flatId: "mayfair",
          cleaningStatus: "ready",
          linenStatus: "ready",
          consumablesStatus: "attention_required",
          maintenanceStatus: "ready",
          criticalAssetStatus: "blocked",
          readinessStatus: "out_of_service",
          overrideStatus: null,
          overrideReason: null,
          updatedAt: "2026-11-21T08:30:00.000Z",
        },
        activeAlerts: [
          {
            id: "alert_1",
            inventoryItemId: "item_tv",
            flatId: "mayfair",
            alertType: "damaged_critical_asset",
            severity: "critical",
            status: "open",
            message: "Critical asset Smart TV is damaged.",
            createdAt: "2026-11-21T08:21:00.000Z",
            resolvedAt: null,
          },
        ],
        activeIssues: [
          {
            id: "issue_1",
            flatId: "mayfair",
            inventoryItemId: "item_tv",
            title: "Replace TV panel",
            notes: "Urgent replacement",
            severity: "critical",
            status: "open",
            createdAt: "2026-11-21T08:22:00.000Z",
            updatedAt: "2026-11-21T08:22:00.000Z",
            resolvedAt: null,
          },
        ],
      },
    ],
    activeAlerts: [
      {
        id: "alert_1",
        inventoryItemId: "item_tv",
        flatId: "mayfair",
        alertType: "damaged_critical_asset",
        severity: "critical",
        status: "open",
        message: "Critical asset Smart TV is damaged.",
        createdAt: "2026-11-21T08:21:00.000Z",
        resolvedAt: null,
      },
    ],
    maintenanceIssues: [
      {
        id: "issue_1",
        flatId: "mayfair",
        inventoryItemId: "item_tv",
        title: "Replace TV panel",
        notes: "Urgent replacement",
        severity: "critical",
        status: "open",
        createdAt: "2026-11-21T08:22:00.000Z",
        updatedAt: "2026-11-21T08:22:00.000Z",
        resolvedAt: null,
      },
    ],
    workerTasks: [],
  };
}

async function testFlatDetailRendersReconciliationActionsAndProvenance(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryFlatDetailSnapshotView({
      overview: createOverview(),
      flatId: "mayfair",
      quantityDrafts: {
        flat_inv_tv: "0",
        flat_inv_water: "4",
      },
      noteDrafts: {
        flat_inv_tv: "Screen cracked",
        flat_inv_water: "Lower than expected",
      },
      overrideStatusDraft: "out_of_service",
      overrideReasonDraft: "Manual safety hold",
      isSubmitting: false,
      onQuantityDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onOverrideStatusDraftChange: () => undefined,
      onOverrideReasonDraftChange: () => undefined,
      onAction: async () => undefined,
      onSetOverride: async () => undefined,
      onClearOverride: async () => undefined,
    })
  );

  assert.ok(html.includes("Flat Summary"));
  assert.ok(html.includes("Inventory Reconciliation"));
  assert.ok(html.includes("Readiness Breakdown"));
  assert.ok(html.includes("Recent Movements"));
  assert.ok(html.includes("Active Alerts"));
  assert.ok(html.includes("Active Maintenance Issues"));

  assert.ok(html.includes("Adjust Quantity"));
  assert.ok(html.includes("Mark Missing"));
  assert.ok(html.includes("Mark Damaged"));
  assert.ok(html.includes("Mark Replaced"));
  assert.ok(html.includes("Restocked Now"));
  assert.ok(html.includes("Note Discrepancy"));

  assert.ok(html.includes("Not Ready Because"));
  assert.ok(html.includes("Critical Assets: Blocked"));
  assert.ok(html.includes("Screen cracked"));
  assert.ok(html.includes("Critical asset Smart TV is damaged."));
  assert.ok(html.includes("Replace TV panel"));
}

async function testFlatDetailStillShowsReadinessWhenNoInventoryRecords(): Promise<void> {
  const overview = createOverview();
  overview.flatInventory = [
    {
      ...overview.flatInventory[0],
      records: [],
    },
  ];

  const html = renderToStaticMarkup(
    AdminInventoryFlatDetailSnapshotView({
      overview,
      flatId: "mayfair",
      quantityDrafts: {},
      noteDrafts: {},
      overrideStatusDraft: "needs_attention",
      overrideReasonDraft: "",
      isSubmitting: false,
      onQuantityDraftChange: () => undefined,
      onNoteDraftChange: () => undefined,
      onOverrideStatusDraftChange: () => undefined,
      onOverrideReasonDraftChange: () => undefined,
      onAction: async () => undefined,
      onSetOverride: async () => undefined,
      onClearOverride: async () => undefined,
    })
  );

  assert.ok(html.includes("Flat Summary"));
  assert.ok(html.includes("Readiness Breakdown"));
  assert.ok(html.includes("No flat inventory records available for reconciliation."));
  assert.ok(html.includes("Active Alerts"));
  assert.ok(html.includes("Active Maintenance Issues"));
}

async function run(): Promise<void> {
  await testFlatDetailRendersReconciliationActionsAndProvenance();
  await testFlatDetailStillShowsReadinessWhenNoInventoryRecords();

  console.log("admin-inventory-flat-detail-ui: ok");
}

void run();

