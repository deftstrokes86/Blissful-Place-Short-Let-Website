import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  deriveFlatSelectionContextNote,
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

async function run(): Promise<void> {
  await testSelectedFlatIndicatorRendering();
  await testInvalidFlatGracefulFallbackNotice();
  await testManualFlatSwitchClearsPreselectionHint();
  await testDraftOverrideKeepsMessagingAndSelectionCoherent();

  console.log("booking-flat-preselection-ux: ok");
}

void run();
