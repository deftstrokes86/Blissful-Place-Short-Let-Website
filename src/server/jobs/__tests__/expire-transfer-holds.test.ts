import assert from "node:assert/strict";

import { ExpireTransferHoldsJob } from "../expire-transfer-holds";
import {
  ReservationService,
  type ReservationInventoryGateway,
} from "../../booking/reservation-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../../booking/reservation-repository";
import type {
  ReservationPricingSnapshot,
} from "../../../types/booking-backend";
import type { BookingToken, ExtraId, FlatId, ReservationStatus } from "../../../types/booking";

class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservationsByToken = new Map<BookingToken, ReservationRepositoryReservation>();
  private readonly flatsById = new Map<FlatId, ReservationRepositoryFlat>();
  private readonly extras: { id: ExtraId; flatFee: number }[] = [];

  constructor(options?: { reservations?: ReservationRepositoryReservation[] }) {
    const defaults: ReservationRepositoryFlat[] = [
      { id: "windsor", nightlyRate: 150000 },
      { id: "kensington", nightlyRate: 180000 },
      { id: "mayfair", nightlyRate: 250000 },
    ];

    for (const flat of defaults) {
      this.flatsById.set(flat.id, flat);
    }

    for (const reservation of options?.reservations ?? []) {
      this.reservationsByToken.set(reservation.token, cloneReservation(reservation));
    }
  }

  async create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    this.reservationsByToken.set(reservation.token, cloneReservation(reservation));
    return cloneReservation(reservation);
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
    const beforeMs = new Date(beforeIso).getTime();

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

        return new Date(reservation.transferHoldExpiresAt).getTime() < beforeMs;
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

class SpyInventoryGateway implements ReservationInventoryGateway {
  readonly reopened: { reservationId: string; reason: "cancelled" | "expired" }[] = [];
  readonly syncedReservations: Array<{
    id: string;
    status: ReservationRepositoryReservation["status"];
  }> = [];

  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    this.syncedReservations.push({
      id: reservation.id,
      status: reservation.status,
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

function createReservation(
  status: ReservationStatus,
  overrides?: Partial<ReservationRepositoryReservation>
): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status,
    paymentMethod: status === "draft" ? null : "transfer",
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
    transferHoldStartedAt: "2026-07-01T09:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T10:00:00.000Z",
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
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

function createHarness(options?: { reservations?: ReservationRepositoryReservation[]; now?: string }) {
  const repository = new InMemoryReservationRepository({ reservations: options?.reservations });
  const inventoryGateway = new SpyInventoryGateway();
  const nowIso = options?.now ?? "2026-07-01T10:30:00.000Z";

  const reservationService = new ReservationService({
    repository,
    inventoryGateway,
    now: () => new Date(nowIso),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  const job = new ExpireTransferHoldsJob({
    reservationService,
    now: () => new Date(nowIso),
  });

  return {
    job,
    reservationService,
    inventoryGateway,
  };
}

async function testExpiresTransferHoldAfterWindow(): Promise<void> {
  const reservation = createReservation("pending_transfer_submission", {
    id: "res_expire_1",
    token: "token_expire_1",
    transferHoldExpiresAt: "2026-07-01T09:20:00.000Z",
  });

  const { job, reservationService, inventoryGateway } = createHarness({
    reservations: [reservation],
    now: "2026-07-01T10:30:00.000Z",
  });

  const result = await job.run();
  const updated = await reservationService.getReservationByToken("token_expire_1");

  assert.equal(result.expiredCount, 1);
  assert.deepEqual(result.expiredReservationIds, ["res_expire_1"]);
  assert.equal(updated?.status, "cancelled");
  assert.deepEqual(inventoryGateway.reopened, [{ reservationId: "res_expire_1", reason: "cancelled" }]);
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "cancelled");
}

async function testIgnoresReservationsStillWithinWindow(): Promise<void> {
  const reservation = createReservation("pending_transfer_submission", {
    id: "res_active_1",
    token: "token_active_1",
    transferHoldExpiresAt: "2026-07-01T11:30:00.000Z",
  });

  const { job, reservationService, inventoryGateway } = createHarness({
    reservations: [reservation],
    now: "2026-07-01T10:30:00.000Z",
  });

  const result = await job.run();
  const unchanged = await reservationService.getReservationByToken("token_active_1");

  assert.equal(result.expiredCount, 0);
  assert.equal(unchanged?.status, "pending_transfer_submission");
  assert.equal(inventoryGateway.reopened.length, 0);
}

async function testIgnoresAlreadyConfirmedOrCancelledReservations(): Promise<void> {
  const confirmed = createReservation("confirmed", {
    id: "res_confirmed_1",
    token: "token_confirmed_1",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-07-01T09:00:00.000Z",
  });
  const cancelled = createReservation("cancelled", {
    id: "res_cancelled_1",
    token: "token_cancelled_1",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-07-01T09:00:00.000Z",
  });

  const { job, inventoryGateway } = createHarness({
    reservations: [confirmed, cancelled],
    now: "2026-07-01T10:30:00.000Z",
  });

  const result = await job.run();

  assert.equal(result.expiredCount, 0);
  assert.equal(inventoryGateway.reopened.length, 0);
}

async function testReopensAvailabilityForAwaitingVerificationExpiry(): Promise<void> {
  const reservation = createReservation("awaiting_transfer_verification", {
    id: "res_awaiting_expire_1",
    token: "token_awaiting_expire_1",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-07-01T09:10:00.000Z",
  });

  const { job, reservationService, inventoryGateway } = createHarness({
    reservations: [reservation],
    now: "2026-07-01T10:30:00.000Z",
  });

  const result = await job.run();
  const updated = await reservationService.getReservationByToken("token_awaiting_expire_1");

  assert.equal(result.expiredCount, 1);
  assert.equal(updated?.status, "cancelled");
  assert.equal(updated?.inventoryReopenedAt, "2026-07-01T10:30:00.000Z");
  assert.deepEqual(inventoryGateway.reopened, [{ reservationId: "res_awaiting_expire_1", reason: "cancelled" }]);
}

async function testIsSafeToRunRepeatedly(): Promise<void> {
  const reservation = createReservation("pending_transfer_submission", {
    id: "res_repeat_1",
    token: "token_repeat_1",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-07-01T09:10:00.000Z",
  });

  const { job, inventoryGateway } = createHarness({
    reservations: [reservation],
    now: "2026-07-01T10:30:00.000Z",
  });

  const firstRun = await job.run();
  const secondRun = await job.run();

  assert.equal(firstRun.expiredCount, 1);
  assert.equal(secondRun.expiredCount, 0);
  assert.equal(inventoryGateway.reopened.length, 1);
  assert.equal(inventoryGateway.syncedReservations.at(-1)?.status, "cancelled");
}

async function run(): Promise<void> {
  await testExpiresTransferHoldAfterWindow();
  await testIgnoresReservationsStillWithinWindow();
  await testIgnoresAlreadyConfirmedOrCancelledReservations();
  await testReopensAvailabilityForAwaitingVerificationExpiry();
  await testIsSafeToRunRepeatedly();

  console.log("expire-transfer-holds-job: ok");
}

void run();

