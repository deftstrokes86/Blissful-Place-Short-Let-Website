import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildBookingHref } from "../../../lib/booking-flat-preselection";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testBuildBookingHrefForSpecificAndGenericCtas(): Promise<void> {
  assert.equal(buildBookingHref("windsor"), "/book?flat=windsor");
  assert.equal(buildBookingHref("kensington"), "/book?flat=kensington");
  assert.equal(buildBookingHref("mayfair"), "/book?flat=mayfair");
  assert.equal(buildBookingHref(null), "/book");
  assert.equal(buildBookingHref(), "/book");
}

async function testFeaturedResidenceCardsUseFlatSpecificBookingUrls(): Promise<void> {
  const source = readSource("src/components/home/HomeFeaturedResidencesSection.tsx");

  assert.ok(source.includes('buildBookingHref("windsor")'));
  assert.ok(source.includes('buildBookingHref("kensington")'));
  assert.ok(source.includes('buildBookingHref("mayfair")'));
}

async function testAvailabilityHandoffUsesSelectedFlatContext(): Promise<void> {
  const source = readSource("src/app/availability/page.tsx");

  assert.ok(source.includes("buildBookingHref(selectedFlat)"));
}

async function testGenericHeroBookingCtaRemainsGeneric(): Promise<void> {
  const source = readSource("src/components/home/HomeHeroSection.tsx");

  assert.ok(source.includes("buildBookingHref()"));
}

async function testPropertyPageCtaUsesMayfairBookingContext(): Promise<void> {
  const source = readSource("src/app/property/page.tsx");

  assert.ok(source.includes('buildBookingHref("mayfair")'));
}

async function testAboutAndContactBookingLinksRemainGeneric(): Promise<void> {
  const aboutSource = readSource("src/app/about/page.tsx");
  const contactSource = readSource("src/app/contact/page.tsx");

  assert.ok(aboutSource.includes('href="/book"'));
  assert.equal(aboutSource.includes('/book?flat='), false);

  assert.ok(contactSource.includes('href="/book"'));
  assert.equal(contactSource.includes('/book?flat='), false);
}

async function run(): Promise<void> {
  await testBuildBookingHrefForSpecificAndGenericCtas();
  await testFeaturedResidenceCardsUseFlatSpecificBookingUrls();
  await testAvailabilityHandoffUsesSelectedFlatContext();
  await testGenericHeroBookingCtaRemainsGeneric();
  await testPropertyPageCtaUsesMayfairBookingContext();
  await testAboutAndContactBookingLinksRemainGeneric();

  console.log("booking-flat-cta-links: ok");
}

void run();
