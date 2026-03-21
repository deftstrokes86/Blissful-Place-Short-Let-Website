import { readBookingDatabase } from "../db/file-database";
import type { ReservationNotificationRecord } from "../../types/booking-backend";

export interface AdminNotificationLogItem {
  id: string;
  eventType: string;
  audience: "guest" | "staff";
  channel: "email" | "internal";
  reservationId: string | null;
  reservationToken: string | null;
  status: "pending" | "sent" | "failed";
  title: string;
  summary: string;
  createdAt: string;
  sentAt: string | null;
  errorMessage: string | null;
}

export interface AdminNotificationsQueryRepository {
  listAllNotifications(): Promise<ReservationNotificationRecord[]>;
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return 100;
  }

  if (!Number.isInteger(value) || value < 1 || value > 200) {
    throw new Error("limit must be an integer between 1 and 200.");
  }

  return value;
}

function summarizeNotification(notification: ReservationNotificationRecord): string {
  const body = notification.body?.trim();
  if (body && body.length > 0) {
    return body;
  }

  return notification.title;
}

export class FileAdminNotificationsQueryRepository implements AdminNotificationsQueryRepository {
  async listAllNotifications(): Promise<ReservationNotificationRecord[]> {
    const db = await readBookingDatabase();

    return db.reservationNotifications.map((notification) => ({
      ...notification,
      payload: {
        ...notification.payload,
      },
    }));
  }
}

export class AdminNotificationsService {
  private readonly repository: AdminNotificationsQueryRepository;

  constructor(input: { repository: AdminNotificationsQueryRepository }) {
    this.repository = input.repository;
  }

  async listInternalNotifications(input?: { limit?: number }): Promise<AdminNotificationLogItem[]> {
    const limit = normalizeLimit(input?.limit);
    const notifications = await this.repository.listAllNotifications();

    return notifications
      .filter((notification) => notification.channel === "internal")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))
      .slice(0, limit)
      .map((notification) => ({
        id: notification.id,
        eventType: notification.eventType,
        audience: notification.audience,
        channel: notification.channel,
        reservationId: notification.reservationId,
        reservationToken: notification.reservationToken,
        status: notification.status,
        title: notification.title,
        summary: summarizeNotification(notification),
        createdAt: notification.createdAt,
        sentAt: notification.sentAt,
        errorMessage: notification.errorMessage,
      }));
  }
}

export const fileAdminNotificationsQueryRepository = new FileAdminNotificationsQueryRepository();
