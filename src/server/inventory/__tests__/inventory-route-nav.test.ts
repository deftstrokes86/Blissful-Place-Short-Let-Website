import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ADMIN_INVENTORY_ROUTES,
  STAFF_WORKER_ROUTES,
  isAdminInventoryRoute,
  isStaffWorkerRoute,
} from "../../../components/admin/inventory/inventory-route-map";
import { AdminInventoryRouteNav } from "../../../components/admin/inventory/AdminInventoryRouteNav";
import { StaffWorkerRouteNav } from "../../../components/staff/StaffWorkerRouteNav";

async function testRouteMapsContainRequiredPaths(): Promise<void> {
  const adminPaths = ADMIN_INVENTORY_ROUTES.map((entry) => entry.path);
  const staffPaths = STAFF_WORKER_ROUTES.map((entry) => entry.path);

  assert.ok(adminPaths.includes("/admin/inventory/items/new"));
  assert.ok(adminPaths.includes("/admin/inventory/templates"));
  assert.ok(adminPaths.includes("/admin/inventory/movements/new"));
  assert.ok(adminPaths.includes("/admin/tasks"));

  assert.ok(staffPaths.includes("/staff/tasks"));
  assert.ok(staffPaths.includes("/staff/issues/new"));
  assert.ok(staffPaths.includes("/staff/restock"));
  assert.ok(staffPaths.includes("/staff/maintenance"));

  assert.equal(isAdminInventoryRoute("/admin/inventory/alerts"), true);
  assert.equal(isAdminInventoryRoute("/admin/not-inventory"), false);
  assert.equal(isStaffWorkerRoute("/staff/flats/[flatId]"), true);
  assert.equal(isStaffWorkerRoute("/staff/unknown"), false);
}

async function testAdminRouteNavRendersInventorySections(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminInventoryRouteNav({
      currentPath: "/admin/inventory/stock",
    })
  );

  assert.ok(html.includes("Inventory Routes"));
  assert.ok(html.includes("Stock"));
  assert.ok(html.includes("Tasks"));
  assert.ok(html.includes("Current"));
}

async function testWorkerRouteNavIsSimplerThanAdminNav(): Promise<void> {
  const adminHtml = renderToStaticMarkup(
    AdminInventoryRouteNav({
      currentPath: "/admin/tasks",
    })
  );

  const workerHtml = renderToStaticMarkup(
    StaffWorkerRouteNav({
      currentPath: "/staff/tasks",
    })
  );

  assert.ok(workerHtml.includes("Worker Actions"));
  assert.ok(workerHtml.includes("Tasks"));
  assert.ok(workerHtml.includes("Restock"));
  assert.ok(workerHtml.includes("Maintenance"));

  const adminLinkCount = (adminHtml.match(/href=/g) ?? []).length;
  const workerLinkCount = (workerHtml.match(/href=/g) ?? []).length;
  assert.ok(workerLinkCount < adminLinkCount);
}

async function run(): Promise<void> {
  await testRouteMapsContainRequiredPaths();
  await testAdminRouteNavRendersInventorySections();
  await testWorkerRouteNavIsSimplerThanAdminNav();

  console.log("inventory-route-nav: ok");
}

void run();
