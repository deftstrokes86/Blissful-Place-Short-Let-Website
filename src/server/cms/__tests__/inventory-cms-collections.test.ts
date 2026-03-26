import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { canManageInventory, canReadInventory } from "../cms-access";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testInventoryCollectionsFilesExist(): Promise<void> {
  assert.equal(existsSync(join(process.cwd(), "src/cms/collections/CmsInventoryItems.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/cms/collections/CmsInventoryTemplates.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/cms/collections/CmsInventoryTemplateItems.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/cms/collections/CmsInventoryAlerts.ts")), true);
  assert.equal(existsSync(join(process.cwd(), "src/cms/collections/CmsMaintenanceIssues.ts")), true);
}

async function testInventoryCollectionsWiredInPayloadConfig(): Promise<void> {
  const payloadConfigSource = readSource("src/cms/payload.config.ts");

  assert.ok(payloadConfigSource.includes("CmsInventoryItemsCollection"));
  assert.ok(payloadConfigSource.includes("CmsInventoryTemplatesCollection"));
  assert.ok(payloadConfigSource.includes("CmsInventoryTemplateItemsCollection"));
  assert.ok(payloadConfigSource.includes("CmsInventoryAlertsCollection"));
  assert.ok(payloadConfigSource.includes("CmsMaintenanceIssuesCollection"));
}

async function testInventoryCollectionAccessWiring(): Promise<void> {
  const templatesSource = readSource("src/cms/collections/CmsInventoryTemplates.ts");
  const templateItemsSource = readSource("src/cms/collections/CmsInventoryTemplateItems.ts");
  const alertsSource = readSource("src/cms/collections/CmsInventoryAlerts.ts");
  const maintenanceSource = readSource("src/cms/collections/CmsMaintenanceIssues.ts");

  for (const source of [templatesSource, templateItemsSource]) {
    assert.ok(source.includes("read: inventoryReadAccess"));
    assert.ok(source.includes("create: inventoryManageAccess"));
    assert.ok(source.includes("update: inventoryManageAccess"));
    assert.ok(source.includes("delete: inventoryManageAccess"));
  }

  for (const source of [alertsSource, maintenanceSource]) {
    assert.ok(source.includes("read: inventoryReadAccess"));
    assert.ok(source.includes("create: () => false"));
    assert.ok(source.includes("update: () => false"));
    assert.ok(source.includes("delete: () => false"));
  }
}

async function testInventoryRoleBoundaries(): Promise<void> {
  assert.equal(canReadInventory("admin"), true);
  assert.equal(canReadInventory("inventory_manager"), true);
  assert.equal(canReadInventory("blog_manager"), false);
  assert.equal(canReadInventory("author"), false);

  assert.equal(canManageInventory("admin"), true);
  assert.equal(canManageInventory("inventory_manager"), true);
  assert.equal(canManageInventory("blog_manager"), false);
  assert.equal(canManageInventory("author"), false);
}

async function testCustomOperationalUiCoexists(): Promise<void> {
  assert.equal(existsSync(join(process.cwd(), "src/app/(site)/admin/inventory/page.tsx")), true);
  assert.equal(existsSync(join(process.cwd(), "src/app/(site)/staff/tasks/page.tsx")), true);
}

async function run(): Promise<void> {
  await testInventoryCollectionsFilesExist();
  await testInventoryCollectionsWiredInPayloadConfig();
  await testInventoryCollectionAccessWiring();
  await testInventoryRoleBoundaries();
  await testCustomOperationalUiCoexists();

  console.log("inventory-cms-collections: ok");
}

void run();

