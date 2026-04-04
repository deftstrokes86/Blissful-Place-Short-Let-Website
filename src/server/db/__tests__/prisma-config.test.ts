import assert from "node:assert/strict";

import {
  resolvePrismaClientOptions,
  resolvePrismaDatabaseUrl,
  resolvePrismaLogLevels,
} from "../prisma-config";

function testResolvePrismaDatabaseUrlReturnsTrimmedPostgresUrl(): void {
  const databaseUrl = "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";

  assert.equal(resolvePrismaDatabaseUrl({ DATABASE_URL: `  ${databaseUrl}  ` }), databaseUrl);
}

function testResolvePrismaDatabaseUrlRejectsMissingValue(): void {
  assert.throws(() => resolvePrismaDatabaseUrl({}), /DATABASE_URL is required/i);
}

function testResolvePrismaDatabaseUrlRejectsFileUrls(): void {
  assert.throws(
    () => resolvePrismaDatabaseUrl({ DATABASE_URL: "file:./.data/payload.db" }),
    /Supabase Postgres|file-based database URLs/i
  );
}

function testResolvePrismaDatabaseUrlRejectsMalformedValues(): void {
  assert.throws(
    () => resolvePrismaDatabaseUrl({ DATABASE_URL: "definitely-not-a-connection-string" }),
    /valid postgres:\/\/ or postgresql:\/\//i
  );
}

function testResolvePrismaDatabaseUrlRejectsWrongProtocol(): void {
  assert.throws(
    () => resolvePrismaDatabaseUrl({ DATABASE_URL: "mysql://user:pass@example.com:3306/app" }),
    /must use a postgres:\/\/ or postgresql:\/\//i
  );
}

function testResolvePrismaDatabaseUrlRejectsSupabaseTransactionPoolerWithoutPgbouncer(): void {
  assert.throws(
    () =>
      resolvePrismaDatabaseUrl({
        DATABASE_URL:
          "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
      }),
    /6543 without pgbouncer=true/i
  );
}

function testResolvePrismaDatabaseUrlAllowsSupabaseTransactionPoolerWithPgbouncer(): void {
  const databaseUrl =
    "postgresql://postgres.user:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require";

  assert.equal(resolvePrismaDatabaseUrl({ DATABASE_URL: databaseUrl }), databaseUrl);
}

function testResolvePrismaLogLevelsFollowEnvironment(): void {
  assert.deepEqual(resolvePrismaLogLevels({ NODE_ENV: "development" }), ["warn", "error"]);
  assert.deepEqual(resolvePrismaLogLevels({ NODE_ENV: "production" }), ["error"]);
}

function testResolvePrismaClientOptionsInjectsValidatedDatabaseUrl(): void {
  const databaseUrl = "postgres://postgres.user:secret@db.example.supabase.co:5432/postgres?sslmode=require";
  const options = resolvePrismaClientOptions({
    DATABASE_URL: ` ${databaseUrl} `,
    NODE_ENV: "production",
  });

  assert.deepEqual(options.datasources, {
    db: {
      url: databaseUrl,
    },
  });
  assert.deepEqual(options.log, ["error"]);
}

function run(): void {
  testResolvePrismaDatabaseUrlReturnsTrimmedPostgresUrl();
  testResolvePrismaDatabaseUrlRejectsMissingValue();
  testResolvePrismaDatabaseUrlRejectsFileUrls();
  testResolvePrismaDatabaseUrlRejectsMalformedValues();
  testResolvePrismaDatabaseUrlRejectsWrongProtocol();
  testResolvePrismaDatabaseUrlRejectsSupabaseTransactionPoolerWithoutPgbouncer();
  testResolvePrismaDatabaseUrlAllowsSupabaseTransactionPoolerWithPgbouncer();
  testResolvePrismaLogLevelsFollowEnvironment();
  testResolvePrismaClientOptionsInjectsValidatedDatabaseUrl();

  console.log("prisma-config: ok");
}

run();
