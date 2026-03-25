import assert from "node:assert/strict";

import {
  buildAvailabilityCalendarDays,
  canNavigateToPreviousMonth,
  filterSelectableCalendarDays,
  shiftYearMonth,
} from "../../../lib/availability-calendar";

async function testPastDatesAreDisabledAndFutureDatesSelectable(): Promise<void> {
  const days = buildAvailabilityCalendarDays({
    year: 2026,
    month: 3,
    blockedSpans: [],
    todayIso: "2026-03-15",
  });

  const pastDay = days.find((entry) => entry.day === 10);
  const todayDay = days.find((entry) => entry.day === 15);
  const futureDay = days.find((entry) => entry.day === 20);

  assert.equal(pastDay?.status, "past");
  assert.equal(pastDay?.isSelectable, false);

  assert.equal(todayDay?.status, "available");
  assert.equal(todayDay?.isSelectable, true);

  assert.equal(futureDay?.status, "available");
  assert.equal(futureDay?.isSelectable, true);
}

async function testBlockedDatesRemainDistinctFromPastDates(): Promise<void> {
  const days = buildAvailabilityCalendarDays({
    year: 2026,
    month: 3,
    blockedSpans: [
      {
        blockId: "b1",
        startDate: "2026-03-20",
        endDate: "2026-03-23",
        blockType: "soft_hold",
      },
    ],
    todayIso: "2026-03-15",
  });

  const blockedDay = days.find((entry) => entry.day === 21);
  const pastDay = days.find((entry) => entry.day === 10);

  assert.equal(blockedDay?.status, "blocked");
  assert.equal(blockedDay?.isSelectable, false);
  assert.equal(blockedDay?.statusLabel, "Held");

  assert.equal(pastDay?.status, "past");
  assert.equal(pastDay?.statusLabel, "Past");
}

async function testPreviousMonthNavigationGuard(): Promise<void> {
  assert.equal(
    canNavigateToPreviousMonth({
      selectedYear: 2026,
      selectedMonth: 3,
      minimumYear: 2026,
      minimumMonth: 3,
    }),
    false,
  );

  assert.equal(
    canNavigateToPreviousMonth({
      selectedYear: 2026,
      selectedMonth: 4,
      minimumYear: 2026,
      minimumMonth: 3,
    }),
    true,
  );
}

async function testYearMonthShiftHandlesBoundaries(): Promise<void> {
  const next = shiftYearMonth({ year: 2026, month: 12, delta: 1 });
  const prev = shiftYearMonth({ year: 2026, month: 1, delta: -1 });

  assert.deepEqual(next, { year: 2027, month: 1 });
  assert.deepEqual(prev, { year: 2025, month: 12 });
}

async function testSelectedDaysAreSanitizedWhenAvailabilityChanges(): Promise<void> {
  const days = buildAvailabilityCalendarDays({
    year: 2026,
    month: 3,
    blockedSpans: [
      {
        blockId: "b2",
        startDate: "2026-03-20",
        endDate: "2026-03-22",
        blockType: "reservation",
      },
    ],
    todayIso: "2026-03-15",
  });

  const sanitized = filterSelectableCalendarDays([10, 15, 20, 21, 23], days);

  assert.deepEqual(sanitized, [15, 23]);
}

async function run(): Promise<void> {
  await testPastDatesAreDisabledAndFutureDatesSelectable();
  await testBlockedDatesRemainDistinctFromPastDates();
  await testPreviousMonthNavigationGuard();
  await testYearMonthShiftHandlesBoundaries();
  await testSelectedDaysAreSanitizedWhenAvailabilityChanges();

  console.log("availability-calendar-ui-logic: ok");
}

void run();

