import assert from "node:assert/strict";

import type { NotificationTemplateEventKey } from "../../../lib/notifications/notification-events";
import type { BookingActor, ReservationEventType, ReservationStatus } from "../../../types/booking";
import type { ReservationNotificationRecord, ReservationPricingSnapshot } from "../../../types/booking-backend";
import { DevEmailProvider } from "../../notifications/delivery-providers/email-provider";
import { InternalLogProvider } from "../../notifications/delivery-providers/internal-provider";
import type { NotificationRepository } from "../../notifications/notification-repository";
import { NotificationService } from "../../notifications/notification-service";
import { type ReservationTransitionNotificationInput } from "../notification-service";
import { ReservationTransitionNotificationGateway } from "../reservation-transition-notification-gateway";
import type { ReservationRepositoryReservation } from "../reservation-repository";

class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications: ReservationNotificationRecord[] = [];

  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    const now = "2026-11-01T10:00:00.000Z";
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
    const index = this.notifications.findIndex((notification) => notification.id === id);
    if (index < 0) {
      throw new Error("Notification not found.");
    }

    const updated: ReservationNotificationRecord = {
      ...this.notifications[index],
      ...patch,
      id: this.notifications[index].id,
      updatedAt: "2026-11-01T10:00:01.000Z",
    };

    this.notifications[index] = updated;
    return { ...updated };
  }

  async findById(id: string): Promise<ReservationNotificationRecord | null> {
    const found = this.notifications.find((notification) => notification.id === id);
    return found ? { ...found } : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<ReservationNotificationRecord | null> {
    const found = this.notifications.find((notification) => notification.dedupeKey === dedupeKey);
    return found ? { ...found } : null;
  }

  async listByReservationId(reservationId: string): Promise<ReservationNotificationRecord[]> {
    return this.notifications
      .filter((notification) => notification.reservationId === reservationId)
      .map((notification) => ({ ...notification }));
  }
}

function createEmptyPricing(): ReservationPricingSnapshot {
  return {
    currency: "NGN",
    nightlyRate: null,
    nights: null,
    staySubtotal: null,
    extrasSubtotal: 0,
    estimatedTotal: null,
  };
}

function createReservation(
  status: ReservationStatus,
  paymentMethod: ReservationRepositoryReservation["paymentMethod"],
  overrides?: Partial<ReservationRepositoryReservation>
): ReservationRepositoryReservation {
  return {
    id: "res_1",
    token: "token_1",
    status,
    paymentMethod,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-11-10",
      checkOut: "2026-11-12",
      guests: 2,
      extraIds: [],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "",
    },
    pricing: createEmptyPricing(),
    progressContext: {
      currentStep: 0,
      activeBranch: paymentMethod,
    },
    transferHoldStartedAt: "2026-11-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-11-01T11:00:00.000Z",
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    lastTouchedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

function createTransitionInput(
  previous: ReservationRepositoryReservation,
  current: ReservationRepositoryReservation,
  event: ReservationEventType,
  actor: BookingActor
): ReservationTransitionNotificationInput {
  return {
    previous,
    current,
    event,
    actor,
  };
}

function createHarness(options?: {
  emailDeliveryEnabled?: boolean;
}): {
  gateway: ReservationTransitionNotificationGateway;
  repository: InMemoryNotificationRepository;
} {
  const repository = new InMemoryNotificationRepository();
  const notificationService = new NotificationService({
    repository,
    emailProvider: new DevEmailProvider(),
    internalProvider: new InternalLogProvider(),
    now: () => new Date("2026-11-01T10:00:00.000Z"),
  });

  const gateway = new ReservationTransitionNotificationGateway({
    notificationService,
    emailDeliveryEnabled: options?.emailDeliveryEnabled,
  });

  return {
    gateway,
    repository,
  };
}

async function listEvents(
  repository: InMemoryNotificationRepository,
  reservationId: string
): Promise<NotificationTemplateEventKey[]> {
  const notifications = await repository.listByReservationId(reservationId);
  return notifications.map((notification) => notification.eventType as NotificationTemplateEventKey).sort();
}

async function testTransferReservationCreatedTriggersGuestAndStaffNotifications(): Promise<void> {
  const { gateway, repository } = createHarness();

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("draft", null),
      createReservation("pending_transfer_submission", "transfer", {
        updatedAt: "2026-11-01T10:05:00.000Z",
      }),
      "branch_request_created",
      "guest"
    )
  );

  const events = await listEvents(repository, "res_1");
  assert.deepEqual(events, ["pending_transfer_created", "transfer_pending_confirmation"]);
}

async function testTransferProofSubmittedTriggersStaffProofNotification(): Promise<void> {
  const { gateway, repository } = createHarness();

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("pending_transfer_submission", "transfer"),
      createReservation("awaiting_transfer_verification", "transfer", {
        updatedAt: "2026-11-01T10:10:00.000Z",
      }),
      "transfer_proof_submitted",
      "guest"
    )
  );

  const events = await listEvents(repository, "res_1");
  assert.deepEqual(events, ["transfer_proof_submitted"]);
}

async function testConfirmedNotificationsOnlyAfterConfirmedStatus(): Promise<void> {
  const { gateway, repository } = createHarness();

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("pending_transfer_submission", "transfer"),
      createReservation("awaiting_transfer_verification", "transfer", {
        updatedAt: "2026-11-01T10:10:00.000Z",
      }),
      "transfer_proof_submitted",
      "guest"
    )
  );

  let events = await listEvents(repository, "res_1");
  assert.ok(events.includes("booking_confirmed") === false);

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("awaiting_transfer_verification", "transfer"),
      createReservation("confirmed", "transfer", {
        updatedAt: "2026-11-01T10:20:00.000Z",
      }),
      "transfer_verified",
      "staff"
    )
  );

  events = await listEvents(repository, "res_1");
  assert.ok(events.includes("booking_confirmed"));
  assert.ok(events.includes("reservation_confirmed_staff_alert"));
}

async function testPosRequestAndConfirmedNotifications(): Promise<void> {
  const { gateway, repository } = createHarness();

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("draft", null),
      createReservation("pending_pos_coordination", "pos", {
        updatedAt: "2026-11-01T10:15:00.000Z",
      }),
      "branch_request_created",
      "guest"
    )
  );

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("pending_pos_coordination", "pos"),
      createReservation("confirmed", "pos", {
        updatedAt: "2026-11-01T10:25:00.000Z",
      }),
      "pos_payment_completed",
      "staff"
    )
  );

  const events = await listEvents(repository, "res_1");
  assert.ok(events.includes("pos_request_submitted"));
  assert.ok(events.includes("booking_confirmed"));
}

async function testCancellationAndExpiryNotificationsTriggeredCorrectly(): Promise<void> {
  const { gateway, repository } = createHarness();

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("pending_pos_coordination", "pos"),
      createReservation("cancelled", "pos", {
        updatedAt: "2026-11-01T10:40:00.000Z",
      }),
      "cancel_requested",
      "staff"
    )
  );

  await gateway.onReservationTransition(
    createTransitionInput(
      createReservation("pending_transfer_submission", "transfer"),
      createReservation("cancelled", "transfer", {
        updatedAt: "2026-11-01T10:50:00.000Z",
      }),
      "transfer_hold_expired",
      "system"
    )
  );

  const events = await listEvents(repository, "res_1");
  assert.ok(events.includes("reservation_cancelled"));
  assert.ok(events.includes("reservation_expired"));
}

async function testGuestEmailChannelRespectsEmailDeliveryFlag(): Promise<void> {
  const disabled = createHarness({ emailDeliveryEnabled: false });

  await disabled.gateway.onReservationTransition(
    createTransitionInput(
      createReservation("draft", null),
      createReservation("pending_pos_coordination", "pos", {
        updatedAt: "2026-11-01T10:55:00.000Z",
      }),
      "branch_request_created",
      "guest"
    )
  );

  const disabledNotifications = await disabled.repository.listByReservationId("res_1");
  const disabledGuest = disabledNotifications.find((item) => item.eventType === "pos_request_submitted");
  assert.equal(disabledGuest?.channel, "internal");
  assert.equal(disabledGuest?.recipient, "reservation:token_1");

  const enabled = createHarness({ emailDeliveryEnabled: true });

  await enabled.gateway.onReservationTransition(
    createTransitionInput(
      createReservation("draft", null),
      createReservation("pending_pos_coordination", "pos", {
        updatedAt: "2026-11-01T10:56:00.000Z",
      }),
      "branch_request_created",
      "guest"
    )
  );

  const enabledNotifications = await enabled.repository.listByReservationId("res_1");
  const enabledGuest = enabledNotifications.find((item) => item.eventType === "pos_request_submitted");
  assert.equal(enabledGuest?.channel, "email");
  assert.equal(enabledGuest?.recipient, "ada@example.com");
}

async function testRepeatedTransitionInputIsIdempotent(): Promise<void> {
  const { gateway, repository } = createHarness();

  const input = createTransitionInput(
    createReservation("draft", null),
    createReservation("pending_transfer_submission", "transfer", {
      updatedAt: "2026-11-01T10:05:00.000Z",
    }),
    "branch_request_created",
    "guest"
  );

  await gateway.onReservationTransition(input);
  await gateway.onReservationTransition(input);

  const notifications = await repository.listByReservationId("res_1");
  assert.equal(notifications.length, 2);
}

async function run(): Promise<void> {
  await testTransferReservationCreatedTriggersGuestAndStaffNotifications();
  await testTransferProofSubmittedTriggersStaffProofNotification();
  await testConfirmedNotificationsOnlyAfterConfirmedStatus();
  await testPosRequestAndConfirmedNotifications();
  await testCancellationAndExpiryNotificationsTriggeredCorrectly();
  await testGuestEmailChannelRespectsEmailDeliveryFlag();
  await testRepeatedTransitionInputIsIdempotent();

  console.log("reservation-transition-notification-gateway: ok");
}

void run();
