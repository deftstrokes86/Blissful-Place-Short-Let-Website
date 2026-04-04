import type { ReservationRepositoryReservation } from "../booking/reservation-repository";
import type { ReservationService } from "../booking/reservation-service";

interface ExpireTransferHoldsJobDependencies {
  reservationService: Pick<ReservationService, "expireTransferHolds">;
  now?: () => Date;
}

export interface ExpireTransferHoldsJobResult {
  checkedAt: string;
  expiredCount: number;
  expiredReservationIds: string[];
  reservations: ReservationRepositoryReservation[];
}

export class ExpireTransferHoldsJob {
  private readonly reservationService: ExpireTransferHoldsJobDependencies["reservationService"];
  private readonly nowProvider: () => Date;

  constructor(dependencies: ExpireTransferHoldsJobDependencies) {
    this.reservationService = dependencies.reservationService;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async run(): Promise<ExpireTransferHoldsJobResult> {
    const checkedAt = this.nowProvider().toISOString();
    const reservations = await this.reservationService.expireTransferHolds();

    return {
      checkedAt,
      expiredCount: reservations.length,
      expiredReservationIds: reservations.map((reservation) => reservation.id),
      reservations,
    };
  }
}

async function createRuntimeReservationService(now: Date): Promise<ReservationService> {
  const [{ ReservationAvailabilityGateway }, { getSharedNotificationService }, { prismaReservationRepository }, { ReservationService }] =
    await Promise.all([
      import("../booking/inventory-gateway"),
      import("../booking/notification-service-factory"),
      import("../booking/prisma-reservation-repository"),
      import("../booking/reservation-service"),
    ]);

  return new ReservationService({
    repository: prismaReservationRepository,
    inventoryGateway: new ReservationAvailabilityGateway(),
    notificationGateway: getSharedNotificationService(),
    now: () => now,
  });
}

export async function runTransferHoldExpiryJob(nowMs: number = Date.now()): Promise<ExpireTransferHoldsJobResult> {
  const fixedNow = new Date(nowMs);
  const reservationService = await createRuntimeReservationService(fixedNow);

  const job = new ExpireTransferHoldsJob({
    reservationService,
    now: () => fixedNow,
  });

  return job.run();
}
