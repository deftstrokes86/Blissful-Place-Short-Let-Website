import { PageIntro } from "@/components/common/PageIntro";
import { AdminBookingsPanel } from "@/components/admin/bookings/AdminBookingsPanel";

export default function AdminBookingsPage() {
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

        <AdminBookingsPanel />
      </section>
    </main>
  );
}
