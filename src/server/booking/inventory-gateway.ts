import type { ReservationInventoryGateway } from "./reservation-service";

export class NoopReservationInventoryGateway implements ReservationInventoryGateway {
  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
    // Inventory reopen integration will be added once inventory persistence is introduced.
  }
}
