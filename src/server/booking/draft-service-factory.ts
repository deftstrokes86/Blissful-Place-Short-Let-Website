import { DraftService } from "./draft-service";
import { getSharedReservationService } from "./reservation-service-factory";

let sharedDraftService: DraftService | null = null;

export function getSharedDraftService(): DraftService {
  if (sharedDraftService) {
    return sharedDraftService;
  }

  sharedDraftService = new DraftService({
    reservationService: getSharedReservationService(),
  });

  return sharedDraftService;
}
