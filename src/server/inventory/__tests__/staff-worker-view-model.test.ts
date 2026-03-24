import assert from "node:assert/strict";

import type { AdminFlatInventoryEntry, AdminWorkerTask } from "../../../lib/admin-inventory-api";
import {
  buildRestockEntries,
  buildIssueTitle,
  findPreferredTaskForFlat,
  isChecklistComplete,
  parseNonNegativeInteger,
} from "../../../components/staff/staff-worker-view-model";

async function testBuildRestockEntriesAndQuantityParsing(): Promise<void> {
  const entries = buildRestockEntries([
    {
      id: "record_1",
      inventoryItemId: "item_water",
      itemName: "Bottled Water",
      category: "consumable",
      criticality: "important",
      unitOfMeasure: "bottle",
      expectedQuantity: 12,
      currentQuantity: 4,
      conditionStatus: "ok",
      notes: null,
      lastCheckedAt: null,
    },
    {
      id: "record_2",
      inventoryItemId: "item_tv",
      itemName: "Smart TV",
      category: "asset",
      criticality: "critical",
      unitOfMeasure: "piece",
      expectedQuantity: 1,
      currentQuantity: 1,
      conditionStatus: "ok",
      notes: null,
      lastCheckedAt: null,
    },
  ] as AdminFlatInventoryEntry[], "mayfair", "Mayfair Suite");

  assert.equal(entries.length, 1);
  assert.equal(entries[0].neededQuantity, 8);
  assert.equal(parseNonNegativeInteger("6"), 6);
  assert.equal(parseNonNegativeInteger("-1"), null);
  assert.equal(isChecklistComplete({ cleaning: true, linen: true, consumables: true }), true);
  assert.equal(isChecklistComplete({ cleaning: true, linen: false, consumables: true }), false);
}

async function testIssueTitleAndPreferredTaskSelection(): Promise<void> {
  assert.equal(buildIssueTitle("supplies_missing"), "Supplies Missing");
  assert.equal(buildIssueTitle("equipment_damage"), "Equipment Damage");

  const task = findPreferredTaskForFlat(
    [
      {
        id: "t1",
        flatId: "mayfair",
        title: "Restock water",
        description: null,
        taskType: "restock",
        priority: "important",
        status: "pending",
        sourceType: "manual",
        sourceId: "manual_1",
        assignedTo: null,
        createdAt: "2026-11-25T08:00:00.000Z",
        updatedAt: "2026-11-25T08:00:00.000Z",
        completedAt: null,
      },
    ] as AdminWorkerTask[],
    "mayfair",
    ["restock"]
  );

  assert.ok(task);
  assert.equal(task?.id, "t1");
}

async function run(): Promise<void> {
  await testBuildRestockEntriesAndQuantityParsing();
  await testIssueTitleAndPreferredTaskSelection();

  console.log("staff-worker-view-model: ok");
}

void run();
