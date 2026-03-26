import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { PageIntro } from "@/components/common/PageIntro";
import { StaffMaintenancePanel } from "@/components/staff/StaffMaintenancePanel";
import { StaffWorkerRouteNav } from "@/components/staff/StaffWorkerRouteNav";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function StaffMaintenancePage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/staff/maintenance" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Staff Operations"
          title="Maintenance Queue"
          description="Update issue progress, mark fixes, or escalate when you need support."
          backHref="/staff/tasks"
          backLabel="Back to Task Queue"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <StaffWorkerRouteNav currentPath="/staff/maintenance" />
        <StaffMaintenancePanel />
      </section>
    </main>
  );
}
