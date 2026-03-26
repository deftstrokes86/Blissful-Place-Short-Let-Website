import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testPropertyFlatMotionUsesSubtleTransitionModel(): Promise<void> {
  const source = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.ok(source.includes("useTransition"));
  assert.ok(source.includes("isSwitchPending"));
  assert.ok(source.includes("property-content-swap"));
  assert.ok(source.includes("property-summary-card"));
}

async function testRapidSwitchingDoesNotUseTimeoutRacePattern(): Promise<void> {
  const source = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.equal(source.includes("setTimeout("), false);
}

async function run(): Promise<void> {
  await testPropertyFlatMotionUsesSubtleTransitionModel();
  await testRapidSwitchingDoesNotUseTimeoutRacePattern();

  console.log("property-page-motion-ui: ok");
}

void run();
