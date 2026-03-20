import assert from "node:assert/strict";

import {
  CalendarAvailabilityService,
  CalendarOverlapError,
  type CalendarAvailabilityRepository,
} from "../calendar-availability-service";
import type { AvailabilityBlockRecord } from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryCalendarAvailabilityRepository implements CalendarAvailabilityRepository {
  private readonly blocks: AvailabilityBlockRecord[];

  constructor(blocks: AvailabilityBlockRecord[]) {
    this.blocks = blocks.map(cloneBlock);
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    return this.blocks.filter((block) => block.flatId === flatId).map(cloneBlock);
  }
}

function cloneBlock(value: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...value,
  };
}

function createBlock(overrides?: Partial<AvailabilityBlockRecord>): AvailabilityBlockRecord {
  return {
    id: "block_1",
    flatId: "mayfair",
    sourceType: "reservation",
    sourceId: "res_1",
    blockType: "hard_block",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    status: "active",
    expiresAt: null,
    releasedAt: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function createHarness(blocks: AvailabilityBlockRecord[]) {
  const repository = new InMemoryCalendarAvailabilityRepository(blocks);
  const service = new CalendarAvailabilityService({
    repository,
    now: () => new Date("2026-10-10T10:00:00.000Z"),
  });

  return {
    service,
  };
}

async function testConfirmedBookingBlocksOverlap(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_confirmed",
      blockType: "hard_block",
      startDate: "2026-10-10",
      endDate: "2026-10-13",
    }),
  ]);

  const result = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-11",
    checkOut: "2026-10-14",
  });

  assert.equal(result.isAvailable, false);
  assert.equal(result.overlappingBlocks.length, 1);
  assert.equal(result.overlappingBlocks[0].blockType, "hard_block");

  await assert.rejects(
    async () => {
      await service.assertCanCreateReservation({
        flatId: "mayfair",
        checkIn: "2026-10-11",
        checkOut: "2026-10-14",
      });
    },
    CalendarOverlapError
  );
}

async function testActiveTransferHoldBlocksOverlap(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_hold_active",
      blockType: "soft_hold",
      startDate: "2026-10-10",
      endDate: "2026-10-13",
      expiresAt: "2026-10-10T11:00:00.000Z",
    }),
  ]);

  const result = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-12",
    checkOut: "2026-10-14",
  });

  assert.equal(result.isAvailable, false);
  assert.equal(result.overlappingBlocks.length, 1);
  assert.equal(result.overlappingBlocks[0].blockType, "soft_hold");
}

async function testExpiredHoldNoLongerBlocks(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_hold_expired",
      blockType: "soft_hold",
      startDate: "2026-10-10",
      endDate: "2026-10-13",
      expiresAt: "2026-10-10T09:59:00.000Z",
    }),
  ]);

  const result = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-11",
    checkOut: "2026-10-12",
  });

  assert.equal(result.isAvailable, true);
  assert.equal(result.overlappingBlocks.length, 0);
}

async function testAdjacentBookingsAllowed(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_adjacent",
      startDate: "2026-10-10",
      endDate: "2026-10-13",
    }),
  ]);

  const after = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-13",
    checkOut: "2026-10-15",
  });

  const before = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-08",
    checkOut: "2026-10-10",
  });

  assert.equal(after.isAvailable, true);
  assert.equal(before.isAvailable, true);
}

async function testMonthAndRangeQueriesReturnExpectedSpans(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_soft_active",
      blockType: "soft_hold",
      startDate: "2026-10-05",
      endDate: "2026-10-07",
      expiresAt: "2026-10-10T12:00:00.000Z",
    }),
    createBlock({
      id: "block_hard_cross_month",
      blockType: "hard_block",
      startDate: "2026-10-30",
      endDate: "2026-11-03",
      expiresAt: null,
    }),
    createBlock({
      id: "block_soft_expired",
      blockType: "soft_hold",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      expiresAt: "2026-10-10T09:00:00.000Z",
    }),
  ]);

  const month = await service.queryBlockedDatesForMonth({
    flatId: "mayfair",
    year: 2026,
    month: 10,
  });

  assert.equal(month.blockedSpans.length, 2);
  assert.deepEqual(
    month.blockedSpans.map((span) => ({ id: span.blockId, start: span.startDate, end: span.endDate })),
    [
      { id: "block_soft_active", start: "2026-10-05", end: "2026-10-07" },
      { id: "block_hard_cross_month", start: "2026-10-30", end: "2026-11-01" },
    ]
  );

  const range = await service.queryFlatAvailability({
    flatId: "mayfair",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
  });

  assert.equal(range.blockedSpans.length, 2);
  assert.equal(range.blockedSpans[1].startDate, "2026-10-30");
  assert.equal(range.blockedSpans[1].endDate, "2026-10-31");
}

async function testDifferentFlatsShowDifferentAvailability(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_windsor",
      flatId: "windsor",
      startDate: "2026-10-12",
      endDate: "2026-10-14",
    }),
    createBlock({
      id: "block_mayfair",
      flatId: "mayfair",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
    }),
  ]);

  const windsorMonth = await service.queryBlockedDatesForMonth({
    flatId: "windsor",
    year: 2026,
    month: 10,
  });

  const mayfairMonth = await service.queryBlockedDatesForMonth({
    flatId: "mayfair",
    year: 2026,
    month: 10,
  });

  assert.equal(windsorMonth.blockedSpans.length, 1);
  assert.equal(windsorMonth.blockedSpans[0].blockId, "block_windsor");

  assert.equal(mayfairMonth.blockedSpans.length, 1);
  assert.equal(mayfairMonth.blockedSpans[0].blockId, "block_mayfair");
}

async function testBoundaryOverlapSemantics(): Promise<void> {
  const { service } = createHarness([
    createBlock({
      id: "block_boundary",
      startDate: "2026-10-10",
      endDate: "2026-10-13",
    }),
  ]);

  const noOverlapAtStart = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-09",
    checkOut: "2026-10-10",
  });

  const noOverlapAtEnd = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-13",
    checkOut: "2026-10-14",
  });

  const overlapInside = await service.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-10-12",
    checkOut: "2026-10-13",
  });

  assert.equal(noOverlapAtStart.isAvailable, true);
  assert.equal(noOverlapAtEnd.isAvailable, true);
  assert.equal(overlapInside.isAvailable, false);
}

async function run(): Promise<void> {
  await testConfirmedBookingBlocksOverlap();
  await testActiveTransferHoldBlocksOverlap();
  await testExpiredHoldNoLongerBlocks();
  await testAdjacentBookingsAllowed();
  await testMonthAndRangeQueriesReturnExpectedSpans();
  await testDifferentFlatsShowDifferentAvailability();
  await testBoundaryOverlapSemantics();

  console.log("calendar-availability-service: ok");
}

void run();

