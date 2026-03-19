import { createRequire } from "node:module";

interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

interface PrismaClientConstructor {
  new (options?: PrismaClientOptions): PrismaClientLike;
}

interface PrismaClientOptions {
  log?: readonly PrismaLogLevel[];
}

type PrismaLogLevel = "query" | "info" | "warn" | "error";

interface PrismaModuleShape {
  PrismaClient: PrismaClientConstructor;
}

interface GlobalWithPrismaCache {
  __blissfulPrismaClient?: PrismaClientLike;
}

const require = createRequire(import.meta.url);
const globalCache = globalThis as typeof globalThis & GlobalWithPrismaCache;

function hasPrismaClientConstructor(moduleValue: unknown): moduleValue is PrismaModuleShape {
  if (!moduleValue || typeof moduleValue !== "object") {
    return false;
  }

  const maybeModule = moduleValue as Record<string, unknown>;
  return typeof maybeModule.PrismaClient === "function";
}

function loadPrismaClientConstructor(): PrismaClientConstructor {
  const loaded = require("@prisma/client") as unknown;

  if (!hasPrismaClientConstructor(loaded)) {
    throw new Error("@prisma/client is installed but PrismaClient export is unavailable.");
  }

  return loaded.PrismaClient;
}

function ensureDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Set it in your environment before using the DB client.");
  }
}

function createPrismaClient(): PrismaClientLike {
  ensureDatabaseUrl();

  const PrismaClient = loadPrismaClientConstructor();
  const logLevels: readonly PrismaLogLevel[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  return new PrismaClient({ log: logLevels });
}

export function getDbClient(): PrismaClientLike {
  if (!globalCache.__blissfulPrismaClient) {
    globalCache.__blissfulPrismaClient = createPrismaClient();
  }

  return globalCache.__blissfulPrismaClient;
}
