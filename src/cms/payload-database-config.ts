const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const SUPABASE_DIRECT_EXAMPLE =
  "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require";
const SUPABASE_SESSION_POOLER_EXAMPLE =
  "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require";
const PAYLOAD_BLOG_ROUTE_GUIDANCE =
  "Public blog routes (/blog and /blog/[slug]) read published content through Payload CMS.";
const PAYLOAD_DATABASE_SOURCE_GUIDANCE =
  "Payload uses PAYLOAD_DATABASE_URL when it is set; otherwise it falls back to DATABASE_URL.";
const PAYLOAD_DATABASE_GUIDANCE =
  `Set DATABASE_URL to your server-side Supabase Postgres connection string. ${PAYLOAD_DATABASE_SOURCE_GUIDANCE} ${PAYLOAD_BLOG_ROUTE_GUIDANCE} Leave PAYLOAD_DATABASE_URL blank unless Payload must intentionally point at a different Postgres database. See docs/production-env-setup.md and docs/payload-blog-database-path.md.`;

export type PayloadDatabaseEnv = {
  DATABASE_URL?: string;
  PAYLOAD_DATABASE_URL?: string;
  PAYLOAD_AUTO_PUSH_SCHEMA?: string;
  NODE_ENV?: string;
  NEXT_PHASE?: string;
};

export type PayloadDatabaseKind = "postgres";
export type PayloadDatabaseDependencySource = "DATABASE_URL" | "PAYLOAD_DATABASE_URL" | "missing";
export type PayloadDatabaseDependencyKind = PayloadDatabaseKind | "missing";

export interface ResolvedPayloadDatabaseConfig {
  databaseUrl: string;
  kind: PayloadDatabaseKind;
  pushSchema: boolean;
  isProduction: boolean;
  isProductionBuild: boolean;
  usesExplicitOverride: boolean;
}

export interface PayloadDatabaseDependencyDescription {
  source: PayloadDatabaseDependencySource;
  kind: PayloadDatabaseDependencyKind;
  summary: string;
}

function hasConfiguredValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSupabaseHost(parsed: URL): boolean {
  return parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".pooler.supabase.com");
}

function parsePayloadPostgresUrl(databaseUrl: string): URL {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error(
      `Payload CMS database URL must be a valid postgres:// or postgresql:// connection string. Use ${SUPABASE_DIRECT_EXAMPLE} or ${SUPABASE_SESSION_POOLER_EXAMPLE}. ${PAYLOAD_DATABASE_GUIDANCE}`
    );
  }
}

function assertPayloadPostgresProtocol(parsed: URL): void {
  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `Payload CMS database URL must use postgres:// or postgresql://. Received protocol "${parsed.protocol}". ${PAYLOAD_DATABASE_GUIDANCE}`
    );
  }
}

function assertSupabaseSslRequirement(parsed: URL, source: Exclude<PayloadDatabaseDependencySource, "missing">): void {
  if (isSupabaseHost(parsed) && parsed.searchParams.get("sslmode")?.toLowerCase() !== "require") {
    throw new Error(
      `Payload CMS database URL from ${source} points at Supabase without sslmode=require. Update ${source} to include ?sslmode=require. ${PAYLOAD_DATABASE_SOURCE_GUIDANCE} Use ${SUPABASE_DIRECT_EXAMPLE} or ${SUPABASE_SESSION_POOLER_EXAMPLE}. ${PAYLOAD_DATABASE_GUIDANCE}`
    );
  }
}

function resolvePayloadAutoPushSchema(env: PayloadDatabaseEnv, isProduction: boolean): boolean {
  const autoPushRaw = env.PAYLOAD_AUTO_PUSH_SCHEMA?.trim()?.toLowerCase();
  const autoPushOverride = autoPushRaw === undefined ? undefined : autoPushRaw === "true";

  return autoPushOverride ?? !isProduction;
}

export function describePayloadDatabaseDependency(
  env: PayloadDatabaseEnv = process.env
): PayloadDatabaseDependencyDescription {
  const payloadDatabaseUrlOverride = env.PAYLOAD_DATABASE_URL?.trim();
  const payloadPrimaryDatabaseUrl = env.DATABASE_URL?.trim();

  if (hasConfiguredValue(payloadDatabaseUrlOverride)) {
    return {
      source: "PAYLOAD_DATABASE_URL",
      kind: "postgres",
      summary:
        "Payload is explicitly pointed at Postgres through PAYLOAD_DATABASE_URL, so public blog content will read from that Payload-specific database connection.",
    };
  }

  if (hasConfiguredValue(payloadPrimaryDatabaseUrl)) {
    return {
      source: "DATABASE_URL",
      kind: "postgres",
      summary:
        "Payload will reuse DATABASE_URL, so public blog content will read from the shared Supabase Postgres database in the normal path.",
    };
  }

  return {
    source: "missing",
    kind: "missing",
    summary:
      "Neither DATABASE_URL nor PAYLOAD_DATABASE_URL is configured, so Payload cannot initialize for blog or CMS content reads.",
  };
}

export function resolvePayloadDatabaseConfig(
  env: PayloadDatabaseEnv = process.env
): ResolvedPayloadDatabaseConfig {
  const payloadEnvironment = env.NODE_ENV?.trim()?.toLowerCase() ?? "development";
  const isProduction = payloadEnvironment === "production";
  const isProductionBuild = env.NEXT_PHASE === "phase-production-build";
  const payloadDatabaseUrlOverride = env.PAYLOAD_DATABASE_URL?.trim();
  const payloadPrimaryDatabaseUrl = env.DATABASE_URL?.trim();
  const usesExplicitOverride = hasConfiguredValue(payloadDatabaseUrlOverride);
  const selectedDatabaseSource: Exclude<PayloadDatabaseDependencySource, "missing"> = usesExplicitOverride
    ? "PAYLOAD_DATABASE_URL"
    : "DATABASE_URL";
  const resolvedDatabaseUrl = usesExplicitOverride ? payloadDatabaseUrlOverride! : payloadPrimaryDatabaseUrl;
  const pushSchema = resolvePayloadAutoPushSchema(env, isProduction);

  if (!hasConfiguredValue(resolvedDatabaseUrl)) {
    throw new Error(
      `Payload CMS requires a Postgres connection string. ${PAYLOAD_DATABASE_GUIDANCE}`
    );
  }

  const parsed = parsePayloadPostgresUrl(resolvedDatabaseUrl);
  assertPayloadPostgresProtocol(parsed);
  assertSupabaseSslRequirement(parsed, selectedDatabaseSource);

  return {
    databaseUrl: resolvedDatabaseUrl,
    kind: "postgres",
    pushSchema,
    isProduction,
    isProductionBuild,
    usesExplicitOverride,
  };
}
