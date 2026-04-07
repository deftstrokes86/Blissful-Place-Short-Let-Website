import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryTemplateDetailPanel } from "@/components/admin/inventory/templates/AdminInventoryTemplateDetailPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

interface AdminInventoryTemplateDetailPageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export default async function AdminInventoryTemplateDetailPage({ params }: AdminInventoryTemplateDetailPageProps) {
  const { templateId } = await params;
  await requireAdminPageAccessOrRedirect({ requestedPath: `/admin/inventory/templates/${templateId}` });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title={`Template: ${templateId}`}
          description="Edit metadata, manage expected item quantities, and apply this template to a flat in one workflow."
          backHref="/admin/inventory/templates"
          backLabel="Back to Templates"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath={`/admin/inventory/templates/${templateId}`} />
        <AdminInventoryTemplateDetailPanel templateId={templateId} />
      </section>
    </main>
  );
}
