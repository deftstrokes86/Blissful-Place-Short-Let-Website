import assert from "node:assert/strict";

import { calculateBookingPricing } from "../../../lib/booking-pricing";
import {
  applyFlatPreselectionToStay,
  resolveBookingFlatPreselection,
  resolveFlatQueryParam,
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

async function testPricingSummaryUsesPreselectedFlat(): Promise<void> {
  const resolved = resolveBookingFlatPreselection({
    resumedDraftFlatId: null,
    urlFlatParam: "mayfair",
  });
  const stay = applyFlatPreselectionToStay(
    createStay({
      checkIn: "2026-04-04",
      checkOut: "2026-04-07",
      guests: 2,
    }),
    resolved.flatId
  );

  const selectedFlatRate = stay.flatId === "windsor" ? FLAT_RATES.windsor : stay.flatId === "kensington" ? FLAT_RATES.kensington : stay.flatId === "mayfair" ? FLAT_RATES.mayfair : null;
  const pricing = calculateBookingPricing({
    selectedFlatRate,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    selectedExtraIds: stay.extraIds,
    extrasCatalog,
  });

  assert.equal(stay.flatId, "mayfair");
  assert.equal(pricing.nights, 3);
  assert.equal(pricing.staySubtotal, (selectedFlatRate ?? 0) * 3);
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

async function testResumedDraftFlatTakesPrecedenceOverUrlFlat(): Promise<void> {
  const resolved = resolveBookingFlatPreselection({
    resumedDraftFlatId: "windsor",
    urlFlatParam: "mayfair",
  });

  assert.equal(resolved.source, "draft");
  assert.equal(resolved.flatId, "windsor");
}

async function run(): Promise<void> {
  await testValidFlatQueryPreselectsExpectedFlat();
  await testInvalidFlatQueryFailsGracefully();
  await testPricingSummaryUsesPreselectedFlat();
  await testUserCanStillChangeFlatAfterPreselection();
  await testResumedDraftFlatTakesPrecedenceOverUrlFlat();

  console.log("booking-flat-preselection: ok");
}

void run();
