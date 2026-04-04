import { Prisma } from "@prisma/client";

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const HOSTINGER_DEPLOY_GUIDANCE =
  "On Hostinger, add or update it in your Node.js app environment variables and then use Settings and redeploy. See docs/supabase-database-setup.md.";

type PrismaServerEnv = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
};

function readRawDatabaseUrl(env: PrismaServerEnv): string {
  const value = env.DATABASE_URL;

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `DATABASE_URL is required. Set it to your server-side Supabase Postgres connection string before starting the app. ${HOSTINGER_DEPLOY_GUIDANCE}`
    );
  }

  return value.trim();
}

function parseDatabaseUrl(databaseUrl: string): URL {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error(
      `DATABASE_URL must be a valid postgres:// or postgresql:// connection string for Supabase Postgres. Use the direct connection or the Supavisor session pooler on port 5432, not the dashboard URL. ${HOSTINGER_DEPLOY_GUIDANCE}`
    );
  }
}

function assertSupportedPoolerConfiguration(parsed: URL): void {
  const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
  const isTransactionPooler = parsed.port === "6543";
  const pgbouncerEnabled = parsed.searchParams.get("pgbouncer")?.toLowerCase() === "true";

  if (isSupabasePooler && isTransactionPooler && !pgbouncerEnabled) {
    throw new Error(
      `DATABASE_URL points at the Supabase transaction pooler on port 6543 without pgbouncer=true. For this Hostinger runtime, prefer the direct connection or the Supavisor session pooler on port 5432. If you intentionally use 6543, append pgbouncer=true and keep a separate direct or session connection available for Prisma CLI workflows. ${HOSTINGER_DEPLOY_GUIDANCE}`
    );
  }
}

export function resolvePrismaDatabaseUrl(env: PrismaServerEnv = process.env): string {
  const databaseUrl = readRawDatabaseUrl(env);
  const parsed = parseDatabaseUrl(databaseUrl);

  if (parsed.protocol === "file:" || parsed.protocol.startsWith("sqlite")) {
    throw new Error(
      `DATABASE_URL must point to Supabase Postgres. Local SQLite and file-based database URLs are not supported by the Prisma runtime. ${HOSTINGER_DEPLOY_GUIDANCE}`
    );
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `DATABASE_URL must use a postgres:// or postgresql:// connection string. Received protocol "${parsed.protocol}". ${HOSTINGER_DEPLOY_GUIDANCE}`
    );
  }

  assertSupportedPoolerConfiguration(parsed);

  return databaseUrl;
}

export function resolvePrismaLogLevels(env: PrismaServerEnv = process.env): Prisma.LogLevel[] {
  return env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
}

export function resolvePrismaClientOptions(
  env: PrismaServerEnv = process.env
): Prisma.PrismaClientOptions {
  return {
    datasources: {
      db: {
        url: resolvePrismaDatabaseUrl(env),
      },
    },
    log: resolvePrismaLogLevels(env),
  };
}
