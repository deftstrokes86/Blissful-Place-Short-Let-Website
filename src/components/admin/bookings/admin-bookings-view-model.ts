import type { ReservationStatus } from "@/types/booking";

export type StaffActionIntent =
  | "verify_transfer"
  | "confirm_pos"
  | "cancel_reservation"
  | "refresh";

export interface HoldExpiryViewModel {
  label: string;
  tone: "active" | "expired" | "neutral";
}

function toTitleCase(value: string): string {
  return value
    .split("_")
    .map((segment) => (segment.length > 0 ? segment[0].toUpperCase() + segment.slice(1) : ""))
    .join(" ");
}

function formatLagosDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(isoDateTime));
}

export function formatReservationStatusLabel(status: ReservationStatus | string): string {
  return toTitleCase(status);
}

export function buildActionKey(reservationId: string, action: StaffActionIntent): string {
  return `${reservationId}:${action}`;
}

export function isActionDisabled(input: {
  inFlightActionKey: string | null;
  action: StaffActionIntent;
  reservationId: string;
  requiresStaffId: boolean;
  staffId: string;
}): boolean {
  const hasActiveSubmission = input.inFlightActionKey === buildActionKey(input.reservationId, input.action);
  if (hasActiveSubmission) {
    return true;
  }

  if (input.requiresStaffId && input.staffId.trim().length === 0) {
    return true;
  }

  return false;
}

export function formatHoldExpiry(holdExpiresAt: string | null, now = new Date()): HoldExpiryViewModel {
  if (!holdExpiresAt) {
    return {
      label: "No hold expiry set",
      tone: "neutral",
    };
  }

  const expiry = new Date(holdExpiresAt);
  const expiryText = formatLagosDateTime(holdExpiresAt);

  if (expiry.getTime() <= now.getTime()) {
    return {
      label: `Expired ${expiryText}`,
      tone: "expired",
    };
  }

  return {
    label: `Expires ${expiryText}`,
    tone: "active",
  };
}
