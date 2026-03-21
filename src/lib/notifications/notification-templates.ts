import type { NotificationChannel } from "@/types/booking-backend";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  type NotificationTemplateEventKey,
} from "./notification-events";

export interface NotificationTemplateContext {
  reservationToken?: string;
  guestName?: string;
  flatLabel?: string;
  checkIn?: string;
  checkOut?: string;
  holdExpiresAt?: string;
}

export interface NotificationTemplateRenderInput {
  event: NotificationTemplateEventKey;
  channel: NotificationChannel;
  context: NotificationTemplateContext;
}

export interface RenderedNotificationTemplate {
  event: NotificationTemplateEventKey;
  audience: "guest" | "staff";
  channel: NotificationChannel;
  subject: string;
  body: string;
}

function formatStayWindow(context: NotificationTemplateContext): string {
  if (!context.checkIn || !context.checkOut) {
    return "Dates pending confirmation";
  }

  return `${context.checkIn} to ${context.checkOut}`;
}

function renderSubject(event: NotificationTemplateEventKey): string {
  switch (event) {
    case "reservation_request_received":
      return "Reservation request received";
    case "transfer_pending_confirmation":
      return "Transfer pending confirmation";
    case "booking_confirmed":
      return "Booking confirmed";
    case "pos_request_submitted":
      return "POS reservation request submitted";
    case "reservation_cancelled":
      return "Reservation cancelled";
    case "reservation_expired":
      return "Reservation expired";
    case "pending_transfer_created":
      return "New pending transfer reservation";
    case "transfer_proof_submitted":
      return "Transfer proof submitted";
    case "pending_pos_created":
      return "New pending POS reservation";
    case "reservation_cancelled_staff_alert":
      return "Reservation cancelled alert";
    case "reservation_confirmed_staff_alert":
      return "Reservation confirmed alert";
    default:
      return "Notification";
  }
}

function renderBody(event: NotificationTemplateEventKey, context: NotificationTemplateContext): string {
  const guestName = context.guestName?.trim() || "Guest";
  const flatLabel = context.flatLabel?.trim() || "selected residence";
  const stayWindow = formatStayWindow(context);

  switch (event) {
    case "reservation_request_received":
      return `${guestName}, your reservation request for ${flatLabel} (${stayWindow}) has been received.`;
    case "transfer_pending_confirmation":
      return `${guestName}, your transfer is pending confirmation for ${flatLabel}. Please complete transfer steps before the hold window ends.`;
    case "booking_confirmed":
      return `${guestName}, your booking is confirmed for ${flatLabel} (${stayWindow}).`;
    case "pos_request_submitted":
      return `${guestName}, your POS reservation request has been submitted. Our team will contact you for payment coordination.`;
    case "reservation_cancelled":
      return `${guestName}, your reservation for ${flatLabel} has been cancelled. Please contact support if you need help with a new request.`;
    case "reservation_expired":
      return `${guestName}, your reservation hold has expired and is no longer active.`;
    case "pending_transfer_created":
      return `staff action required: new pending transfer reservation for ${flatLabel} (${stayWindow}).`;
    case "transfer_proof_submitted":
      return `staff action required: transfer proof submitted for review.`;
    case "pending_pos_created":
      return `staff action required: new pending POS reservation requires coordination.`;
    case "reservation_cancelled_staff_alert":
      return `Staff alert: reservation was cancelled and no longer active.`;
    case "reservation_confirmed_staff_alert":
      return `Staff alert: reservation is confirmed and ready for downstream operations.`;
    default:
      return "Notification generated.";
  }
}

export function renderNotificationTemplate(input: NotificationTemplateRenderInput): RenderedNotificationTemplate {
  const definition = NOTIFICATION_EVENT_DEFINITIONS[input.event];

  if (!definition.allowedChannels.includes(input.channel)) {
    throw new Error("Channel is not allowed for this notification event.");
  }

  return {
    event: input.event,
    audience: definition.audience,
    channel: input.channel,
    subject: renderSubject(input.event),
    body: renderBody(input.event, input.context),
  };
}


