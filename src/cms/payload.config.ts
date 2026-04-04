import fs from "node:fs";
import path from "node:path";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { BlogCategoriesCollection } from "./collections/BlogCategories";
import { BlogMediaCollection } from "./collections/BlogMedia";
import { BlogPostsCollection } from "./collections/BlogPosts";
import { BlogTagsCollection } from "./collections/BlogTags";
import { CmsInventoryAlertsCollection } from "./collections/CmsInventoryAlerts";
import { CmsInventoryItemsCollection } from "./collections/CmsInventoryItems";
import { CmsInventoryTemplateItemsCollection } from "./collections/CmsInventoryTemplateItems";
import { CmsInventoryTemplatesCollection } from "./collections/CmsInventoryTemplates";
import { CmsMaintenanceIssuesCollection } from "./collections/CmsMaintenanceIssues";
import { CmsPagesCollection } from "./collections/CmsPages";
import { CmsUsersCollection } from "./collections/CmsUsers";

const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = process.env.PAYLOAD_SECRET?.trim() || "blissful-place-cms-dev-secret";
const payloadEnvironment = process.env.NODE_ENV?.trim()?.toLowerCase() ?? "development";
const payloadIsProduction = payloadEnvironment === "production";
const payloadIsDevelopment = !payloadIsProduction;
const payloadIsProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const payloadPrimaryDatabaseUrl = process.env.DATABASE_URL?.trim();
const payloadDatabaseUrlOverride = process.env.PAYLOAD_DATABASE_URL?.trim();
const payloadDefaultSqliteUrl = "file:./.data/payload.db";
const payloadAutoPushRaw = process.env.PAYLOAD_AUTO_PUSH_SCHEMA?.trim()?.toLowerCase();
const payloadAutoPushOverride =
  payloadAutoPushRaw === undefined ? undefined : payloadAutoPushRaw === "true";
const payloadAllowProductionSqlite =
  process.env.PAYLOAD_ALLOW_PRODUCTION_SQLITE?.trim()?.toLowerCase() === "true";

type SqliteStatementResult = Array<Record<string, unknown>>;

interface SqliteStatement {
  all: () => SqliteStatementResult;
}

interface SqliteDatabase {
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
}

type SqliteDatabaseConstructor = new (filePath: string, options: { readOnly: boolean }) => SqliteDatabase;

function loadSqliteDatabaseConstructor(): SqliteDatabaseConstructor | null {
  try {
    const runtimeRequire = typeof require === "function" ? require : null;

    if (!runtimeRequire) {
      return null;
    }

    const sqliteModule = runtimeRequire("node:sqlite") as { DatabaseSync?: SqliteDatabaseConstructor };

    if (typeof sqliteModule.DatabaseSync === "function") {
      return sqliteModule.DatabaseSync;
    }
  } catch {
    // Ignore runtime environments that do not expose node:sqlite.
  }

  return null;
}

function resolveSqliteFilePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const relativePath = databaseUrl.slice("file:".length);
  return path.resolve(process.cwd(), relativePath);
}

function toSqliteCollectionTableName(slug: string): string {
  return slug.replace(/-/g, "_");
}

function resolvePayloadDatabaseUrl(): string {
  if (payloadDatabaseUrlOverride) {
    return payloadDatabaseUrlOverride;
  }

  if (payloadIsProduction && payloadPrimaryDatabaseUrl) {
    return payloadPrimaryDatabaseUrl;
  }

  return payloadDefaultSqliteUrl;
}

function resolvePayloadDatabaseKind(databaseUrl: string): "postgres" | "sqlite" {
  return databaseUrl.startsWith("file:") ? "sqlite" : "postgres";
}

function hasSchemaDrift(sqliteFilePath: string, collectionSlugs: readonly string[]): boolean {
  if (!fs.existsSync(sqliteFilePath)) {
    return false;
  }

  const DatabaseSync = loadSqliteDatabaseConstructor();

  if (!DatabaseSync) {
    return false;
  }

  const expectedTables = collectionSlugs.map((slug) => toSqliteCollectionTableName(slug));
  const database = new DatabaseSync(sqliteFilePath, { readOnly: true });

  try {
    const tableNames = new Set(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => (typeof row.name === "string" ? row.name : ""))
        .filter((name) => name.length > 0)
    );

    return expectedTables.some((tableName) => !tableNames.has(tableName));
  } catch {
    // If we cannot inspect schema drift safely, do not force push here.
    return false;
  } finally {
    database.close();
  }
}

const payloadDatabaseUrl = resolvePayloadDatabaseUrl();
const payloadResolvedDatabaseKind = resolvePayloadDatabaseKind(payloadDatabaseUrl);

if (
  payloadIsProduction &&
  !payloadIsProductionBuild &&
  payloadResolvedDatabaseKind === "sqlite" &&
  !payloadAllowProductionSqlite
) {
  throw new Error(
    "Payload CMS is configured to use SQLite in production. Set PAYLOAD_DATABASE_URL to a persistent Postgres connection string, rely on DATABASE_URL, or set PAYLOAD_ALLOW_PRODUCTION_SQLITE=true only when production has persistent disk."
  );
}

const payloadSqliteFilePath =
  payloadResolvedDatabaseKind === "sqlite" ? resolveSqliteFilePath(payloadDatabaseUrl) : null;
const payloadCollectionSlugs = [
  CmsUsersCollection.slug,
  CmsPagesCollection.slug,
  BlogCategoriesCollection.slug,
  BlogTagsCollection.slug,
  BlogMediaCollection.slug,
  BlogPostsCollection.slug,
  CmsInventoryItemsCollection.slug,
  CmsInventoryTemplatesCollection.slug,
  CmsInventoryTemplateItemsCollection.slug,
  CmsInventoryAlertsCollection.slug,
  CmsMaintenanceIssuesCollection.slug,
] as const;
const payloadBootstrapPush = payloadSqliteFilePath ? !fs.existsSync(payloadSqliteFilePath) : false;
const payloadSchemaDriftPush = payloadSqliteFilePath
  ? hasSchemaDrift(payloadSqliteFilePath, payloadCollectionSlugs)
  : false;
const payloadAutoPushSchema = payloadAutoPushOverride ?? payloadIsDevelopment;
const payloadShouldPushSqliteSchema = payloadAutoPushSchema && (payloadBootstrapPush || payloadSchemaDriftPush);
const payloadShouldPushPostgresSchema = payloadAutoPushSchema;
const payloadDatabaseAdapter =
  payloadResolvedDatabaseKind === "sqlite"
    ? sqliteAdapter({
        client: {
          url: payloadDatabaseUrl,
        },
        // Keep runtime non-interactive by default.
        // Automatically bootstrap schema when the local SQLite DB is new or drifted.
        push: payloadShouldPushSqliteSchema,
      })
    : postgresAdapter({
        pool: {
          connectionString: payloadDatabaseUrl,
        },
        // Production never auto-pushes Postgres schemas, but local env overrides should stay predictable.
        push: payloadShouldPushPostgresSchema,
      });

const payloadConfig = buildConfig({
  secret: payloadSecret,
  editor: lexicalEditor(),
  db: payloadDatabaseAdapter,
  admin: {
    user: CmsUsersCollection.slug,
    suppressHydrationWarning: true,
  },
  routes: {
    admin: CMS_ADMIN_ROUTE,
    api: CMS_API_ROUTE,
  },
  collections: [
    CmsUsersCollection,
    CmsPagesCollection,
    BlogCategoriesCollection,
    BlogTagsCollection,
    BlogMediaCollection,
    BlogPostsCollection,
    CmsInventoryItemsCollection,
    CmsInventoryTemplatesCollection,
    CmsInventoryTemplateItemsCollection,
    CmsInventoryAlertsCollection,
    CmsMaintenanceIssuesCollection,
  ],
  typescript: {
    outputFile: path.resolve(process.cwd(), "src/types/payload-types"),
  },
});

export default payloadConfig;
