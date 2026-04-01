import type { ReservationNotificationRecord } from "../../types/booking-backend";
import { prismaNotificationRepository as bookingNotificationRepository } from "../booking/prisma-notification-repository";

export type NotificationRecord = ReservationNotificationRecord;

export interface NotificationRepository {
  create(input: Omit<NotificationRecord, "id" | "createdAt" | "updatedAt">): Promise<NotificationRecord>;
  update(id: string, patch: Partial<NotificationRecord>): Promise<NotificationRecord>;
  findById(id: string): Promise<NotificationRecord | null>;
  findByDedupeKey(dedupeKey: string): Promise<NotificationRecord | null>;
  listByReservationId(reservationId: string): Promise<NotificationRecord[]>;
}

export class FileNotificationRepositoryAdapter implements NotificationRepository {
  async create(input: Omit<NotificationRecord, "id" | "createdAt" | "updatedAt">): Promise<NotificationRecord> {
    return bookingNotificationRepository.create(input);
  }

  async update(id: string, patch: Partial<NotificationRecord>): Promise<NotificationRecord> {
    return bookingNotificationRepository.update(id, patch);
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return bookingNotificationRepository.findById(id);
  }

  async findByDedupeKey(dedupeKey: string): Promise<NotificationRecord | null> {
    return bookingNotificationRepository.findByDedupeKey(dedupeKey);
  }

  async listByReservationId(reservationId: string): Promise<NotificationRecord[]> {
    return bookingNotificationRepository.listByReservationId(reservationId);
  }
}

export const fileNotificationRepository = new FileNotificationRepositoryAdapter();

