import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  coerceBlogPostStatus,
  normalizeBlogSlug,
  resolveBlogContent,
  shouldAutoSetPublishedAt,
} from "../blog-content-model";
import { canManageBlog, buildBlogReadAccessConstraint, canReadBlogCollections } from "../cms-access";
import { blogMediaPublicReadAccess } from "../../../cms/access-controls";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function evaluateBlogMediaReadAccess(args: unknown): ReturnType<typeof blogMediaPublicReadAccess> {
  return blogMediaPublicReadAccess(args as Parameters<typeof blogMediaPublicReadAccess>[0]);
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

async function testBlogRichTextToolbarConfig(): Promise<void> {
  const source = readSource("src/cms/collections/BlogPosts.ts");

  assert.ok(source.includes("FixedToolbarFeature"));
  assert.ok(source.includes("lexicalEditor({"));
  assert.ok(source.includes("features: ({ defaultFeatures }) => ["));
  assert.ok(source.includes("...defaultFeatures"));
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

async function testBlogContentNormalization(): Promise<void> {
  const existingContent = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [],
          direction: null,
          format: "",
          indent: 0,
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };

  assert.equal(resolveBlogContent(existingContent, "Excerpt", "Title"), existingContent);

  const fromString = resolveBlogContent("Plain body text", "Excerpt", "Title");
  assert.ok(fromString);
  assert.equal((fromString as { root: { type: string } }).root.type, "root");

  const fromExcerpt = resolveBlogContent(null, "Excerpt fallback", "Title");
  assert.ok(fromExcerpt);

  const fromTitle = resolveBlogContent(null, null, "Title fallback");
  assert.ok(fromTitle);

  const unresolved = resolveBlogContent(null, null, null);
  assert.equal(unresolved, null);
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
  assert.ok(mediaSource.includes("blogMediaPublicReadAccess"));
  assert.ok(tagsSource.includes('slug: "blog-tags"'));
}

async function testBlogMediaFileReadBehavior(): Promise<void> {
  assert.equal(
    evaluateBlogMediaReadAccess({
      req: {
        path: "/cms/api/blog-media/file/image.jpg",
      },
    }),
    true
  );

  assert.equal(
    evaluateBlogMediaReadAccess({
      req: {
        path: "/cms/api/blog-media",
      },
    }),
    false
  );

  assert.equal(
    evaluateBlogMediaReadAccess({
      req: {
        path: "/cms/api/blog-media",
        user: {
          id: "manager-1",
          role: "blog_manager",
          collection: "cms-users",
        },
      },
    }),
    true
  );
}

async function run(): Promise<void> {
  await testBlogPostCollectionFieldShape();
  await testBlogRichTextToolbarConfig();
  await testBlogSlugBehavior();
  await testBlogStatusHelpers();
  await testBlogContentNormalization();
  await testBlogCmsAccessExpectations();
  await testBlogSupportCollectionsExist();
  await testBlogMediaFileReadBehavior();

  console.log("blog-collections: ok");
}

void run();
