import { AdminNotificationsPanel } from "@/components/admin/notifications/AdminNotificationsPanel";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminNotificationsPage() {
  await requireAdminPageAccessOrRedirect();

  return (
    <main className="admin-notifications-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Notifications"
          description="Review internal notification events, delivery status, and reservation-linked context in one operational feed."
          backHref="/admin/bookings"
          backLabel="Back to Booking Administration"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <AdminNotificationsPanel />
      </section>
    </main>
  );
}
