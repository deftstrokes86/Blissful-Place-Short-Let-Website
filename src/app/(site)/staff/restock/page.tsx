import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { PageIntro } from "@/components/common/PageIntro";
import { StaffRestockPanel } from "@/components/staff/StaffRestockPanel";
import { StaffWorkerRouteNav } from "@/components/staff/StaffWorkerRouteNav";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";

export const dynamic = "force-dynamic";

export default async function StaffRestockPage() {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/staff/restock" });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Staff Operations"
          title="Restock Queue"
          description="See what is low, enter what you added, and report shortages quickly."
          backHref="/staff/tasks"
          backLabel="Back to Task Queue"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <StaffWorkerRouteNav currentPath="/staff/restock" />
        <StaffRestockPanel />
      </section>
    </main>
  );
}
