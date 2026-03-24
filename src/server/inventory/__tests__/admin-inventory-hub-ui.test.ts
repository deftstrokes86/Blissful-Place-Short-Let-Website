import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminInventoryOverview } from "../../../lib/admin-inventory-api";
import { AdminInventoryHubSnapshotView } from "../../../components/admin/inventory/AdminInventoryHubSnapshotView";

function createOverview(): AdminInventoryOverview {
  return {
    generatedAt: "2026-11-20T10:00:00.000Z",
    flats: [
      { id: "mayfair", name: "Mayfair Suite" },
      { id: "windsor", name: "Windsor Residence" },
    ],
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
    templates: [
      {
        id: "template_1",
        name: "Mayfair Standard",
        description: "Base setup",
        flatType: "suite",
        items: [
          {
            id: "template_item_1",
            inventoryItemId: "item_tv",
            expectedQuantity: 1,
            itemName: "Smart TV",
          },
        ],
      },
    ],
    flatInventory: [
      {
        flatId: "mayfair",
        flatName: "Mayfair Suite",
        records: [
          {
            id: "flat_inv_1",
            inventoryItemId: "item_tv",
            itemName: "Smart TV",
            category: "asset",
            criticality: "critical",
            unitOfMeasure: "piece",
            expectedQuantity: 1,
            currentQuantity: 1,
            conditionStatus: "ok",
            notes: null,
            lastCheckedAt: "2026-11-20T09:00:00.000Z",
          },
        ],
      },
      {
        flatId: "windsor",
        flatName: "Windsor Residence",
        records: [],
      },
    ],
    stockMovements: [
      {
        id: "movement_1",
        inventoryItemId: "item_water",
        itemName: "Bottled Water",
        flatId: "mayfair",
        contextLabel: "Mayfair Suite",
        movementType: "transfer",
        quantity: 6,
        reason: "Restock",
        notes: null,
        actorId: "staff_1",
        createdAt: "2026-11-20T08:00:00.000Z",
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
          criticalAssetStatus: "ready",
          readinessStatus: "needs_attention",
          overrideStatus: null,
          overrideReason: null,
          updatedAt: "2026-11-20T09:00:00.000Z",
        },
        activeAlerts: [],
        activeIssues: [],
      },
      {
        flatId: "windsor",
        flatName: "Windsor Residence",
        readiness: {
          flatId: "windsor",
          cleaningStatus: "ready",
          linenStatus: "ready",
          consumablesStatus: "ready",
          maintenanceStatus: "ready",
          criticalAssetStatus: "ready",
          readinessStatus: "ready",
          overrideStatus: null,
          overrideReason: null,
          updatedAt: "2026-11-20T09:00:00.000Z",
        },
        activeAlerts: [],
        activeIssues: [],
      },
    ],
    activeAlerts: [
      {
        id: "alert_1",
        inventoryItemId: "item_water",
        flatId: "mayfair",
        alertType: "low_stock",
        severity: "important",
        status: "open",
        message: "Bottled water below expected level.",
        createdAt: "2026-11-20T09:30:00.000Z",
        resolvedAt: null,
      },
    ],
    maintenanceIssues: [
      {
        id: "issue_1",
        flatId: "mayfair",
        inventoryItemId: null,
        title: "Bathroom leak",
        notes: "Pending fix",
        severity: "important",
        status: "open",
        createdAt: "2026-11-20T09:20:00.000Z",
        updatedAt: "2026-11-20T09:20:00.000Z",
        resolvedAt: null,
      },
    ],
    workerTasks: [
      {
        id: "task_1",
        flatId: "mayfair",
        title: "Restock water",
        description: "Priority restock",
        taskType: "restock",
        priority: "important",
        status: "open",
        sourceType: "alert",
        sourceId: "alert_1",
        assignedTo: null,
        createdAt: "2026-11-20T09:15:00.000Z",
        updatedAt: "2026-11-20T09:15:00.000Z",
        completedAt: null,
      },
    ],
  };
}

function createEmptyOverview(): AdminInventoryOverview {
  return {
    generatedAt: "2026-11-20T10:00:00.000Z",
    flats: [],
    inventoryCatalog: [],
    templates: [],
    flatInventory: [],
    stockMovements: [],
    readiness: [],
    activeAlerts: [],
    maintenanceIssues: [],
    workerTasks: [],
  };
}

async function testHubRendersOperationalNavigationCards(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryHubSnapshotView({
      overview: createOverview(),
    })
  );

  assert.ok(html.includes("Inventory Catalog"));
  assert.ok(html.includes("Templates"));
  assert.ok(html.includes("Central Stock"));
  assert.ok(html.includes("Stock Movements"));
  assert.ok(html.includes("Alerts Snapshot"));
  assert.ok(html.includes("Readiness and Flats"));

  assert.ok(html.includes("/admin/inventory/items/new"));
  assert.ok(html.includes("/admin/inventory/templates/new"));
  assert.ok(html.includes("/admin/inventory/stock"));
  assert.ok(html.includes("/admin/inventory/movements/new"));
  assert.ok(html.includes("/admin/inventory/alerts"));
}

async function testHubRendersKeyCountsAndFlatQuickLinks(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryHubSnapshotView({
      overview: createOverview(),
    })
  );

  assert.ok(html.includes("2 total items"));
  assert.ok(html.includes("1 active template"));
  assert.ok(html.includes("1 open alert"));
  assert.ok(html.includes("1 open issue"));
  assert.ok(html.includes("1 open task"));

  assert.ok(html.includes("/admin/inventory/flats/mayfair"));
  assert.ok(html.includes("/admin/inventory/flats/windsor"));
}

async function testHubEmptyStatesStayActionable(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryHubSnapshotView({
      overview: createEmptyOverview(),
    })
  );

  assert.ok(html.includes("No inventory catalog items yet."));
  assert.ok(html.includes("No templates configured yet."));
  assert.ok(html.includes("No open alerts right now."));
  assert.ok(html.includes("Start by creating your first item"));
}

async function run(): Promise<void> {
  await testHubRendersOperationalNavigationCards();
  await testHubRendersKeyCountsAndFlatQuickLinks();
  await testHubEmptyStatesStayActionable();

  console.log("admin-inventory-hub-ui: ok");
}

void run();
