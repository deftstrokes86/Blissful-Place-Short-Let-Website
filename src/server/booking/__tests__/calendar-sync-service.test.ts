import assert from "node:assert/strict";

import {
  CalendarSyncService,
  type CalendarSyncReservation,
  type ReservationCalendarSyncEvent,
} from "../calendar-sync-service";
import type {
  AvailabilityBlockRecord,
  AvailabilityBlockSourceType,
} from "../../../types/booking-backend";
import type { FlatId, ReservationStatus } from "../../../types/booking";

class InMemoryAvailabilityBlockRepository {
  private readonly blocksById = new Map<string, AvailabilityBlockRecord>();
  createCalls = 0;
  updateCalls = 0;

  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.createCalls += 1;
    this.blocksById.set(block.id, cloneBlock(block));
    return cloneBlock(block);
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.updateCalls += 1;
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

function createReservation(
  status: ReservationStatus,
  overrides?: Partial<CalendarSyncReservation>
): CalendarSyncReservation {
  return {
    id: "res_001",
    status,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
    },
    transferHoldExpiresAt: "2026-10-10T11:00:00.000Z",
    ...overrides,
  };
}

function createHarness() {
  const repository = new InMemoryAvailabilityBlockRepository();
  const service = new CalendarSyncService({
    repository,
    now: () => new Date("2026-10-10T10:00:00.000Z"),
    createId: () => "block_001",
  });

  return {
    service,
    repository,
  };
}

async function testConfirmedCreatesHardBlock(): Promise<void> {
  const { service } = createHarness();

  const result = await service.syncFromReservation(createReservation("confirmed"));

  assert.equal(result.action, "created");
  assert.ok(result.block);
  assert.equal(result.block?.blockType, "hard_block");
  assert.equal(result.block?.status, "active");
}

async function testPendingTransferCreatesSoftHold(): Promise<void> {
  const { service } = createHarness();

  const result = await service.syncFromReservation(createReservation("pending_transfer_submission"));

  assert.equal(result.action, "created");
  assert.equal(result.block?.blockType, "soft_hold");
  assert.equal(result.block?.expiresAt, "2026-10-10T11:00:00.000Z");
}

async function testStatusTransitionUpdatesBlockTypeCorrectly(): Promise<void> {
  const { service } = createHarness();

  await service.syncFromReservation(createReservation("pending_transfer_submission"));
  const updated = await service.syncFromReservation(createReservation("confirmed"));

  assert.equal(updated.action, "updated");
  assert.equal(updated.block?.blockType, "hard_block");
  assert.equal(updated.block?.expiresAt, null);
}

async function testCancellationReleasesBlock(): Promise<void> {
  const { service } = createHarness();

  await service.syncFromReservation(createReservation("confirmed"));
  const released = await service.syncFromReservation(createReservation("cancelled"));

  assert.equal(released.action, "released");
  assert.equal(released.block, null);
}

async function testExpiryReleasesBlock(): Promise<void> {
  const { service } = createHarness();

  await service.syncFromReservation(createReservation("pending_transfer_submission"));
  const released = await service.syncFromReservation(createReservation("expired"));

  assert.equal(released.action, "released");
  assert.equal(released.block, null);
}

async function testRepeatedSyncIsIdempotent(): Promise<void> {
  const { service, repository } = createHarness();

  const first = await service.syncFromReservation(createReservation("confirmed"));
  const second = await service.syncFromReservation(createReservation("confirmed"));

  assert.equal(first.action, "created");
  assert.equal(second.action, "unchanged");
  assert.equal(repository.createCalls, 1);
  assert.equal(repository.updateCalls, 0);
}

async function testChangedDatesResyncCorrectly(): Promise<void> {
  const { service } = createHarness();

  await service.syncFromReservation(createReservation("pending_transfer_submission"));
  const updated = await service.syncFromReservation(
    createReservation("pending_transfer_submission", {
      stay: {
        flatId: "mayfair",
        checkIn: "2026-10-12",
        checkOut: "2026-10-15",
      },
    })
  );

  assert.equal(updated.action, "updated");
  assert.equal(updated.block?.startDate, "2026-10-12");
  assert.equal(updated.block?.endDate, "2026-10-15");
}

async function testSameSourceDoesNotCreateDuplicateBlocks(): Promise<void> {
  const { service, repository } = createHarness();

  await service.syncFromReservation(createReservation("pending_transfer_submission"));
  await service.syncFromReservation(createReservation("awaiting_transfer_verification"));
  await service.syncFromReservation(createReservation("confirmed"));

  const blocks = await repository.listByFlat("mayfair");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].sourceId, "res_001");
}

async function testSupportsEventInput(): Promise<void> {
  const { service } = createHarness();

  const event: ReservationCalendarSyncEvent = {
    type: "status_transitioned",
    reservation: createReservation("confirmed"),
  };

  const result = await service.syncFromEvent(event);
  assert.equal(result.action, "created");
}

async function testCheckInInclusiveCheckOutExclusiveSemantics(): Promise<void> {
  const { service } = createHarness();

  await service.syncFromReservation(createReservation("confirmed"));

  const overlap = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-10-12",
    checkOut: "2026-10-14",
  });
  assert.equal(overlap.length, 1);

  const edge = await service.findOverlappingActiveBlocks({
    flatId: "mayfair",
    checkIn: "2026-10-13",
    checkOut: "2026-10-15",
  });
  assert.equal(edge.length, 0);
}

async function run(): Promise<void> {
  await testConfirmedCreatesHardBlock();
  await testPendingTransferCreatesSoftHold();
  await testStatusTransitionUpdatesBlockTypeCorrectly();
  await testCancellationReleasesBlock();
  await testExpiryReleasesBlock();
  await testRepeatedSyncIsIdempotent();
  await testChangedDatesResyncCorrectly();
  await testSameSourceDoesNotCreateDuplicateBlocks();
  await testSupportsEventInput();
  await testCheckInInclusiveCheckOutExclusiveSemantics();

  console.log("calendar-sync-service: ok");
}

void run();
