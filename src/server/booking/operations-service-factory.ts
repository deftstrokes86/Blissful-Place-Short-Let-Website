import { createDatabaseId } from "../db/file-database";
import { fileAvailabilityBlockRepository } from "./file-availability-block-repository";
import { fileOperationsQueryRepository } from "./file-operations-query-repository";
import { fileWebsitePaymentIdempotencyGateway } from "./idempotency-service";
import { getSharedOfflinePaymentService } from "./offline-payment-service-factory";
import { OperationsService } from "./operations-service";
import { getSharedReservationService } from "./reservation-service-factory";

let sharedOperationsService: OperationsService | null = null;

export function getSharedOperationsService(): OperationsService {
  if (sharedOperationsService) {
    return sharedOperationsService;
  }

  sharedOperationsService = new OperationsService({
    queryRepository: fileOperationsQueryRepository,
    availabilityBlockRepository: fileAvailabilityBlockRepository,
    idempotencyGateway: fileWebsitePaymentIdempotencyGateway,
    offlinePaymentService: getSharedOfflinePaymentService(),
    reservationService: getSharedReservationService(),
    createId: () => createDatabaseId("manual"),
  });

  return sharedOperationsService;
}
