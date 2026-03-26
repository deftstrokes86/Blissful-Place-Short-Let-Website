import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminInventoryFlatDetailPanel } from "@/components/admin/inventory/flats/AdminInventoryFlatDetailPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

interface AdminInventoryFlatDetailPageProps {
  params: Promise<{
    flatId: string;
  }>;
}

export default async function AdminInventoryFlatDetailPage({ params }: AdminInventoryFlatDetailPageProps) {
  const { flatId } = await params;
  await requireAdminPageAccessOrRedirect({ requestedPath: `/admin/inventory/flats/${flatId}` });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Inventory Administration"
          title={`Flat Inventory: ${flatId}`}
          description="Inspect expected versus current stock, reconcile discrepancies, and keep readiness impact visible with provenance."
          backHref="/admin/inventory"
          backLabel="Back to Inventory Overview"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath={`/admin/inventory/flats/${flatId}`} />
        <AdminInventoryFlatDetailPanel flatId={flatId} />
      </section>
    </main>
  );
}
