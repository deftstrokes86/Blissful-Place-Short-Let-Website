import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryPanel } from "@/components/admin/inventory/AdminInventoryPanel";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryMovementsPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/movements" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Stock Movements"
          description="Audit movement history for traceable add, consume, damage, replace, and transfer actions."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/movements" />
        <AdminInventoryPanel />
      </section>
    </main>
  );
}
