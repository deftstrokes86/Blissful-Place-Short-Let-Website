import { prisma } from "../db/prisma";
import type { TourAppointmentRecord } from "../../types/booking-backend";
import type { TourSlotRepository } from "./tour-slot-service";

function mapFromPrisma(row: {
  id: string;
  date: Date;
  time: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): TourAppointmentRecord {
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone ?? null,
    status: row.status as TourAppointmentRecord["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaTourSlotRepository implements TourSlotRepository {
  async listAppointments(): Promise<TourAppointmentRecord[]> {
    const rows = await prisma.tourAppointment.findMany();
    return rows.map(mapFromPrisma);
  }

  async createAppointment(record: TourAppointmentRecord): Promise<TourAppointmentRecord> {
    // Check for conflicts before inserting.
    const conflict = await prisma.tourAppointment.findFirst({
      where: {
        date: new Date(record.date),
        time: record.time,
        status: "booked",
      },
    });

    if (conflict) {
      throw new Error("This tour slot is already booked.");
    }

    const created = await prisma.tourAppointment.create({
      data: {
        id: record.id,
        date: new Date(record.date),
        time: record.time,
        guestName: record.guestName,
        guestEmail: record.guestEmail,
        guestPhone: record.guestPhone ?? undefined,
        status: record.status,
      },
    });

    return mapFromPrisma(created);
  }
}

export const prismaTourSlotRepository = new PrismaTourSlotRepository();
