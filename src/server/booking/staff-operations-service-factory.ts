import { prismaOperationsQueryRepository } from "./prisma-operations-query-repository";
import { prismaWebsitePaymentIdempotencyGateway } from "./prisma-idempotency-service";
import { getSharedOfflinePaymentService } from "./offline-payment-service-factory";
import { getSharedReservationService } from "./reservation-service-factory";
import { StaffOperationsService } from "./staff-operations-service";

let sharedStaffOperationsService: StaffOperationsService | null = null;

export function getSharedStaffOperationsService(): StaffOperationsService {
  if (sharedStaffOperationsService) {
    return sharedStaffOperationsService;
  }

  sharedStaffOperationsService = new StaffOperationsService({
    queryRepository: prismaOperationsQueryRepository,
    idempotencyGateway: prismaWebsitePaymentIdempotencyGateway,
    offlinePaymentService: getSharedOfflinePaymentService(),
    reservationService: getSharedReservationService(),
  });

  return sharedStaffOperationsService;
}
