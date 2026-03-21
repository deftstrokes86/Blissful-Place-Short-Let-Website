import type { AdminNotificationListItem } from "../../../lib/admin-notifications-api";

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1).toLowerCase()}`)
    .join(" ");
}

export function formatNotificationEventLabel(eventType: string): string {
  return toTitleCase(eventType);
}

export function formatNotificationStatusLabel(status: AdminNotificationListItem["status"]): string {
  if (status === "pending") {
    return "Queued";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Sent";
}

export function getNotificationStatusClassName(status: AdminNotificationListItem["status"]): string {
  if (status === "pending") {
    return "admin-status-pill admin-status-pending";
  }

  if (status === "failed") {
    return "admin-status-pill admin-status-failed";
  }

  return "admin-status-pill admin-status-confirmed";
}

export function formatAudienceLabel(audience: AdminNotificationListItem["audience"]): string {
  return toTitleCase(audience);
}

export function formatChannelLabel(channel: AdminNotificationListItem["channel"]): string {
  return toTitleCase(channel);
}

export function summarizeNotification(item: AdminNotificationListItem): string {
  const summary = item.summary.trim();
  if (summary.length > 0) {
    return summary;
  }

  return item.title;
}

export function formatLagosDateTime(isoDateTime: string | null): string {
  if (!isoDateTime) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(isoDateTime));
}

export function getDeliveryDetail(item: AdminNotificationListItem): string {
  if (item.status === "sent") {
    return item.sentAt ? `Sent ${formatLagosDateTime(item.sentAt)}` : "Sent";
  }

  if (item.status === "failed") {
    return item.errorMessage?.trim() || "Delivery failed.";
  }

  return "Pending delivery";
}
