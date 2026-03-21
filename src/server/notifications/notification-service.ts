import { DEFAULT_NOTIFICATION_SENDER } from "../../lib/notifications/notification-config";
import {
  renderNotificationTemplate,
  type NotificationTemplateContext,
} from "../../lib/notifications/notification-templates";
import {
  NOTIFICATION_EVENT_DEFINITIONS,
  type NotificationTemplateEventKey,
} from "../../lib/notifications/notification-events";
import type { NotificationChannel, ReservationNotificationRecord } from "../../types/booking-backend";
import type { EmailProvider } from "./delivery-providers/email-provider";
import type { InternalProvider } from "./delivery-providers/internal-provider";
import type { NotificationRepository } from "./notification-repository";

export interface NotificationSender {
  name: string;
  email: string;
}

export interface CreateNotificationIntentInput {
  event: NotificationTemplateEventKey;
  channel: NotificationChannel;
  recipient: string;
  dedupeKey: string;
  templateContext: NotificationTemplateContext;
  payloadMetadata?: Record<string, string | number | boolean | null>;
  reservationId?: string | null;
  reservationToken?: string | null;
  paymentAttemptId?: string | null;
}

interface NotificationServiceDependencies {
  repository: NotificationRepository;
  emailProvider: EmailProvider;
  internalProvider: InternalProvider;
  defaultSender?: NotificationSender;
  now?: () => Date;
}

function toNullableString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deriveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Notification delivery failed.";
}

function normalizeTemplateContext(
  context: NotificationTemplateContext
): Record<string, string | number | boolean | null> {
  return {
    reservationToken: context.reservationToken ?? null,
    guestName: context.guestName ?? null,
    flatLabel: context.flatLabel ?? null,
    checkIn: context.checkIn ?? null,
    checkOut: context.checkOut ?? null,
    holdExpiresAt: context.holdExpiresAt ?? null,
  };
}

function mergePayloadMetadata(
  context: NotificationTemplateContext,
  metadata?: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  return {
    ...normalizeTemplateContext(context),
    ...(metadata ?? {}),
  };
}

function normalizeSender(value: NotificationSender | undefined): NotificationSender {
  if (!value) {
    return DEFAULT_NOTIFICATION_SENDER;
  }

  const name = value.name.trim();
  const email = value.email.trim();

  return {
    name: name.length > 0 ? name : DEFAULT_NOTIFICATION_SENDER.name,
    email: email.length > 0 ? email : DEFAULT_NOTIFICATION_SENDER.email,
  };
}

export class NotificationService {
  private readonly repository: NotificationRepository;
  private readonly emailProvider: EmailProvider;
  private readonly internalProvider: InternalProvider;
  private readonly defaultSender: NotificationSender;
  private readonly nowProvider: () => Date;

  constructor(dependencies: NotificationServiceDependencies) {
    this.repository = dependencies.repository;
    this.emailProvider = dependencies.emailProvider;
    this.internalProvider = dependencies.internalProvider;
    this.defaultSender = normalizeSender(dependencies.defaultSender);
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async createNotificationIntent(input: CreateNotificationIntentInput): Promise<ReservationNotificationRecord> {
    if (input.dedupeKey.trim().length === 0) {
      throw new Error("Notification dedupe key is required.");
    }

    if (input.recipient.trim().length === 0) {
      throw new Error("Notification recipient is required.");
    }

    const existing = await this.repository.findByDedupeKey(input.dedupeKey);
    if (existing) {
      return existing;
    }

    const definition = NOTIFICATION_EVENT_DEFINITIONS[input.event];
    if (!definition.allowedChannels.includes(input.channel)) {
      throw new Error("Channel is not allowed for this notification event.");
    }

    const rendered = renderNotificationTemplate({
      event: input.event,
      channel: input.channel,
      context: input.templateContext,
    });

    return this.repository.create({
      eventType: input.event,
      templateKey: input.event,
      audience: definition.audience,
      channel: input.channel,
      recipient: input.recipient,
      title: rendered.subject,
      body: rendered.body,
      templateRef: `template:${input.event}`,
      status: "pending",
      dedupeKey: input.dedupeKey,
      payload: mergePayloadMetadata(input.templateContext, input.payloadMetadata),
      reservationId: input.reservationId ?? null,
      reservationToken: toNullableString(input.reservationToken),
      paymentAttemptId: toNullableString(input.paymentAttemptId),
      errorMessage: null,
      sentAt: null,
    });
  }

  async deliverNotification(notificationId: string): Promise<ReservationNotificationRecord> {
    const notification = await this.repository.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found.");
    }

    if (notification.status === "sent") {
      return notification;
    }

    try {
      if (notification.channel === "email") {
        await this.emailProvider.deliver({
          notificationId: notification.id,
          event: notification.eventType as NotificationTemplateEventKey,
          recipient: notification.recipient,
          senderName: this.defaultSender.name,
          senderEmail: this.defaultSender.email,
          subject: notification.title,
          body: notification.body ?? "",
        });
      } else if (notification.channel === "internal") {
        await this.internalProvider.deliver({
          notificationId: notification.id,
          event: notification.eventType as NotificationTemplateEventKey,
          recipient: notification.recipient,
          subject: notification.title,
          body: notification.body ?? "",
        });
      } else {
        throw new Error("Unsupported notification channel.");
      }

      return this.repository.update(notification.id, {
        status: "sent",
        sentAt: this.nowProvider().toISOString(),
        errorMessage: null,
      });
    } catch (error) {
      return this.repository.update(notification.id, {
        status: "failed",
        errorMessage: deriveErrorMessage(error),
      });
    }
  }

  async createAndDeliverNotification(input: CreateNotificationIntentInput): Promise<ReservationNotificationRecord> {
    const intent = await this.createNotificationIntent(input);

    if (intent.status !== "pending") {
      return intent;
    }

    return this.deliverNotification(intent.id);
  }
}
