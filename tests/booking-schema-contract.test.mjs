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
  assertModelHasFields(schema, "PaymentAttempt", ["id", "reservationId", "outcome", "providerReference"]);
  assertModelHasFields(schema, "TransferVerificationMetadata", [
    "id",
    "reservationId",
    "transferReference",
    "verificationStatus",
  ]);
  assertModelHasFields(schema, "PosCoordinationMetadata", ["id", "reservationId", "contactWindow", "status"]);
  assertModelHasFields(schema, "IdempotencyKey", ["key", "action", "payloadHash", "responseSnapshot"]);

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
