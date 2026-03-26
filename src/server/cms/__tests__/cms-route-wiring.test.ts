import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testCmsMountFilesExist(): Promise<void> {
  assert.equal(existsSync(join(process.cwd(), "src/app/cms/layout.tsx")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/cms/[[...segments]]/page.tsx")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/cms/api/[...slug]/route.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/cms/api/graphql/route.ts")), false);
}

async function testPayloadConfigUsesCmsRoutes(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes('const CMS_ADMIN_ROUTE = "/cms"'));
  assert.ok(source.includes('const CMS_API_ROUTE = "/cms/api"'));
  assert.ok(source.includes("admin: CMS_ADMIN_ROUTE"));
  assert.ok(source.includes("api: CMS_API_ROUTE"));
  assert.ok(!source.includes('admin: "/admin"'));
}

async function testCmsUsesDedicatedUsersAndDatabaseBoundary(): Promise<void> {
  const payloadConfigSource = readSource("src/cms/payload.config.ts");
  const cmsUsersSource = readSource("src/cms/collections/CmsUsers.ts");

  assert.ok(cmsUsersSource.includes('slug: "cms-users"'));
  assert.ok(payloadConfigSource.includes("user: CmsUsersCollection.slug"));
  assert.ok(payloadConfigSource.includes("PAYLOAD_DATABASE_URL"));
  assert.ok(payloadConfigSource.includes("file:./.data/payload.db"));
  assert.ok(!payloadConfigSource.includes('user: "users"'));
}

async function testRootPayloadConfigDelegatesToCmsConfig(): Promise<void> {
  const source = readSource("payload.config.ts");

  assert.ok(source.includes("@/cms/payload.config"));
}

async function testCmsAdminUiWiringUsesPayloadViews(): Promise<void> {
  const layoutSource = readSource("src/app/cms/layout.tsx");
  const pageSource = readSource("src/app/cms/[[...segments]]/page.tsx");

  assert.ok(layoutSource.includes("RootLayout"));
  assert.ok(pageSource.includes("RootPage"));
}

async function testCmsApiRouteWiresPayloadRestHandlers(): Promise<void> {
  const apiRouteSource = readSource("src/app/cms/api/[...slug]/route.ts");

  assert.ok(apiRouteSource.includes("REST_GET"));
  assert.ok(apiRouteSource.includes("REST_POST"));
  assert.ok(apiRouteSource.includes("REST_PATCH"));
  assert.ok(apiRouteSource.includes("REST_DELETE"));
}

async function run(): Promise<void> {
  await testCmsMountFilesExist();
  await testPayloadConfigUsesCmsRoutes();
  await testCmsUsesDedicatedUsersAndDatabaseBoundary();
  await testRootPayloadConfigDelegatesToCmsConfig();
  await testCmsAdminUiWiringUsesPayloadViews();
  await testCmsApiRouteWiresPayloadRestHandlers();

  console.log("cms-route-wiring: ok");
}

void run();
