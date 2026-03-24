export interface InventoryRouteEntry {
  path: string;
  href: string;
  label: string;
  audience: "admin" | "worker";
}

export const ADMIN_INVENTORY_ROUTES: readonly InventoryRouteEntry[] = [
  { path: "/admin/inventory", href: "/admin/inventory", label: "Overview", audience: "admin" },
  { path: "/admin/inventory/items/new", href: "/admin/inventory/items/new", label: "New Item", audience: "admin" },
  { path: "/admin/inventory/items/[itemId]", href: "/admin/inventory", label: "Item Detail", audience: "admin" },
  { path: "/admin/inventory/templates", href: "/admin/inventory/templates", label: "Templates", audience: "admin" },
  { path: "/admin/inventory/templates/new", href: "/admin/inventory/templates/new", label: "New Template", audience: "admin" },
  { path: "/admin/inventory/templates/[templateId]", href: "/admin/inventory/templates", label: "Template Detail", audience: "admin" },
  { path: "/admin/inventory/stock", href: "/admin/inventory/stock", label: "Stock", audience: "admin" },
  { path: "/admin/inventory/movements", href: "/admin/inventory/movements", label: "Movements", audience: "admin" },
  { path: "/admin/inventory/movements/new", href: "/admin/inventory/movements/new", label: "New Movement", audience: "admin" },
  { path: "/admin/inventory/flats/[flatId]", href: "/admin/inventory", label: "Flat Detail", audience: "admin" },
  { path: "/admin/inventory/alerts", href: "/admin/inventory/alerts", label: "Alerts", audience: "admin" },
  { path: "/admin/inventory/maintenance", href: "/admin/inventory/maintenance", label: "Maintenance", audience: "admin" },
  { path: "/admin/readiness", href: "/admin/readiness", label: "Readiness", audience: "admin" },
  { path: "/admin/tasks", href: "/admin/tasks", label: "Tasks", audience: "admin" },
];

export const STAFF_WORKER_ROUTES: readonly InventoryRouteEntry[] = [
  { path: "/staff/tasks", href: "/staff/tasks", label: "Tasks", audience: "worker" },
  { path: "/staff/flats/[flatId]", href: "/staff/flats/mayfair", label: "Flat Details", audience: "worker" },
  { path: "/staff/issues/new", href: "/staff/issues/new", label: "Report Issue", audience: "worker" },
  { path: "/staff/restock", href: "/staff/restock", label: "Restock", audience: "worker" },
  { path: "/staff/maintenance", href: "/staff/maintenance", label: "Maintenance", audience: "worker" },
];

export function isAdminInventoryRoute(path: string): boolean {
  return ADMIN_INVENTORY_ROUTES.some((route) => route.path === path);
}

export function isStaffWorkerRoute(path: string): boolean {
  return STAFF_WORKER_ROUTES.some((route) => route.path === path);
}

export function matchRoutePath(currentPath: string, pattern: string): boolean {
  if (currentPath === pattern) {
    return true;
  }

  const currentParts = currentPath.split("/").filter((part) => part.length > 0);
  const patternParts = pattern.split("/").filter((part) => part.length > 0);

  if (currentParts.length !== patternParts.length) {
    return false;
  }

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const currentPart = currentParts[index];

    if (patternPart.startsWith("[") && patternPart.endsWith("]")) {
      if (!currentPart) {
        return false;
      }

      continue;
    }

    if (patternPart !== currentPart) {
      return false;
    }
  }

  return true;
}
