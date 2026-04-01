import type { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import type { ReservationNotificationRecord } from "../../types/booking-backend";
import type { NotificationRepository } from "./notification-service";

function mapFromPrisma(row: {
  id: string;
  eventType: string;
  templateKey: string;
  audience: string;
  channel: string;
  recipient: string;
  title: string;
  body: string | null;
  templateRef: string | null;
  status: string;
  dedupeKey: string;
  payload: Prisma.JsonValue;
  reservationId: string | null;
  reservationToken: string | null;
  paymentAttemptId: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReservationNotificationRecord {
  return {
    id: row.id,
    eventType: row.eventType as ReservationNotificationRecord["eventType"],
    templateKey: row.templateKey as ReservationNotificationRecord["templateKey"],
    audience: row.audience as ReservationNotificationRecord["audience"],
    channel: row.channel as ReservationNotificationRecord["channel"],
    recipient: row.recipient,
    title: row.title,
    body: row.body ?? null,
    templateRef: row.templateRef ?? null,
    status: row.status as ReservationNotificationRecord["status"],
    dedupeKey: row.dedupeKey,
    payload: row.payload as ReservationNotificationRecord["payload"],
    reservationId: row.reservationId ?? null,
    reservationToken: row.reservationToken ?? null,
    paymentAttemptId: row.paymentAttemptId ?? null,
    errorMessage: row.errorMessage ?? null,
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    const created = await prisma.reservationNotification.create({
      data: {
        eventType: input.eventType,
        templateKey: input.templateKey,
        audience: input.audience,
        channel: input.channel,
        recipient: input.recipient,
        title: input.title,
        body: input.body ?? undefined,
        templateRef: input.templateRef ?? undefined,
        status: input.status,
        dedupeKey: input.dedupeKey,
        payload: input.payload as Prisma.InputJsonValue,
        reservationId: input.reservationId ?? undefined,
        reservationToken: input.reservationToken ?? undefined,
        paymentAttemptId: input.paymentAttemptId ?? undefined,
        errorMessage: input.errorMessage ?? undefined,
        sentAt: input.sentAt ? new Date(input.sentAt) : undefined,
      },
    });

    return mapFromPrisma(created);
  }

  async update(
    id: string,
    patch: Partial<ReservationNotificationRecord>
  ): Promise<ReservationNotificationRecord> {
    const data: Prisma.ReservationNotificationUpdateInput = {};

    if (patch.status !== undefined) data.status = patch.status;
    if (patch.errorMessage !== undefined) data.errorMessage = patch.errorMessage;
    if (patch.sentAt !== undefined) data.sentAt = patch.sentAt ? new Date(patch.sentAt) : null;
    if (patch.payload !== undefined) data.payload = patch.payload as Prisma.InputJsonValue;

    const updated = await prisma.reservationNotification.update({ where: { id }, data });
    return mapFromPrisma(updated);
  }

  async findById(id: string): Promise<ReservationNotificationRecord | null> {
    const found = await prisma.reservationNotification.findUnique({ where: { id } });
    return found ? mapFromPrisma(found) : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<ReservationNotificationRecord | null> {
    const found = await prisma.reservationNotification.findUnique({ where: { dedupeKey } });
    return found ? mapFromPrisma(found) : null;
  }

  async listByReservationId(reservationId: string): Promise<ReservationNotificationRecord[]> {
    const rows = await prisma.reservationNotification.findMany({
      where: { reservationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return rows.map(mapFromPrisma);
  }
}

export const prismaNotificationRepository = new PrismaNotificationRepository();
