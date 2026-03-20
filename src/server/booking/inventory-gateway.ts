import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { ReservationInventoryGateway } from "./reservation-service";
import { CalendarSyncService } from "./calendar-sync-service";
import { fileAvailabilityBlockRepository } from "./file-availability-block-repository";

function toCalendarSyncReservation(reservation: ReservationRepositoryReservation) {
  return {
    id: reservation.id,
    status: reservation.status,
    stay: {
      flatId: reservation.stay.flatId,
      checkIn: reservation.stay.checkIn,
      checkOut: reservation.stay.checkOut,
    },
    transferHoldExpiresAt: reservation.transferHoldExpiresAt,
  };
}

export class ReservationAvailabilityGateway implements ReservationInventoryGateway {
  private readonly calendarSyncService: CalendarSyncService;

  constructor(calendarSyncService?: CalendarSyncService) {
    this.calendarSyncService =
      calendarSyncService ??
      new CalendarSyncService({
        repository: fileAvailabilityBlockRepository,
      });
  }

  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    await this.calendarSyncService.syncFromReservation(toCalendarSyncReservation(reservation));
  }

  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
    // Explicit reopen side-effects are represented by released availability blocks.
  }
}

export class NoopReservationInventoryGateway implements ReservationInventoryGateway {
  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    void reservation;
  }

  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
  }
}
