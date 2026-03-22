import { formatLagosDateTime } from "../inventory/admin-inventory-view-model";

export type ReadinessIssueAction = "open" | "in_progress" | "resolved" | "closed";

export function isCreateIssueDisabled(input: {
  isSubmitting: boolean;
  flatId: string;
  title: string;
  severity: string;
}): boolean {
  if (input.isSubmitting) {
    return true;
  }

  if (input.flatId.trim().length === 0 || input.title.trim().length === 0 || input.severity.trim().length === 0) {
    return true;
  }

  return false;
}

export function isUpdateIssueDisabled(input: {
  isSubmitting: boolean;
  issueId: string;
  status: string;
}): boolean {
  if (input.isSubmitting) {
    return true;
  }

  if (input.issueId.trim().length === 0 || input.status.trim().length === 0) {
    return true;
  }

  return false;
}

export function formatReadinessUpdatedAt(value: string | null): string {
  return formatLagosDateTime(value);
}
