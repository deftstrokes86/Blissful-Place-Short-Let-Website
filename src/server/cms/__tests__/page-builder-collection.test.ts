import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  coercePageStatus,
  normalizePageSlug,
  resolvePageSlug,
  shouldAutoSetPagePublishedAt,
} from "../page-builder-model";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testPageBuilderCollectionShape(): Promise<void> {
  const source = readSource("src/cms/collections/CmsPages.ts");

  assert.ok(source.includes('slug: "cms-pages"'));
  assert.ok(source.includes('name: "layout"'));
  assert.ok(source.includes('type: "blocks"'));
  assert.ok(source.includes('slug: "hero"'));
  assert.ok(source.includes('slug: "richText"'));
  assert.ok(source.includes('slug: "featureGrid"'));
  assert.ok(source.includes('slug: "mediaSplit"'));
  assert.ok(source.includes('slug: "ctaStrip"'));
  assert.ok(source.includes('name: "status"'));
  assert.ok(source.includes('name: "publishedAt"'));
  assert.ok(source.includes('name: "metaTitle"'));
  assert.ok(source.includes('name: "metaDescription"'));
  assert.ok(source.includes('versions: {'));
  assert.ok(source.includes('drafts: true'));
}

async function testPageBuilderRichTextToolbarConfig(): Promise<void> {
  const source = readSource("src/cms/collections/CmsPages.ts");

  assert.ok(source.includes("FixedToolbarFeature"));
  assert.ok(source.includes("lexicalEditor({"));
  assert.ok(source.includes("features: ({ defaultFeatures }) => ["));
  assert.ok(source.includes('name: "body"'));
  assert.ok(source.includes("...defaultFeatures"));
}

async function testPageBuilderSlugAndStatusHelpers(): Promise<void> {
  assert.equal(normalizePageSlug("  About Blissful Place  "), "about-blissful-place");
  assert.equal(resolvePageSlug(" custom-page ", "ignored"), "custom-page");
  assert.equal(resolvePageSlug("", "Contact Us"), "contact-us");

  assert.equal(coercePageStatus("draft"), "draft");
  assert.equal(coercePageStatus("published"), "published");
  assert.equal(coercePageStatus("archived"), null);

  assert.equal(shouldAutoSetPagePublishedAt("published", null), true);
  assert.equal(shouldAutoSetPagePublishedAt("published", "2026-03-26T00:00:00.000Z"), false);
  assert.equal(shouldAutoSetPagePublishedAt("draft", null), false);
}

async function testPayloadConfigRegistersPageBuilderCollection(): Promise<void> {
  const source = readSource("src/cms/payload.config.ts");

  assert.ok(source.includes("CmsPagesCollection"));
  assert.ok(source.includes("CmsPagesCollection,"));
}

async function run(): Promise<void> {
  await testPageBuilderCollectionShape();
  await testPageBuilderRichTextToolbarConfig();
  await testPageBuilderSlugAndStatusHelpers();
  await testPayloadConfigRegistersPageBuilderCollection();

  console.log("page-builder-collection: ok");
}

void run();
