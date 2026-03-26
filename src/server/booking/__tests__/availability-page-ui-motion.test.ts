import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testAvailabilityPageWiresMotionStatesAndDisabledPrevious(): Promise<void> {
  const source = readSource("src/app/availability/page.tsx");

  assert.ok(source.includes("availability-calendar-surface"));
  assert.ok(source.includes("transitionMode"));
  assert.ok(source.includes("previousMonthAllowed"));
  assert.ok(source.includes("disabled={!previousMonthAllowed}"));
}

async function testAvailabilityContinueCtaDependsOnBookingReadySelection(): Promise<void> {
  const source = readSource("src/app/availability/page.tsx");

  assert.ok(source.includes("continueToBookingEnabled = selectedStayRange !== null"));
  assert.ok(source.includes("aria-disabled={!continueToBookingEnabled}"));
  assert.ok(source.includes("availability-trip-lock"));
  assert.ok(source.includes("Ready for booking"));
}

async function testAvailabilityPageUsesDistinctDayStateClasses(): Promise<void> {
  const source = readSource("src/app/availability/page.tsx");

  assert.ok(source.includes("is-past"));
  assert.ok(source.includes("is-blocked"));
  assert.ok(source.includes("is-available"));
  assert.ok(source.includes("is-selected"));
}

async function run(): Promise<void> {
  await testAvailabilityPageWiresMotionStatesAndDisabledPrevious();
  await testAvailabilityContinueCtaDependsOnBookingReadySelection();
  await testAvailabilityPageUsesDistinctDayStateClasses();

  console.log("availability-page-ui-motion: ok");
}

void run();
