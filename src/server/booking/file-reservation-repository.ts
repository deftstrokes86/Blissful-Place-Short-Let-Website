import { readBookingDatabase, withBookingDatabase } from "../db/file-database";
import type { BookingToken, FlatId, ReservationStatus } from "../../types/booking";
import type { ExtraId } from "../../types/booking";
import type { ReservationRecord } from "../../types/booking-backend";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "./reservation-repository";

function cloneReservation(value: ReservationRecord): ReservationRepositoryReservation {
  return {
    ...value,
    stay: {
      ...value.stay,
      extraIds: [...value.stay.extraIds],
    },
    guest: {
      ...value.guest,
    },
    pricing: {
      ...value.pricing,
    },
  };
}

function isTransferHoldCandidate(status: ReservationStatus): boolean {
  return status === "pending_transfer_submission" || status === "awaiting_transfer_verification";
}

export class FileReservationRepository implements ReservationRepository {
  async create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    return withBookingDatabase(async (db) => {
      const created = cloneReservation(reservation);
      db.reservations.push(created);
      return cloneReservation(created);
    });
  }

  async update(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    return withBookingDatabase(async (db) => {
      const index = db.reservations.findIndex((item) => item.token === reservation.token);
      if (index < 0) {
        throw new Error("Reservation not found.");
      }

      const updated = cloneReservation(reservation);
      db.reservations[index] = updated;

      return cloneReservation(updated);
    });
  }

  async findByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    const db = await readBookingDatabase();
    const found = db.reservations.find((item) => item.token === token);
    return found ? cloneReservation(found) : null;
  }

  async listTransferHoldExpiringBefore(beforeIso: string): Promise<ReservationRepositoryReservation[]> {
    const beforeMs = new Date(beforeIso).getTime();
    const db = await readBookingDatabase();

    return db.reservations
      .filter((reservation) => {
        if (!isTransferHoldCandidate(reservation.status)) {
          return false;
        }

        if (!reservation.transferHoldExpiresAt) {
          return false;
        }

        return new Date(reservation.transferHoldExpiresAt).getTime() < beforeMs;
      })
      .map(cloneReservation);
  }

  async findFlatById(flatId: FlatId): Promise<ReservationRepositoryFlat | null> {
    const db = await readBookingDatabase();
    const flat = db.flats.find((item) => item.id === flatId);

    return flat
      ? {
          id: flat.id,
          nightlyRate: flat.nightlyRate,
        }
      : null;
  }

  async listExtras(): Promise<readonly { id: ExtraId; flatFee: number }[]> {
    const db = await readBookingDatabase();
    return db.extras.map((extra) => ({
      id: extra.id,
      flatFee: extra.flatFee,
    }));
  }
}

export const fileReservationRepository = new FileReservationRepository();
