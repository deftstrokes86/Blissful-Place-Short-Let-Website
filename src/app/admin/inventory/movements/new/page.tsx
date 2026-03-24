import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryMovementCreatePanel } from "@/components/admin/inventory/movements/AdminInventoryMovementCreatePanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryNewMovementPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/movements/new" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Record Stock Movement"
          description="Capture movement and transfer actions with reasons and notes to preserve operational audit quality."
          backHref="/admin/inventory/movements"
          backLabel="Back to Stock Movements"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/movements/new" />
        <AdminInventoryMovementCreatePanel />
      </section>
    </main>
  );
}
