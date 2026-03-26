"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
async function testCmsMountFilesExist() {
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/(cms)/layout.tsx")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/(cms)/cms/[[...segments]]/page.tsx")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/(cms)/cms/api/[...slug]/route.ts")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/(cms)/cms/api/graphql/route.ts")), false);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/cms/layout.tsx")), false);
}
async function testPayloadConfigUsesCmsRoutes() {
    const source = readSource("src/cms/payload.config.ts");
    strict_1.default.ok(source.includes('const CMS_ADMIN_ROUTE = "/cms"'));
    strict_1.default.ok(source.includes('const CMS_API_ROUTE = "/cms/api"'));
    strict_1.default.ok(source.includes("admin: CMS_ADMIN_ROUTE"));
    strict_1.default.ok(source.includes("api: CMS_API_ROUTE"));
    strict_1.default.ok(source.includes("suppressHydrationWarning: true"));
    strict_1.default.ok(!source.includes('admin: "/admin"'));
}
async function testCmsUsesDedicatedUsersAndDatabaseBoundary() {
    const payloadConfigSource = readSource("src/cms/payload.config.ts");
    const cmsUsersSource = readSource("src/cms/collections/CmsUsers.ts");
    strict_1.default.ok(cmsUsersSource.includes('slug: "cms-users"'));
    strict_1.default.ok(payloadConfigSource.includes("user: CmsUsersCollection.slug"));
    strict_1.default.ok(payloadConfigSource.includes("PAYLOAD_DATABASE_URL"));
    strict_1.default.ok(payloadConfigSource.includes("file:./.data/payload.db"));
    strict_1.default.ok(payloadConfigSource.includes("PAYLOAD_AUTO_PUSH_SCHEMA"));
    strict_1.default.ok(payloadConfigSource.includes("payloadShouldPushSchema"));
    strict_1.default.ok(payloadConfigSource.includes("fs.existsSync"));
    strict_1.default.ok(payloadConfigSource.includes("resolveSqliteFilePath"));
    strict_1.default.ok(!payloadConfigSource.includes('user: "users"'));
}
async function testRootPayloadConfigDelegatesToCmsConfig() {
    const source = readSource("payload.config.ts");
    strict_1.default.ok(source.includes("./src/cms/payload.config.ts"));
}
async function testCmsAdminUiWiringUsesPayloadViewsWithoutNestedHtml() {
    const cmsRootLayoutSource = readSource("src/app/(cms)/layout.tsx");
    const pageSource = readSource("src/app/(cms)/cms/[[...segments]]/page.tsx");
    strict_1.default.ok(cmsRootLayoutSource.includes('"@payloadcms/next/css"'));
    strict_1.default.ok(cmsRootLayoutSource.includes("RootLayout"));
    strict_1.default.ok(cmsRootLayoutSource.includes("serverFunction"));
    strict_1.default.ok(pageSource.includes("RootPage"));
    strict_1.default.ok(!pageSource.includes("segments ?? []"));
}
async function testCmsImportMapContainsRequiredBuiltInComponents() {
    const source = readSource("src/cms/payload.ts");
    strict_1.default.ok(source.includes("CollectionCards"));
    strict_1.default.ok(source.includes("RscEntryLexicalField"));
    strict_1.default.ok(source.includes("@payloadcms/next/rsc#CollectionCards"));
    strict_1.default.ok(source.includes("@payloadcms/richtext-lexical/rsc#RscEntryLexicalField"));
}
async function testCmsApiRouteWiresPayloadRestHandlers() {
    const apiRouteSource = readSource("src/app/(cms)/cms/api/[...slug]/route.ts");
    strict_1.default.ok(apiRouteSource.includes("REST_GET"));
    strict_1.default.ok(apiRouteSource.includes("REST_POST"));
    strict_1.default.ok(apiRouteSource.includes("REST_PATCH"));
    strict_1.default.ok(apiRouteSource.includes("REST_DELETE"));
}
async function run() {
    await testCmsMountFilesExist();
    await testPayloadConfigUsesCmsRoutes();
    await testCmsUsesDedicatedUsersAndDatabaseBoundary();
    await testRootPayloadConfigDelegatesToCmsConfig();
    await testCmsAdminUiWiringUsesPayloadViewsWithoutNestedHtml();
    await testCmsImportMapContainsRequiredBuiltInComponents();
    await testCmsApiRouteWiresPayloadRestHandlers();
    console.log("cms-route-wiring: ok");
}
void run();
