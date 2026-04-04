// LEGACY FILE-DB BOUNDARY:
// This repository persists booking data to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { readBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type { FlatReadinessRecord } from "../../types/booking-backend";
import type {
  AvailabilityRepository,
  AvailabilityRepositoryBlock,
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

  async listAvailabilityBlocksByFlat(flatId: FlatId): Promise<AvailabilityRepositoryBlock[]> {
    const db = await readBookingDatabase();

    return db.availabilityBlocks
      .filter((block) => block.flatId === flatId)
      .map((block) => ({
        id: block.id,
        flatId: block.flatId,
        sourceType: block.sourceType,
        sourceId: block.sourceId,
        blockType: block.blockType,
        startDate: block.startDate,
        endDate: block.endDate,
        status: block.status,
        expiresAt: block.expiresAt,
      }));
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const db = await readBookingDatabase();
    const record = db.flatReadiness.find((entry) => entry.flatId === flatId);

    if (!record) {
      return null;
    }

    return {
      ...record,
    };
  }
}

export const fileAvailabilityRepository = new FileAvailabilityRepository();

