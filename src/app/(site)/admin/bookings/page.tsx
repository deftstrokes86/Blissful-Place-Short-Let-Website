import { PageIntro } from "@/components/common/PageIntro";

import { AdminBookingsPanel } from "@/components/admin/bookings/AdminBookingsPanel";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/bookings" });

  return (
    <main className="admin-bookings-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Booking Administration"
          description="Manage pending transfer and POS reservations with truthful status handling and one-submit-at-a-time actions."
          backHref="/"
          backLabel="Back to Homepage"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <AdminBookingsPanel />
      </section>
    </main>
  );
}
