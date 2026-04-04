import { getSharedAvailabilityService } from "./availability-service-factory";
import { getSharedDraftService } from "./draft-service-factory";
import { prismaWebsitePaymentIdempotencyGateway } from "./prisma-idempotency-service";
import { LegacyGuestReservationService } from "./legacy-guest-reservation-service";
import { getSharedReservationService } from "./reservation-service-factory";

let sharedLegacyGuestReservationService: LegacyGuestReservationService | null = null;

export function getSharedLegacyGuestReservationService(): LegacyGuestReservationService {
  if (sharedLegacyGuestReservationService) {
    return sharedLegacyGuestReservationService;
  }

  sharedLegacyGuestReservationService = new LegacyGuestReservationService({
    draftService: getSharedDraftService(),
    reservationService: getSharedReservationService(),
    availabilityService: getSharedAvailabilityService(),
    idempotencyGateway: prismaWebsitePaymentIdempotencyGateway,
  });

  return sharedLegacyGuestReservationService;
}
