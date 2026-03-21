import type { BookingActor, ReservationEventType, ReservationStatus } from "../../types/booking";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  NotificationTemplateKey,
  ReservationNotificationRecord,
} from "../../types/booking-backend";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import { DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT } from "../../lib/notifications/notification-config";

export interface NotificationRepository {
  create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord>;
  update(
    id: string,
    patch: Partial<ReservationNotificationRecord>
  ): Promise<ReservationNotificationRecord>;
  findById(id: string): Promise<ReservationNotificationRecord | null>;
  findByDedupeKey(dedupeKey: string): Promise<ReservationNotificationRecord | null>;
  listByReservationId(reservationId: string): Promise<ReservationNotificationRecord[]>;
}

export interface NotificationCreateInput {
  eventType: NotificationEventType;
  templateKey: NotificationTemplateKey;
  audience: NotificationAudience;
  channel: NotificationChannel;
  recipient: string;
  title: string;
  body?: string | null;
  templateRef?: string | null;
  payload?: Record<string, string | number | boolean | null>;
  dedupeKey: string;
  reservationId?: string | null;
  reservationToken?: string | null;
  paymentAttemptId?: string | null;
}

export interface TransitionDeliveryStatusInput {
  notificationId: string;
  toStatus: NotificationStatus;
  errorMessage?: string | null;
}

export interface ReservationTransitionNotificationInput {
  previous: ReservationRepositoryReservation;
  current: ReservationRepositoryReservation;
  event: ReservationEventType;
  actor: BookingActor;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ReservationNotificationGateway {
  onReservationTransition(input: ReservationTransitionNotificationInput): Promise<void>;
}

interface NotificationServiceDependencies {
  repository: NotificationRepository;
  now?: () => Date;
}

interface NotificationDecision {
  eventType: NotificationEventType;
  templateKey: NotificationTemplateKey;
  audience: NotificationAudience;
  channel: NotificationChannel;
}

const STAFF_EVENTS = new Set<NotificationEventType>([
  "staff_transfer_pending_created",
  "staff_transfer_proof_submitted",
  "staff_pos_pending_created",
  "staff_reservation_cancelled",
  "staff_reservation_confirmed",
  "staff_transfer_hold_nearing_expiry",
]);

function createDedupeKey(input: ReservationTransitionNotificationInput, eventType: NotificationEventType): string {
  return [
    input.current.id,
    input.previous.status,
    input.current.status,
    input.event,
    eventType,
    input.current.updatedAt,
  ].join("|");
}

function resolveEventByStatus(
  status: ReservationStatus,
  paymentMethod: ReservationRepositoryReservation["paymentMethod"]
): NotificationEventType | null {
  if (status === "pending_online_payment" && paymentMethod === "website") {
    return "website_payment_pending";
  }

  if (status === "failed_payment" && paymentMethod === "website") {
    return "website_payment_failed";
  }

  if (status === "pending_transfer_submission") {
    return "transfer_payment_pending";
  }

  if (status === "awaiting_transfer_verification") {
    return "transfer_payment_awaiting_verification";
  }

  if (status === "pending_pos_coordination") {
    return "pos_request_submitted";
  }

  if (status === "confirmed") {
    if (paymentMethod === "website") {
      return "website_payment_confirmed";
    }

    if (paymentMethod === "transfer") {
      return "transfer_payment_confirmed";
    }

    if (paymentMethod === "pos") {
      return "pos_payment_confirmed";
    }
  }

  if (status === "cancelled") {
    return "reservation_cancelled";
  }

  return null;
}

function resolveNotificationDecision(input: ReservationTransitionNotificationInput): NotificationDecision | null {
  if (input.previous.status === input.current.status) {
    return null;
  }

  const eventType = resolveEventByStatus(input.current.status, input.current.paymentMethod);
  if (!eventType) {
    return null;
  }

  if (eventType.endsWith("_confirmed") && input.current.status !== "confirmed") {
    return null;
  }

  return {
    eventType,
    templateKey: eventType,
    audience: "guest",
    channel: "internal",
  };
}

function buildPayload(input: ReservationTransitionNotificationInput): ReservationNotificationRecord["payload"] {
  return {
    reservationToken: input.current.token,
    fromStatus: input.previous.status,
    toStatus: input.current.status,
    paymentMethod: input.current.paymentMethod,
    actor: input.actor,
    event: input.event,
    checkIn: input.current.stay.checkIn,
    checkOut: input.current.stay.checkOut,
    flatId: input.current.stay.flatId,
    guestEmail: input.current.guest.email,
    ...input.metadata,
  };
}

function eventTitle(eventType: NotificationEventType): string {
  switch (eventType) {
    case "website_payment_pending":
      return "Reservation Request Received";
    case "website_payment_confirmed":
      return "Booking Confirmed";
    case "website_payment_failed":
      return "Payment Failed";
    case "transfer_payment_pending":
      return "Transfer Pending Confirmation";
    case "transfer_payment_awaiting_verification":
      return "Transfer Proof Submitted";
    case "transfer_payment_confirmed":
      return "Booking Confirmed";
    case "pos_request_submitted":
      return "POS Reservation Request Submitted";
    case "pos_payment_confirmed":
      return "Booking Confirmed";
    case "reservation_cancelled":
      return "Reservation Cancelled";
    case "reservation_expired_or_hold_expired":
      return "Reservation Expired";
    case "staff_transfer_pending_created":
      return "New Pending Transfer Reservation";
    case "staff_transfer_proof_submitted":
      return "Transfer Proof Submitted";
    case "staff_pos_pending_created":
      return "New Pending POS Reservation";
    case "staff_reservation_cancelled":
      return "Reservation Cancelled";
    case "staff_reservation_confirmed":
      return "Reservation Confirmed";
    case "staff_transfer_hold_nearing_expiry":
      return "Transfer Hold Nearing Expiry";
    case "reservation_request_received":
      return "Reservation Request Received";
    default:
      return "Notification";
  }
}

function isValidChannelForEvent(eventType: NotificationEventType, channel: NotificationChannel): boolean {
  if (STAFF_EVENTS.has(eventType)) {
    return channel === "internal";
  }

  return channel === "email" || channel === "internal";
}

function isValidAudienceForEvent(eventType: NotificationEventType, audience: NotificationAudience): boolean {
  return STAFF_EVENTS.has(eventType) ? audience === "staff" : audience === "guest";
}

function canTransitionDeliveryStatus(from: NotificationStatus, to: NotificationStatus): boolean {
  if (from === to) {
    return true;
  }

  if (from === "pending") {
    return to === "sent" || to === "failed";
  }

  if (from === "failed") {
    return to === "pending";
  }

  return false;
}

function assertValidCreateInput(input: NotificationCreateInput): void {
  if (input.recipient.trim().length === 0) {
    throw new Error("Notification recipient is required.");
  }

  if (input.title.trim().length === 0) {
    throw new Error("Notification title is required.");
  }

  if (input.dedupeKey.trim().length === 0) {
    throw new Error("Notification dedupe key is required.");
  }

  if (!isValidAudienceForEvent(input.eventType, input.audience)) {
    throw new Error("Notification audience does not match event type.");
  }

  if (!isValidChannelForEvent(input.eventType, input.channel)) {
    throw new Error("Notification channel is not allowed for this event type.");
  }
}

export class NotificationService implements ReservationNotificationGateway {
  private readonly repository: NotificationRepository;
  private readonly nowProvider: () => Date;

  constructor(dependencies: NotificationServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async createNotificationRecord(input: NotificationCreateInput): Promise<ReservationNotificationRecord> {
    assertValidCreateInput(input);

    const existing = await this.repository.findByDedupeKey(input.dedupeKey);
    if (existing) {
      return existing;
    }

    return this.repository.create({
      eventType: input.eventType,
      templateKey: input.templateKey,
      audience: input.audience,
      channel: input.channel,
      recipient: input.recipient,
      title: input.title,
      body: input.body ?? null,
      templateRef: input.templateRef ?? null,
      status: "pending",
      dedupeKey: input.dedupeKey,
      payload: input.payload ?? {},
      reservationId: input.reservationId ?? null,
      reservationToken: input.reservationToken ?? null,
      paymentAttemptId: input.paymentAttemptId ?? null,
      errorMessage: null,
      sentAt: null,
    });
  }

  async transitionDeliveryStatus(input: TransitionDeliveryStatusInput): Promise<ReservationNotificationRecord> {
    const existing = await this.repository.findById(input.notificationId);
    if (!existing) {
      throw new Error("Notification not found.");
    }

    if (!canTransitionDeliveryStatus(existing.status, input.toStatus)) {
      throw new Error("Invalid delivery status transition.");
    }

    if (existing.status === input.toStatus) {
      return existing;
    }

    const nowIso = this.nowProvider().toISOString();

    return this.repository.update(existing.id, {
      status: input.toStatus,
      sentAt: input.toStatus === "sent" ? nowIso : existing.sentAt,
      errorMessage: input.toStatus === "failed" ? input.errorMessage ?? "Delivery failed." : null,
    });
  }

  async recordReservationTransition(
    input: ReservationTransitionNotificationInput
  ): Promise<ReservationNotificationRecord | null> {
    const decision = resolveNotificationDecision(input);
    if (!decision) {
      return null;
    }

    const recipient =
      decision.audience === "guest"
        ? (input.current.guest.email.trim().length > 0 ? input.current.guest.email : `reservation:${input.current.token}`)
        : DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT;

    return this.createNotificationRecord({
      eventType: decision.eventType,
      templateKey: decision.templateKey,
      audience: decision.audience,
      channel: decision.channel,
      recipient,
      title: eventTitle(decision.eventType),
      body: null,
      payload: buildPayload(input),
      dedupeKey: createDedupeKey(input, decision.eventType),
      reservationId: input.current.id,
      reservationToken: input.current.token,
      paymentAttemptId: null,
    });
  }

  async onReservationTransition(input: ReservationTransitionNotificationInput): Promise<void> {
    await this.recordReservationTransition(input);
  }
}



