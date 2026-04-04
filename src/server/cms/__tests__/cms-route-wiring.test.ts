import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testCmsMountFilesExist(): Promise<void> {
  assert.equal(existsSync(join(process.cwd(), "src/app/(cms)/layout.tsx")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/(cms)/cms/[[...segments]]/page.tsx")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/(cms)/cms/api/[...slug]/route.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/(cms)/cms/api/graphql/route.ts")), false);
  assert.equal(existsSync(join(process.cwd(), "src/app/cms/layout.tsx")), false);
}

async function testPayloadConfigUsesCmsRoutes(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes('const CMS_ADMIN_ROUTE = "/cms"'));
  assert.ok(source.includes('const CMS_API_ROUTE = "/cms/api"'));
  assert.ok(source.includes("admin: CMS_ADMIN_ROUTE"));
  assert.ok(source.includes("api: CMS_API_ROUTE"));
  assert.ok(source.includes("suppressHydrationWarning: true"));
  assert.ok(!source.includes('admin: "/admin"'));
}

async function testCmsUsesDedicatedUsersAndDatabaseBoundary(): Promise<void> {
  const payloadConfigSource = readSource("src/cms/payload.config.ts");
  const cmsUsersSource = readSource("src/cms/collections/CmsUsers.ts");

  assert.ok(cmsUsersSource.includes('slug: "cms-users"'));
  assert.ok(payloadConfigSource.includes("user: CmsUsersCollection.slug"));
  assert.ok(payloadConfigSource.includes("@payloadcms/db-postgres"));
  assert.ok(payloadConfigSource.includes("postgresAdapter"));
  assert.ok(payloadConfigSource.includes("sqliteAdapter"));
  assert.ok(payloadConfigSource.includes("PAYLOAD_DATABASE_URL"));
  assert.ok(payloadConfigSource.includes("DATABASE_URL"));
  assert.ok(payloadConfigSource.includes("file:./.data/payload.db"));
  assert.ok(payloadConfigSource.includes("PAYLOAD_ALLOW_PRODUCTION_SQLITE"));
  assert.ok(payloadConfigSource.includes("resolvePayloadDatabaseUrl"));
  assert.ok(payloadConfigSource.includes("resolvePayloadDatabaseKind"));
  assert.ok(payloadConfigSource.includes("payloadResolvedDatabaseKind"));
  assert.ok(payloadConfigSource.includes("payloadShouldPushSqliteSchema"));
  assert.ok(payloadConfigSource.includes("payloadShouldPushPostgresSchema"));
  assert.ok(payloadConfigSource.includes("fs.existsSync"));
  assert.ok(payloadConfigSource.includes("resolveSqliteFilePath"));
  assert.ok(!payloadConfigSource.includes('user: "users"'));
}

async function testPayloadMediaStorageUsesSupabaseStorageWhenConfigured(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes("@payloadcms/storage-s3"));
  assert.ok(source.includes("s3Storage"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_BUCKET"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_REGION"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_PROJECT_REF"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_ENDPOINT"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_ACCESS_KEY_ID"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_SECRET_ACCESS_KEY"));
  assert.ok(source.includes("PAYLOAD_MEDIA_SUPABASE_FORCE_PATH_STYLE"));
  assert.ok(source.includes("storage.supabase.co/storage/v1/s3"));
  assert.ok(source.includes("payloadMediaStorageEnabled"));
  assert.ok(source.includes("collections: {"));
  assert.ok(source.includes("[BlogMediaCollection.slug]: true"));
  assert.ok(source.includes("plugins: payloadPlugins"));
  assert.ok(!source.includes('acl: "public-read"'));
}

async function testPayloadSchemaPushSafetyInDevelopment(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes("process.env.NODE_ENV"));
  assert.ok(source.includes("payloadIsDevelopment"));
  assert.ok(source.includes("payloadAutoPushOverride"));
  assert.ok(source.includes("payloadAutoPushSchema = payloadAutoPushOverride ?? payloadIsDevelopment"));
}

async function testPayloadProductionDatabaseSafety(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes("payloadIsProduction"));
  assert.ok(source.includes("payloadIsProductionBuild"));
  assert.ok(source.includes('process.env.NEXT_PHASE === "phase-production-build"'));
  assert.ok(source.includes('payloadResolvedDatabaseKind === "sqlite"'));
  assert.ok(source.includes("throw new Error"));
  assert.ok(source.includes("persistent Postgres connection string"));
}

async function testPayloadProductionMediaSafety(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes("payloadMediaStorageHasPartialConfig"));
  assert.ok(source.includes("PAYLOAD_ALLOW_PRODUCTION_LOCAL_MEDIA"));
  assert.ok(source.includes("Payload CMS blog media is configured to use local filesystem storage in production"));
  assert.ok(source.includes("Payload CMS Supabase media storage is partially configured"));
}

async function testRootPayloadConfigDelegatesToCmsConfig(): Promise<void> {
  const source = readSource("payload.config.ts");

  assert.ok(source.includes("./src/cms/payload.config"));
}

async function testCmsAdminUiWiringUsesPayloadViewsWithoutNestedHtml(): Promise<void> {
  const cmsRootLayoutSource = readSource("src/app/(cms)/layout.tsx");
  const pageSource = readSource("src/app/(cms)/cms/[[...segments]]/page.tsx");

  assert.ok(cmsRootLayoutSource.includes('"@payloadcms/next/css"'));
  assert.ok(cmsRootLayoutSource.includes("RootLayout"));
  assert.ok(cmsRootLayoutSource.includes("serverFunction"));
  assert.ok(cmsRootLayoutSource.includes("cloneElement"));
  assert.ok(cmsRootLayoutSource.includes("suppressHydrationWarning: true"));
  assert.ok(pageSource.includes("RootPage"));
  assert.ok(!pageSource.includes("segments ?? []"));
}

async function testCmsImportMapContainsRequiredBuiltInComponents(): Promise<void> {
  const source = readSource("src/cms/payload.ts");

  assert.ok(source.includes("CollectionCards"));
  assert.ok(source.includes("RscEntryLexicalField"));
  assert.ok(source.includes("@payloadcms/next/rsc#CollectionCards"));
  assert.ok(source.includes("@payloadcms/richtext-lexical/rsc#RscEntryLexicalField"));
}

async function testCmsApiRouteWiresPayloadRestHandlers(): Promise<void> {
  const apiRouteSource = readSource("src/app/(cms)/cms/api/[...slug]/route.ts");

  assert.ok(apiRouteSource.includes("REST_GET"));
  assert.ok(apiRouteSource.includes("REST_POST"));
  assert.ok(apiRouteSource.includes("REST_PATCH"));
  assert.ok(apiRouteSource.includes("REST_DELETE"));
}

async function run(): Promise<void> {
  await testCmsMountFilesExist();
  await testPayloadConfigUsesCmsRoutes();
  await testCmsUsesDedicatedUsersAndDatabaseBoundary();
  await testPayloadMediaStorageUsesSupabaseStorageWhenConfigured();
  await testPayloadSchemaPushSafetyInDevelopment();
  await testPayloadProductionDatabaseSafety();
  await testPayloadProductionMediaSafety();
  await testRootPayloadConfigDelegatesToCmsConfig();
  await testCmsAdminUiWiringUsesPayloadViewsWithoutNestedHtml();
  await testCmsImportMapContainsRequiredBuiltInComponents();
  await testCmsApiRouteWiresPayloadRestHandlers();

  console.log("cms-route-wiring: ok");
}

void run();

