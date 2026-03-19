import { readBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type {
  AvailabilityRepository,
  AvailabilityRepositoryFlat,
  AvailabilityRepositoryReservation,
} from "./availability-service";

export class FileAvailabilityRepository implements AvailabilityRepository {
  async findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null> {
    const db = await readBookingDatabase();
    const flat = db.flats.find((entry) => entry.id === flatId);

    if (!flat) {
      return null;
    }

    return {
      id: flat.id,
      maxGuests: flat.maxGuests,
    };
  }

  async listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]> {
    const db = await readBookingDatabase();

    return db.reservations
      .filter((reservation) => reservation.stay.flatId === flatId)
      .map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        stay: {
          flatId: reservation.stay.flatId,
          checkIn: reservation.stay.checkIn,
          checkOut: reservation.stay.checkOut,
        },
      }));
  }
}

export const fileAvailabilityRepository = new FileAvailabilityRepository();
