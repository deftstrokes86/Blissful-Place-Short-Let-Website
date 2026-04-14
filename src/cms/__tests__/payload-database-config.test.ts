import { resolvePayloadDatabaseConfig } from "../payload-database-config";

// ─── Unit: resolvePayloadDatabaseConfig ──────────────────────────────────────

describe("resolvePayloadDatabaseConfig", () => {
  it("falls back to DATABASE_URL when PAYLOAD_DATABASE_URL is blank", () => {
    const config = resolvePayloadDatabaseConfig({
      PAYLOAD_DATABASE_URL: "",
      DATABASE_URL: "postgresql://postgres:pw@db.example.supabase.co:5432/postgres?sslmode=require",
      NODE_ENV: "development",
    });
    expect(config.kind).toBe("postgres");
    expect(config.usesExplicitOverride).toBe(false);
  });

  it("uses PAYLOAD_DATABASE_URL over DATABASE_URL when both are set", () => {
    const config = resolvePayloadDatabaseConfig({
      PAYLOAD_DATABASE_URL: "postgresql://postgres:pw@db.payload.supabase.co:5432/postgres?sslmode=require",
      DATABASE_URL: "postgresql://postgres:pw@db.primary.supabase.co:5432/postgres?sslmode=require",
      NODE_ENV: "development",
    });
    expect(config.kind).toBe("postgres");
    expect(config.databaseUrl).toBe("postgresql://postgres:pw@db.payload.supabase.co:5432/postgres?sslmode=require");
    expect(config.usesExplicitOverride).toBe(true);
  });

  it("throws when no database URL is configured at all", () => {
    expect(() =>
      resolvePayloadDatabaseConfig({ PAYLOAD_DATABASE_URL: "", DATABASE_URL: "", NODE_ENV: "development" })
    ).toThrow();
  });

  it("rejects non-postgres DATABASE_URL", () => {
    expect(() =>
      resolvePayloadDatabaseConfig({
        PAYLOAD_DATABASE_URL: "",
        DATABASE_URL: "file:./.data/payload.db",
        NODE_ENV: "development",
      })
    ).toThrow();
  });
});
