import type { BookingToken, ExtraId, FlatId } from "../../types/booking";
import type { ReservationRecord } from "../../types/booking-backend";

export interface ReservationRepositoryFlat {
  id: FlatId;
  nightlyRate: number;
}

export interface ReservationRepositoryExtra {
  id: ExtraId;
  flatFee: number;
}

export type ReservationRepositoryReservation = ReservationRecord;

export interface ReservationRepository {
  create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation>;
  update(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation>;
  findByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null>;
  listTransferHoldExpiringBefore(beforeIso: string): Promise<ReservationRepositoryReservation[]>;
  findFlatById(flatId: FlatId): Promise<ReservationRepositoryFlat | null>;
  listExtras(): Promise<readonly ReservationRepositoryExtra[]>;
}
