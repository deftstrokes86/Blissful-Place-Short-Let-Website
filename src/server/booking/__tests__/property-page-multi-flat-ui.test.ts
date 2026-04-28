import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getPropertyFlatRoute,
  PROPERTY_FLAT_CONTENT,
  PROPERTY_FLAT_ID_BY_ROUTE_SLUG,
  PROPERTY_FLAT_ROUTE_SLUG_BY_ID,
  type PropertyFlatContent,
  resolveLegacyPropertyFlatRoute,
  resolvePropertyFlatId,
  resolvePropertyFlatIdFromRouteSlug,
} from "../../../lib/property-flat-content";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testPropertyFlatResolverHandlesValidAliasAndFallback(): Promise<void> {
  assert.equal(resolvePropertyFlatId("windsor"), "windsor");
  assert.equal(resolvePropertyFlatId("kensington-lodge"), "kensington");
  assert.equal(resolvePropertyFlatId("mayfair-suite"), "mayfair");
  assert.equal(resolvePropertyFlatId("unknown-flat"), "windsor");
  assert.equal(resolvePropertyFlatId(["kensington", "mayfair"]), "kensington");
}

async function testPropertyFlatRouteMappingIsStable(): Promise<void> {
  assert.deepEqual(PROPERTY_FLAT_ROUTE_SLUG_BY_ID, {
    windsor: "windsor-residence",
    kensington: "kensington-lodge",
    mayfair: "mayfair-suite",
  });
  assert.deepEqual(PROPERTY_FLAT_ID_BY_ROUTE_SLUG, {
    "windsor-residence": "windsor",
    "kensington-lodge": "kensington",
    "mayfair-suite": "mayfair",
  });
  assert.equal(resolvePropertyFlatIdFromRouteSlug("windsor-residence"), "windsor");
  assert.equal(resolvePropertyFlatIdFromRouteSlug("kensington-lodge"), "kensington");
  assert.equal(resolvePropertyFlatIdFromRouteSlug("mayfair-suite"), "mayfair");
  assert.equal(resolvePropertyFlatIdFromRouteSlug("unknown-flat"), null);
  assert.equal(getPropertyFlatRoute("windsor"), "/property/windsor-residence");
  assert.equal(resolveLegacyPropertyFlatRoute("mayfair"), "/property/mayfair-suite");
}

async function testPropertyPageRendersSelectorAndUsesSelectedFlatData(): Promise<void> {
  const pageSource = readSource("src/app/(site)/property/page.tsx");
  const flatPageSource = readSource("src/app/(site)/property/[slug]/page.tsx");
  const componentSource = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.ok(pageSource.includes("searchParams"));
  assert.ok(pageSource.includes("resolveLegacyPropertyFlatRoute"));
  assert.ok(pageSource.includes("redirect(legacyFlatRoute)"));
  assert.ok(pageSource.includes("PropertyFlatExperience"));
  assert.ok(flatPageSource.includes("generateStaticParams"));
  assert.ok(flatPageSource.includes("generateMetadata"));
  assert.ok(flatPageSource.includes("buildFlatSchema"));
  assert.ok(componentSource.includes("PROPERTY_FLAT_CONTENT"));
  assert.ok(componentSource.includes("property-flat-selector"));
  assert.ok(componentSource.includes("flat.id === selectedFlat.id"));
  assert.ok(componentSource.includes("getPropertyFlatRoute(flat.id)"));
  assert.equal(componentSource.includes("`/property?flat=${flatId}`"), false);
}

async function testPropertyPageUpdatesCtasWithSelectedFlatContext(): Promise<void> {
  const source = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.ok(source.includes("buildBookingHref(selectedFlat.id)"));
  assert.ok(source.includes("availabilityHref"));
  assert.ok(source.includes("tourHref"));
}

async function testFlatSwitchingStateModelIsStable(): Promise<void> {
  const source = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.ok(source.includes("if (flatId === selectedFlatId)"));
  assert.ok(source.includes("setSelectedFlatId(flatId)"));
  assert.ok(source.includes("setContentAnimationKey"));
}

async function testGalleryStaysSyncedToSelectedFlat(): Promise<void> {
  const source = readSource("src/components/property/PropertyFlatExperience.tsx");

  assert.ok(source.includes("selectedContent.galleryImages.map"));
  assert.ok(source.includes("key={`${selectedFlat.id}-"));
}

async function testEveryFlatHasCompletePropertyContentAndNoStarlinkCopy(): Promise<void> {
  const expectedFlatIds = ["windsor", "kensington", "mayfair"] as const;
  const lowerCaseCopyFragments: string[] = [];

  assert.deepEqual(Object.keys(PROPERTY_FLAT_CONTENT).sort(), [...expectedFlatIds].sort());

  for (const flatId of expectedFlatIds) {
    const content: PropertyFlatContent = PROPERTY_FLAT_CONTENT[flatId];

    assert.ok(content.heroImage.src.length > 0, `Flat "${flatId}" is missing hero image src`);
    assert.ok(content.galleryImages.length > 0, `Flat "${flatId}" is missing gallery images`);
    assert.ok(content.overview.length > 0, `Flat "${flatId}" is missing overview copy`);
    assert.ok(content.featureCards.length > 0, `Flat "${flatId}" is missing feature cards`);
    assert.ok(content.includedInRate.length > 0, `Flat "${flatId}" is missing included-rate list`);

    lowerCaseCopyFragments.push(
      content.subtitle.toLowerCase(),
      content.positioningLine.toLowerCase(),
      ...content.overview.map((paragraph) => paragraph.toLowerCase()),
      ...content.featureCards.map((feature) => feature.title.toLowerCase()),
      ...content.featureCards.map((feature) => feature.description.toLowerCase()),
      ...content.includedInRate.map((item) => item.toLowerCase()),
    );
  }

  const combinedCopy = lowerCaseCopyFragments.join(" ");
  assert.equal(combinedCopy.includes("starlink"), false);
}

async function run(): Promise<void> {
  await testPropertyFlatResolverHandlesValidAliasAndFallback();
  await testPropertyFlatRouteMappingIsStable();
  await testPropertyPageRendersSelectorAndUsesSelectedFlatData();
  await testPropertyPageUpdatesCtasWithSelectedFlatContext();
  await testFlatSwitchingStateModelIsStable();
  await testGalleryStaysSyncedToSelectedFlat();
  await testEveryFlatHasCompletePropertyContentAndNoStarlinkCopy();

  console.log("property-page-multi-flat-ui: ok");
}

void run();
