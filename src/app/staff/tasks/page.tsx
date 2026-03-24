import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { PageIntro } from "@/components/common/PageIntro";
import { StaffTasksPanel } from "@/components/staff/StaffTasksPanel";
import { StaffWorkerRouteNav } from "@/components/staff/StaffWorkerRouteNav";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function StaffTasksPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/staff/tasks" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Staff Operations"
          title="My Task Queue"
          description="Simple execution queue for open readiness, restock, and maintenance tasks."
          backHref="/admin/bookings"
          backLabel="Back to Operations"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <StaffWorkerRouteNav currentPath="/staff/tasks" />
        <StaffTasksPanel />
      </section>
    </main>
  );
}
