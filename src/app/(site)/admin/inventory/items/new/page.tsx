import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryItemCreatePanel } from "@/components/admin/inventory/items/AdminInventoryItemCreatePanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryNewItemPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/items/new" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Create Inventory Item"
          description="Add durable assets, consumables, and maintenance supplies to the readiness inventory catalog."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/items/new" />
        <AdminInventoryItemCreatePanel />
      </section>
    </main>
  );
}
