import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_ROUTE_FILES = [
  "src/app/admin/inventory/items/new/page.tsx",
  "src/app/admin/inventory/items/[itemId]/page.tsx",
  "src/app/admin/inventory/templates/page.tsx",
  "src/app/admin/inventory/templates/new/page.tsx",
  "src/app/admin/inventory/templates/[templateId]/page.tsx",
  "src/app/admin/inventory/stock/page.tsx",
  "src/app/admin/inventory/movements/page.tsx",
  "src/app/admin/inventory/movements/new/page.tsx",
  "src/app/admin/inventory/flats/[flatId]/page.tsx",
  "src/app/admin/inventory/alerts/page.tsx",
  "src/app/admin/inventory/maintenance/page.tsx",
  "src/app/admin/tasks/page.tsx",
  "src/app/staff/tasks/page.tsx",
  "src/app/staff/flats/[flatId]/page.tsx",
  "src/app/staff/issues/new/page.tsx",
  "src/app/staff/restock/page.tsx",
  "src/app/staff/maintenance/page.tsx",
] as const;

async function testRequiredRouteFilesExist(): Promise<void> {
  for (const relativePath of REQUIRED_ROUTE_FILES) {
    const absolutePath = join(process.cwd(), relativePath);
    assert.equal(
      existsSync(absolutePath),
      true,
      `Missing required route file: ${relativePath}`
    );
  }
}

async function run(): Promise<void> {
  await testRequiredRouteFilesExist();

  console.log("inventory-route-files: ok");
}

void run();
