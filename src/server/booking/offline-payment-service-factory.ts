import type { PaymentMethod } from "../../types/booking";
import type { AvailabilityCheckResult } from "./availability-service";
import { getSharedAvailabilityService } from "./availability-service-factory";
import { prismaOfflinePaymentMetadataRepository } from "./prisma-offline-payment-metadata-repository";
import {
  OfflinePaymentService,
  type OfflinePaymentAvailabilityGateway,
} from "./offline-payment-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import { getSharedReservationService } from "./reservation-service-factory";

class SharedOfflineAvailabilityGateway implements OfflinePaymentAvailabilityGateway {
  async checkPreHoldReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: PaymentMethod
  ): Promise<AvailabilityCheckResult> {
    return getSharedAvailabilityService().runPreHoldRecheck(reservation.stay, paymentMethod, reservation.id);
  }

  async checkPreConfirmationReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: "transfer" | "pos"
  ): Promise<AvailabilityCheckResult> {
    return getSharedAvailabilityService().runPreConfirmationRecheck(
      reservation.stay,
      paymentMethod,
      reservation.id
    );
  }
}

let sharedOfflinePaymentService: OfflinePaymentService | null = null;

export function getSharedOfflinePaymentService(): OfflinePaymentService {
  if (sharedOfflinePaymentService) {
    return sharedOfflinePaymentService;
  }

  sharedOfflinePaymentService = new OfflinePaymentService({
    reservationService: getSharedReservationService(),
    metadataRepository: prismaOfflinePaymentMetadataRepository,
    availabilityGateway: new SharedOfflineAvailabilityGateway(),
  });

  return sharedOfflinePaymentService;
}
