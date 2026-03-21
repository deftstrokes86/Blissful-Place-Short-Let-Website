import assert from "node:assert/strict";

import type { BookingActor, BookingToken, ExtraId, FlatId, ReservationEventType, ReservationStatus } from "../../../types/booking";
import type {
  ReservationNotificationRecord,
  ReservationPricingSnapshot,
} from "../../../types/booking-backend";
import { NotificationService, type NotificationRepository } from "../notification-service";
import { ReservationService, type ReservationInventoryGateway } from "../reservation-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../reservation-repository";

class InMemoryNotificationRepository implements NotificationRepository {
  private readonly notifications: ReservationNotificationRecord[] = [];

  async create(
    input: Omit<ReservationNotificationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ReservationNotificationRecord> {
    const now = "2026-07-01T10:00:00.000Z";
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
      updatedAt: "2026-07-01T10:00:00.000Z",
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

class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservationsByToken = new Map<BookingToken, ReservationRepositoryReservation>();
  private readonly flatsById = new Map<FlatId, ReservationRepositoryFlat>();
  private readonly extras: { id: ExtraId; flatFee: number }[];
  private sequence = 1;

  constructor(options?: { reservations?: ReservationRepositoryReservation[] }) {
    const defaults: ReservationRepositoryFlat[] = [
      { id: "windsor", nightlyRate: 150000 },
      { id: "kensington", nightlyRate: 180000 },
      { id: "mayfair", nightlyRate: 250000 },
    ];

    for (const flat of defaults) {
      this.flatsById.set(flat.id, flat);
    }

    this.extras = [
      { id: "airport", flatFee: 65000 },
      { id: "pantry", flatFee: 45000 },
      { id: "celebration", flatFee: 75000 },
    ];

    for (const reservation of options?.reservations ?? []) {
      this.reservationsByToken.set(reservation.token, cloneReservation(reservation));
    }
  }

  async create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    const assigned = {
      ...cloneReservation(reservation),
      id: reservation.id || `res_${this.sequence++}`,
    };

    this.reservationsByToken.set(assigned.token, assigned);
    return cloneReservation(assigned);
  }

  async update(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    if (!this.reservationsByToken.has(reservation.token)) {
      throw new Error("Reservation not found.");
    }

    this.reservationsByToken.set(reservation.token, cloneReservation(reservation));
    return cloneReservation(reservation);
  }

  async findByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    const found = this.reservationsByToken.get(token);
    return found ? cloneReservation(found) : null;
  }

  async listTransferHoldExpiringBefore(beforeIso: string): Promise<ReservationRepositoryReservation[]> {
    const before = new Date(beforeIso).getTime();

    return Array.from(this.reservationsByToken.values())
      .filter((reservation) => {
        if (
          reservation.status !== "pending_transfer_submission" &&
          reservation.status !== "awaiting_transfer_verification"
        ) {
          return false;
        }

        if (!reservation.transferHoldExpiresAt) {
          return false;
        }

        return new Date(reservation.transferHoldExpiresAt).getTime() < before;
      })
      .map(cloneReservation);
  }

  async findFlatById(flatId: FlatId): Promise<ReservationRepositoryFlat | null> {
    return this.flatsById.get(flatId) ?? null;
  }

  async listExtras(): Promise<readonly { id: ExtraId; flatFee: number }[]> {
    return [...this.extras];
  }
}

class MockInventoryGateway implements ReservationInventoryGateway {
  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    void reservation;
  }

  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
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
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
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
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    lastTouchedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

function cloneReservation(value: ReservationRepositoryReservation): ReservationRepositoryReservation {
  return {
    ...value,
    stay: {
      ...value.stay,
      extraIds: [...value.stay.extraIds],
    },
    guest: {
      ...value.guest,
    },
    pricing: {
      ...value.pricing,
    },
    progressContext: {
      ...value.progressContext,
    },
  };
}

async function testTransferPendingAndTransferConfirmedUseDistinctTemplates(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const transferPending = await service.recordReservationTransition({
    previous: createReservation("draft", null),
    current: createReservation("pending_transfer_submission", "transfer", {
      updatedAt: "2026-07-01T10:10:00.000Z",
    }),
    event: "branch_request_created",
    actor: "guest",
  });

  const transferConfirmed = await service.recordReservationTransition({
    previous: createReservation("awaiting_transfer_verification", "transfer"),
    current: createReservation("confirmed", "transfer", {
      updatedAt: "2026-07-01T10:20:00.000Z",
    }),
    event: "transfer_verified",
    actor: "staff",
  });

  assert.equal(transferPending?.templateKey, "transfer_payment_pending");
  assert.equal(transferConfirmed?.templateKey, "transfer_payment_confirmed");
  assert.notEqual(transferPending?.templateKey, transferConfirmed?.templateKey);
}

async function testPosRequestAndPosConfirmedUseDistinctTemplates(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const posRequested = await service.recordReservationTransition({
    previous: createReservation("draft", null),
    current: createReservation("pending_pos_coordination", "pos", {
      updatedAt: "2026-07-01T10:15:00.000Z",
    }),
    event: "branch_request_created",
    actor: "guest",
  });

  const posConfirmed = await service.recordReservationTransition({
    previous: createReservation("pending_pos_coordination", "pos"),
    current: createReservation("confirmed", "pos", {
      updatedAt: "2026-07-01T10:25:00.000Z",
    }),
    event: "pos_payment_completed",
    actor: "staff",
  });

  assert.equal(posRequested?.templateKey, "pos_request_submitted");
  assert.equal(posConfirmed?.templateKey, "pos_payment_confirmed");
}

async function testNoConfirmedNotificationBeforeConfirmedStatus(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });

  const awaitingVerification = await service.recordReservationTransition({
    previous: createReservation("pending_transfer_submission", "transfer"),
    current: createReservation("awaiting_transfer_verification", "transfer", {
      updatedAt: "2026-07-01T10:12:00.000Z",
    }),
    event: "transfer_proof_submitted",
    actor: "guest",
  });

  assert.equal(awaitingVerification?.templateKey, "transfer_payment_awaiting_verification");
  assert.ok(awaitingVerification?.templateKey.includes("confirmed") === false);
}

async function testRepeatedTransitionNotificationIsIdempotent(): Promise<void> {
  const repository = new InMemoryNotificationRepository();
  const service = new NotificationService({ repository });
  const input: {
    previous: ReservationRepositoryReservation;
    current: ReservationRepositoryReservation;
    event: ReservationEventType;
    actor: BookingActor;
  } = {
    previous: createReservation("draft", null),
    current: createReservation("pending_transfer_submission", "transfer", {
      updatedAt: "2026-07-01T10:10:00.000Z",
    }),
    event: "branch_request_created",
    actor: "guest",
  };

  const first = await service.recordReservationTransition(input);
  const second = await service.recordReservationTransition(input);
  const list = await repository.listByReservationId("res_1");

  assert.equal(first?.id, second?.id);
  assert.equal(list.length, 1);
}

async function testReservationServiceEmitsNotificationsViaServiceBoundary(): Promise<void> {
  const existing = createReservation("draft", null, {
    token: "token_transition",
  });
  const reservationRepository = new InMemoryReservationRepository({ reservations: [existing] });
  const notificationRepository = new InMemoryNotificationRepository();
  const notificationService = new NotificationService({ repository: notificationRepository });
  const reservationService = new ReservationService({
    repository: reservationRepository,
    inventoryGateway: new MockInventoryGateway(),
    notificationGateway: notificationService,
    now: () => new Date("2026-07-01T10:00:00.000Z"),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  await reservationService.transitionReservation({
    token: "token_transition",
    event: "branch_request_created",
    actor: "guest",
    paymentMethod: "transfer",
    availabilityPassed: true,
  });

  const notifications = await notificationRepository.listByReservationId("res_1");
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].templateKey, "transfer_payment_pending");
}

async function run(): Promise<void> {
  await testTransferPendingAndTransferConfirmedUseDistinctTemplates();
  await testPosRequestAndPosConfirmedUseDistinctTemplates();
  await testNoConfirmedNotificationBeforeConfirmedStatus();
  await testRepeatedTransitionNotificationIsIdempotent();
  await testReservationServiceEmitsNotificationsViaServiceBoundary();

  console.log("notification-service: ok");
}

void run();



