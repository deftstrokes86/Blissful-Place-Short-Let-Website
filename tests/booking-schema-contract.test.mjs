import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function extractEnumValues(schema, name) {
  const match = schema.match(new RegExp(`enum\\s+${name}\\s+\\{([\\s\\S]*?)\\}`, "m"));
  assert.ok(match, `Expected enum ${name} to exist`);

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//"));
}

function assertModelHasFields(schema, modelName, fields) {
  const modelMatch = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\}`, "m"));
  assert.ok(modelMatch, `Expected model ${modelName} to exist`);

  const body = modelMatch[1];
  for (const field of fields) {
    assert.match(body, new RegExp(`\\b${field}\\b`), `Expected ${modelName} to include field '${field}'`);
  }
}

function run() {
  const schemaPath = resolve(process.cwd(), "prisma", "schema.prisma");
  const schema = readFileSync(schemaPath, "utf8");

  const statuses = extractEnumValues(schema, "ReservationStatus");
  assert.deepEqual(statuses, [
    "draft",
    "pending_online_payment",
    "pending_transfer_submission",
    "awaiting_transfer_verification",
    "pending_pos_coordination",
    "confirmed",
    "expired",
    "cancelled",
    "failed_payment",
  ]);

  const methods = extractEnumValues(schema, "PaymentMethod");
  assert.deepEqual(methods, ["website", "transfer", "pos"]);

  const inventoryCategories = extractEnumValues(schema, "InventoryItemCategory");
  assert.deepEqual(inventoryCategories, ["asset", "consumable", "maintenance_supply"]);

  const inventoryCriticality = extractEnumValues(schema, "InventoryItemCriticality");
  assert.deepEqual(inventoryCriticality, ["critical", "important", "minor"]);

  const flatInventoryCondition = extractEnumValues(schema, "FlatInventoryConditionStatus");
  assert.deepEqual(flatInventoryCondition, ["ok", "missing", "damaged", "needs_replacement"]);

  const stockMovementTypes = extractEnumValues(schema, "StockMovementType");
  assert.deepEqual(stockMovementTypes, ["add", "deduct", "consume", "adjust", "damage", "replace", "transfer"]);

  const readinessComponentStatus = extractEnumValues(schema, "ReadinessComponentStatus");
  assert.deepEqual(readinessComponentStatus, ["ready", "attention_required", "blocked"]);

  const flatReadinessStatus = extractEnumValues(schema, "FlatReadinessStatus");
  assert.deepEqual(flatReadinessStatus, ["ready", "needs_attention", "out_of_service"]);

  const alertType = extractEnumValues(schema, "InventoryAlertType");
  assert.deepEqual(alertType, ["low_stock", "missing_required_item", "damaged_critical_asset", "readiness_issue", "readiness_impacting_issue"]);

  const alertSeverity = extractEnumValues(schema, "InventoryAlertSeverity");
  assert.deepEqual(alertSeverity, ["critical", "important", "minor"]);

  const alertStatus = extractEnumValues(schema, "InventoryAlertStatus");
  assert.deepEqual(alertStatus, ["open", "acknowledged", "resolved"]);

  const maintenanceStatus = extractEnumValues(schema, "MaintenanceIssueStatus");
  assert.deepEqual(maintenanceStatus, ["open", "in_progress", "resolved", "closed"]);

  assertModelHasFields(schema, "Flat", ["id", "name", "nightlyRate", "maxGuests"]);
  assertModelHasFields(schema, "Extra", ["id", "title", "flatFee"]);
  assertModelHasFields(schema, "Reservation", [
    "id",
    "token",
    "status",
    "paymentMethod",
    "transferHoldStartedAt",
    "transferHoldExpiresAt",
  ]);
  assertModelHasFields(schema, "AvailabilityBlock", [
    "id",
    "flatId",
    "sourceType",
    "sourceId",
    "blockType",
    "startDate",
    "endDate",
    "status",
    "expiresAt",
  ]);
  assertModelHasFields(schema, "PaymentAttempt", ["id", "reservationId", "outcome", "providerReference"]);
  assertModelHasFields(schema, "TransferVerificationMetadata", [
    "id",
    "reservationId",
    "transferReference",
    "verificationStatus",
  ]);
  assertModelHasFields(schema, "PosCoordinationMetadata", ["id", "reservationId", "contactWindow", "status"]);
  assertModelHasFields(schema, "IdempotencyKey", ["key", "action", "payloadHash", "responseSnapshot"]);

  assertModelHasFields(schema, "InventoryItem", [
    "id",
    "name",
    "category",
    "internalCode",
    "unitOfMeasure",
    "reorderThreshold",
    "parLevel",
    "criticality",
    "createdAt",
    "updatedAt",
  ]);

  assertModelHasFields(schema, "InventoryTemplate", ["id", "name", "description", "flatType", "createdAt", "updatedAt"]);

  assertModelHasFields(schema, "TemplateItem", [
    "id",
    "templateId",
    "inventoryItemId",
    "expectedQuantity",
    "createdAt",
    "updatedAt",
  ]);

  assertModelHasFields(schema, "FlatInventory", [
    "id",
    "flatId",
    "inventoryItemId",
    "expectedQuantity",
    "currentQuantity",
    "conditionStatus",
    "notes",
    "lastCheckedAt",
    "createdAt",
    "updatedAt",
  ]);

  assertModelHasFields(schema, "StockMovement", [
    "id",
    "inventoryItemId",
    "flatId",
    "movementType",
    "quantity",
    "reason",
    "notes",
    "actorId",
    "createdAt",
  ]);

  assertModelHasFields(schema, "FlatReadiness", [
    "flatId",
    "cleaningStatus",
    "linenStatus",
    "consumablesStatus",
    "maintenanceStatus",
    "criticalAssetStatus",
    "readinessStatus",
    "overrideStatus",
    "overrideReason",
    "updatedAt",
  ]);

  assertModelHasFields(schema, "InventoryAlert", [
    "id",
    "inventoryItemId",
    "flatId",
    "alertType",
    "severity",
    "status",
    "message",
    "createdAt",
    "resolvedAt",
  ]);

  assertModelHasFields(schema, "MaintenanceIssue", [
    "id",
    "flatId",
    "inventoryItemId",
    "title",
    "notes",
    "severity",
    "status",
    "createdAt",
    "updatedAt",
    "resolvedAt",
  ]);

  const idempotencyModel = schema.match(/model\s+IdempotencyKey\s+\{([\s\S]*?)\}/m);
  assert.ok(idempotencyModel, "Expected model IdempotencyKey to exist");
  assert.match(
    idempotencyModel[1],
    /@@id\(\[key,\s*action\]\)/,
    "Expected composite primary key on [key, action]"
  );

  const extraModel = schema.match(/model\s+Extra\s+\{([\s\S]*?)\}/m);
  assert.ok(extraModel, "Expected model Extra to exist");
  assert.match(extraModel[1], /flatFee\s+Int/, "Expected Extra.flatFee Int");

  console.log("booking-schema-contract: ok");
}

run();

