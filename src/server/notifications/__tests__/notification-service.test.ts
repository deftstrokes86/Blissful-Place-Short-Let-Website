import assert from "node:assert/strict";

import type { NotificationTemplateEventKey } from "../../../lib/notifications/notification-events";
import type { ReservationNotificationRecord } from "../../../types/booking-backend";
import type { EmailDeliveryMessage, EmailProvider } from "../delivery-providers/email-provider";
import type { InternalDeliveryMessage, InternalProvider } from "../delivery-providers/internal-provider";
import type { NotificationRepository } from "../notification-repository";
import { NotificationService, type CreateNotificationIntentInput } from "../notification-service";

class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications: ReservationNotificationRecord[] = [];

  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    const now = "2026-09-01T10:00:00.000Z";
    const created: ReservationNotificationRecord = {
      ...input,
      id: `ntf_${this.notifications.length + 1}`,
      createdAt: now,
      updatedAt: now,
    };

    this.notifications.push(created);
    return { ...created };
  }

  async update(id: string, patch: Partial<ReservationNotificationRecord>): Promise<ReservationNotificationRecord> {
    const index = this.notifications.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error("Notification not found.");
    }

    const updated: ReservationNotificationRecord = {
      ...this.notifications[index],
      ...patch,
      id: this.notifications[index].id,
      updatedAt: "2026-09-01T10:05:00.000Z",
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

class SpyEmailProvider implements EmailProvider {
  readonly calls: EmailDeliveryMessage[] = [];
  shouldFail = false;

  async deliver(message: EmailDeliveryMessage): Promise<{ providerMessageId: string | null }> {
    this.calls.push(message);

    if (this.shouldFail) {
      throw new Error("Email transport failed");
    }

    return {
      providerMessageId: "msg_1",
    };
  }
}

class SpyInternalProvider implements InternalProvider {
  readonly calls: InternalDeliveryMessage[] = [];
  shouldFail = false;

  async deliver(message: InternalDeliveryMessage): Promise<void> {
    this.calls.push(message);

    if (this.shouldFail) {
      throw new Error("Internal log failed");
    }
  }
}

function createInput(
  event: NotificationTemplateEventKey,
  channel: "email" | "internal",
  dedupeKey: string,
  overrides?: Partial<CreateNotificationIntentInput>
): CreateNotificationIntentInput {
  return {
    event,
    channel,
    dedupeKey,
    recipient: channel === "email" ? "guest@example.com" : "ops:bookings",
    templateContext: {
      reservationToken: "token_123",
      guestName: "Ada Lovelace",
      flatLabel: "Mayfair Suite",
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
      holdExpiresAt: "2026-10-01T13:00:00.000Z",
    },
    reservationId: "res_123",
    reservationToken: "token_123",
    paymentAttemptId: null,
    ...overrides,
  };
}

function createServiceHarness(options?: {
  defaultSender?: {
    name: string;
    email: string;
  };
}): {
  service: NotificationService;
  repository: InMemoryNotificationRepository;
  emailProvider: SpyEmailProvider;
  internalProvider: SpyInternalProvider;
} {
  const repository = new InMemoryNotificationRepository();
  const emailProvider = new SpyEmailProvider();
  const internalProvider = new SpyInternalProvider();

  const service = new NotificationService({
    repository,
    emailProvider,
    internalProvider,
    defaultSender: options?.defaultSender,
    now: () => new Date("2026-09-01T10:00:00.000Z"),
  });

  return {
    service,
    repository,
    emailProvider,
    internalProvider,
  };
}

async function testNotificationCreatedAndPersisted(): Promise<void> {
  const { service } = createServiceHarness();

  const created = await service.createNotificationIntent(
    createInput("reservation_request_received", "email", "dedupe-create-1")
  );

  assert.equal(created.status, "pending");
  assert.equal(created.title, "Reservation request received");
  assert.equal(created.reservationId, "res_123");
  assert.equal(created.channel, "email");
}

async function testEmailDeliveryPathCalledCorrectly(): Promise<void> {
  const { service, emailProvider, internalProvider } = createServiceHarness();

  const delivered = await service.createAndDeliverNotification(
    createInput("reservation_request_received", "email", "dedupe-email-1")
  );

  assert.equal(emailProvider.calls.length, 1);
  assert.equal(internalProvider.calls.length, 0);
  assert.equal(delivered.status, "sent");
  assert.equal(delivered.sentAt, "2026-09-01T10:00:00.000Z");
}

async function testEmailDeliveryUsesConfiguredSenderIdentity(): Promise<void> {
  const { service, emailProvider } = createServiceHarness({
    defaultSender: {
      name: "Reservations Team",
      email: "no-reply@example.test",
    },
  });

  await service.createAndDeliverNotification(
    createInput("reservation_request_received", "email", "dedupe-sender-1")
  );

  assert.equal(emailProvider.calls.length, 1);
  assert.equal(emailProvider.calls[0].senderName, "Reservations Team");
  assert.equal(emailProvider.calls[0].senderEmail, "no-reply@example.test");
}

async function testInternalDeliveryPathCalledCorrectly(): Promise<void> {
  const { service, emailProvider, internalProvider } = createServiceHarness();

  const delivered = await service.createAndDeliverNotification(
    createInput("pending_transfer_created", "internal", "dedupe-internal-1")
  );

  assert.equal(emailProvider.calls.length, 0);
  assert.equal(internalProvider.calls.length, 1);
  assert.equal(delivered.status, "sent");
}

async function testFailedDeliveryRecordedCorrectly(): Promise<void> {
  const { service, emailProvider } = createServiceHarness();
  emailProvider.shouldFail = true;

  const delivered = await service.createAndDeliverNotification(
    createInput("reservation_request_received", "email", "dedupe-failure-1")
  );

  assert.equal(delivered.status, "failed");
  assert.equal(delivered.errorMessage, "Email transport failed");
}

async function testDuplicateTriggerProtection(): Promise<void> {
  const { service, repository, emailProvider } = createServiceHarness();

  const first = await service.createAndDeliverNotification(
    createInput("reservation_request_received", "email", "dedupe-duplicate-1")
  );

  const second = await service.createAndDeliverNotification(
    createInput("reservation_request_received", "email", "dedupe-duplicate-1")
  );

  assert.equal(first.id, second.id);
  assert.equal(emailProvider.calls.length, 1);

  const linked = await repository.listByReservationId("res_123");
  assert.equal(linked.length, 1);
}

async function testUnsupportedEventChannelRejectedCleanly(): Promise<void> {
  const { service, repository, emailProvider, internalProvider } = createServiceHarness();

  await assert.rejects(
    async () => {
      await service.createAndDeliverNotification(
        createInput("pending_transfer_created", "email", "dedupe-unsupported-1")
      );
    },
    /channel/i
  );

  assert.equal(emailProvider.calls.length, 0);
  assert.equal(internalProvider.calls.length, 0);

  const linked = await repository.listByReservationId("res_123");
  assert.equal(linked.length, 0);
}

async function run(): Promise<void> {
  await testNotificationCreatedAndPersisted();
  await testEmailDeliveryPathCalledCorrectly();
  await testEmailDeliveryUsesConfiguredSenderIdentity();
  await testInternalDeliveryPathCalledCorrectly();
  await testFailedDeliveryRecordedCorrectly();
  await testDuplicateTriggerProtection();
  await testUnsupportedEventChannelRejectedCleanly();

  console.log("server-notification-service: ok");
}

void run();
