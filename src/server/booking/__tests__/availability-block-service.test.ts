import assert from "node:assert/strict";

import {
  AvailabilityBlockService,
  type AvailabilityBlockRepository,
  type AvailabilityBlockingReservation,
} from "../availability-block-service";
import { CalendarAvailabilityService } from "../calendar-availability-service";
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
  let sequence = 0;
  const service = new AvailabilityBlockService({
    repository,
    now: () => new Date("2026-09-10T10:00:00.000Z"),
    createId: () => {
      sequence += 1;
      return `block_${String(sequence).padStart(3, "0")}`;
    },
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

async function testCreateMaintenanceManualBlock(): Promise<void> {
  const { service } = createServiceHarness();

  const block = await service.createManualBlock({
    flatId: "mayfair",
    startDate: "2026-09-15",
    endDate: "2026-09-18",
    manualBlockType: "maintenance",
    reason: "Scheduled HVAC maintenance",
    notes: "Tower B mechanical room work",
    createdBy: "staff_ops_1",
  });

  assert.equal(block.sourceType, "manual");
  assert.equal(block.manualBlockType, "maintenance");
  assert.equal(block.blockType, "hard_block");
  assert.equal(block.reason, "Scheduled HVAC maintenance");
  assert.equal(block.notes, "Tower B mechanical room work");
  assert.equal(block.createdBy, "staff_ops_1");
}

async function testCreateOwnerBlackoutManualBlock(): Promise<void> {
  const { service } = createServiceHarness();

  const block = await service.createManualBlock({
    flatId: "kensington",
    startDate: "2026-10-03",
    endDate: "2026-10-07",
    manualBlockType: "owner_blackout",
    reason: "Owner personal stay",
  });

  assert.equal(block.sourceType, "manual");
  assert.equal(block.manualBlockType, "owner_blackout");
  assert.equal(block.blockType, "hard_block");
}

async function testCreateAdminManualBlock(): Promise<void> {
  const { service } = createServiceHarness();

  const block = await service.createManualBlock({
    flatId: "windsor",
    startDate: "2026-11-01",
    endDate: "2026-11-04",
    manualBlockType: "admin_block",
    reason: "Temporary operational hold",
  });

  assert.equal(block.sourceType, "manual");
  assert.equal(block.manualBlockType, "admin_block");
  assert.equal(block.blockType, "hard_block");
}

async function testManualBlockRejectsInvalidDateRange(): Promise<void> {
  const { service } = createServiceHarness();

  await assert.rejects(
    async () => {
      await service.createManualBlock({
        flatId: "mayfair",
        startDate: "2026-09-19",
        endDate: "2026-09-18",
        manualBlockType: "maintenance",
        reason: "Invalid window",
      });
    },
    /Invalid reservation date window/
  );
}

async function testManualBlockMakesDatesUnavailableInAvailabilityQuery(): Promise<void> {
  const { service, repository } = createServiceHarness();

  await service.createManualBlock({
    flatId: "mayfair",
    startDate: "2026-09-20",
    endDate: "2026-09-22",
    manualBlockType: "maintenance",
    reason: "Room deep clean",
  });

  const calendarService = new CalendarAvailabilityService({
    repository: {
      listByFlat: (flatId) => repository.listByFlat(flatId),
    },
    now: () => new Date("2026-09-20T09:00:00.000Z"),
  });

  const availability = await calendarService.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-09-20",
    checkOut: "2026-09-21",
  });

  assert.equal(availability.isAvailable, false);
  assert.equal(availability.overlappingBlocks.length, 1);
  assert.equal(availability.overlappingBlocks[0].sourceType, "manual");
  assert.equal(availability.overlappingBlocks[0].blockType, "hard_block");
}

async function testReleasingManualBlockDoesNotTouchReservationBlock(): Promise<void> {
  const { service, repository } = createServiceHarness();

  const reservation = createReservation("confirmed");
  const reservationBlock = await service.syncReservationBlock(reservation);
  assert.ok(reservationBlock);

  const manualBlock = await service.createManualBlock({
    flatId: "mayfair",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    manualBlockType: "admin_block",
    reason: "Operational lock",
  });

  const released = await service.releaseManualBlock(manualBlock.sourceId);
  assert.equal(released.status, "released");
  assert.ok(released.releasedAt);

  const stillActiveReservationBlock = await repository.findBySource("reservation", reservation.id);
  assert.ok(stillActiveReservationBlock);
  assert.equal(stillActiveReservationBlock?.status, "active");
}

async function run(): Promise<void> {
  await testConfirmedCreatesHardBlock();
  await testPendingTransferCreatesSoftHold();
  await testAwaitingTransferVerificationRetainsSoftHold();
  await testCancelledReleasesBlock();
  await testExpiredReleasesBlock();
  await testInvalidDateRangesAreRejected();
  await testCheckInInclusiveAndCheckOutExclusiveSemantics();
  await testCreateMaintenanceManualBlock();
  await testCreateOwnerBlackoutManualBlock();
  await testCreateAdminManualBlock();
  await testManualBlockRejectsInvalidDateRange();
  await testManualBlockMakesDatesUnavailableInAvailabilityQuery();
  await testReleasingManualBlockDoesNotTouchReservationBlock();

  console.log("availability-block-service: ok");
}

void run();
