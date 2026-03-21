import type { NotificationTemplateEventKey } from "../../../lib/notifications/notification-events";

export interface InternalDeliveryMessage {
  notificationId: string;
  event: NotificationTemplateEventKey;
  recipient: string;
  subject: string;
  body: string;
}

export interface InternalProvider {
  deliver(message: InternalDeliveryMessage): Promise<void>;
}

export class InternalLogProvider implements InternalProvider {
  private readonly shouldFail: boolean;
  private readonly sink: ((message: InternalDeliveryMessage) => void) | null;

  constructor(options?: { shouldFail?: boolean; sink?: (message: InternalDeliveryMessage) => void }) {
    this.shouldFail = options?.shouldFail ?? false;
    this.sink = options?.sink ?? null;
  }

  async deliver(message: InternalDeliveryMessage): Promise<void> {
    if (this.shouldFail) {
      throw new Error("Internal notification log delivery failed.");
    }

    this.sink?.(message);
  }
}


