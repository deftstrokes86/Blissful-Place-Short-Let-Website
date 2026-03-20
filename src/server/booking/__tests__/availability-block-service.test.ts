import assert from "node:assert/strict";

import {
  AvailabilityBlockService,
  type AvailabilityBlockRepository,
  type AvailabilityBlockingReservation,
} from "../availability-block-service";
import type {
  AvailabilityBlockRecord,
  AvailabilityBlockSourceType,
} from "../../../types/booking-backend";
import type { FlatId, ReservationStatus } from "../../../types/booking";

class InMemoryAvailabilityBlockRepository implements AvailabilityBlockRepository {
  private readonly blocksById = new Map<string, AvailabilityBlockRecord>();

  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.blocksById.set(block.id, cloneBlock(block));
    return cloneBlock(block);
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    if (!this.blocksById.has(block.id)) {
      throw new Error("Availability block not found.");
    }

    this.blocksById.set(block.id, cloneBlock(block));
    return cloneBlock(block);
  }

  async findBySource(
    sourceType: AvailabilityBlockSourceType,
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null> {
    for (const block of this.blocksById.values()) {
      if (block.sourceType === sourceType && block.sourceId === sourceId) {
        return cloneBlock(block);
      }
    }

    return null;
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    return Array.from(this.blocksById.values())
      .filter((block) => block.flatId === flatId)
      .map(cloneBlock);
  }
}

function cloneBlock(value: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...value,
  };
}

function createReservation(status: ReservationStatus): AvailabilityBlockingReservation {
  return {
    id: "res_001",
    status,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
    },
    transferHoldExpiresAt: "2026-09-10T11:00:00.000Z",
  };
}

function createServiceHarness() {
  const repository = new InMemoryAvailabilityBlockRepository();
  const service = new AvailabilityBlockService({
    repository,
    now: () => new Date("2026-09-10T10:00:00.000Z"),
    createId: () => "block_001",
  });

  return {
    service,
    repository,
  };
}

async function testConfirmedCreatesHardBlock(): Promise<void> {
  const { service } = createServiceHarness();
  const reservation = createReservation("confirmed");

  const block = await service.syncReservationBlock(reservation);
  assert.ok(block);
  assert.equal(block.blockType, "hard_block");
  assert.equal(block.status, "active");
  assert.equal(block.expiresAt, null);
}

async function testPendingTransferCreatesSoftHold(): Promise<void> {
  const { service } = createServiceHarness();
  const reservation = createReservation("pending_transfer_submission");

  const block = await service.syncReservationBlock(reservation);
  assert.ok(block);
  assert.equal(block.blockType, "soft_hold");
  assert.equal(block.status, "active");
  assert.equal(block.expiresAt, "2026-09-10T11:00:00.000Z");
}

async function testAwaitingTransferVerificationRetainsSoftHold(): Promise<void> {
  const { service, repository } = createServiceHarness();

  await service.syncReservationBlock(createReservation("pending_transfer_submission"));
  const updated = await service.syncReservationBlock(createReservation("awaiting_transfer_verification"));

  assert.ok(updated);
  assert.equal(updated.id, "block_001");
  assert.equal(updated.blockType, "soft_hold");
  assert.equal(updated.status, "active");

  const allBlocks = await repository.listByFlat("mayfair");
  assert.equal(allBlocks.length, 1);
}

async function testCancelledReleasesBlock(): Promise<void> {
  const { service } = createServiceHarness();
  await service.syncReservationBlock(createReservation("pending_transfer_submission"));

  const released = await service.syncReservationBlock(createReservation("cancelled"));
  assert.equal(released, null);

  const overlaps = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-09-10",
    checkOut: "2026-09-11",
  });

  assert.equal(overlaps.length, 0);
}

async function testExpiredReleasesBlock(): Promise<void> {
  const { service } = createServiceHarness();
  await service.syncReservationBlock(createReservation("confirmed"));

  const released = await service.syncReservationBlock(createReservation("expired"));
  assert.equal(released, null);

  const overlaps = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-09-10",
    checkOut: "2026-09-11",
  });

  assert.equal(overlaps.length, 0);
}

async function testInvalidDateRangesAreRejected(): Promise<void> {
  const { service } = createServiceHarness();
  const reservation = createReservation("confirmed");
  reservation.stay.checkIn = "2026-09-13";
  reservation.stay.checkOut = "2026-09-10";

  await assert.rejects(
    async () => {
      await service.syncReservationBlock(reservation);
    },
    /Invalid reservation date window/
  );
}

async function testCheckInInclusiveAndCheckOutExclusiveSemantics(): Promise<void> {
  const { service } = createServiceHarness();
  await service.syncReservationBlock(createReservation("confirmed"));

  const inside = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-09-12",
    checkOut: "2026-09-14",
  });
  assert.equal(inside.length, 1, "Expected overlap when requested check-in lands inside an active block.");

  const edge = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-09-13",
    checkOut: "2026-09-15",
  });
  assert.equal(edge.length, 0, "Expected no overlap when requested check-in equals blocked check-out.");
}

async function run(): Promise<void> {
  await testConfirmedCreatesHardBlock();
  await testPendingTransferCreatesSoftHold();
  await testAwaitingTransferVerificationRetainsSoftHold();
  await testCancelledReleasesBlock();
  await testExpiredReleasesBlock();
  await testInvalidDateRangesAreRejected();
  await testCheckInInclusiveAndCheckOutExclusiveSemantics();

  console.log("availability-block-service: ok");
}

void run();



