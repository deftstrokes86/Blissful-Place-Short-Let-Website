import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { LOCATION_LANDING_PAGES, locationLandingPages } from "@/lib/location-landing-pages";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function assertUnique(values: readonly string[], label: string): void {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

function testLocationLandingPageContent(): void {
  assert.equal(LOCATION_LANDING_PAGES.length, 4);

  const expectedPaths = new Set([
    "/short-let-apartment-near-ikeja",
    "/short-let-near-abule-egba",
    "/short-let-in-agbado-lagos",
    "/short-let-near-lagos-airport",
  ]);

  assert.deepEqual(new Set(LOCATION_LANDING_PAGES.map((page) => page.path)), expectedPaths);
  assertUnique(LOCATION_LANDING_PAGES.map((page) => page.metaTitle), "Meta titles");
  assertUnique(LOCATION_LANDING_PAGES.map((page) => page.metaDescription), "Meta descriptions");
  assertUnique(LOCATION_LANDING_PAGES.map((page) => page.intro), "Page intros");

  for (const page of LOCATION_LANDING_PAGES) {
    assert.ok(page.sections.length >= 4, `${page.path} should have useful content sections`);
    assert.ok(page.faqs.length >= 3 && page.faqs.length <= 5, `${page.path} should have 3 to 5 FAQs`);
    assert.ok(page.apartmentLinks.some((link) => link.href === "/property/windsor-residence"));
    assert.ok(page.apartmentLinks.some((link) => link.href === "/property/kensington-lodge"));
    assert.ok(page.apartmentLinks.some((link) => link.href === "/property/mayfair-suite"));
    assert.ok(page.primaryCta.href === "/book" || page.secondaryCta.href === "/book");
    assert.ok(page.guideLinks.some((link) => link.href === "/guide" || link.href === "/property"));
  }
}

function testLocationContentAvoidsUnsupportedClaims(): void {
  const content = JSON.stringify(locationLandingPages).toLowerCase();

  for (const phrase of [
    "minutes from",
    "airport hotel",
    "champagne",
    "private chef",
    "biometric",
    "armed police",
    "smart keycard",
    "elevator",
    "panoramic city views",
    "/property?flat",
  ]) {
    assert.equal(content.includes(phrase), false, `Location content should not include "${phrase}"`);
  }
}

function testRoutesSitemapFooterAndFaqSchema(): void {
  const componentSource = readSource("src/components/location/LocationLandingPage.tsx");
  const sitemapSource = readSource("src/app/sitemap.ts");
  const footerSource = readSource("src/components/site/SiteFooter.tsx");

  assert.ok(componentSource.includes('"@type": "FAQPage"'));
  assert.ok(componentSource.includes("page.faqs.map"));
  assert.ok(componentSource.includes("JSON.stringify(faqSchema)"));
  assert.ok(componentSource.includes("<SiteHeader"));
  assert.ok(componentSource.includes("<SiteFooter"));
  assert.ok(sitemapSource.includes("LOCATION_LANDING_PAGES"));
  assert.ok(sitemapSource.includes("locationLandingRoutes"));
  assert.ok(sitemapSource.includes('changeFrequency: "monthly"'));
  assert.ok(sitemapSource.includes("priority: 0.75"));
  assert.ok(footerSource.includes("Popular Stay Locations"));
  assert.ok(footerSource.includes("locationLandingPages.ikeja.path"));
  assert.ok(footerSource.includes("locationLandingPages.abuleEgba.path"));
  assert.ok(footerSource.includes("locationLandingPages.agbado.path"));
  assert.ok(footerSource.includes("locationLandingPages.lagosAirport.path"));

  for (const page of LOCATION_LANDING_PAGES) {
    const routeSource = readSource(`src/app/(site)/${page.slug}/page.tsx`);

    assert.ok(routeSource.includes("buildSeoMetadata"));
    assert.ok(routeSource.includes("LocationLandingPage"));
    assert.ok(sitemapSource.includes("page.path"));
  }
}

function run(): void {
  testLocationLandingPageContent();
  testLocationContentAvoidsUnsupportedClaims();
  testRoutesSitemapFooterAndFaqSchema();

  console.log("location-landing-pages: ok");
}

run();
