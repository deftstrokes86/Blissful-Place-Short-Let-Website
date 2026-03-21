import { ReservationAvailabilityGateway } from "./inventory-gateway";
import { fileReservationRepository } from "./file-reservation-repository";
import { getSharedNotificationService } from "./notification-service-factory";
import { ReservationService } from "./reservation-service";

let sharedReservationService: ReservationService | null = null;

export function getSharedReservationService(): ReservationService {
  if (sharedReservationService) {
    return sharedReservationService;
  }

  sharedReservationService = new ReservationService({
    repository: fileReservationRepository,
    inventoryGateway: new ReservationAvailabilityGateway(),
    notificationGateway: getSharedNotificationService(),
  });

  return sharedReservationService;
}

