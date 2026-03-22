function titleCaseFromSnake(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatInventoryCategoryLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatCriticalityLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatConditionStatusLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatMovementTypeLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatReadinessStatusLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatComponentStatusLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatIssueStatusLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatAlertTypeLabel(value: string): string {
  return titleCaseFromSnake(value);
}

export function formatLagosDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function getReadinessStatusClassName(status: string): string {
  if (status === "ready") {
    return "admin-status-pill admin-readiness-ready";
  }

  if (status === "needs_attention") {
    return "admin-status-pill admin-readiness-attention";
  }

  if (status === "out_of_service") {
    return "admin-status-pill admin-readiness-out";
  }

  return "admin-status-pill";
}

export function getSeverityClassName(severity: string): string {
  if (severity === "critical") {
    return "admin-status-pill admin-severity-critical";
  }

  if (severity === "important") {
    return "admin-status-pill admin-severity-important";
  }

  return "admin-status-pill admin-severity-minor";
}
