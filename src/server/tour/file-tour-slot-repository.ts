// LEGACY FILE-DB BOUNDARY:
// This repository persists tour appointments to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { readBookingDatabase, withBookingDatabase } from "../db/file-database";
import type { TourAppointmentRecord } from "../../types/booking-backend";
import type { TourSlotRepository } from "./tour-slot-service";

function cloneAppointment(record: TourAppointmentRecord): TourAppointmentRecord {
  return { ...record };
}

export class FileTourSlotRepository implements TourSlotRepository {
  async listAppointments(): Promise<TourAppointmentRecord[]> {
    const db = await readBookingDatabase();
    return (db.tourAppointments ?? []).map(cloneAppointment);
  }

  async createAppointment(record: TourAppointmentRecord): Promise<TourAppointmentRecord> {
    return withBookingDatabase(async (db) => {
      if (!db.tourAppointments) {
        db.tourAppointments = [];
      }

      const alreadyBooked = db.tourAppointments.some((entry) => {
        return entry.status === "booked" && entry.date === record.date && entry.time === record.time;
      });

      if (alreadyBooked) {
        throw new Error("This tour slot is already booked.");
      }

      db.tourAppointments.push(cloneAppointment(record));
      return cloneAppointment(record);
    });
  }
}

export const fileTourSlotRepository = new FileTourSlotRepository();


