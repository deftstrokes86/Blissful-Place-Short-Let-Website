import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryTemplateCreatePanel } from "@/components/admin/inventory/templates/AdminInventoryTemplateCreatePanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryTemplateNewPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory/templates/new" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title="Create Template"
          description="Create template metadata first, then add expected items and quantities in template detail."
          backHref="/admin/inventory/templates"
          backLabel="Back to Templates"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/inventory/templates/new" />
        <AdminInventoryTemplateCreatePanel />
      </section>
    </main>
  );
}
