import fs from "node:fs";
import path from "node:path";

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
const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL?.trim() || "file:./.data/payload.db";
const payloadAutoPushRaw = process.env.PAYLOAD_AUTO_PUSH_SCHEMA?.trim().toLowerCase();
const payloadAutoPushOverride =
  payloadAutoPushRaw === undefined ? undefined : payloadAutoPushRaw === "true";
const payloadIsDevelopment = (process.env.NODE_ENV?.trim().toLowerCase() ?? "development") !== "production";

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

const payloadSqliteFilePath = resolveSqliteFilePath(payloadDatabaseUrl);
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
const payloadShouldPushSchema = payloadAutoPushSchema && (payloadBootstrapPush || payloadSchemaDriftPush);

const payloadConfig = buildConfig({
  secret: payloadSecret,
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: payloadDatabaseUrl,
    },
    // Keep runtime non-interactive by default.
    // Automatically bootstrap schema when local DB is new, drifted, or when dev-mode auto-push is enabled.
    push: payloadShouldPushSchema,
  }),
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
