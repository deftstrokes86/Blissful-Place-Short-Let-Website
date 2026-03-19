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

function extractTypeUnionValues(source, typeName) {
  const match = source.match(new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`, "m"));
  assert.ok(match, `Expected type ${typeName} to exist`);

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (entry) => entry[1]);
}

function run() {
  const schema = readFileSync(resolve(process.cwd(), "prisma", "schema.prisma"), "utf8");
  const bookingTypes = readFileSync(resolve(process.cwd(), "src", "types", "booking.ts"), "utf8");

  const schemaStatuses = extractEnumValues(schema, "ReservationStatus");
  const schemaMethods = extractEnumValues(schema, "PaymentMethod");

  const typeStatuses = extractTypeUnionValues(bookingTypes, "ReservationStatus");
  const typeMethods = extractTypeUnionValues(bookingTypes, "PaymentMethod");

  assert.deepEqual(schemaStatuses, typeStatuses, "ReservationStatus enum drift between schema and shared types");
  assert.deepEqual(schemaMethods, typeMethods, "PaymentMethod enum drift between schema and shared types");

  console.log("booking-schema-alignment: ok");
}

run();
