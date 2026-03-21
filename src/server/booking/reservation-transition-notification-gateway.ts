import {
  DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT,
} from "../../lib/notifications/notification-config";
import { getEventsForStatus, type NotificationTemplateEventKey } from "../../lib/notifications/notification-events";
import type { NotificationAudience, NotificationChannel } from "../../types/booking-backend";
import type { NotificationService } from "../notifications/notification-service";
import type { ReservationTransitionNotificationInput, ReservationNotificationGateway } from "./notification-service";

type TransitionNotificationIntent = {
  event: NotificationTemplateEventKey;
  audience: NotificationAudience;
};

interface ReservationTransitionNotificationGatewayDependencies {
  notificationService: Pick<NotificationService, "createAndDeliverNotification">;
  staffRecipient?: string;
  emailDeliveryEnabled?: boolean;
}

function toTitleCase(value: string): string {
  if (value.trim().length === 0) {
    return "Selected Residence";
  }

  return value
    .split(/[-_\s]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1).toLowerCase()}`)
    .join(" ");
}

function buildGuestName(input: ReservationTransitionNotificationInput): string {
  const firstName = input.current.guest.firstName.trim();
  const lastName = input.current.guest.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? fullName : "Guest";
}

function resolveTransitionIntents(input: ReservationTransitionNotificationInput): TransitionNotificationIntent[] {
  if (input.previous.status === input.current.status) {
    return [];
  }

  if (input.event === "transfer_hold_expired") {
    return [
      { event: "reservation_expired", audience: "guest" },
      { event: "reservation_cancelled_staff_alert", audience: "staff" },
    ];
  }

  const intents: TransitionNotificationIntent[] = [];

  for (const event of getEventsForStatus(input.current.status, "guest")) {
    intents.push({ event, audience: "guest" });
  }

  for (const event of getEventsForStatus(input.current.status, "staff")) {
    intents.push({ event, audience: "staff" });
  }

  const uniqueIntents = new Map<string, TransitionNotificationIntent>();
  for (const intent of intents) {
    uniqueIntents.set(`${intent.audience}:${intent.event}`, intent);
  }

  return [...uniqueIntents.values()];
}

function createDedupeKey(intent: TransitionNotificationIntent, input: ReservationTransitionNotificationInput): string {
  return [
    "reservation-transition",
    input.current.id,
    intent.audience,
    intent.event,
    input.event,
    input.previous.status,
    input.current.status,
    input.current.updatedAt,
  ].join("|");
}

function resolveChannelAndRecipient(
  intent: TransitionNotificationIntent,
  input: ReservationTransitionNotificationInput,
  staffRecipient: string,
  emailDeliveryEnabled: boolean
): { channel: NotificationChannel; recipient: string } {
  if (intent.audience === "staff") {
    return {
      channel: "internal",
      recipient: staffRecipient,
    };
  }

  const guestEmail = input.current.guest.email.trim();
  if (emailDeliveryEnabled && guestEmail.length > 0) {
    return {
      channel: "email",
      recipient: guestEmail,
    };
  }

  return {
    channel: "internal",
    recipient: `reservation:${input.current.token}`,
  };
}

export class ReservationTransitionNotificationGateway implements ReservationNotificationGateway {
  private readonly notificationService: Pick<NotificationService, "createAndDeliverNotification">;
  private readonly staffRecipient: string;
  private readonly emailDeliveryEnabled: boolean;

  constructor(dependencies: ReservationTransitionNotificationGatewayDependencies) {
    this.notificationService = dependencies.notificationService;
    this.staffRecipient = dependencies.staffRecipient ?? DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT;
    this.emailDeliveryEnabled = dependencies.emailDeliveryEnabled ?? false;
  }

  async onReservationTransition(input: ReservationTransitionNotificationInput): Promise<void> {
    const intents = resolveTransitionIntents(input);

    for (const intent of intents) {
      const dispatch = resolveChannelAndRecipient(
        intent,
        input,
        this.staffRecipient,
        this.emailDeliveryEnabled
      );

      await this.notificationService.createAndDeliverNotification({
        event: intent.event,
        channel: dispatch.channel,
        recipient: dispatch.recipient,
        dedupeKey: createDedupeKey(intent, input),
        templateContext: {
          reservationToken: input.current.token,
          guestName: buildGuestName(input),
          flatLabel: toTitleCase(input.current.stay.flatId),
          checkIn: input.current.stay.checkIn,
          checkOut: input.current.stay.checkOut,
          holdExpiresAt: input.current.transferHoldExpiresAt ?? undefined,
        },
        payloadMetadata: {
          previousStatus: input.previous.status,
          currentStatus: input.current.status,
          transitionEvent: input.event,
          actor: input.actor,
          paymentMethod: input.current.paymentMethod,
          ...(input.metadata ?? {}),
        },
        reservationId: input.current.id,
        reservationToken: input.current.token,
        paymentAttemptId: null,
      });
    }
  }
}
