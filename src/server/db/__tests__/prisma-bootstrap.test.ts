import assert from "node:assert/strict";
import { createRequire } from "node:module";

const nodeRequire = createRequire(__filename);

type PrismaModule = typeof import("../prisma");

class ThrowingPrismaClient {
  constructor() {
    throw new Error("Mock Prisma engine bootstrap failure.");
  }
}

function withDatabaseUrl(databaseUrl: string | undefined, run: () => void): void {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  if (typeof databaseUrl === "string") {
    process.env.DATABASE_URL = databaseUrl;
  } else {
    delete process.env.DATABASE_URL;
  }

  try {
    run();
  } finally {
    if (typeof originalDatabaseUrl === "string") {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
}

function loadFreshPrismaModule(): PrismaModule {
  const modulePath = nodeRequire.resolve("../prisma");
  delete nodeRequire.cache[modulePath];
  const prismaModule = nodeRequire(modulePath) as PrismaModule;
  prismaModule.resetPrismaClientForTests();
  return prismaModule;
}

function testImportDoesNotEagerlyInitializePrisma(): void {
  withDatabaseUrl(undefined, () => {
    assert.doesNotThrow(() => {
      const prismaModule = loadFreshPrismaModule();
      assert.equal(typeof prismaModule.getPrismaClient, "function");
    });
  });
}

function testLazyPrismaProxyStillRaisesReadableInitFailureWhenAccessed(): void {
  withDatabaseUrl(undefined, () => {
    const prismaModule = loadFreshPrismaModule();

    assert.throws(
      () => prismaModule.prisma.$connect,
      (error: unknown) => {
        assert(error instanceof prismaModule.PrismaInitializationError);
        assert.match(error.message, /Prisma client initialization failed before the app could access the database/i);
        assert.match(error.message, /DATABASE_URL is required/i);
        return true;
      }
    );
  });
}

function testCreatePrismaClientWrapsMissingDatabaseUrl(): void {
  const prismaModule = loadFreshPrismaModule();

  assert.throws(
    () => prismaModule.createPrismaClient({}),
    (error: unknown) => {
      assert(error instanceof prismaModule.PrismaInitializationError);
      assert.match(error.message, /Prisma client initialization failed before the app could access the database/i);
      assert.match(error.message, /DATABASE_URL is required/i);
      assert.match(error.message, /repo root \.env/i);
      return true;
    }
  );
}

function testCreatePrismaClientWrapsMalformedDatabaseUrl(): void {
  const prismaModule = loadFreshPrismaModule();

  assert.throws(
    () => prismaModule.createPrismaClient({ DATABASE_URL: "not-a-real-url" }),
    (error: unknown) => {
      assert(error instanceof prismaModule.PrismaInitializationError);
      assert.match(error.message, /DATABASE_URL must be a valid postgres:\/\/ or postgresql:\/\//i);
      assert.match(error.message, /DATABASE_URL could not be parsed/i);
      return true;
    }
  );
}

function testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets(): void {
  const prismaModule = loadFreshPrismaModule();

  assert.throws(
    () =>
      prismaModule.createPrismaClient(
        {
          DATABASE_URL: "postgresql://postgres.user:super-secret@db.example.supabase.co:5432/postgres?sslmode=require",
        },
        ThrowingPrismaClient as unknown as new (
          options?: ConstructorParameters<typeof import("@prisma/client").PrismaClient>[0]
        ) => import("@prisma/client").PrismaClient
      ),
    (error: unknown) => {
      assert(error instanceof prismaModule.PrismaInitializationError);
      assert.match(error.message, /Mock Prisma engine bootstrap failure/i);
      assert.match(error.message, /Connection target: db\.example\.supabase\.co:5432\/postgres\?sslmode=require/i);
      assert.doesNotMatch(error.message, /super-secret/);
      assert.doesNotMatch(error.message, /postgres\.user/);
      return true;
    }
  );
}

function run(): void {
  testImportDoesNotEagerlyInitializePrisma();
  testLazyPrismaProxyStillRaisesReadableInitFailureWhenAccessed();
  testCreatePrismaClientWrapsMissingDatabaseUrl();
  testCreatePrismaClientWrapsMalformedDatabaseUrl();
  testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets();

  console.log("prisma-bootstrap: ok");
}

run();
