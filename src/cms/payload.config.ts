import path from "node:path";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
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
import { resolvePayloadDatabaseConfig } from "./payload-database-config";

const CMS_ADMIN_ROUTE = "/cms";
const CMS_API_ROUTE = "/cms/api";
const payloadSecret = process.env.PAYLOAD_SECRET?.trim() || "blissful-place-cms-dev-secret";
const payloadDatabase = resolvePayloadDatabaseConfig();
const payloadMediaBucket =
  process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET?.trim() ?? process.env.PAYLOAD_MEDIA_S3_BUCKET?.trim();
const payloadMediaRegion =
  process.env.PAYLOAD_MEDIA_SUPABASE_REGION?.trim() ?? process.env.PAYLOAD_MEDIA_S3_REGION?.trim();
const payloadMediaProjectRef = process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF?.trim();
const payloadMediaEndpointOverride =
  process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT?.trim() ?? process.env.PAYLOAD_MEDIA_S3_ENDPOINT?.trim();
const payloadMediaAccessKeyId =
  process.env.PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID?.trim() ?? process.env.PAYLOAD_MEDIA_S3_ACCESS_KEY_ID?.trim();
const payloadMediaSecretAccessKey =
  process.env.PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY?.trim() ??
  process.env.PAYLOAD_MEDIA_S3_SECRET_ACCESS_KEY?.trim();
const payloadMediaForcePathStyleRaw =
  process.env.PAYLOAD_MEDIA_SUPABASE_FORCE_PATH_STYLE?.trim()?.toLowerCase() ??
  process.env.PAYLOAD_MEDIA_S3_FORCE_PATH_STYLE?.trim()?.toLowerCase();
const payloadMediaForcePathStyle =
  payloadMediaForcePathStyleRaw === undefined ? true : payloadMediaForcePathStyleRaw === "true";
const payloadAllowProductionLocalMedia =
  process.env.PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA?.trim()?.toLowerCase() === "true";

function hasConfiguredValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolvePayloadMediaStorageEndpoint(): string | null {
  if (hasConfiguredValue(payloadMediaEndpointOverride)) {
    return payloadMediaEndpointOverride;
  }

  if (hasConfiguredValue(payloadMediaProjectRef)) {
    return `https://${payloadMediaProjectRef}.storage.supabase.co/storage/v1/s3`;
  }

  if (hasConfiguredValue(payloadMediaRegion) && hasConfiguredValue(process.env.PAYLOAD_MEDIA_S3_BUCKET?.trim())) {
    return `https://s3.${payloadMediaRegion}.amazonaws.com`;
  }

  return null;
}

const payloadResolvedMediaStorageEndpoint = resolvePayloadMediaStorageEndpoint();
const payloadMediaStorageRequiredValues = [
  payloadMediaBucket,
  payloadMediaRegion,
  payloadMediaAccessKeyId,
  payloadMediaSecretAccessKey,
  payloadResolvedMediaStorageEndpoint,
] as const;
const payloadMediaStorageConfiguredCount = payloadMediaStorageRequiredValues.filter(hasConfiguredValue).length;
const payloadMediaStorageEnabled = payloadMediaStorageConfiguredCount === payloadMediaStorageRequiredValues.length;
const payloadMediaStorageHasPartialConfig =
  payloadMediaStorageConfiguredCount > 0 && !payloadMediaStorageEnabled;

if (payloadMediaStorageHasPartialConfig) {
  throw new Error(
    "Payload CMS Supabase media storage is partially configured. Set PAYLOAD_MEDIA_SUPABASE_BUCKET, PAYLOAD_MEDIA_SUPABASE_REGION, PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID, PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY, and either PAYLOAD_MEDIA_SUPABASE_ENDPOINT or PAYLOAD_MEDIA_SUPABASE_PROJECT_REF."
  );
}

if (
  payloadDatabase.isProduction &&
  !payloadDatabase.isProductionBuild &&
  !payloadMediaStorageEnabled &&
  !payloadAllowProductionLocalMedia
) {
  throw new Error(
    "Payload CMS blog media is configured to use local filesystem storage in production. Set PAYLOAD_MEDIA_SUPABASE_BUCKET, PAYLOAD_MEDIA_SUPABASE_REGION, PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID, PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY, and either PAYLOAD_MEDIA_SUPABASE_ENDPOINT or PAYLOAD_MEDIA_SUPABASE_PROJECT_REF for persistent Supabase Storage, or set PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA=true only when production has persistent disk."
  );
}

const payloadDatabaseAdapter = postgresAdapter({
  pool: {
    connectionString: payloadDatabase.databaseUrl,
  },
  push: payloadDatabase.pushSchema,
});
const payloadPlugins = payloadMediaStorageEnabled
  ? [
      s3Storage({
        bucket: payloadMediaBucket!,
        collections: {
          [BlogMediaCollection.slug]: true,
        },
        config: {
          credentials: {
            accessKeyId: payloadMediaAccessKeyId!,
            secretAccessKey: payloadMediaSecretAccessKey!,
          },
          endpoint: payloadResolvedMediaStorageEndpoint!,
          forcePathStyle: payloadMediaForcePathStyle,
          region: payloadMediaRegion!,
        },
      }),
    ]
  : [];

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
  plugins: payloadPlugins,
  typescript: {
    outputFile: path.resolve(process.cwd(), "src/types/payload-types"),
  },
});

export default payloadConfig;
