import assert from "node:assert/strict";

import {
  AvailabilityService,
  type AvailabilityRepository,
  type AvailabilityRepositoryBlock,
  type AvailabilityRepositoryFlat,
  type AvailabilityRepositoryReservation,
} from "../availability-service";
import type { FlatId, ReservationStatus, StayDetailsInput } from "../../../types/booking";
import type { FlatReadinessRecord } from "../../../types/booking-backend";

class InMemoryAvailabilityRepository implements AvailabilityRepository {
  private readonly flats = new Map<FlatId, AvailabilityRepositoryFlat>();
  private readonly reservations: AvailabilityRepositoryReservation[];
  private readonly blocks: AvailabilityRepositoryBlock[];
  private readonly readinessByFlat: Partial<Record<FlatId, FlatReadinessRecord>>;

  constructor(options?: {
    reservations?: AvailabilityRepositoryReservation[];
    blocks?: AvailabilityRepositoryBlock[];
    readinessByFlat?: Partial<Record<FlatId, FlatReadinessRecord>>;
  }) {
    this.flats.set("windsor", { id: "windsor", maxGuests: 6 });
    this.flats.set("kensington", { id: "kensington", maxGuests: 6 });
    this.flats.set("mayfair", { id: "mayfair", maxGuests: 6 });

    this.reservations = [...(options?.reservations ?? [])];
    this.blocks = [...(options?.blocks ?? [])];
    this.readinessByFlat = options?.readinessByFlat ?? {};
  }

  async findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null> {
    return this.flats.get(flatId) ?? null;
  }

  async listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]> {
    return this.reservations.filter((reservation) => reservation.stay.flatId === flatId);
  }

  async listAvailabilityBlocksByFlat(flatId: FlatId): Promise<AvailabilityRepositoryBlock[]> {
    return this.blocks.filter((block) => block.flatId === flatId);
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = this.readinessByFlat[flatId];
    return found ? { ...found } : null;
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

function createBlock(overrides?: Partial<AvailabilityRepositoryBlock>): AvailabilityRepositoryBlock {
  return {
    id: "block_1",
    flatId: "mayfair",
    sourceType: "reservation",
    sourceId: "res_1",
    blockType: "hard_block",
    startDate: "2026-07-10",
    endDate: "2026-07-13",
    status: "active",
    expiresAt: null,
    ...overrides,
  };
}

function createReadiness(overrides?: Partial<FlatReadinessRecord>): FlatReadinessRecord {
  return {
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
    consumablesStatus: "ready",
    maintenanceStatus: "ready",
    criticalAssetStatus: "ready",
    readinessStatus: "ready",
    overrideStatus: null,
    overrideReason: null,
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

function createService(options?: {
  reservations?: AvailabilityRepositoryReservation[];
  blocks?: AvailabilityRepositoryBlock[];
  readinessByFlat?: Partial<Record<FlatId, FlatReadinessRecord>>;
}): AvailabilityService {
  return new AvailabilityService({
    repository: new InMemoryAvailabilityRepository(options),
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
  const service = createService({ reservations: [createReservation("confirmed")] });
  const result = await service.runPreHoldRecheck(createStay(), "website");

  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "sold_out" && conflict.field === "stay"));
}

async function testNonBlockingStatusesDoNotBlock(): Promise<void> {
  const service = createService({ reservations: [createReservation("cancelled")] });
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
  const service = createService({
    reservations: [
      createReservation("pending_transfer_submission", {
        id: "res_same",
      }),
    ],
  });

  const result = await service.runPreHoldRecheck(createStay(), "transfer", "res_same");
  assert.equal(result.isAvailable, true);
}

async function testCalendarBlocksRejectBlockedDateRanges(): Promise<void> {
  const service = createService({
    blocks: [
      createBlock({
        id: "block_mayfair_hold",
        flatId: "mayfair",
        blockType: "soft_hold",
        startDate: "2026-07-10",
        endDate: "2026-07-12",
        expiresAt: "2026-07-01T11:00:00.000Z",
      }),
    ],
  });

  const result = await service.runInitialAvailabilityCheck(
    createStay({
      flatId: "mayfair",
      checkIn: "2026-07-10",
      checkOut: "2026-07-11",
    })
  );

  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "sold_out" && conflict.field === "stay"));
}

async function testCalendarBlocksRemainFlatSpecific(): Promise<void> {
  const service = createService({
    blocks: [
      createBlock({
        id: "block_mayfair_only",
        flatId: "mayfair",
        blockType: "hard_block",
        startDate: "2026-07-10",
        endDate: "2026-07-12",
      }),
    ],
  });

  const result = await service.runInitialAvailabilityCheck(
    createStay({
      flatId: "windsor",
      checkIn: "2026-07-10",
      checkOut: "2026-07-11",
    })
  );

  assert.equal(result.isAvailable, true);
}

async function testOutOfServiceReadinessPreventsCasualBookability(): Promise<void> {
  const service = createService({
    readinessByFlat: {
      mayfair: createReadiness({
        readinessStatus: "out_of_service",
        maintenanceStatus: "blocked",
      }),
    },
  });

  const result = await service.runInitialAvailabilityCheck(createStay());
  assert.equal(result.isAvailable, false);
  assert.ok(result.conflicts.some((conflict) => conflict.code === "sold_out" && conflict.field === "flat"));
  assert.ok(result.reasons.some((reason) => reason.toLowerCase().includes("out of service")));
}

async function testNeedsAttentionSurfacesWarningWithoutBlocking(): Promise<void> {
  const service = createService({
    readinessByFlat: {
      mayfair: createReadiness({
        readinessStatus: "needs_attention",
        consumablesStatus: "attention_required",
      }),
    },
  });

  const result = await service.runInitialAvailabilityCheck(createStay());
  assert.equal(result.isAvailable, true);
  assert.equal(result.conflicts.length, 0);
  assert.ok(result.reasons.some((reason) => reason.toLowerCase().includes("needs attention")));
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
  await testCalendarBlocksRejectBlockedDateRanges();
  await testCalendarBlocksRemainFlatSpecific();
  await testOutOfServiceReadinessPreventsCasualBookability();
  await testNeedsAttentionSurfacesWarningWithoutBlocking();

  console.log("availability-service: ok");
}

void run();
