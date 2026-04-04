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

async function testRootPayloadConfigDelegatesToCmsConfig(): Promise<void> {
  const source = readSource("payload.config.ts");

  assert.ok(source.includes("./src/cms/payload.config.ts"));
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
  await testPayloadSchemaPushSafetyInDevelopment();
  await testPayloadProductionDatabaseSafety();
  await testRootPayloadConfigDelegatesToCmsConfig();
  await testCmsAdminUiWiringUsesPayloadViewsWithoutNestedHtml();
  await testCmsImportMapContainsRequiredBuiltInComponents();
  await testCmsApiRouteWiresPayloadRestHandlers();

  console.log("cms-route-wiring: ok");
}

void run();
