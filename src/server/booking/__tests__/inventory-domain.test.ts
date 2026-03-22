import assert from "node:assert/strict";

import {
  createFlatInventoryRecord,
  createFlatReadinessRecord,
  createInventoryAlertRecord,
  createInventoryItemRecord,
  createInventoryTemplateRecord,
  createMaintenanceIssueRecord,
  createStockMovementRecord,
  createTemplateItemRecord,
  ensureFlatInventoryConditionStatus,
  ensureFlatReadinessStatus,
  ensureInventoryAlertSeverity,
  ensureInventoryAlertStatus,
  ensureInventoryAlertType,
  ensureInventoryItemCategory,
  ensureInventoryItemCriticality,
  ensureMaintenanceIssueStatus,
  ensureReadinessComponentStatus,
  ensureStockMovementType,
} from "../inventory-domain";
import type {
  FlatInventoryConditionStatus,
  FlatReadinessStatus,
  InventoryAlertSeverity,
  InventoryAlertStatus,
  InventoryAlertType,
  InventoryItemCategory,
  InventoryItemCriticality,
  MaintenanceIssueStatus,
  ReadinessComponentStatus,
  StockMovementType,
} from "../../../types/booking-backend";

async function testValidItemCategorySupport(): Promise<void> {
  assert.equal(ensureInventoryItemCategory("asset"), "asset");
  assert.equal(ensureInventoryItemCategory("consumable"), "consumable");
  assert.equal(ensureInventoryItemCategory("maintenance_supply"), "maintenance_supply");

  assert.equal(ensureInventoryItemCriticality("critical"), "critical");
  assert.equal(ensureInventoryItemCriticality("important"), "important");
  assert.equal(ensureInventoryItemCriticality("minor"), "minor");
}

async function testTemplateToTemplateItemStructure(): Promise<void> {
  const template = createInventoryTemplateRecord({
    id: "template_exec_1",
    name: "Executive Two-Bedroom Standard",
    description: "Default setup for executive flats",
    flatType: "two_bedroom_executive",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  });

  const item = createTemplateItemRecord({
    id: "template_item_1",
    templateId: template.id,
    inventoryItemId: "item_television_55",
    expectedQuantity: 1,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  });

  assert.equal(template.id, "template_exec_1");
  assert.equal(item.templateId, template.id);
  assert.equal(item.expectedQuantity, 1);
}

async function testFlatInventoryRecordShape(): Promise<void> {
  const record = createFlatInventoryRecord({
    id: "flat_inv_1",
    flatId: "mayfair",
    inventoryItemId: "item_television_55",
    expectedQuantity: 1,
    currentQuantity: 1,
    conditionStatus: "ok",
    notes: "Checked and working.",
    lastCheckedAt: "2026-10-01T11:00:00.000Z",
    createdAt: "2026-10-01T11:00:00.000Z",
    updatedAt: "2026-10-01T11:00:00.000Z",
  });

  assert.equal(record.flatId, "mayfair");
  assert.equal(record.conditionStatus, "ok");
  assert.equal(record.currentQuantity, 1);
}

async function testStockMovementShape(): Promise<void> {
  const movement = createStockMovementRecord({
    id: "move_1",
    inventoryItemId: "item_bath_towel",
    flatId: "kensington",
    movementType: "transfer",
    quantity: 4,
    reason: "Replenish flat linen",
    notes: "Moved from central store.",
    actorId: "staff_ops_1",
    createdAt: "2026-10-01T12:00:00.000Z",
  });

  assert.equal(movement.movementType, "transfer");
  assert.equal(movement.quantity, 4);
  assert.equal(movement.flatId, "kensington");
}

async function testReadinessRecordShape(): Promise<void> {
  const readiness = createFlatReadinessRecord({
    flatId: "windsor",
    cleaningStatus: "ready",
    linenStatus: "ready",
    consumablesStatus: "attention_required",
    maintenanceStatus: "ready",
    criticalAssetStatus: "ready",
    readinessStatus: "needs_attention",
    overrideStatus: null,
    overrideReason: null,
    updatedAt: "2026-10-01T13:00:00.000Z",
  });

  assert.equal(readiness.flatId, "windsor");
  assert.equal(readiness.readinessStatus, "needs_attention");
  assert.equal(readiness.consumablesStatus, "attention_required");
}

async function testAlertRecordShape(): Promise<void> {
  const alert = createInventoryAlertRecord({
    id: "alert_1",
    inventoryItemId: "item_toiletries_pack",
    flatId: "mayfair",
    alertType: "low_stock",
    severity: "important",
    status: "open",
    message: "Toiletries below par level for upcoming arrivals.",
    createdAt: "2026-10-01T13:30:00.000Z",
    resolvedAt: null,
  });

  assert.equal(alert.alertType, "low_stock");
  assert.equal(alert.severity, "important");
  assert.equal(alert.status, "open");
}

async function testMaintenanceIssueShape(): Promise<void> {
  const issue = createMaintenanceIssueRecord({
    id: "issue_1",
    flatId: "mayfair",
    inventoryItemId: "item_ac_unit",
    title: "AC unit not cooling",
    notes: "Needs compressor inspection.",
    severity: "critical",
    status: "open",
    createdAt: "2026-10-01T14:00:00.000Z",
    updatedAt: "2026-10-01T14:00:00.000Z",
    resolvedAt: null,
  });

  assert.equal(issue.title, "AC unit not cooling");
  assert.equal(issue.severity, "critical");
  assert.equal(issue.status, "open");
}

async function testRejectInvalidEnumLikeValues(): Promise<void> {
  assert.throws(() => ensureInventoryItemCategory("tool"), /Invalid inventory item category/i);
  assert.throws(() => ensureInventoryItemCriticality("high"), /Invalid inventory item criticality/i);
  assert.throws(() => ensureFlatInventoryConditionStatus("broken"), /Invalid flat inventory condition status/i);
  assert.throws(() => ensureStockMovementType("borrow"), /Invalid stock movement type/i);
  assert.throws(() => ensureReadinessComponentStatus("pending"), /Invalid readiness component status/i);
  assert.throws(() => ensureFlatReadinessStatus("blocked"), /Invalid flat readiness status/i);
  assert.throws(() => ensureInventoryAlertType("overdue"), /Invalid inventory alert type/i);
  assert.throws(() => ensureInventoryAlertSeverity("warning"), /Invalid inventory alert severity/i);
  assert.throws(() => ensureInventoryAlertStatus("new"), /Invalid inventory alert status/i);
  assert.throws(() => ensureMaintenanceIssueStatus("queued"), /Invalid maintenance issue status/i);
}

async function testTypeSafetyForInventoryEnums(): Promise<void> {
  const category: InventoryItemCategory = "asset";
  const criticality: InventoryItemCriticality = "critical";
  const condition: FlatInventoryConditionStatus = "ok";
  const movementType: StockMovementType = "add";
  const componentStatus: ReadinessComponentStatus = "ready";
  const readinessStatus: FlatReadinessStatus = "ready";
  const alertType: InventoryAlertType = "low_stock";
  const alertSeverity: InventoryAlertSeverity = "minor";
  const alertStatus: InventoryAlertStatus = "resolved";
  const issueStatus: MaintenanceIssueStatus = "in_progress";

  assert.equal(category, "asset");
  assert.equal(criticality, "critical");
  assert.equal(condition, "ok");
  assert.equal(movementType, "add");
  assert.equal(componentStatus, "ready");
  assert.equal(readinessStatus, "ready");
  assert.equal(alertType, "low_stock");
  assert.equal(alertSeverity, "minor");
  assert.equal(alertStatus, "resolved");
  assert.equal(issueStatus, "in_progress");

  // @ts-expect-error invalid inventory item category must not type-check
  const invalidCategory: InventoryItemCategory = "tool";
  assert.equal(typeof invalidCategory, "string");

  // @ts-expect-error invalid readiness status must not type-check
  const invalidReadiness: FlatReadinessStatus = "blocked";
  assert.equal(typeof invalidReadiness, "string");
}

async function run(): Promise<void> {
  await testValidItemCategorySupport();
  await testTemplateToTemplateItemStructure();
  await testFlatInventoryRecordShape();
  await testStockMovementShape();
  await testReadinessRecordShape();
  await testAlertRecordShape();
  await testMaintenanceIssueShape();
  await testRejectInvalidEnumLikeValues();
  await testTypeSafetyForInventoryEnums();

  const sampleItem = createInventoryItemRecord({
    id: "item_1",
    name: "Bath Towel",
    category: "consumable",
    internalCode: "BT-001",
    unitOfMeasure: "piece",
    reorderThreshold: 12,
    parLevel: 24,
    criticality: "important",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  });

  assert.equal(sampleItem.category, "consumable");
  assert.equal(sampleItem.reorderThreshold, 12);

  console.log("inventory-domain: ok");
}

void run();
