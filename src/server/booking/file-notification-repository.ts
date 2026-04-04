// LEGACY FILE-DB BOUNDARY:
// This repository persists booking data to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { createDatabaseId, readBookingDatabase, withBookingDatabase } from "../db/file-database";
import { nowIso } from "../db/db-utils";
import type { ReservationNotificationRecord } from "../../types/booking-backend";
import type { NotificationRepository } from "./notification-service";

function cloneNotification(notification: ReservationNotificationRecord): ReservationNotificationRecord {
  return {
    ...notification,
    payload: {
      ...notification.payload,
    },
  };
}

export class FileNotificationRepository implements NotificationRepository {
  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    return withBookingDatabase(async (db) => {
      const createdAt = nowIso();
      const notification: ReservationNotificationRecord = {
        id: createDatabaseId("ntf"),
        createdAt,
        updatedAt: createdAt,
        ...input,
        payload: {
          ...input.payload,
        },
      };

      db.reservationNotifications.push(notification);
      return cloneNotification(notification);
    });
  }

  async update(id: string, patch: Partial<ReservationNotificationRecord>): Promise<ReservationNotificationRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.reservationNotifications.findIndex((notification) => notification.id === id);
      if (index < 0) {
        throw new Error("Notification not found.");
      }

      const existing = db.reservationNotifications[index];
      const updated: ReservationNotificationRecord = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: nowIso(),
        payload: {
          ...(patch.payload ?? existing.payload),
        },
      };

      db.reservationNotifications[index] = updated;
      return cloneNotification(updated);
    });
  }

  async findById(id: string): Promise<ReservationNotificationRecord | null> {
    const db = await readBookingDatabase();
    const found = db.reservationNotifications.find((notification) => notification.id === id);

    return found ? cloneNotification(found) : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<ReservationNotificationRecord | null> {
    const db = await readBookingDatabase();
    const found = db.reservationNotifications.find((notification) => notification.dedupeKey === dedupeKey);

    return found ? cloneNotification(found) : null;
  }

  async listByReservationId(reservationId: string): Promise<ReservationNotificationRecord[]> {
    const db = await readBookingDatabase();

    return db.reservationNotifications
      .filter((notification) => notification.reservationId === reservationId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map(cloneNotification);
  }
}

export const fileNotificationRepository = new FileNotificationRepository();

