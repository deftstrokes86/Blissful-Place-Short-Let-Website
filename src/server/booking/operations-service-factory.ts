import { createDatabaseId } from "../db/database-identifiers";
import { prismaAvailabilityBlockRepository } from "./prisma-availability-block-repository";
import { prismaOperationsQueryRepository } from "./prisma-operations-query-repository";
import { prismaWebsitePaymentIdempotencyGateway } from "./prisma-idempotency-service";
import { getSharedOfflinePaymentService } from "./offline-payment-service-factory";
import { OperationsService } from "./operations-service";
import { getSharedReservationService } from "./reservation-service-factory";

let sharedOperationsService: OperationsService | null = null;

export function getSharedOperationsService(): OperationsService {
  if (sharedOperationsService) {
    return sharedOperationsService;
  }

  sharedOperationsService = new OperationsService({
    queryRepository: prismaOperationsQueryRepository,
    availabilityBlockRepository: prismaAvailabilityBlockRepository,
    idempotencyGateway: prismaWebsitePaymentIdempotencyGateway,
    offlinePaymentService: getSharedOfflinePaymentService(),
    reservationService: getSharedReservationService(),
    createId: () => createDatabaseId("manual"),
  });

  return sharedOperationsService;
}

