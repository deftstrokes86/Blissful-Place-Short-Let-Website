import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryItemDetailPanel } from "@/components/admin/inventory/items/AdminInventoryItemDetailPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

interface AdminInventoryItemDetailPageProps {
  params: Promise<{
    itemId: string;
  }>;
}

export default async function AdminInventoryItemDetailPage({ params }: AdminInventoryItemDetailPageProps) {
  const { itemId } = await params;
  await requireAdminPageAccessOrRedirect({ requestedPath: `/admin/inventory/items/${itemId}` });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title={`Inventory Item: ${itemId}`}
          description="Review catalog details, update item metadata, and track flat/movement operational context."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath={`/admin/inventory/items/${itemId}`} />
        <AdminInventoryItemDetailPanel itemId={itemId} />
      </section>
    </main>
  );
}
