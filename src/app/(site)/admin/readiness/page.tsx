import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { AdminReadinessPanel } from "@/components/admin/readiness/AdminReadinessPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function AdminReadinessPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/readiness" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Flat Readiness"
          description="Monitor readiness components, alerts, and maintenance issues so operational state remains truthful before booking decisions."
          backHref="/admin/bookings"
          backLabel="Back to Booking Administration"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />

        <AdminReadinessPanel />
      </section>
    </main>
  );
}
