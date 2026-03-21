import { getNotificationConfig } from "../../lib/notifications/notification-config";
import { DevEmailProvider } from "../notifications/delivery-providers/email-provider";
import { InternalLogProvider } from "../notifications/delivery-providers/internal-provider";
import { fileNotificationRepository } from "../notifications/notification-repository";
import { NotificationService } from "../notifications/notification-service";
import type { ReservationNotificationGateway } from "./notification-service";
import { ReservationTransitionNotificationGateway } from "./reservation-transition-notification-gateway";

let sharedNotificationGateway: ReservationNotificationGateway | null = null;

export function getSharedNotificationService(): ReservationNotificationGateway {
  if (sharedNotificationGateway) {
    return sharedNotificationGateway;
  }

  const config = getNotificationConfig();

  const notificationService = new NotificationService({
    repository: fileNotificationRepository,
    emailProvider: new DevEmailProvider(),
    internalProvider: new InternalLogProvider(),
    defaultSender: config.sender,
  });

  sharedNotificationGateway = new ReservationTransitionNotificationGateway({
    notificationService,
    staffRecipient: config.staffInternalRecipient,
    emailDeliveryEnabled: config.emailDeliveryEnabled,
  });

  return sharedNotificationGateway;
}
