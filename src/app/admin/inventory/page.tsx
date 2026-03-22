import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryPanel } from "@/components/admin/inventory/AdminInventoryPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminInventoryPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/inventory" });

  return (
    <main className="admin-inventory-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Inventory Administration"
          description="Review inventory catalog, templates, flat-level stock records, and movement history with clear operational context."
          backHref="/admin/bookings"
          backLabel="Back to Booking Administration"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <AdminInventoryPanel />
      </section>
    </main>
  );
}
