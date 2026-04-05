import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:bootstrap-secret@db.bootstrap.supabase.co:5432/postgres?sslmode=require";

const nodeRequire = createRequire(__filename);
const prismaModule = nodeRequire("../prisma") as typeof import("../prisma");

const { createPrismaClient, PrismaInitializationError } = prismaModule;

class ThrowingPrismaClient {
  constructor() {
    throw new Error("Mock Prisma engine bootstrap failure.");
  }
}

function testCreatePrismaClientWrapsMissingDatabaseUrl(): void {
  assert.throws(
    () => createPrismaClient({}),
    (error: unknown) => {
      assert(error instanceof PrismaInitializationError);
      assert.match(error.message, /Prisma client initialization failed before the app could access the database/i);
      assert.match(error.message, /DATABASE_URL is required/i);
      assert.match(error.message, /repo root \.env/i);
      return true;
    }
  );
}

function testCreatePrismaClientWrapsMalformedDatabaseUrl(): void {
  assert.throws(
    () => createPrismaClient({ DATABASE_URL: "not-a-real-url" }),
    (error: unknown) => {
      assert(error instanceof PrismaInitializationError);
      assert.match(error.message, /DATABASE_URL must be a valid postgres:\/\/ or postgresql:\/\//i);
      assert.match(error.message, /DATABASE_URL could not be parsed/i);
      return true;
    }
  );
}

function testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets(): void {
  assert.throws(
    () =>
      createPrismaClient(
        {
          DATABASE_URL: "postgresql://postgres.user:super-secret@db.example.supabase.co:5432/postgres?sslmode=require",
        },
        ThrowingPrismaClient as unknown as new (
          options?: ConstructorParameters<typeof import("@prisma/client").PrismaClient>[0]
        ) => import("@prisma/client").PrismaClient
      ),
    (error: unknown) => {
      assert(error instanceof PrismaInitializationError);
      assert.match(error.message, /Mock Prisma engine bootstrap failure/i);
      assert.match(error.message, /Connection target: db\.example\.supabase\.co:5432\/postgres\?sslmode=require/i);
      assert.doesNotMatch(error.message, /super-secret/);
      assert.doesNotMatch(error.message, /postgres\.user/);
      return true;
    }
  );
}

function run(): void {
  testCreatePrismaClientWrapsMissingDatabaseUrl();
  testCreatePrismaClientWrapsMalformedDatabaseUrl();
  testCreatePrismaClientWrapsBootstrapConstructorFailureWithoutLeakingSecrets();

  console.log("prisma-bootstrap: ok");
}

run();

