import Link from "next/link";

import { STAFF_WORKER_ROUTES, matchRoutePath } from "../admin/inventory/inventory-route-map";

interface StaffWorkerRouteNavProps {
  currentPath: string;
}

export function StaffWorkerRouteNav({ currentPath }: StaffWorkerRouteNavProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="staff-worker-routes-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-worker-routes-heading" className="heading-sm" style={{ margin: 0 }}>
          Worker Actions
        </h2>
        <span className="admin-count-pill">Staff</span>
      </div>

      <div className="admin-mini-table">
        {STAFF_WORKER_ROUTES.map((route) => {
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
