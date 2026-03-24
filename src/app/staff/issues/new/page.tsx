import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { PageIntro } from "@/components/common/PageIntro";
import { StaffIssueFormPanel } from "@/components/staff/StaffIssueFormPanel";
import { StaffWorkerRouteNav } from "@/components/staff/StaffWorkerRouteNav";
import { requireAdminPageAccessOrRedirect } from "@/server/auth/admin-page-guard";
import type { FlatId } from "@/types/booking";

interface StaffNewIssuePageProps {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}

function normalizeFlatId(value: string | null): FlatId | undefined {
  if (value === "mayfair" || value === "windsor" || value === "kensington") {
    return value;
  }

  return undefined;
}

function pickFirstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function StaffNewIssuePage({ searchParams }: StaffNewIssuePageProps) {
  await requireAdminPageAccessOrRedirect({ requestedPath: "/staff/issues/new" });

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const initialFlatId = normalizeFlatId(pickFirstValue(resolvedSearchParams.flatId));

  return (
    <main className="admin-readiness-page">
      <section className="container">
        <PageIntro
          subtitle="Staff Operations"
          title="Report Issue"
          description="Choose flat, type, severity, and a short note so the team can act quickly."
          backHref="/staff/tasks"
          backLabel="Back to Task Queue"
          wrapperStyle={{ marginBottom: "2rem" }}
        />

        <AdminLogoutButton />
        <StaffWorkerRouteNav currentPath="/staff/issues/new" />
        <StaffIssueFormPanel initialFlatId={initialFlatId} />
      </section>
    </main>
  );
}
