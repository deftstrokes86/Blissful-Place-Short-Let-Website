import path from "node:path";

import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { BlogCategoriesCollection } from "@/cms/collections/BlogCategories";
import { BlogMediaCollection } from "@/cms/collections/BlogMedia";
import { BlogPostsCollection } from "@/cms/collections/BlogPosts";
import { BlogTagsCollection } from "@/cms/collections/BlogTags";
import { CmsInventoryAlertsCollection } from "@/cms/collections/CmsInventoryAlerts";
import { CmsInventoryItemsCollection } from "@/cms/collections/CmsInventoryItems";
import { CmsInventoryTemplateItemsCollection } from "@/cms/collections/CmsInventoryTemplateItems";
import { CmsInventoryTemplatesCollection } from "@/cms/collections/CmsInventoryTemplates";
import { CmsMaintenanceIssuesCollection } from "@/cms/collections/CmsMaintenanceIssues";
import { CmsUsersCollection } from "@/cms/collections/CmsUsers";

const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = process.env.PAYLOAD_SECRET?.trim() || "blissful-place-cms-dev-secret";
const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL?.trim() || "file:./.data/payload.db";

const payloadConfig = buildConfig({
  secret: payloadSecret,
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: payloadDatabaseUrl,
    },
  }),
  admin: {
    user: CmsUsersCollection.slug,
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
    outputFile: path.resolve(process.cwd(), "src/types/payload-types.ts"),
  },
});

export default payloadConfig;
