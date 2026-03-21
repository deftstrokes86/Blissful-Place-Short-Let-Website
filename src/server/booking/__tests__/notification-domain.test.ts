import assert from "node:assert/strict";

import type { NotificationCreateInput, NotificationRepository } from "../notification-service";
import { NotificationService } from "../notification-service";
import type { ReservationNotificationRecord } from "../../../types/booking-backend";

class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications: ReservationNotificationRecord[] = [];

  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    const now = "2026-08-01T10:00:00.000Z";
    const created: ReservationNotificationRecord = {
      ...input,
      id: `ntf_${this.notifications.length + 1}`,
      createdAt: now,
      updatedAt: now,
    };

    this.notifications.push(created);
    return { ...created };
  }

  async update(
    id: string,
    patch: Partial<ReservationNotificationRecord>
  ): Promise<ReservationNotificationRecord> {
    const index = this.notifications.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Notification not found.");
    }

    const updated: ReservationNotificationRecord = {
      ...this.notifications[index],
      ...patch,
      id: this.notifications[index].id,
      updatedAt: "2026-08-01T10:10:00.000Z",
    };

    this.notifications[index] = updated;
    return { ...updated };
  }

  async findById(id: string): Promise<ReservationNotificationRecord | null> {
    const found = this.notifications.find((item) => item.id === id);
    return found ? { ...found } : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<ReservationNotificationRecord | null> {
    const found = this.notifications.find((item) => item.dedupeKey === dedupeKey);
    return found ? { ...found } : null;
  }

  async listByReservationId(reservationId: string): Promise<ReservationNotificationRecord[]> {
    return this.notifications
      .filter((item) => item.reservationId === reservationId)
      .map((item) => ({ ...item }));
  }
}

function createBaseInput(overrides?: Partial<NotificationCreateInput>): NotificationCreateInput {
  return {
    eventType: "reservation_request_received",
    templateKey: "reservation_request_received",
    audience: "guest",
    channel: "email",
    recipient: "ada@example.com",
    title: "Reservation Request Received",
    body: "We have received your reservation request.",
    payload: {
      reservationToken: "token_1",
    },
    dedupeKey: "dedupe-reservation-request-1",
    reservationId: "res_1",
    reservationToken: "token_1",
    paymentAttemptId: null,
    ...overrides,
  };
}

async function testCreateNotificationRecord(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const created = await service.createNotificationRecord(createBaseInput());

  assert.equal(created.eventType, "reservation_request_received");
  assert.equal(created.channel, "email");
  assert.equal(created.status, "pending");
  assert.equal(created.recipient, "ada@example.com");
  assert.equal(created.reservationId, "res_1");
}

async function testAllowedEventTypeChannelCombinations(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const staffInternal = await service.createNotificationRecord(
    createBaseInput({
      eventType: "staff_transfer_pending_created",
      templateKey: "staff_transfer_pending_created",
      audience: "staff",
      channel: "internal",
      recipient: "ops:transfer-queue",
      title: "New Pending Transfer Reservation",
      dedupeKey: "dedupe-staff-transfer-1",
      body: null,
    })
  );

  assert.equal(staffInternal.channel, "internal");

  await assert.rejects(
    async () => {
      await service.createNotificationRecord(
        createBaseInput({
          eventType: "staff_transfer_pending_created",
          templateKey: "staff_transfer_pending_created",
          audience: "staff",
          channel: "email",
          recipient: "staff@example.com",
          dedupeKey: "dedupe-invalid-staff-email",
        })
      );
    },
    /channel/i
  );
}

async function testValidDeliveryStatusTransitions(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const created = await service.createNotificationRecord(createBaseInput({ dedupeKey: "dedupe-status-1" }));

  const sent = await service.transitionDeliveryStatus({
    notificationId: created.id,
    toStatus: "sent",
  });

  assert.equal(sent.status, "sent");
  assert.ok(sent.sentAt !== null);

  await assert.rejects(
    async () => {
      await service.transitionDeliveryStatus({
        notificationId: created.id,
        toStatus: "failed",
        errorMessage: "Provider timeout",
      });
    },
    /transition/i
  );
}

async function testIdempotentCreationByDedupeKey(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const first = await service.createNotificationRecord(createBaseInput({ dedupeKey: "dedupe-unique-1" }));
  const second = await service.createNotificationRecord(createBaseInput({ dedupeKey: "dedupe-unique-1" }));

  assert.equal(first.id, second.id);

  const linked = await repository.listByReservationId("res_1");
  assert.equal(linked.length, 1);
}

async function testLinksNotificationToReservationWhenProvided(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  await service.createNotificationRecord(
    createBaseInput({
      dedupeKey: "dedupe-link-1",
      reservationId: "res_linked",
      reservationToken: "token_linked",
    })
  );

  const linked = await repository.listByReservationId("res_linked");
  assert.equal(linked.length, 1);
  assert.equal(linked[0].reservationToken, "token_linked");
}

async function run(): Promise<void> {
  await testCreateNotificationRecord();
  await testAllowedEventTypeChannelCombinations();
  await testValidDeliveryStatusTransitions();
  await testIdempotentCreationByDedupeKey();
  await testLinksNotificationToReservationWhenProvided();

  console.log("notification-domain: ok");
}

void run();
