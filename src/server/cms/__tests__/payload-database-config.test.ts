import assert from "node:assert/strict";

import {
  PAYLOAD_LOCAL_SQLITE_URL,
  describePayloadDatabaseDependency,
  resolvePayloadDatabaseConfig,
} from "@/cms/payload-database-config";

async function testPayloadDefaultsToCanonicalDatabaseUrl(): Promise<void> {
  const databaseUrl = "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require";
  const resolved = resolvePayloadDatabaseConfig({
    DATABASE_URL: databaseUrl,
    NODE_ENV: "development",
  });

  assert.equal(resolved.databaseUrl, databaseUrl);
  assert.equal(resolved.kind, "postgres");
  assert.equal(resolved.usesExplicitOverride, false);
  assert.equal(resolved.pushSchema, true);
}

async function testPayloadPrefersExplicitOverride(): Promise<void> {
  const resolved = resolvePayloadDatabaseConfig({
    DATABASE_URL: "postgresql://postgres:secret@db.primary.supabase.co:5432/postgres?sslmode=require",
    PAYLOAD_DATABASE_URL:
      "postgresql://postgres:secret@db.payload.supabase.co:5432/postgres?sslmode=require",
    NODE_ENV: "development",
  });

  assert.equal(
    resolved.databaseUrl,
    "postgresql://postgres:secret@db.payload.supabase.co:5432/postgres?sslmode=require"
  );
  assert.equal(resolved.usesExplicitOverride, true);
}

async function testPayloadAllowsExplicitLocalSqliteOnlyInNonProduction(): Promise<void> {
  const resolved = resolvePayloadDatabaseConfig({
    DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
    PAYLOAD_DATABASE_URL: PAYLOAD_LOCAL_SQLITE_URL,
    NODE_ENV: "development",
  });

  assert.equal(resolved.kind, "sqlite");
  assert.equal(resolved.isLocalSqliteOverride, true);
}

async function testPayloadRejectsMissingDatabaseConfig(): Promise<void> {
  assert.throws(
    () => resolvePayloadDatabaseConfig({ NODE_ENV: "development" }),
    /Payload CMS requires a Postgres connection string/i
  );
}

async function testPayloadRejectsImplicitSqliteCanonicalDatabaseUrl(): Promise<void> {
  assert.throws(
    () =>
      resolvePayloadDatabaseConfig({
        DATABASE_URL: PAYLOAD_LOCAL_SQLITE_URL,
        NODE_ENV: "development",
      }),
    /only supported through an explicit PAYLOAD_DATABASE_URL override/i
  );
}

async function testPayloadRejectsProductionSqliteOverride(): Promise<void> {
  assert.throws(
    () =>
      resolvePayloadDatabaseConfig({
        DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
        PAYLOAD_DATABASE_URL: PAYLOAD_LOCAL_SQLITE_URL,
        NODE_ENV: "production",
      }),
    /configured to use SQLite in production/i
  );
}

async function testPayloadRejectsSupabaseWithoutSslModeOnDatabaseUrl(): Promise<void> {
  assert.throws(
    () =>
      resolvePayloadDatabaseConfig({
        DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres",
        NODE_ENV: "development",
      }),
    /from DATABASE_URL points at Supabase without sslmode=require/i
  );
}

async function testPayloadRejectsSupabaseWithoutSslModeOnPayloadOverride(): Promise<void> {
  assert.throws(
    () =>
      resolvePayloadDatabaseConfig({
        DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
        PAYLOAD_DATABASE_URL: "postgresql://postgres:secret@db.payload.supabase.co:5432/postgres",
        NODE_ENV: "development",
      }),
    /from PAYLOAD_DATABASE_URL points at Supabase without sslmode=require/i
  );
}

async function testPayloadAutoPushDefaultsStayPredictable(): Promise<void> {
  assert.equal(
    resolvePayloadDatabaseConfig({
      DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
      NODE_ENV: "development",
    }).pushSchema,
    true
  );

  assert.equal(
    resolvePayloadDatabaseConfig({
      DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
      NODE_ENV: "production",
    }).pushSchema,
    false
  );

  assert.equal(
    resolvePayloadDatabaseConfig({
      DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
      NODE_ENV: "production",
      PAYLOAD_AUTO_PUSH_SCHEMA: "true",
    }).pushSchema,
    true
  );
}

async function testPayloadDependencyDescriptionDefaultsToSharedDatabaseUrl(): Promise<void> {
  const description = describePayloadDatabaseDependency({
    DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
  });

  assert.equal(description.source, "DATABASE_URL");
  assert.equal(description.kind, "postgres");
  assert.match(description.summary, /shared Supabase Postgres database/i);
  assert.match(description.summary, /blog content/i);
}

async function testPayloadDependencyDescriptionFlagsExplicitSqliteOverride(): Promise<void> {
  const description = describePayloadDatabaseDependency({
    DATABASE_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres?sslmode=require",
    PAYLOAD_DATABASE_URL: PAYLOAD_LOCAL_SQLITE_URL,
  });

  assert.equal(description.source, "PAYLOAD_DATABASE_URL");
  assert.equal(description.kind, "sqlite");
  assert.match(description.summary, /non-production CMS-only sandbox/i);
  assert.match(description.summary, /not the normal production blog database path/i);
}

async function testPayloadDependencyDescriptionHandlesMissingEnv(): Promise<void> {
  const description = describePayloadDatabaseDependency({});

  assert.equal(description.source, "missing");
  assert.equal(description.kind, "missing");
  assert.match(description.summary, /Neither DATABASE_URL nor PAYLOAD_DATABASE_URL is configured/i);
}

async function run(): Promise<void> {
  await testPayloadDefaultsToCanonicalDatabaseUrl();
  await testPayloadPrefersExplicitOverride();
  await testPayloadAllowsExplicitLocalSqliteOnlyInNonProduction();
  await testPayloadRejectsMissingDatabaseConfig();
  await testPayloadRejectsImplicitSqliteCanonicalDatabaseUrl();
  await testPayloadRejectsProductionSqliteOverride();
  await testPayloadRejectsSupabaseWithoutSslModeOnDatabaseUrl();
  await testPayloadRejectsSupabaseWithoutSslModeOnPayloadOverride();
  await testPayloadAutoPushDefaultsStayPredictable();
  await testPayloadDependencyDescriptionDefaultsToSharedDatabaseUrl();
  await testPayloadDependencyDescriptionFlagsExplicitSqliteOverride();
  await testPayloadDependencyDescriptionHandlesMissingEnv();

  console.log("payload-database-config: ok");
}

void run();
