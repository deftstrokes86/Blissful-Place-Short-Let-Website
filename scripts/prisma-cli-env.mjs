import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const SUPABASE_DIRECT_HOST_SUFFIX = ".supabase.co";
const SUPABASE_POOLER_HOST_SUFFIX = ".pooler.supabase.com";
const LOCAL_PRISMA_GUIDANCE =
  "Set DATABASE_URL in the repo root .env for local Prisma CLI usage. Keep .env.local for app-only overrides or temporary local changes.";
const SUPABASE_DIRECT_EXAMPLE =
  "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require";
const SUPABASE_POOLER_EXAMPLE =
  "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require";

function parseDotenv(content) {
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = rawLine.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    env[match[1]] = value;
  }

  return env;
}

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseDotenv(readFileSync(filePath, "utf8"));
}

function parseDatabaseUrl(databaseUrl) {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error(
      `DATABASE_URL must be a valid postgres:// or postgresql:// Supabase connection string. Use ${SUPABASE_DIRECT_EXAMPLE} for local Prisma CLI work, or ${SUPABASE_POOLER_EXAMPLE} if you intentionally prefer the Supabase session pooler. ${LOCAL_PRISMA_GUIDANCE}`
    );
  }
}

function isSupabaseHost(parsed) {
  return (
    parsed.hostname.endsWith(SUPABASE_DIRECT_HOST_SUFFIX) ||
    parsed.hostname.endsWith(SUPABASE_POOLER_HOST_SUFFIX)
  );
}

export function resolvePrismaCliEnvironment({ cwd = process.cwd(), env = process.env } = {}) {
  const envLocal = readEnvFile(resolve(cwd, ".env.local"));
  const envRoot = readEnvFile(resolve(cwd, ".env"));
  const mergedEnv = {
    ...envLocal,
    ...envRoot,
    ...env,
  };

  const databaseUrl = typeof mergedEnv.DATABASE_URL === "string" ? mergedEnv.DATABASE_URL.trim() : "";

  return {
    env: mergedEnv,
    databaseUrl,
    databaseUrlSource: databaseUrl
      ? Object.prototype.hasOwnProperty.call(env, "DATABASE_URL")
        ? "process.env"
        : Object.prototype.hasOwnProperty.call(envRoot, "DATABASE_URL")
          ? ".env"
          : Object.prototype.hasOwnProperty.call(envLocal, "DATABASE_URL")
            ? ".env.local"
            : "unknown"
      : null,
  };
}

export function commandNeedsDatabaseUrl(args) {
  const [group = "", action = ""] = args;
  return group === "db" || group === "migrate" || group === "validate" || group === "studio" || action === "pull";
}

export function assertPrismaCliDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error(
      `DATABASE_URL is required for Prisma CLI database commands. ${LOCAL_PRISMA_GUIDANCE}`
    );
  }

  const parsed = parseDatabaseUrl(databaseUrl);

  if (parsed.protocol === "file:" || parsed.protocol.startsWith("sqlite")) {
    throw new Error(
      `DATABASE_URL must point to Supabase Postgres, not SQLite or a file path. Use ${SUPABASE_DIRECT_EXAMPLE}. ${LOCAL_PRISMA_GUIDANCE}`
    );
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `DATABASE_URL must use postgres:// or postgresql://. Use ${SUPABASE_DIRECT_EXAMPLE}. ${LOCAL_PRISMA_GUIDANCE}`
    );
  }

  if (isSupabaseHost(parsed) && parsed.searchParams.get("sslmode")?.toLowerCase() !== "require") {
    throw new Error(
      `DATABASE_URL points at Supabase without sslmode=require. For local Prisma CLI work, use ${SUPABASE_DIRECT_EXAMPLE}. If you intentionally prefer the Supabase session pooler, use ${SUPABASE_POOLER_EXAMPLE}.`
    );
  }

  const isSupabasePooler = parsed.hostname.endsWith(SUPABASE_POOLER_HOST_SUFFIX);
  const isTransactionPooler = parsed.port === "6543";
  const pgbouncerEnabled = parsed.searchParams.get("pgbouncer")?.toLowerCase() === "true";

  if (isSupabasePooler && isTransactionPooler && !pgbouncerEnabled) {
    throw new Error(
      `DATABASE_URL points at the Supabase transaction pooler on port 6543 without pgbouncer=true. For this repo, prefer the direct connection ${SUPABASE_DIRECT_EXAMPLE}. If you intentionally use the transaction pooler, append pgbouncer=true and keep a direct or session-pooler URL available for Prisma CLI workflows.`
    );
  }

  return databaseUrl;
}
