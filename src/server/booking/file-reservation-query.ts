// LEGACY FILE-DB BOUNDARY:
// This repository persists booking data to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { readBookingDatabase } from "../db/file-database";
import type { ReservationRepositoryReservation } from "./reservation-repository";

function cloneReservation(value: ReservationRepositoryReservation): ReservationRepositoryReservation {
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

export interface WebsitePaymentReservationQuery {
  findById(reservationId: string): Promise<ReservationRepositoryReservation | null>;
}

export class FileWebsitePaymentReservationQuery implements WebsitePaymentReservationQuery {
  async findById(reservationId: string): Promise<ReservationRepositoryReservation | null> {
    const db = await readBookingDatabase();
    const found = db.reservations.find((reservation) => reservation.id === reservationId);

    return found ? cloneReservation(found) : null;
  }
}

export const fileWebsitePaymentReservationQuery = new FileWebsitePaymentReservationQuery();

