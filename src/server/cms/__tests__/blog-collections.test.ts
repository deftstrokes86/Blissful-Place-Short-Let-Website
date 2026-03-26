import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  coerceBlogPostStatus,
  normalizeBlogSlug,
  shouldAutoSetPublishedAt,
} from "../blog-content-model";
import { canManageBlog, buildBlogReadAccessConstraint, canReadBlogCollections } from "../cms-access";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

async function testBlogPostCollectionFieldShape(): Promise<void> {
  const source = readSource("src/cms/collections/BlogPosts.ts");

  const requiredFields = [
    'name: "title"',
    'name: "slug"',
    'name: "excerpt"',
    'name: "content"',
    'name: "featuredImage"',
    'name: "author"',
    'name: "categories"',
    'name: "status"',
    'name: "publishedAt"',
    'name: "metaTitle"',
    'name: "metaDescription"',
    'name: "ogImage"',
    'name: "canonicalUrl"',
    'name: "tags"',
  ];

  for (const fieldToken of requiredFields) {
    assert.ok(source.includes(fieldToken), `Expected blog posts field token: ${fieldToken}`);
  }
}

async function testBlogSlugBehavior(): Promise<void> {
  assert.equal(normalizeBlogSlug("  Hello, Lagos! Private Tour  "), "hello-lagos-private-tour");
  assert.equal(normalizeBlogSlug("Already-clean-slug"), "already-clean-slug");
  assert.equal(normalizeBlogSlug("---Mixed___Spacing***"), "mixed-spacing");
}

async function testBlogStatusHelpers(): Promise<void> {
  assert.equal(coerceBlogPostStatus("draft"), "draft");
  assert.equal(coerceBlogPostStatus("published"), "published");
  assert.equal(coerceBlogPostStatus("archived"), null);

  assert.equal(shouldAutoSetPublishedAt("published", null), true);
  assert.equal(shouldAutoSetPublishedAt("published", "2026-01-01T00:00:00.000Z"), false);
  assert.equal(shouldAutoSetPublishedAt("draft", null), false);
}

async function testBlogCmsAccessExpectations(): Promise<void> {
  assert.equal(canManageBlog("admin"), true);
  assert.equal(canManageBlog("blog_manager"), true);
  assert.equal(canManageBlog("author"), false);
  assert.equal(canManageBlog("inventory_manager"), false);

  assert.equal(canReadBlogCollections("inventory_manager"), false);
  assert.equal(canReadBlogCollections("author"), true);
  assert.equal(canReadBlogCollections("blog_manager"), true);
  assert.equal(canReadBlogCollections(null), false);

  assert.equal(buildBlogReadAccessConstraint("inventory_manager", "inv-1"), false);
  assert.equal(buildBlogReadAccessConstraint(null, null), false);
}

async function testBlogSupportCollectionsExist(): Promise<void> {
  const categoriesSource = readSource("src/cms/collections/BlogCategories.ts");
  const mediaSource = readSource("src/cms/collections/BlogMedia.ts");
  const tagsSource = readSource("src/cms/collections/BlogTags.ts");

  assert.ok(categoriesSource.includes('slug: "blog-categories"'));
  assert.ok(mediaSource.includes('slug: "blog-media"'));
  assert.ok(tagsSource.includes('slug: "blog-tags"'));
}

async function run(): Promise<void> {
  await testBlogPostCollectionFieldShape();
  await testBlogSlugBehavior();
  await testBlogStatusHelpers();
  await testBlogCmsAccessExpectations();
  await testBlogSupportCollectionsExist();

  console.log("blog-collections: ok");
}

void run();



