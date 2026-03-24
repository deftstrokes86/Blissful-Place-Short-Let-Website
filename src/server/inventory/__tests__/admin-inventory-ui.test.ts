import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminInventoryOverview } from "../../../lib/admin-inventory-api";
import { AdminInventorySnapshotView } from "../../../components/admin/inventory/AdminInventorySnapshotView";
import { AdminReadinessSnapshotView } from "../../../components/admin/readiness/AdminReadinessSnapshotView";

function createOverview(): AdminInventoryOverview {
  return {
    generatedAt: "2026-11-10T10:00:00.000Z",
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
    ],
    templates: [
      {
        id: "template_1",
        name: "Mayfair Standard",
        description: "Base guest-ready setup",
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
            lastCheckedAt: "2026-11-10T09:00:00.000Z",
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
        movementType: "replace",
        quantity: 1,
        reason: "Damaged item replaced",
        notes: null,
        actorId: "staff_1",
        createdAt: "2026-11-10T08:00:00.000Z",
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
          updatedAt: "2026-11-10T09:30:00.000Z",
        },
        activeAlerts: [
          {
            id: "alert_1",
            inventoryItemId: "item_water",
            flatId: "mayfair",
            alertType: "low_stock",
            severity: "important",
            status: "open",
            message: "Bottled water below expected level.",
            createdAt: "2026-11-10T09:45:00.000Z",
            resolvedAt: null,
          },
        ],
        activeIssues: [
          {
            id: "issue_1",
            flatId: "mayfair",
            inventoryItemId: "item_tv",
            title: "Remote battery issue",
            notes: "replace battery",
            severity: "minor",
            status: "open",
            createdAt: "2026-11-10T09:40:00.000Z",
            updatedAt: "2026-11-10T09:40:00.000Z",
            resolvedAt: null,
          },
        ],
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
        createdAt: "2026-11-10T09:45:00.000Z",
        resolvedAt: null,
      },
    ],
    workerTasks: [],
    maintenanceIssues: [
      {
        id: "issue_1",
        flatId: "mayfair",
        inventoryItemId: "item_tv",
        title: "Remote battery issue",
        notes: "replace battery",
        severity: "minor",
        status: "open",
        createdAt: "2026-11-10T09:40:00.000Z",
        updatedAt: "2026-11-10T09:40:00.000Z",
        resolvedAt: null,
      },
    ],
  };
}

async function testInventorySnapshotRendersCoreSections(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventorySnapshotView({
      overview: createOverview(),
      selectedFlatId: "mayfair",
    })
  );

  assert.ok(html.includes("Inventory Catalog"));
  assert.ok(html.includes("Templates"));
  assert.ok(html.includes("Flat Inventory"));
  assert.ok(html.includes("Stock Movements"));
  assert.ok(html.includes("Smart TV"));
}

async function testReadinessSnapshotRendersStatusesAndAlerts(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminReadinessSnapshotView({
      overview: createOverview(),
    })
  );

  assert.ok(html.includes("Readiness Dashboard"));
  assert.ok(html.includes("Needs Attention"));
  assert.ok(html.includes("Maintenance and Alerts"));
  assert.ok(html.includes("Bottled water below expected level"));
  assert.ok(html.includes("Remote battery issue"));
}

async function run(): Promise<void> {
  await testInventorySnapshotRendersCoreSections();
  await testReadinessSnapshotRendersStatusesAndAlerts();

  console.log("admin-inventory-ui: ok");
}

void run();
