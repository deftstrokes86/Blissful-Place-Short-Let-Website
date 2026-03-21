import { PageIntro } from "@/components/common/PageIntro";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminAvailabilityPage() {
  await requireAdminPageAccessOrRedirect();

  return (
    <main className="admin-availability-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Availability Administration"
          description="Manage manual availability blocks and calendar controls from the protected operations surface."
          backHref="/admin/bookings"
          backLabel="Back to Booking Administration"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <div className="booking-inline-note booking-inline-note-soft">
          Manual availability controls are available through the protected operations interfaces and will be surfaced here.
        </div>
      </section>
    </main>
  );
}
