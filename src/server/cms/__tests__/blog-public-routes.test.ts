import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SafeBlogImage } from "@/components/blog/SafeBlogImage";
import {
  BLOG_TOPIC_OPTIONS,
  buildBlogTopicLink,
  formatBlogPublishedDate,
  normalizeBlogTopicParam,
  postMatchesBlogTopic,
  resolvePrimaryBlogCategoryLabel,
  resolveSelectedBlogTopic,
  sanitizeBlogPagePosts,
} from "@/lib/blog-page";
import {
  hasRenderableBlogImageCandidate,
  resolveBlogMediaDocumentUrl,
  resolveRenderableBlogImageUrl,
} from "@/lib/blog-image";
import {
  mapPublishedBlogPostSummariesFromDocs,
  resolvePublishedBlogPostDetailFromDocs,
} from "../blog-content-transformers";
import { mapPublicBlogPostDetail, mapPublicBlogPostSummary } from "../blog-public-mappers";
import {
  buildPublishedBlogDetailQuery,
  buildPublishedBlogListQuery,
  normalizePublicBlogSlugInput,
} from "../blog-public-query";
import {
  buildPublicBlogPostingSchema,
  buildPublicBlogPostMetadata,
  extractLexicalParagraphs,
  resolvePublicLexicalContentState,
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

async function testPublicMapperSupportsNumericCmsIds(): Promise<void> {
  const summary = mapPublicBlogPostSummary({
    id: 42,
    title: "Published Post",
    slug: "published-post",
    excerpt: "Short summary",
    publishedAt: "2026-03-26T19:00:00.000Z",
    categories: [
      {
        id: 10,
        title: "Guides",
        slug: "guides",
      },
    ],
    author: {
      id: 8,
      name: "Editorial Team",
    },
    featuredImage: {
      id: 7,
      url: "/media/post.jpg",
      alt: "Post image",
    },
  });

  assert.ok(summary);
  if (!summary) {
    throw new Error("Expected mapped summary for numeric CMS ids");
  }

  assert.equal(summary.id, "42");
  assert.equal(summary.categories[0]?.id, "10");
  assert.equal(summary.authorName, "Editorial Team");

  const detail = mapPublicBlogPostDetail({
    ...summary,
    content: {
      root: {
        children: [],
      },
    },
    metaTitle: "Meta",
    metaDescription: "Description",
    ogImage: {
      id: 11,
      url: "/media/og.jpg",
      alt: "OG",
    },
  });

  assert.ok(detail);
}

async function testBlogImageGuardrails(): Promise<void> {
  const validSupabaseImage =
    "https://ghdgxaqumrsovzaqakfb.storage.supabase.co/storage/v1/object/public/blog-media/featured.jpg";
  const insecureSupabaseImage =
    "http://ghdgxaqumrsovzaqakfb.storage.supabase.co/storage/v1/object/public/blog-media/featured.jpg";
  const previousProjectRef = process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF;
  const previousBucket = process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET;
  const previousEndpoint = process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT;
  const previousSiteUrl = process.env.SITE_URL;

  process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF = "ghdgxaqumrsovzaqakfb";
  process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET = "blog-media";
  process.env.SITE_URL = "http://localhost:3000";
  delete process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT;

  try {
    assert.equal(resolveRenderableBlogImageUrl("/media/featured.jpg"), "/media/featured.jpg");
    assert.equal(resolveRenderableBlogImageUrl(validSupabaseImage), validSupabaseImage);
    assert.equal(
      resolveRenderableBlogImageUrl("http://localhost:3000/media/featured.jpg?cache=1"),
      "/media/featured.jpg?cache=1"
    );
    assert.equal(resolveRenderableBlogImageUrl(insecureSupabaseImage), null);
    assert.equal(resolveRenderableBlogImageUrl(""), null);
    assert.equal(resolveRenderableBlogImageUrl("   "), null);
    assert.equal(resolveRenderableBlogImageUrl("featured.jpg"), null);
    assert.equal(resolveRenderableBlogImageUrl("javascript:alert(1)"), null);
    assert.equal(resolveRenderableBlogImageUrl("https://example.com/featured.jpg"), null);
    assert.equal(hasRenderableBlogImageCandidate(validSupabaseImage), true);
    assert.equal(hasRenderableBlogImageCandidate("https://example.com/featured.jpg"), false);

    assert.equal(
      resolveBlogMediaDocumentUrl({
        filename: "featured photo.jpg",
        prefix: "blog/2026",
      }),
      "https://ghdgxaqumrsovzaqakfb.supabase.co/storage/v1/object/public/blog-media/blog/2026/featured%20photo.jpg"
    );

    const mappedSummary = mapPublicBlogPostSummary({
      id: 77,
      title: "Guardrailed Post",
      slug: "guardrailed-post",
      excerpt: "Safe rendering",
      publishedAt: "2026-04-04T10:00:00.000Z",
      categories: [],
      author: {
        id: 2,
        name: "Editorial Team",
      },
      featuredImage: {
        filename: "cover image.jpg",
        prefix: "blog/posts",
        alt: "Derived image",
      },
    });

    assert.ok(mappedSummary);
    assert.equal(
      mappedSummary?.featuredImageUrl,
      "https://ghdgxaqumrsovzaqakfb.supabase.co/storage/v1/object/public/blog-media/blog/posts/cover%20image.jpg"
    );

    const blockedSummary = mapPublicBlogPostSummary({
      id: 78,
      title: "Blocked Image Post",
      slug: "blocked-image-post",
      excerpt: "Blocked external image",
      publishedAt: "2026-04-04T10:00:00.000Z",
      categories: [],
      author: {
        id: 2,
        name: "Editorial Team",
      },
      featuredImage: {
        id: 9,
        url: "https://example.com/not-allowed.jpg",
        alt: "Invalid image",
      },
    });

    assert.ok(blockedSummary);
    assert.equal(blockedSummary?.featuredImageUrl, null);
  } finally {
    if (typeof previousProjectRef === "string") {
      process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF = previousProjectRef;
    } else {
      delete process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF;
    }

    if (typeof previousBucket === "string") {
      process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET = previousBucket;
    } else {
      delete process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET;
    }

    if (typeof previousEndpoint === "string") {
      process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT = previousEndpoint;
    } else {
      delete process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT;
    }

    if (typeof previousSiteUrl === "string") {
      process.env.SITE_URL = previousSiteUrl;
    } else {
      delete process.env.SITE_URL;
    }
  }

  const validImageElement = SafeBlogImage({
    src: validSupabaseImage,
    alt: "Valid image",
    sizes: "100vw",
  }) as unknown as { props: Record<string, unknown> };
  assert.equal(validImageElement.props.src, validSupabaseImage);

  const normalizedSiteImageElement = SafeBlogImage({
    src: "http://localhost:3000/media/featured.jpg?cache=1",
    alt: "Normalized site image",
    sizes: "100vw",
  }) as unknown as { props: Record<string, unknown> };
  assert.equal(normalizedSiteImageElement.props.src, "/media/featured.jpg?cache=1");

  const missingImageFallback = SafeBlogImage({
    src: "",
    alt: "Missing image",
    sizes: "100vw",
  }) as unknown as { props: Record<string, unknown>; type: unknown };
  assert.equal(missingImageFallback.type, "span");
  assert.equal(missingImageFallback.props.className, "blog-image-fallback");

  const malformedImageFallback = SafeBlogImage({
    src: "not-a-valid-url",
    alt: "Malformed image",
    sizes: "100vw",
    fallbackClassName: "blog-image-fallback custom-fallback",
  }) as unknown as { props: Record<string, unknown>; type: unknown };
  assert.equal(malformedImageFallback.type, "span");
  assert.equal(malformedImageFallback.props.className, "blog-image-fallback custom-fallback");

  const insecureExternalFallback = SafeBlogImage({
    src: insecureSupabaseImage,
    alt: "Insecure external image",
    sizes: "100vw",
  }) as unknown as { props: Record<string, unknown>; type: unknown };
  assert.equal(insecureExternalFallback.type, "span");
  assert.equal(insecureExternalFallback.props.className, "blog-image-fallback");
}

async function testBlogContentServiceRecoversFromMalformedRecords(): Promise<void> {
  const explosiveRecord: Record<string, unknown> = {
    id: 900,
    slug: "explosive-record",
  };

  Object.defineProperty(explosiveRecord, "title", {
    enumerable: true,
    get() {
      throw new Error("boom");
    },
  });

  const validSummaryRecord = {
    id: 42,
    title: "Published Post",
    slug: "published-post",
    excerpt: "Short summary",
    publishedAt: "2026-03-26T19:00:00.000Z",
    categories: [
      {
        id: 10,
        title: "Guides",
        slug: "guides",
      },
    ],
    author: {
      id: 8,
      name: "Editorial Team",
    },
    featuredImage: {
      id: 7,
      url: "/media/post.jpg",
      alt: "Post image",
    },
  };

  const partialSummaryRecord = {
    id: 43,
    title: "Fallback Image Post",
    slug: "fallback-image-post",
    excerpt: "Still render this one",
    publishedAt: null,
    categories: [],
    author: null,
    featuredImage: {
      id: 12,
      url: "https://example.com/not-allowed.jpg",
      alt: "Blocked image",
    },
  };

  const summaryRecords = mapPublishedBlogPostSummariesFromDocs([
    validSummaryRecord,
    explosiveRecord,
    { id: 99, title: "Missing slug" },
    partialSummaryRecord,
  ]);

  assert.equal(summaryRecords.length, 2);
  assert.equal(summaryRecords[0]?.slug, "published-post");
  assert.equal(summaryRecords[1]?.slug, "fallback-image-post");
  assert.equal(summaryRecords[1]?.featuredImageUrl, null);
  assert.deepEqual(mapPublishedBlogPostSummariesFromDocs(null), []);

  const detailRecord = {
    ...validSummaryRecord,
    content: {
      root: {
        children: [],
      },
    },
    metaTitle: "Meta",
    metaDescription: "Description",
    ogImage: {
      id: 11,
      url: "/media/og.jpg",
      alt: "OG",
    },
  };

  const detail = resolvePublishedBlogPostDetailFromDocs([explosiveRecord, { id: 1 }, detailRecord]);
  assert.ok(detail);
  assert.equal(detail?.slug, "published-post");
  assert.equal(resolvePublishedBlogPostDetailFromDocs(null), null);
}

async function testBlogPageHelperGuardrails(): Promise<void> {
  const safePosts = sanitizeBlogPagePosts([
    {
      id: "42",
      title: "Published Post",
      slug: "published-post",
      excerpt: "Short summary",
      publishedAt: "2026-03-26T19:00:00.000Z",
      categories: [
        {
          id: "10",
          title: "Guides",
          slug: "guides",
        },
      ],
      authorName: "Editorial Team",
      featuredImageUrl: "/media/post.jpg",
      featuredImageAlt: "Post image",
    },
    {
      id: "99",
      title: "Missing slug",
      excerpt: "Invalid post",
      categories: [],
    },
    {
      id: "100",
      title: "   ",
      slug: "blank-title",
      excerpt: "Invalid title",
      categories: [],
    },
    {
      id: 101,
      title: " Partial Data Still Renders ",
      slug: " partial-data-still-renders ",
      excerpt: "  ",
      publishedAt: "not-a-date",
      categories: [
        {
          id: "broken-category",
          title: "   ",
          slug: "",
        },
      ],
      authorName: "   ",
      featuredImageUrl: 12,
      featuredImageAlt: 8,
    },
  ]);

  assert.equal(safePosts.length, 2);
  assert.equal(safePosts[0]?.slug, "published-post");
  assert.equal(safePosts[1]?.title, "Partial Data Still Renders");
  assert.equal(safePosts[1]?.slug, "partial-data-still-renders");
  assert.equal(safePosts[1]?.excerpt, "");
  assert.equal(safePosts[1]?.categories.length, 0);
  assert.equal(safePosts[1]?.authorName, null);
  assert.equal(safePosts[1]?.featuredImageUrl, null);
  assert.equal(safePosts[1]?.featuredImageAlt, "");
  assert.deepEqual(sanitizeBlogPagePosts([]), []);
  assert.deepEqual(sanitizeBlogPagePosts(null), []);

  assert.equal(formatBlogPublishedDate("not-a-date"), "Unscheduled");
  assert.equal(formatBlogPublishedDate(null), "Unscheduled");
  assert.equal(normalizeBlogTopicParam([" Stay-Experience "]), "stay-experience");
  assert.equal(resolveSelectedBlogTopic("missing-topic").value, "all-posts");
  assert.equal(resolveSelectedBlogTopic("stay-experience").label, "Stay Experience");
  assert.equal(buildBlogTopicLink("all-posts"), "/blog");
  assert.equal(buildBlogTopicLink("corporate-stays"), "/blog?topic=corporate-stays");
  assert.equal(postMatchesBlogTopic(["stay-experience"], resolveSelectedBlogTopic("stay-experience")), true);
  assert.equal(resolvePrimaryBlogCategoryLabel({ categories: [] }), "General");
  assert.equal(BLOG_TOPIC_OPTIONS.length >= 5, true);
}

async function testPublicBlogServiceUsesExplicitPublishedServerQuery(): Promise<void> {
  const source = readSource("src/server/cms/blog-content-service.ts");

  assert.ok(source.includes("overrideAccess: true"));
  assert.ok(source.includes("buildPublishedBlogListQuery"));
  assert.ok(source.includes("buildPublishedBlogDetailQuery"));
  assert.ok(source.includes("mapPublishedBlogPostSummariesFromDocs"));
  assert.ok(source.includes("resolvePublishedBlogPostDetailFromDocs"));
}

async function testBlogIndexEditorialLayoutStructure(): Promise<void> {
  const pageSource = readSource("src/app/(site)/blog/page.tsx");
  const clientSource = readSource("src/components/blog/BlogListingClient.tsx");
  const helperSource = readSource("src/lib/blog-page.ts");

  assert.ok(pageSource.includes("loadBlogPagePosts"));
  assert.ok(pageSource.includes("<BlogListingClient posts={posts} />"));
  assert.ok(clientSource.includes("const [featuredPost, ...remainingPosts] = visiblePosts"));
  assert.ok(clientSource.includes("const topicNavigation ="));
  assert.ok(clientSource.includes("useSearchParams"));
  assert.ok(clientSource.includes("searchParams.get(\"topic\") ?? searchParams.get(\"category\")"));
  assert.ok(clientSource.includes('className="blog-featured"'));
  assert.ok(clientSource.includes('className="blog-category-row"'));
  assert.ok(clientSource.includes('className="blog-post-grid"'));
  assert.ok(clientSource.includes('className="blog-card-meta-row"'));
  assert.ok(clientSource.includes('className="blog-card-category-chip"'));
  assert.ok(clientSource.includes('className="blog-card-date"'));
  assert.ok(clientSource.includes('className="blog-post-card-excerpt"'));
  assert.ok(clientSource.includes("blog-grid-heading"));
  assert.ok(clientSource.includes("<SafeBlogImage"));
  assert.ok(helperSource.includes("All Posts"));
  assert.ok(helperSource.includes("Short-Let Guides"));
  assert.ok(helperSource.includes("Lagos Area Guides"));
  assert.ok(helperSource.includes("Corporate Stays"));
  assert.ok(helperSource.includes("Stay Experience"));
}

async function testMetadataAndContentHelpers(): Promise<void> {
  const metadata = buildPublicBlogPostMetadata({
    title: "Sample Post",
    excerpt: "Default excerpt",
    metaTitle: "Custom Meta Title",
    metaDescription: "Custom Meta Description",
    ogImageUrl: "/media/og-image.jpg",
    featuredImageUrl: "/media/featured.jpg",
    slug: "sample-post",
  });

  assert.equal(metadata.title, "Custom Meta Title");
  assert.equal(metadata.description, "Custom Meta Description");
  assert.equal(metadata.openGraph?.url, "https://www.blissfulplaceresidences.com/blog/sample-post");
  assert.equal(metadata.openGraph?.siteName, "Blissful Place Residences");
  assert.equal(getFirstImageUrl(metadata.openGraph?.images), "/media/og-image.jpg");
  assert.equal(metadata.alternates?.canonical, "/blog/sample-post");

  const fallbackMetadata = buildPublicBlogPostMetadata({
    title: "Fallback Post",
    excerpt: "Fallback excerpt",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: null,
    featuredImageUrl: "/media/fallback-featured.jpg",
    slug: "fallback-post",
  });

  assert.equal(fallbackMetadata.title, "Fallback Post");
  assert.equal(fallbackMetadata.description, "Fallback excerpt");
  assert.equal(getFirstImageUrl(fallbackMetadata.openGraph?.images), "/media/fallback-featured.jpg");
  assert.equal(fallbackMetadata.alternates?.canonical, "/blog/fallback-post");

  const unsafeMetadata = buildPublicBlogPostMetadata({
    title: "Unsafe Image Post",
    excerpt: "Unsafe image excerpt",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: "https://example.com/tracking-pixel.jpg",
    featuredImageUrl: "javascript:alert(1)",
    slug: "unsafe-image-post",
  });

  assert.equal(getFirstImageUrl(unsafeMetadata.openGraph?.images), "https://www.blissfulplaceresidences.com/Hero-Image.png");
  assert.equal((unsafeMetadata.twitter as { card?: string } | undefined)?.card, "summary_large_image");

  const minimalMetadata = buildPublicBlogPostMetadata({
    title: "Minimal Post",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: null,
    featuredImageUrl: null,
    slug: "minimal-post",
  });

  assert.equal(minimalMetadata.description, "Read this article on Blissful Place Residences.");

  const blogPostingSchema = buildPublicBlogPostingSchema({
    title: "Sample Post",
    slug: "sample-post",
    excerpt: "Schema excerpt",
    metaDescription: "Schema meta description",
    ogImageUrl: "/media/schema-og.jpg",
    featuredImageUrl: "/media/schema-featured.jpg",
    publishedAt: "2026-04-01T10:00:00.000Z",
    createdAt: "2026-03-30T09:00:00.000Z",
    updatedAt: "2026-04-03T08:30:00.000Z",
  });

  assert.equal(blogPostingSchema["@type"], "BlogPosting");
  assert.equal(
    blogPostingSchema.mainEntityOfPage["@id"],
    "https://www.blissfulplaceresidences.com/blog/sample-post"
  );
  assert.equal(blogPostingSchema.url, "https://www.blissfulplaceresidences.com/blog/sample-post");
  assert.equal(blogPostingSchema.headline, "Sample Post");
  assert.equal(blogPostingSchema.description, "Schema excerpt");
  assert.equal(blogPostingSchema.image, "https://www.blissfulplaceresidences.com/media/schema-og.jpg");
  assert.equal(blogPostingSchema.datePublished, "2026-04-01T10:00:00.000Z");
  assert.equal(blogPostingSchema.dateModified, "2026-04-03T08:30:00.000Z");
  assert.equal(blogPostingSchema.author.name, "Blissful Place Residences");
  assert.equal(blogPostingSchema.publisher.name, "Blissful Place Residences");
  assert.equal(blogPostingSchema.publisher.logo.url, "https://www.blissfulplaceresidences.com/Hero-Image.png");

  const fallbackBlogPostingSchema = buildPublicBlogPostingSchema({
    title: "Fallback Post",
    slug: "fallback-post",
    excerpt: "",
    metaDescription: "",
    ogImageUrl: null,
    featuredImageUrl: null,
    publishedAt: null,
    createdAt: null,
    updatedAt: null,
  });

  assert.equal(
    fallbackBlogPostingSchema.mainEntityOfPage["@id"],
    "https://www.blissfulplaceresidences.com/blog/fallback-post"
  );
  assert.equal(
    fallbackBlogPostingSchema.image,
    "https://www.blissfulplaceresidences.com/Hero-Image.png"
  );
  assert.ok(!Number.isNaN(Date.parse(fallbackBlogPostingSchema.datePublished)));
  assert.ok(!Number.isNaN(Date.parse(fallbackBlogPostingSchema.dateModified)));

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

  const lexicalContent = resolvePublicLexicalContentState({
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [{ type: "text", text: "Hello" }] }],
    },
  });
  assert.ok(lexicalContent);
  assert.equal(resolvePublicLexicalContentState("## Markdown heading"), null);
}

async function testBlogPostPageUsesRichTextRenderer(): Promise<void> {
  const source = readSource("src/app/(site)/blog/[slug]/page.tsx");

  assert.ok(source.includes('from "@payloadcms/richtext-lexical/react"'));
  assert.ok(source.includes("resolvePublicLexicalContentState"));
  assert.ok(source.includes("buildPublicBlogPostingSchema"));
  assert.ok(source.includes('type="application/ld+json"'));
  assert.ok(source.includes("JSON.stringify(blogPostingSchema)"));
  assert.ok(source.includes("<RichText"));
  assert.ok(source.includes("<SafeBlogImage"));
  assert.ok(source.includes("hasRenderableBlogImageCandidate"));
  assert.ok(source.includes("getBlogInternalLinks"));
  assert.ok(source.includes("Helpful links for planning your stay"));
  assert.ok(source.includes('!value.includes("?flat=")'));
  assert.ok(!source.includes("paragraphs.map((paragraph"));
}

async function testLegacyBlogContentIncludesContextualInternalLinks(): Promise<void> {
  const source = readSource("src/migrations/data/legacy-blog-content.json");

  assert.ok(source.includes('"type": "link"'));
  assert.ok(source.includes('"url": "/property"'));
  assert.ok(source.includes('"url": "/guide"'));
  assert.ok(source.includes('"url": "/book"'));
  assert.ok(source.includes('"url": "/contact"'));
  assert.ok(source.includes("view the available apartments"));
  assert.ok(source.includes("available short-let apartments"));
  assert.ok(!source.includes("/property?flat="));
}

async function run(): Promise<void> {
  await testPublishedOnlyQueryBehavior();
  await testSlugNormalizationAndInvalidHandling();
  await testPublicMapperSupportsNumericCmsIds();
  await testBlogImageGuardrails();
  await testBlogContentServiceRecoversFromMalformedRecords();
  await testBlogPageHelperGuardrails();
  await testPublicBlogServiceUsesExplicitPublishedServerQuery();
  await testBlogIndexEditorialLayoutStructure();
  await testMetadataAndContentHelpers();
  await testBlogPostPageUsesRichTextRenderer();
  await testLegacyBlogContentIncludesContextualInternalLinks();

  console.log("blog-public-routes: ok");
}

void run();


