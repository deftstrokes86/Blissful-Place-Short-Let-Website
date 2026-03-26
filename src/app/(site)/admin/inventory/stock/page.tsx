import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryPanel } from "@/components/admin/inventory/AdminInventoryPanel";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryStockPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/stock" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Stock Position"
          description="Review current stock posture across flats with expected-versus-current context."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/stock" />
        <AdminInventoryPanel />
      </section>
    </main>
  );
}
