import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryTemplatesPanel } from "@/components/admin/inventory/templates/AdminInventoryTemplatesPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryTemplatesPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/templates" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Inventory Templates"
          description="List and manage reusable template standards so flat setup stays consistent and operationally ready."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Hub"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/templates" />
        <AdminInventoryTemplatesPanel />
      </section>
    </main>
  );
}
