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

  const roles = extractEnumValues(schema, "AuthRole");
  assert.deepEqual(roles, ["admin", "staff"]);

  assertModelHasFields(schema, "AuthUser", [
    "id",
    "email",
    "passwordHash",
    "role",
    "isActive",
    "sessions",
    "createdAt",
    "updatedAt",
  ]);

  assertModelHasFields(schema, "AuthSession", [
    "id",
    "userId",
    "user",
    "sessionToken",
    "expiresAt",
    "createdAt",
    "updatedAt",
  ]);

  const authUserModel = schema.match(/model\s+AuthUser\s+\{([\s\S]*?)\}/m);
  assert.ok(authUserModel, "Expected model AuthUser to exist");
  assert.match(authUserModel[1], /@@map\("users"\)/, "Expected AuthUser to map to users table");
  assert.match(authUserModel[1], /email\s+String\s+@unique/, "Expected AuthUser.email unique constraint");

  const authSessionModel = schema.match(/model\s+AuthSession\s+\{([\s\S]*?)\}/m);
  assert.ok(authSessionModel, "Expected model AuthSession to exist");
  assert.match(authSessionModel[1], /@@map\("sessions"\)/, "Expected AuthSession to map to sessions table");
  assert.match(
    authSessionModel[1],
    /sessionToken\s+String\s+@unique/,
    "Expected AuthSession.sessionToken unique constraint"
  );

  console.log("auth-schema-contract: ok");
}

run();
