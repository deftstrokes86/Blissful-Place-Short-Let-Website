import type { AdminReadinessRecord } from "@/lib/admin-inventory-api";

export function formatNonReadyReasons(input: {
  readiness: AdminReadinessRecord | null;
  activeAlertsCount: number;
  activeIssuesCount: number;
}): string[] {
  const reasons: string[] = [];

  if (!input.readiness) {
    reasons.push("Readiness has not been computed yet.");
    return reasons;
  }

  if (input.readiness.criticalAssetStatus !== "ready") {
    reasons.push(`Critical Assets: ${formatComponentStatus(input.readiness.criticalAssetStatus)}`);
  }

  if (input.readiness.consumablesStatus !== "ready") {
    reasons.push(`Consumables: ${formatComponentStatus(input.readiness.consumablesStatus)}`);
  }

  if (input.readiness.maintenanceStatus !== "ready") {
    reasons.push(`Maintenance: ${formatComponentStatus(input.readiness.maintenanceStatus)}`);
  }

  if (input.readiness.cleaningStatus !== "ready") {
    reasons.push(`Cleaning: ${formatComponentStatus(input.readiness.cleaningStatus)}`);
  }

  if (input.readiness.linenStatus !== "ready") {
    reasons.push(`Linen: ${formatComponentStatus(input.readiness.linenStatus)}`);
  }

  if (input.activeAlertsCount > 0) {
    reasons.push(`Active Alerts: ${input.activeAlertsCount}`);
  }

  if (input.activeIssuesCount > 0) {
    reasons.push(`Active Maintenance Issues: ${input.activeIssuesCount}`);
  }

  return reasons;
}

export function parseNonNegativeInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function canRestock(category: "asset" | "consumable" | "maintenance_supply"): boolean {
  return category === "consumable" || category === "maintenance_supply";
}

function formatComponentStatus(value: "ready" | "attention_required" | "blocked"): string {
  if (value === "attention_required") {
    return "Attention Required";
  }

  if (value === "blocked") {
    return "Blocked";
  }

  return "Ready";
}
