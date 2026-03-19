import assert from "node:assert/strict";

import {
  AvailabilityService,
  type AvailabilityRepository,
  type AvailabilityRepositoryFlat,
  type AvailabilityRepositoryReservation,
} from "../availability-service";
import type { FlatId, ReservationStatus, StayDetailsInput } from "../../../types/booking";

class InMemoryAvailabilityRepository implements AvailabilityRepository {
  private readonly flats = new Map<FlatId, AvailabilityRepositoryFlat>();
  private readonly reservations: AvailabilityRepositoryReservation[];

  constructor(options?: { reservations?: AvailabilityRepositoryReservation[] }) {
    this.flats.set("windsor", { id: "windsor", maxGuests: 6 });
    this.flats.set("kensington", { id: "kensington", maxGuests: 6 });
    this.flats.set("mayfair", { id: "mayfair", maxGuests: 6 });

    this.reservations = [...(options?.reservations ?? [])];
  }

  async findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null> {
    return this.flats.get(flatId) ?? null;
  }

  async listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]> {
    return this.reservations.filter((reservation) => reservation.stay.flatId === flatId);
  }
}

function createStay(overrides?: Partial<StayDetailsInput>): StayDetailsInput {
  return {
    flatId: "mayfair",
    checkIn: "2026-07-10",
    checkOut: "2026-07-12",
    guests: 2,
    extraIds: [],
    ...overrides,
  };
}

function createReservation(
  status: ReservationStatus,
  overrides?: Partial<AvailabilityRepositoryReservation>
): AvailabilityRepositoryReservation {
  return {
    id: "res_existing",
    status,
    stay: createStay(),
    ...overrides,
  };
}

function createService(reservations?: AvailabilityRepositoryReservation[]): AvailabilityService {
  return new AvailabilityService({
    repository: new InMemoryAvailabilityRepository({ reservations }),
    now: () => new Date("2026-07-01T10:00:00.000Z"),
    createInventoryVersion: () => "inventory-fixed",
  });
}

async function testInitialAvailabilityCheck(): Promise<void> {
  const service = createService();
  const result = await service.runInitialAvailabilityCheck(createStay());

  assert.equal(result.intent, "initial");
  assert.equal(result.checkpoint, "stay_details_entry");
  assert.equal(result.isAvailable, true);
}

async function testPreHoldRecheckIntent(): Promise<void> {
  const service = createService();
  const result = await service.runPreHoldRecheck(createStay(), "transfer");

  assert.equal(result.intent, "pre_hold");
  assert.equal(result.checkpoint, "pre_hold_request");
  assert.equal(result.isAvailable, true);
}

async function testPreCheckoutRecheckIntent(): Promise<void> {
  const service = createService();
  const result = await service.runPreCheckoutRecheck(createStay());

  assert.equal(result.intent, "pre_checkout");
  assert.equal(result.checkpoint, "pre_online_payment_handoff");
  assert.equal(result.isAvailable, true);
}

async function testPreConfirmationRecheckIntentByMethod(): Promise<void> {
  const service = createService();

  const transfer = await service.runPreConfirmationRecheck(createStay(), "transfer");
  assert.equal(transfer.intent, "pre_confirmation_transfer");
  assert.equal(transfer.checkpoint, "pre_transfer_confirmation");

  const pos = await service.runPreConfirmationRecheck(createStay(), "pos");
  assert.equal(pos.intent, "pre_confirmation_pos");
  assert.equal(pos.checkpoint, "pre_pos_confirmation");
}

async function testOverlapConflictBlocksAvailability(): Promise<void> {
  const service = createService([createReservation("confirmed")]);
  const result = await service.runPreHoldRecheck(createStay(), "website");

  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "sold_out" && conflict.field === "stay"));
}

async function testNonBlockingStatusesDoNotBlock(): Promise<void> {
  const service = createService([createReservation("cancelled")]);
  const result = await service.runPreHoldRecheck(createStay(), "website");

  assert.equal(result.isAvailable, true);
}

async function testInvalidWindowConflict(): Promise<void> {
  const service = createService();
  const result = await service.runInitialAvailabilityCheck(
    createStay({
      checkIn: "2026-07-12",
      checkOut: "2026-07-10",
    })
  );

  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "invalid_window"));
}

async function testCapacityConflict(): Promise<void> {
  const service = createService();
  const result = await service.runPreHoldRecheck(createStay({ guests: 10 }), "pos");

  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "capacity_exceeded"));
}

async function testExcludeSameReservationIdOnRecheck(): Promise<void> {
  const service = createService([
    createReservation("pending_transfer_submission", {
      id: "res_same",
    }),
  ]);

  const result = await service.runPreHoldRecheck(createStay(), "transfer", "res_same");
  assert.equal(result.isAvailable, true);
}

async function run(): Promise<void> {
  await testInitialAvailabilityCheck();
  await testPreHoldRecheckIntent();
  await testPreCheckoutRecheckIntent();
  await testPreConfirmationRecheckIntentByMethod();
  await testOverlapConflictBlocksAvailability();
  await testNonBlockingStatusesDoNotBlock();
  await testInvalidWindowConflict();
  await testCapacityConflict();
  await testExcludeSameReservationIdOnRecheck();

  console.log("availability-service: ok");
}

void run();
