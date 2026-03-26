import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildPublishedBlogDetailQuery,
  buildPublishedBlogListQuery,
  normalizePublicBlogSlugInput,
} from "../blog-public-query";
import {
  buildPublicBlogPostMetadata,
  extractLexicalParagraphs,
  resolvePublicBlogIntro,
} from "../blog-public-content";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function getFirstImageUrl(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0) {
    const firstImage = value[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (firstImage && typeof firstImage === "object" && "url" in firstImage) {
      const imageUrl = (firstImage as { url?: unknown }).url;
      return typeof imageUrl === "string" ? imageUrl : null;
    }
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

async function testPublishedOnlyQueryBehavior(): Promise<void> {
  const listQuery = buildPublishedBlogListQuery(12);
  assert.equal(listQuery.collection, "blog-posts");
  assert.equal(listQuery.limit, 12);
  assert.equal(listQuery.depth, 1);
  assert.equal(listQuery.sort, "-publishedAt");
  assert.deepEqual(listQuery.where, {
    status: {
      equals: "published",
    },
  });

  const detailQuery = buildPublishedBlogDetailQuery("  WELCOME-To-Lagos  ");
  assert.ok(detailQuery);
  if (!detailQuery) {
    throw new Error("Expected detail query for valid slug");
  }

  assert.equal(detailQuery.collection, "blog-posts");
  assert.equal(detailQuery.limit, 1);
  assert.equal(detailQuery.depth, 2);
  assert.deepEqual(detailQuery.where, {
    and: [
      {
        slug: {
          equals: "welcome-to-lagos",
        },
      },
      {
        status: {
          equals: "published",
        },
      },
    ],
  });
}

async function testSlugNormalizationAndInvalidHandling(): Promise<void> {
  assert.equal(normalizePublicBlogSlugInput("  Hello-World  "), "hello-world");
  assert.equal(normalizePublicBlogSlugInput(""), "");
  assert.equal(buildPublishedBlogDetailQuery("   "), null);
}

async function testPublicBlogServiceUsesExplicitPublishedServerQuery(): Promise<void> {
  const source = readSource("src/server/cms/blog-content-service.ts");

  assert.ok(source.includes("overrideAccess: true"));
  assert.ok(source.includes("buildPublishedBlogListQuery"));
  assert.ok(source.includes("buildPublishedBlogDetailQuery"));
}

async function testMetadataAndContentHelpers(): Promise<void> {
  const metadata = buildPublicBlogPostMetadata({
    title: "Sample Post",
    excerpt: "Default excerpt",
    metaTitle: "Custom Meta Title",
    metaDescription: "Custom Meta Description",
    ogImageUrl: "/media/og-image.jpg",
    featuredImageUrl: "/media/featured.jpg",
    canonicalUrl: "https://www.blissfulplaceresidences.com/blog/custom-canonical",
    slug: "sample-post",
  });

  assert.equal(metadata.title, "Custom Meta Title");
  assert.equal(metadata.description, "Custom Meta Description");
  assert.equal(getFirstImageUrl(metadata.openGraph?.images), "/media/og-image.jpg");
  assert.equal(metadata.alternates?.canonical, "https://www.blissfulplaceresidences.com/blog/custom-canonical");

  const fallbackMetadata = buildPublicBlogPostMetadata({
    title: "Fallback Post",
    excerpt: "Fallback excerpt",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: null,
    featuredImageUrl: "/media/fallback-featured.jpg",
    canonicalUrl: null,
    slug: "fallback-post",
  });

  assert.equal(fallbackMetadata.title, "Fallback Post");
  assert.equal(fallbackMetadata.description, "Fallback excerpt");
  assert.equal(getFirstImageUrl(fallbackMetadata.openGraph?.images), "/media/fallback-featured.jpg");
  assert.equal(fallbackMetadata.alternates?.canonical, "/blog/fallback-post");

  const minimalMetadata = buildPublicBlogPostMetadata({
    title: "Minimal Post",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: null,
    featuredImageUrl: null,
    canonicalUrl: null,
    slug: "minimal-post",
  });

  assert.equal(minimalMetadata.description, "Read this article on Blissful Place Residences.");

  const paragraphs = extractLexicalParagraphs({
    root: {
      children: [
        { children: [{ text: "First paragraph" }] },
        { children: [{ text: "Second paragraph" }] },
      ],
    },
  });

  assert.deepEqual(paragraphs, ["First paragraph", "Second paragraph"]);

  assert.equal(resolvePublicBlogIntro("Explicit intro", paragraphs), "Explicit intro");
  assert.equal(resolvePublicBlogIntro("", paragraphs), "First paragraph");
}

async function run(): Promise<void> {
  await testPublishedOnlyQueryBehavior();
  await testSlugNormalizationAndInvalidHandling();
  await testPublicBlogServiceUsesExplicitPublishedServerQuery();
  await testMetadataAndContentHelpers();

  console.log("blog-public-routes: ok");
}

void run();
