import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryAlertsPanel } from "@/components/admin/inventory/alerts/AdminInventoryAlertsPanel";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryAlertsPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/alerts" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Inventory Alerts"
          description="Prioritize active low-stock, missing-item, and readiness-impacting alerts and resolve them from one operational screen."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/alerts" />
        <AdminInventoryAlertsPanel />
      </section>
    </main>
  );
}
