import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminInventoryRouteNav } from "@/components/admin/inventory/AdminInventoryRouteNav";
import { AdminTasksPanel } from "@/components/admin/tasks/AdminTasksPanel";
import { PageIntro } from "@/components/common/PageIntro";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export default async function AdminTasksPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/admin/tasks" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Internal Operations"
          title="Worker Task Coordination"
          description="Coordinate worker tasks generated from readiness, alerts, and maintenance while preserving booking truth boundaries."
          backHref="/admin/inventory"
          backLabel="Back to Inventory"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <AdminInventoryRouteNav currentPath="/admin/tasks" />
        <AdminTasksPanel />
      </section>
    </main>
  );
}
