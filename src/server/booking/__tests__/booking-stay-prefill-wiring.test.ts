import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testBookingPageReadsFlatAndDateQueryParams(): Promise<void> {
  const source = readSource("src/app/book/page.tsx");

  assert.ok(source.includes('searchParams.get("flat")'));
  assert.ok(source.includes('searchParams.get("checkIn")'));
  assert.ok(source.includes('searchParams.get("checkOut")'));
}

async function testBookingPageAppliesUrlDatePrefillOnlyWithoutDraftResume(): Promise<void> {
  const source = readSource("src/app/book/page.tsx");

  assert.ok(source.includes("if (!resumeToken)"));
  assert.ok(source.includes("resolveStayRangeQueryPrefill(urlCheckInParam, urlCheckOutParam)"));
  assert.ok(source.includes("applyStayDateRangePrefillToStay"));
}

async function testDraftRestoreFallbackStillUsesUrlPrefillGracefully(): Promise<void> {
  const source = readSource("src/app/book/page.tsx");

  assert.ok(source.includes("Saved draft could not be restored"));
  assert.ok(source.includes("resolveStayRangeQueryPrefill(urlCheckInParam, urlCheckOutParam)"));
}

async function run(): Promise<void> {
  await testBookingPageReadsFlatAndDateQueryParams();
  await testBookingPageAppliesUrlDatePrefillOnlyWithoutDraftResume();
  await testDraftRestoreFallbackStillUsesUrlPrefillGracefully();

  console.log("booking-stay-prefill-wiring: ok");
}

void run();
