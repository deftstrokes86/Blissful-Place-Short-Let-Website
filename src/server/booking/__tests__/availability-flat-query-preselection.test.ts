import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testAvailabilityPageReadsFlatQueryParamOnLoad(): Promise<void> {
  const source = readSource("src/app/availability/page.tsx");

  assert.ok(source.includes('new URLSearchParams(window.location.search)'));
  assert.ok(source.includes('searchParams.get("flat")'));
  assert.ok(source.includes("resolveFlatQueryParam"));
  assert.ok(source.includes("setSelectedFlat(preselectedFlatId)"));
}

async function run(): Promise<void> {
  await testAvailabilityPageReadsFlatQueryParamOnLoad();

  console.log("availability-flat-query-preselection: ok");
}

void run();
