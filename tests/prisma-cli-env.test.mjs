import assert from "node:assert/strict";

import {
  assertPrismaCliDatabaseUrl,
  commandNeedsDatabaseUrl,
  resolvePrismaCliEnvironment,
} from "../scripts/prisma-cli-env.mjs";

function testResolvePrismaCliEnvironmentPrefersProcessEnv() {
  const result = resolvePrismaCliEnvironment({
    cwd: process.cwd(),
    env: {
      DATABASE_URL: "postgresql://postgres:secret@db.process.supabase.co:5432/postgres?sslmode=require",
    },
  });

  assert.equal(result.databaseUrlSource, "process.env");
  assert.match(result.databaseUrl, /^postgresql:\/\/postgres:secret@db\.process\.supabase\.co:5432\/postgres\?sslmode=require$/);
}

function testCommandNeedsDatabaseUrlRecognizesDatabaseCommands() {
  assert.equal(commandNeedsDatabaseUrl(["db", "push"]), true);
  assert.equal(commandNeedsDatabaseUrl(["migrate", "deploy"]), true);
  assert.equal(commandNeedsDatabaseUrl(["validate"]), true);
  assert.equal(commandNeedsDatabaseUrl(["generate"]), false);
}

function testAssertPrismaCliDatabaseUrlRejectsMissingSupabaseSslMode() {
  assert.throws(
    () =>
      assertPrismaCliDatabaseUrl(
        "postgresql://postgres:secret@db.example.supabase.co:5432/postgres"
      ),
    /sslmode=require/i
  );
}

function testAssertPrismaCliDatabaseUrlAllowsDirectSupabaseConnectionWithSslMode() {
  const databaseUrl =
    "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require";

  assert.equal(assertPrismaCliDatabaseUrl(databaseUrl), databaseUrl);
}

function testAssertPrismaCliDatabaseUrlRejectsTransactionPoolerWithoutPgbouncer() {
  assert.throws(
    () =>
      assertPrismaCliDatabaseUrl(
        "postgresql://postgres.example:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
      ),
    /pgbouncer=true/i
  );
}

function run() {
  testResolvePrismaCliEnvironmentPrefersProcessEnv();
  testCommandNeedsDatabaseUrlRecognizesDatabaseCommands();
  testAssertPrismaCliDatabaseUrlRejectsMissingSupabaseSslMode();
  testAssertPrismaCliDatabaseUrlAllowsDirectSupabaseConnectionWithSslMode();
  testAssertPrismaCliDatabaseUrlRejectsTransactionPoolerWithoutPgbouncer();

  console.log("prisma-cli-env: ok");
}

run();
