import type { ReservationNotificationRecord } from "../../types/booking-backend";
import { fileNotificationRepository as bookingFileNotificationRepository } from "../booking/file-notification-repository";

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
    return bookingFileNotificationRepository.create(input);
  }

  async update(id: string, patch: Partial<NotificationRecord>): Promise<NotificationRecord> {
    return bookingFileNotificationRepository.update(id, patch);
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return bookingFileNotificationRepository.findById(id);
  }

  async findByDedupeKey(dedupeKey: string): Promise<NotificationRecord | null> {
    return bookingFileNotificationRepository.findByDedupeKey(dedupeKey);
  }

  async listByReservationId(reservationId: string): Promise<NotificationRecord[]> {
    return bookingFileNotificationRepository.listByReservationId(reservationId);
  }
}

export const fileNotificationRepository = new FileNotificationRepositoryAdapter();

