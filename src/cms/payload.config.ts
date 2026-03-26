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
import { CmsUsersCollection } from "./collections/CmsUsers";

const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = process.env.PAYLOAD_SECRET?.trim() || "blissful-place-cms-dev-secret";
const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL?.trim() || "file:./.data/payload.db";
const payloadAutoPushSchema = process.env.PAYLOAD_AUTO_PUSH_SCHEMA?.trim().toLowerCase() === "true";

function resolveSqliteFilePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const relativePath = databaseUrl.slice("file:".length);
  return path.resolve(process.cwd(), relativePath);
}

const payloadSqliteFilePath = resolveSqliteFilePath(payloadDatabaseUrl);
const payloadBootstrapPush = payloadSqliteFilePath ? !fs.existsSync(payloadSqliteFilePath) : false;
const payloadShouldPushSchema = payloadAutoPushSchema || payloadBootstrapPush;

const payloadConfig = buildConfig({
  secret: payloadSecret,
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: payloadDatabaseUrl,
    },
    // Keep runtime non-interactive by default.
    // Automatically bootstrap schema only when the sqlite file does not exist.
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
