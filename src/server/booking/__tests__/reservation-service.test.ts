import assert from "node:assert/strict";

import {
  ReservationService,
  type ReservationInventoryGateway,
} from "../reservation-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../reservation-repository";
import type {
  DraftCreateInput,
  DraftUpdateInput,
  ReservationPricingSnapshot,
} from "../../../types/booking-backend";
import type { BookingToken, ExtraId, FlatId } from "../../../types/booking";

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
  readonly reopened: { reservationId: string; reason: "cancelled" | "expired" }[] = [];
  readonly syncedReservations: Array<{
    id: string;
    status: ReservationRepositoryReservation["status"];
    checkIn: string;
    checkOut: string;
  }> = [];

  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    this.syncedReservations.push({
      id: reservation.id,
      status: reservation.status,
      checkIn: reservation.stay.checkIn,
      checkOut: reservation.stay.checkOut,
    });
  }

  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    this.reopened.push({ reservationId, reason });
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

function createExistingReservation(overrides: Partial<ReservationRepositoryReservation>): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status: "draft",
    paymentMethod: null,
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
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
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
  };
}

function createServiceHarness(options?: { reservations?: ReservationRepositoryReservation[]; now?: string }) {
  const repository = new InMemoryReservationRepository({ reservations: options?.reservations });
  const inventoryGateway = new MockInventoryGateway();
  const now = options?.now ?? "2026-07-01T10:00:00.000Z";

  const service = new ReservationService({
    repository,
    inventoryGateway,
    now: () => new Date(now),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  return {
    service,
    inventoryGateway,
  };
}

async function testCreateDraftReservation(): Promise<void> {
  const { service } = createServiceHarness();
  const input: DraftCreateInput = {
    stay: {
      flatId: "mayfair",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
      guests: 2,
      extraIds: ["airport"],
    },
    guest: {
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      phone: "+2348000000000",
      specialRequests: "Late check-in",
    },
    paymentMethod: null,
  };

  const created = await service.createDraftReservation(input);

  assert.equal(created.status, "draft");
  assert.equal(created.pricing.nights, 2);
  assert.equal(created.pricing.staySubtotal, 500000);
  assert.equal(created.pricing.extrasSubtotal, 65000);
  assert.equal(created.pricing.estimatedTotal, 565000);
}

async function testUpdateDraftReservation(): Promise<void> {
  const existing = createExistingReservation({ token: "token_update" });
  const { service } = createServiceHarness({ reservations: [existing] });

  const patch: DraftUpdateInput = {
    stay: {
      checkOut: "2026-07-13",
      extraIds: ["airport", "pantry"],
    },
  };

  const updated = await service.updateDraftReservation("token_update", patch);

  assert.equal(updated.pricing.nights, 3);
  assert.equal(updated.pricing.extrasSubtotal, 110000);
  assert.equal(updated.pricing.estimatedTotal, 860000);
}

async function testAllowedTransitionToTransferPending(): Promise<void> {
  const existing = createExistingReservation({ token: "token_transition" });
  const { service, inventoryGateway } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:00:00.000Z",
  });

  const transitioned = await service.transitionReservation({
    token: "token_transition",
    event: "branch_request_created",
    actor: "guest",
    paymentMethod: "transfer",
    availabilityPassed: true,
  });

  assert.equal(transitioned.status, "pending_transfer_submission");
  assert.equal(transitioned.transferHoldStartedAt, "2026-07-01T10:00:00.000Z");
  assert.equal(transitioned.transferHoldExpiresAt, "2026-07-01T11:00:00.000Z");
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "pending_transfer_submission");
}

async function testForbiddenTransitionRejected(): Promise<void> {
  const existing = createExistingReservation({ token: "token_forbidden" });
  const { service } = createServiceHarness({ reservations: [existing] });

  await assert.rejects(
    async () => {
      await service.transitionReservation({
        token: "token_forbidden",
        event: "transfer_verified",
        actor: "staff",
        availabilityPassed: true,
      });
    },
    /Event is not valid for the current reservation state/
  );
}

async function testTransferHoldExpiryHandling(): Promise<void> {
  const existing = createExistingReservation({
    id: "res_expiring",
    token: "token_expiring",
    status: "pending_transfer_submission",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T09:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T10:00:00.000Z",
  });

  const { service, inventoryGateway } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T11:05:00.000Z",
  });

  const expired = await service.expireTransferHolds();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].status, "cancelled");
  assert.equal(expired[0].inventoryReopenedAt, "2026-07-01T11:05:00.000Z");
  assert.deepEqual(inventoryGateway.reopened, [{ reservationId: "res_expiring", reason: "cancelled" }]);
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "cancelled");
}

async function testInvalidConfirmationPathBlocked(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_invalid_confirm",
    status: "pending_transfer_submission",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T11:00:00.000Z",
  });

  const { service } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:30:00.000Z",
  });

  await assert.rejects(
    async () => {
      await service.transitionReservation({
        token: "token_invalid_confirm",
        event: "online_payment_confirmed",
        actor: "system",
      });
    },
    /Event is not valid for the current reservation state/
  );
}

async function testForbiddenSwitchMethodFromPendingOnlinePayment(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_switch_forbidden",
    status: "pending_online_payment",
    paymentMethod: "website",
  });

  const { service } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:30:00.000Z",
  });

  await assert.rejects(
    async () => {
      await service.transitionReservation({
        token: "token_switch_forbidden",
        event: "switch_payment_method",
        actor: "guest",
        paymentMethod: "transfer",
        branchResetApplied: true,
        availabilityPassed: true,
      });
    },
    /Event is not valid for the current reservation state/
  );
}
async function testCalendarSyncTriggeredWhenTransferProofMovesAwaitingVerification(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_awaiting_sync",
    status: "pending_transfer_submission",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T11:00:00.000Z",
  });

  const { service, inventoryGateway } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:20:00.000Z",
  });

  const transitioned = await service.transitionReservation({
    token: "token_awaiting_sync",
    event: "transfer_proof_submitted",
    actor: "guest",
    availabilityPassed: true,
  });

  assert.equal(transitioned.status, "awaiting_transfer_verification");
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "awaiting_transfer_verification");
}

async function testCalendarSyncTriggeredWhenConfirmed(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_confirm_sync",
    status: "pending_online_payment",
    paymentMethod: "website",
  });

  const { service, inventoryGateway } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:20:00.000Z",
  });

  const transitioned = await service.transitionReservation({
    token: "token_confirm_sync",
    event: "online_payment_confirmed",
    actor: "system",
  });

  assert.equal(transitioned.status, "confirmed");
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "confirmed");
}

async function testCalendarSyncTriggeredWhenFailedPaymentRecorded(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_failed_sync",
    status: "pending_online_payment",
    paymentMethod: "website",
  });

  const { service, inventoryGateway } = createServiceHarness({
    reservations: [existing],
    now: "2026-07-01T10:20:00.000Z",
  });

  const transitioned = await service.transitionReservation({
    token: "token_failed_sync",
    event: "online_payment_failed",
    actor: "system",
  });

  assert.equal(transitioned.status, "failed_payment");
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "failed_payment");
}

async function testCalendarSyncTriggeredWhenDraftDatesChange(): Promise<void> {
  const existing = createExistingReservation({ token: "token_dates_sync" });
  const { service, inventoryGateway } = createServiceHarness({ reservations: [existing] });

  const updated = await service.updateDraftReservation("token_dates_sync", {
    stay: {
      checkIn: "2026-08-01",
      checkOut: "2026-08-04",
    },
  });

  assert.equal(updated.status, "draft");
  assert.equal(updated.stay.checkIn, "2026-08-01");
  assert.equal(updated.stay.checkOut, "2026-08-04");
  assert.deepEqual(inventoryGateway.syncedReservations.at(-1), {
    id: updated.id,
    status: "draft",
    checkIn: "2026-08-01",
    checkOut: "2026-08-04",
  });
}
async function run(): Promise<void> {
  await testCreateDraftReservation();
  await testUpdateDraftReservation();
  await testAllowedTransitionToTransferPending();
  await testForbiddenTransitionRejected();
  await testTransferHoldExpiryHandling();
  await testInvalidConfirmationPathBlocked();
  await testForbiddenSwitchMethodFromPendingOnlinePayment();
  await testCalendarSyncTriggeredWhenTransferProofMovesAwaitingVerification();
  await testCalendarSyncTriggeredWhenConfirmed();
  await testCalendarSyncTriggeredWhenFailedPaymentRecorded();
  await testCalendarSyncTriggeredWhenDraftDatesChange();

  console.log("reservation-service: ok");
}

void run();

