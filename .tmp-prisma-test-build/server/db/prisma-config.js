"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePrismaDatabaseUrl = resolvePrismaDatabaseUrl;
exports.describePrismaDatabaseTarget = describePrismaDatabaseTarget;
exports.resolvePrismaLogLevels = resolvePrismaLogLevels;
exports.resolvePrismaClientOptions = resolvePrismaClientOptions;
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const HOSTINGER_DEPLOY_GUIDANCE = "On Hostinger, add or update it in your Node.js app environment variables and then use Settings and redeploy. See docs/production-env-setup.md.";
const SUPABASE_DIRECT_EXAMPLE = "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require";
const SUPABASE_SESSION_POOLER_EXAMPLE = "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require";
function readRawDatabaseUrl(env) {
    const value = env.DATABASE_URL;
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`DATABASE_URL is required. Set it to your server-side Supabase Postgres connection string before starting the app. ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
    return value.trim();
}
function parseDatabaseUrl(databaseUrl) {
    try {
        return new URL(databaseUrl);
    }
    catch (_a) {
        throw new Error(`DATABASE_URL must be a valid postgres:// or postgresql:// connection string for Supabase Postgres. Use ${SUPABASE_DIRECT_EXAMPLE} or ${SUPABASE_SESSION_POOLER_EXAMPLE}. ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
}
function formatResolvedDatabaseTarget(parsed) {
    const databaseName = parsed.pathname.replace(/^\/+/, "") || "postgres";
    const queryKeys = ["sslmode", "pgbouncer"]
        .map((key) => {
        const value = parsed.searchParams.get(key);
        return value ? `${key}=${value}` : null;
    })
        .filter((value) => value !== null);
    const querySuffix = queryKeys.length > 0 ? `?${queryKeys.join("&")}` : "";
    return `${parsed.hostname}:${parsed.port || "5432"}/${databaseName}${querySuffix}`;
}
function isSupabaseHost(parsed) {
    return parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".pooler.supabase.com");
}
function assertSupabaseSslConfiguration(parsed) {
    var _a;
    if (isSupabaseHost(parsed) && ((_a = parsed.searchParams.get("sslmode")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "require") {
        throw new Error(`DATABASE_URL points at Supabase without sslmode=require. Use ${SUPABASE_DIRECT_EXAMPLE} for direct connections or ${SUPABASE_SESSION_POOLER_EXAMPLE} for the session pooler. ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
}
function assertSupportedPoolerConfiguration(parsed) {
    var _a;
    const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
    const isTransactionPooler = parsed.port === "6543";
    const pgbouncerEnabled = ((_a = parsed.searchParams.get("pgbouncer")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true";
    if (isSupabasePooler && isTransactionPooler && !pgbouncerEnabled) {
        throw new Error(`DATABASE_URL points at the Supabase transaction pooler on port 6543 without pgbouncer=true. For this Hostinger runtime, prefer the direct connection or the Supavisor session pooler on port 5432. If you intentionally use 6543, append pgbouncer=true and keep a separate direct or session connection available for Prisma CLI workflows. ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
}
function resolvePrismaDatabaseUrl(env = process.env) {
    const databaseUrl = readRawDatabaseUrl(env);
    const parsed = parseDatabaseUrl(databaseUrl);
    if (parsed.protocol === "file:" || parsed.protocol.startsWith("sqlite")) {
        throw new Error(`DATABASE_URL must point to Supabase Postgres. Local SQLite and file-based database URLs are not supported by the Prisma runtime. ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
    if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
        throw new Error(`DATABASE_URL must use a postgres:// or postgresql:// connection string. Received protocol "${parsed.protocol}". ${HOSTINGER_DEPLOY_GUIDANCE}`);
    }
    assertSupabaseSslConfiguration(parsed);
    assertSupportedPoolerConfiguration(parsed);
    return databaseUrl;
}
function describePrismaDatabaseTarget(env = process.env) {
    const databaseUrl = env.DATABASE_URL;
    if (typeof databaseUrl !== "string" || databaseUrl.trim().length === 0) {
        return "DATABASE_URL is not set";
    }
    try {
        return formatResolvedDatabaseTarget(new URL(databaseUrl.trim()));
    }
    catch (_a) {
        return "DATABASE_URL could not be parsed";
    }
}
function resolvePrismaLogLevels(env = process.env) {
    return env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
}
function resolvePrismaClientOptions(env = process.env) {
    return {
        datasources: {
            db: {
                url: resolvePrismaDatabaseUrl(env),
            },
        },
        log: resolvePrismaLogLevels(env),
    };
}
