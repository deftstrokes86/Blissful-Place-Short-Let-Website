import type { ReservationStatus } from "@/types/booking";
import type { NotificationAudience, NotificationChannel } from "@/types/booking-backend";

export type GuestNotificationEventKey =
  | "reservation_request_received"
  | "transfer_pending_confirmation"
  | "booking_confirmed"
  | "pos_request_submitted"
  | "reservation_cancelled"
  | "reservation_expired";

export type StaffNotificationEventKey =
  | "pending_transfer_created"
  | "transfer_proof_submitted"
  | "pending_pos_created"
  | "reservation_cancelled_staff_alert"
  | "reservation_confirmed_staff_alert";

export type NotificationTemplateEventKey = GuestNotificationEventKey | StaffNotificationEventKey;

export interface NotificationEventDefinition {
  key: NotificationTemplateEventKey;
  audience: NotificationAudience;
  allowedChannels: readonly NotificationChannel[];
}

export const NOTIFICATION_EVENT_DEFINITIONS: Record<NotificationTemplateEventKey, NotificationEventDefinition> = {
  reservation_request_received: {
    key: "reservation_request_received",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  transfer_pending_confirmation: {
    key: "transfer_pending_confirmation",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  booking_confirmed: {
    key: "booking_confirmed",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  pos_request_submitted: {
    key: "pos_request_submitted",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  reservation_cancelled: {
    key: "reservation_cancelled",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  reservation_expired: {
    key: "reservation_expired",
    audience: "guest",
    allowedChannels: ["email", "internal"],
  },
  pending_transfer_created: {
    key: "pending_transfer_created",
    audience: "staff",
    allowedChannels: ["internal"],
  },
  transfer_proof_submitted: {
    key: "transfer_proof_submitted",
    audience: "staff",
    allowedChannels: ["internal"],
  },
  pending_pos_created: {
    key: "pending_pos_created",
    audience: "staff",
    allowedChannels: ["internal"],
  },
  reservation_cancelled_staff_alert: {
    key: "reservation_cancelled_staff_alert",
    audience: "staff",
    allowedChannels: ["internal"],
  },
  reservation_confirmed_staff_alert: {
    key: "reservation_confirmed_staff_alert",
    audience: "staff",
    allowedChannels: ["internal"],
  },
};

export type BookingNotificationMapKey =
  | "pending_online_payment"
  | "pending_transfer_submission"
  | "awaiting_transfer_verification"
  | "pending_pos_coordination"
  | "cancelled_guest"
  | "cancelled_staff"
  | "expired"
  | "confirmed_guest"
  | "confirmed_staff";

export const BOOKING_NOTIFICATION_EVENT_MAP: Record<BookingNotificationMapKey, readonly NotificationTemplateEventKey[]> = {
  pending_online_payment: ["reservation_request_received"],
  pending_transfer_submission: ["transfer_pending_confirmation"],
  awaiting_transfer_verification: ["transfer_proof_submitted"],
  pending_pos_coordination: ["pos_request_submitted"],
  cancelled_guest: ["reservation_cancelled"],
  cancelled_staff: ["reservation_cancelled_staff_alert"],
  expired: ["reservation_expired"],
  confirmed_guest: ["booking_confirmed"],
  confirmed_staff: ["reservation_confirmed_staff_alert"],
};

export function getEventsForStatus(
  status: ReservationStatus,
  audience: NotificationAudience
): readonly NotificationTemplateEventKey[] {
  if (status === "pending_online_payment" && audience === "guest") {
    return BOOKING_NOTIFICATION_EVENT_MAP.pending_online_payment;
  }

  if (status === "pending_transfer_submission") {
    return audience === "guest"
      ? BOOKING_NOTIFICATION_EVENT_MAP.pending_transfer_submission
      : ["pending_transfer_created"];
  }

  if (status === "awaiting_transfer_verification") {
    return audience === "staff"
      ? BOOKING_NOTIFICATION_EVENT_MAP.awaiting_transfer_verification
      : [];
  }

  if (status === "pending_pos_coordination") {
    return audience === "guest"
      ? BOOKING_NOTIFICATION_EVENT_MAP.pending_pos_coordination
      : ["pending_pos_created"];
  }

  if (status === "confirmed") {
    return audience === "guest"
      ? BOOKING_NOTIFICATION_EVENT_MAP.confirmed_guest
      : BOOKING_NOTIFICATION_EVENT_MAP.confirmed_staff;
  }

  if (status === "cancelled") {
    return audience === "guest"
      ? BOOKING_NOTIFICATION_EVENT_MAP.cancelled_guest
      : BOOKING_NOTIFICATION_EVENT_MAP.cancelled_staff;
  }

  if (status === "expired" && audience === "guest") {
    return BOOKING_NOTIFICATION_EVENT_MAP.expired;
  }

  return [];
}
