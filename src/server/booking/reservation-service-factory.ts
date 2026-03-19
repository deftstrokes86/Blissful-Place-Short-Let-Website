import { NoopReservationInventoryGateway } from "./inventory-gateway";
import { fileReservationRepository } from "./file-reservation-repository";
import { ReservationService } from "./reservation-service";

let sharedReservationService: ReservationService | null = null;

export function getSharedReservationService(): ReservationService {
  if (sharedReservationService) {
    return sharedReservationService;
  }

  sharedReservationService = new ReservationService({
    repository: fileReservationRepository,
    inventoryGateway: new NoopReservationInventoryGateway(),
  });

  return sharedReservationService;
}
