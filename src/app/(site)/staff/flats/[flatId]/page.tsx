import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { PageIntro } from "@/components/common/PageIntro";
import { StaffFlatPanel } from "@/components/staff/StaffFlatPanel";
import { StaffWorkerRouteNav } from "@/components/staff/StaffWorkerRouteNav";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";
import type { FlatId } from "@/types/booking";

export const dynamic = "force-dynamic";

interface StaffFlatDetailPageProps {
  params: Promise<{
    flatId: string;
  }>;
}

function normalizeFlatId(value: string): FlatId {
  if (value === "windsor" || value === "kensington" || value === "mayfair") {
    return value;
  }

  return "mayfair";
}

export default async function StaffFlatDetailPage({ params }: StaffFlatDetailPageProps) {
  const { flatId } = await params;
  const normalizedFlatId = normalizeFlatId(flatId);

  await requireAdminPageAccessOrRedirect({ requestedPath: `/staff/flats/${normalizedFlatId}` });

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Staff Operations"
          title={`Flat Detail: ${normalizedFlatId}`}
          description="Check readiness, current inventory condition, and open tasks for this flat."
          backHref="/staff/tasks"
          backLabel="Back to Task Queue"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <StaffWorkerRouteNav currentPath={`/staff/flats/${normalizedFlatId}`} />
        <StaffFlatPanel flatId={normalizedFlatId} />
      </section>
    </main>
  );
}
