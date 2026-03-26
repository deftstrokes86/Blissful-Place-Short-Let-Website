import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  deriveFlatSelectionContextNote,
  deriveStayDateSelectionContextNote,
  resolveBookingFlatPreselection,
} from "../../../lib/booking-flat-preselection";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testSelectedFlatIndicatorRendering(): Promise<void> {
  const note = deriveFlatSelectionContextNote({
    urlFlatParam: "mayfair-suite",
    preselectionSource: "url",
    activeFlatId: "mayfair",
  });

  assert.match(note ?? "", /preselected/i);

  const stayStepSource = readSource("src/components/booking/steps/StayDetailsStep.tsx");
  assert.ok(stayStepSource.includes("flatSelectionContextNote &&"));
  assert.ok(stayStepSource.includes("booking-inline-note booking-inline-note-muted"));
  assert.ok(stayStepSource.includes("payment-plan-card"));
  assert.ok(stayStepSource.includes('"selected"'));
}

async function testInvalidFlatGracefulFallbackNotice(): Promise<void> {
  const note = deriveFlatSelectionContextNote({
    urlFlatParam: "invalid-flat-slug",
    preselectionSource: "none",
    activeFlatId: "",
  });

  assert.match(note ?? "", /couldn't match that residence/i);

  const clearedAfterManualSelection = deriveFlatSelectionContextNote({
    urlFlatParam: "invalid-flat-slug",
    preselectionSource: "none",
    activeFlatId: "windsor",
  });

  assert.equal(clearedAfterManualSelection, null);
}

async function testManualFlatSwitchClearsPreselectionHint(): Promise<void> {
  const beforeSwitch = deriveFlatSelectionContextNote({
    urlFlatParam: "kensington",
    preselectionSource: "url",
    activeFlatId: "kensington",
  });
  const afterSwitch = deriveFlatSelectionContextNote({
    urlFlatParam: "kensington",
    preselectionSource: "url",
    activeFlatId: "windsor",
  });

  assert.match(beforeSwitch ?? "", /preselected/i);
  assert.equal(afterSwitch, null);
}

async function testDraftOverrideKeepsMessagingAndSelectionCoherent(): Promise<void> {
  const resolved = resolveBookingFlatPreselection({
    resumedDraftFlatId: "windsor",
    urlFlatParam: "mayfair",
  });

  assert.equal(resolved.source, "draft");
  assert.equal(resolved.flatId, "windsor");

  const note = deriveFlatSelectionContextNote({
    urlFlatParam: "mayfair",
    preselectionSource: resolved.source,
    activeFlatId: resolved.flatId,
  });

  assert.equal(note, null);
}

async function testBookingHandoffDateContextNoteRendering(): Promise<void> {
  const note = deriveStayDateSelectionContextNote({
    preselectionSource: "url",
    activeCheckIn: "2026-04-10",
    activeCheckOut: "2026-04-12",
  });

  assert.match(note ?? "", /availability/i);

  const stayStepSource = readSource("src/components/booking/steps/StayDetailsStep.tsx");
  const bookPageSource = readSource("src/app/book/page.tsx");

  assert.ok(stayStepSource.includes("stayDateSelectionContextNote"));
  assert.ok(bookPageSource.includes("stayDateSelectionContextNote={stayDateSelectionContextNote}"));
}

async function testDraftDateSelectionDoesNotShowAvailabilityOriginMessage(): Promise<void> {
  const note = deriveStayDateSelectionContextNote({
    preselectionSource: "draft",
    activeCheckIn: "2026-04-10",
    activeCheckOut: "2026-04-12",
  });

  assert.equal(note, null);
}

async function testBookingSummaryReflectsPrefilledValuesAndStillAllowsEdits(): Promise<void> {
  const summarySource = readSource("src/components/booking/BookingSummaryCard.tsx");
  const bookingPageSource = readSource("src/app/book/page.tsx");

  assert.ok(summarySource.includes('checkIn || "--"'));
  assert.ok(summarySource.includes('checkOut || "--"'));
  assert.ok(bookingPageSource.includes('setStayDatePreselectionSource("none")'));
}

async function run(): Promise<void> {
  await testSelectedFlatIndicatorRendering();
  await testInvalidFlatGracefulFallbackNotice();
  await testManualFlatSwitchClearsPreselectionHint();
  await testDraftOverrideKeepsMessagingAndSelectionCoherent();
  await testBookingHandoffDateContextNoteRendering();
  await testDraftDateSelectionDoesNotShowAvailabilityOriginMessage();
  await testBookingSummaryReflectsPrefilledValuesAndStillAllowsEdits();

  console.log("booking-flat-preselection-ux: ok");
}

void run();
