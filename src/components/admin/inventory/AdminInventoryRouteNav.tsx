import Link from "next/link";

import { ADMIN_INVENTORY_ROUTES, matchRoutePath } from "./inventory-route-map";

interface AdminInventoryRouteNavProps {
  currentPath: string;
}

export function AdminInventoryRouteNav({ currentPath }: AdminInventoryRouteNavProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="admin-inventory-routes-heading">
      <div className="admin-bookings-section-header">
        <h2 id="admin-inventory-routes-heading" className="heading-sm" style={{ margin: 0 }}>
          Inventory Routes
        </h2>
        <span className="admin-count-pill">Admin</span>
      </div>

      <div className="admin-mini-table">
        {ADMIN_INVENTORY_ROUTES.map((route) => {
          const active = matchRoutePath(currentPath, route.path);

          return (
            <div key={route.path} className="admin-mini-table-row">
              <Link href={route.href}>{route.label}</Link>
              {active ? <span className="admin-status-pill admin-readiness-ready">Current</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
