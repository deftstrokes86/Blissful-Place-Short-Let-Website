import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { AdminInventoryHubPanel } from "@/components/admin/inventory/AdminInventoryHubPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Inventory Administration"
          description="Supervisor hub for catalog, templates, stock, movement, alerts, and readiness-linked inventory actions."
          backHref="/admin/bookings"
          backLabel="Back to Booking Administration"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <AdminInventoryHubPanel />
      </section>
    </main>
  );
}
