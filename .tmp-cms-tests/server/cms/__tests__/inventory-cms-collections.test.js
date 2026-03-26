"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const cms_access_1 = require("../cms-access");
function readSource(relativePath) {
    return (0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), relativePath), "utf8");
}
async function testInventoryCollectionsFilesExist() {
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/cms/collections/CmsInventoryItems.ts")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/cms/collections/CmsInventoryTemplates.ts")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/cms/collections/CmsInventoryTemplateItems.ts")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/cms/collections/CmsInventoryAlerts.ts")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/cms/collections/CmsMaintenanceIssues.ts")), true);
}
async function testInventoryCollectionsWiredInPayloadConfig() {
    const payloadConfigSource = readSource("src/cms/payload.config.ts");
    strict_1.default.ok(payloadConfigSource.includes("CmsInventoryItemsCollection"));
    strict_1.default.ok(payloadConfigSource.includes("CmsInventoryTemplatesCollection"));
    strict_1.default.ok(payloadConfigSource.includes("CmsInventoryTemplateItemsCollection"));
    strict_1.default.ok(payloadConfigSource.includes("CmsInventoryAlertsCollection"));
    strict_1.default.ok(payloadConfigSource.includes("CmsMaintenanceIssuesCollection"));
}
async function testInventoryCollectionAccessWiring() {
    const templatesSource = readSource("src/cms/collections/CmsInventoryTemplates.ts");
    const templateItemsSource = readSource("src/cms/collections/CmsInventoryTemplateItems.ts");
    const alertsSource = readSource("src/cms/collections/CmsInventoryAlerts.ts");
    const maintenanceSource = readSource("src/cms/collections/CmsMaintenanceIssues.ts");
    for (const source of [templatesSource, templateItemsSource]) {
        strict_1.default.ok(source.includes("read: inventoryReadAccess"));
        strict_1.default.ok(source.includes("create: inventoryManageAccess"));
        strict_1.default.ok(source.includes("update: inventoryManageAccess"));
        strict_1.default.ok(source.includes("delete: inventoryManageAccess"));
    }
    for (const source of [alertsSource, maintenanceSource]) {
        strict_1.default.ok(source.includes("read: inventoryReadAccess"));
        strict_1.default.ok(source.includes("create: () => false"));
        strict_1.default.ok(source.includes("update: () => false"));
        strict_1.default.ok(source.includes("delete: () => false"));
    }
}
async function testInventoryRoleBoundaries() {
    strict_1.default.equal((0, cms_access_1.canReadInventory)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("inventory_manager"), true);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("blog_manager"), false);
    strict_1.default.equal((0, cms_access_1.canReadInventory)("author"), false);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("admin"), true);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("inventory_manager"), true);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("blog_manager"), false);
    strict_1.default.equal((0, cms_access_1.canManageInventory)("author"), false);
}
async function testCustomOperationalUiCoexists() {
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/admin/inventory/page.tsx")), true);
    strict_1.default.equal((0, node_fs_1.existsSync)((0, node_path_1.join)(process.cwd(), "src/app/staff/tasks/page.tsx")), true);
}
async function run() {
    await testInventoryCollectionsFilesExist();
    await testInventoryCollectionsWiredInPayloadConfig();
    await testInventoryCollectionAccessWiring();
    await testInventoryRoleBoundaries();
    await testCustomOperationalUiCoexists();
    console.log("inventory-cms-collections: ok");
}
void run();
