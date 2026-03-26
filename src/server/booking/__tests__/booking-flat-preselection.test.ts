import assert from "node:assert/strict";

import { calculateBookingPricing } from "../../../lib/booking-pricing";
import {
  applyFlatPreselectionToStay,
  applyStayDateRangePrefillToStay,
  buildBookingHref,
  deriveSelectedDateRangeForBooking,
  resolveBookingFlatPreselection,
  resolveBookingStayDatePreselection,
  resolveFlatQueryParam,
  resolveStayRangeQueryPrefill,
} from "../../../lib/booking-flat-preselection";
import type { ExtraId, FlatId, StayFormState } from "../../../types/booking";

const FLAT_RATES: Record<FlatId, number> = {
  windsor: 150000,
  kensington: 180000,
  mayfair: 250000,
};

const EMPTY_STAY: StayFormState = {
  flatId: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
  extraIds: [],
};

const extrasCatalog: Array<{ id: ExtraId; price: number }> = [
  { id: "airport", price: 65000 },
  { id: "pantry", price: 45000 },
  { id: "celebration", price: 75000 },
];

function createStay(overrides?: Partial<StayFormState>): StayFormState {
  return {
    ...EMPTY_STAY,
    ...overrides,
  };
}

async function testValidFlatQueryPreselectsExpectedFlat(): Promise<void> {
  const resolved = resolveBookingFlatPreselection({
    resumedDraftFlatId: null,
    urlFlatParam: "kensington-lodge",
  });

  assert.equal(resolved.source, "url");
  assert.equal(resolved.flatId, "kensington");
}

async function testInvalidFlatQueryFailsGracefully(): Promise<void> {
  assert.equal(resolveFlatQueryParam(""), null);
  assert.equal(resolveFlatQueryParam("not-a-flat"), null);
  assert.equal(
    resolveBookingFlatPreselection({
      resumedDraftFlatId: null,
      urlFlatParam: "unknown-suite",
    }).source,
    "none"
  );
}

async function testAvailabilitySelectionBuildsBookingUrlWithFlatAndDates(): Promise<void> {
  const range = deriveSelectedDateRangeForBooking({
    year: 2026,
    month: 4,
    selectedDays: [12, 13, 14],
  });

  assert.deepEqual(range, {
    checkIn: "2026-04-12",
    checkOut: "2026-04-15",
  });

  assert.equal(
    buildBookingHref("mayfair", range),
    "/book?flat=mayfair&checkIn=2026-04-12&checkOut=2026-04-15"
  );
}

async function testBuildBookingHrefSkipsInvalidDateRangeButKeepsFlat(): Promise<void> {
  assert.equal(
    buildBookingHref("windsor", {
      checkIn: "bad-date",
      checkOut: "2026-04-15",
    }),
    "/book?flat=windsor"
  );
}

async function testBookingDateRangePrefillFromUrlValues(): Promise<void> {
  const resolvedRange = resolveStayRangeQueryPrefill("2026-04-12", "2026-04-15");
  const stay = applyStayDateRangePrefillToStay(createStay(), resolvedRange);

  assert.equal(stay.checkIn, "2026-04-12");
  assert.equal(stay.checkOut, "2026-04-15");
}

async function testPricingSummaryUsesUrlPrefilledFlatAndDates(): Promise<void> {
  const resolvedFlat = resolveBookingFlatPreselection({
    resumedDraftFlatId: null,
    urlFlatParam: "mayfair",
  });
  const resolvedRange = resolveStayRangeQueryPrefill("2026-04-04", "2026-04-07");

  const stayWithFlat = applyFlatPreselectionToStay(
    createStay({
      guests: 2,
    }),
    resolvedFlat.flatId
  );
  const stay = applyStayDateRangePrefillToStay(stayWithFlat, resolvedRange);

  const selectedFlatRate =
    stay.flatId === "windsor"
      ? FLAT_RATES.windsor
      : stay.flatId === "kensington"
      ? FLAT_RATES.kensington
      : stay.flatId === "mayfair"
      ? FLAT_RATES.mayfair
      : null;

  const pricing = calculateBookingPricing({
    selectedFlatRate,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    selectedExtraIds: stay.extraIds,
    extrasCatalog,
  });

  assert.equal(stay.flatId, "mayfair");
  assert.equal(stay.checkIn, "2026-04-04");
  assert.equal(stay.checkOut, "2026-04-07");
  assert.equal(pricing.nights, 3);
  assert.equal(pricing.staySubtotal, (selectedFlatRate ?? 0) * 3);
}

async function testInvalidFlatWithValidDatesStillPrefillsDates(): Promise<void> {
  const resolvedFlat = resolveBookingFlatPreselection({
    resumedDraftFlatId: null,
    urlFlatParam: "unknown-flat",
  });
  const resolvedRange = resolveStayRangeQueryPrefill("2026-04-04", "2026-04-07");

  const stayWithFlat = applyFlatPreselectionToStay(createStay(), resolvedFlat.flatId);
  const stay = applyStayDateRangePrefillToStay(stayWithFlat, resolvedRange);

  assert.equal(resolvedFlat.flatId, null);
  assert.equal(stay.flatId, "");
  assert.equal(stay.checkIn, "2026-04-04");
  assert.equal(stay.checkOut, "2026-04-07");
}

async function testUserCanStillChangeFlatAfterPreselection(): Promise<void> {
  const resolved = resolveBookingFlatPreselection({
    resumedDraftFlatId: null,
    urlFlatParam: "windsor-residence",
  });
  const preselected = applyFlatPreselectionToStay(createStay(), resolved.flatId);

  assert.equal(preselected.flatId, "windsor");

  const manuallyChanged: StayFormState = {
    ...preselected,
    flatId: "mayfair",
  };
  const afterReapplying = applyFlatPreselectionToStay(manuallyChanged, resolved.flatId);

  assert.equal(afterReapplying.flatId, "mayfair");
}

async function testUserCanStillChangeDatesAfterUrlPrefill(): Promise<void> {
  const prefilled = applyStayDateRangePrefillToStay(
    createStay(),
    resolveStayRangeQueryPrefill("2026-04-12", "2026-04-15")
  );

  const manuallyChanged: StayFormState = {
    ...prefilled,
    checkIn: "2026-04-20",
    checkOut: "2026-04-23",
  };

  const afterReapplying = applyStayDateRangePrefillToStay(
    manuallyChanged,
    resolveStayRangeQueryPrefill("2026-04-12", "2026-04-15")
  );

  assert.equal(afterReapplying.checkIn, "2026-04-20");
  assert.equal(afterReapplying.checkOut, "2026-04-23");
}

async function testResumedDraftStayDatesTakePrecedenceOverUrlDates(): Promise<void> {
  const resolved = resolveBookingStayDatePreselection({
    resumedDraftCheckIn: "2026-06-10",
    resumedDraftCheckOut: "2026-06-12",
    urlCheckInParam: "2026-07-01",
    urlCheckOutParam: "2026-07-04",
  });

  assert.equal(resolved.source, "draft");
  assert.deepEqual(resolved.range, {
    checkIn: "2026-06-10",
    checkOut: "2026-06-12",
  });
}

async function testInvalidUrlDatesFailGracefully(): Promise<void> {
  assert.equal(resolveStayRangeQueryPrefill("bad-date", "2026-04-12"), null);
  assert.equal(resolveStayRangeQueryPrefill("2026-04-12", "2026-04-10"), null);

  const nonContiguousRange = deriveSelectedDateRangeForBooking({
    year: 2026,
    month: 4,
    selectedDays: [12, 14],
  });

  assert.equal(nonContiguousRange, null);
}

async function run(): Promise<void> {
  await testValidFlatQueryPreselectsExpectedFlat();
  await testInvalidFlatQueryFailsGracefully();
  await testAvailabilitySelectionBuildsBookingUrlWithFlatAndDates();
  await testBuildBookingHrefSkipsInvalidDateRangeButKeepsFlat();
  await testBookingDateRangePrefillFromUrlValues();
  await testPricingSummaryUsesUrlPrefilledFlatAndDates();
  await testInvalidFlatWithValidDatesStillPrefillsDates();
  await testUserCanStillChangeFlatAfterPreselection();
  await testUserCanStillChangeDatesAfterUrlPrefill();
  await testResumedDraftStayDatesTakePrecedenceOverUrlDates();
  await testInvalidUrlDatesFailGracefully();

  console.log("booking-flat-preselection: ok");
}

void run();
