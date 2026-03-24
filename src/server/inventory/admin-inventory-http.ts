import type { FlatId } from "../../types/booking";
import type { MaintenanceIssueRecord } from "../../types/booking-backend";
import type { AdminInventoryService } from "./admin-inventory-service";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const ISSUE_SEVERITIES: readonly MaintenanceIssueRecord["severity"][] = ["critical", "important", "minor"];
const ISSUE_STATUSES: readonly MaintenanceIssueRecord["status"][] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

function normalizeRequiredString(value: string | null | undefined, field: string = "value"): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  return normalizeRequiredString(value) ?? null;
}

function normalizeFlatId(value: string | null | undefined): FlatId | null {
  const normalized = normalizeRequiredString(value, "flatId");
  if (!normalized) {
    return null;
  }

  return FLAT_IDS.includes(normalized as FlatId) ? (normalized as FlatId) : null;
}

function normalizeIssueSeverity(
  value: string | null | undefined
): MaintenanceIssueRecord["severity"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return ISSUE_SEVERITIES.includes(normalized as MaintenanceIssueRecord["severity"])
    ? (normalized as MaintenanceIssueRecord["severity"])
    : null;
}

function normalizeIssueStatus(value: string | null | undefined): MaintenanceIssueRecord["status"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return ISSUE_STATUSES.includes(normalized as MaintenanceIssueRecord["status"])
    ? (normalized as MaintenanceIssueRecord["status"])
    : null;
}

export async function handleGetAdminInventoryOverviewRequest(service: AdminInventoryService) {
  const overview = await service.getOverview();
  return { overview };
}

export async function handleCreateMaintenanceIssueRequest(
  service: AdminInventoryService,
  input: {
    flatId: string | null;
    inventoryItemId: string | null;
    title: string | null;
    notes: string | null;
    severity: string | null;
  }
) {
  const flatId = normalizeFlatId(input.flatId);
  const title = normalizeRequiredString(input.title, "title");
  const severity = normalizeIssueSeverity(input.severity);

  if (!flatId || !title || !severity) {
    throw new Error("flatId, title, and severity are required for maintenance issue creation.");
  }

  const issue = await service.createMaintenanceIssue({
    flatId,
    inventoryItemId: normalizeOptionalString(input.inventoryItemId),
    title,
    notes: normalizeOptionalString(input.notes),
    severity,
  });

  return { issue };
}

export async function handleUpdateMaintenanceIssueStatusRequest(
  service: AdminInventoryService,
  input: {
    issueId: string | null;
    status: string | null;
    notes: string | null;
  }
) {
  const issueId = normalizeRequiredString(input.issueId, "issueId");
  const status = normalizeIssueStatus(input.status);

  if (!issueId || !status) {
    throw new Error("issueId and a valid status are required for maintenance issue updates.");
  }

  const issue = await service.updateMaintenanceIssueStatus({
    issueId,
    status,
    notes: normalizeOptionalString(input.notes),
  });

  return { issue };
}

export async function handleResolveInventoryAlertRequest(
  service: Pick<AdminInventoryService, "resolveInventoryAlert">,
  input: {
    alertId: string | null;
    note: string | null;
  }
) {
  const alertId = normalizeRequiredString(input.alertId, "alertId");
  if (!alertId) {
    throw new Error("alertId is required for alert resolution.");
  }

  const alert = await service.resolveInventoryAlert({
    alertId,
    note: normalizeOptionalString(input.note),
  });

  return { alert };
}
