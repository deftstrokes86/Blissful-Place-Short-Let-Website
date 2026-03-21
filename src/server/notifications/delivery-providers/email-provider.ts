import type { NotificationTemplateEventKey } from "../../../lib/notifications/notification-events";

export interface EmailDeliveryMessage {
  notificationId: string;
  event: NotificationTemplateEventKey;
  recipient: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
}

export interface EmailProvider {
  deliver(message: EmailDeliveryMessage): Promise<{ providerMessageId: string | null }>;
}

export class DevEmailProvider implements EmailProvider {
  private readonly shouldFail: boolean;
  private readonly sink: ((message: EmailDeliveryMessage) => void) | null;

  constructor(options?: { shouldFail?: boolean; sink?: (message: EmailDeliveryMessage) => void }) {
    this.shouldFail = options?.shouldFail ?? false;
    this.sink = options?.sink ?? null;
  }

  async deliver(message: EmailDeliveryMessage): Promise<{ providerMessageId: string | null }> {
    if (this.shouldFail) {
      throw new Error("Email delivery failed in dev provider.");
    }

    this.sink?.(message);
    return {
      providerMessageId: null,
    };
  }
}
