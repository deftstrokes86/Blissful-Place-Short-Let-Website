import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryMaintenancePanel } from "@/components/admin/inventory/maintenance/AdminInventoryMaintenancePanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryMaintenancePage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/maintenance" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Maintenance Operations"
          description="Track maintenance issues, update status, resolve work, and escalate blocked items to the worker task queue."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/maintenance" />
        <AdminInventoryMaintenancePanel />
      </section>
    </main>
  );
}
