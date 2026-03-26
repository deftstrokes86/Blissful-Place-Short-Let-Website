import { getCmsPayload } from "@/cms/payload";
import { buildPublishedBlogDetailQuery, buildPublishedBlogListQuery } from "@/server/cms/blog-public-query";

interface BlogCategorySummary {
  id: string;
  title: string;
  slug: string;
}

interface BlogMediaSummary {
  id: string;
  url: string;
  alt: string;
}

interface BlogAuthorSummary {
  id: string;
  name: string;
}

export interface PublicBlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  categories: BlogCategorySummary[];
  authorName: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
}

export interface PublicBlogPostDetail extends PublicBlogPostSummary {
  content: unknown;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapCategory(value: unknown): BlogCategorySummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const title = asString(record.title);
  const slug = asString(record.slug);

  if (!id || !title || !slug) {
    return null;
  }

  return { id, title, slug };
}

function mapCategories(value: unknown): BlogCategorySummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => mapCategory(entry))
    .filter((entry): entry is BlogCategorySummary => Boolean(entry));
}

function mapMedia(value: unknown): BlogMediaSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const url = asString(record.url);

  if (!id || !url) {
    return null;
  }

  return {
    id,
    url,
    alt: asString(record.alt),
  };
}

function mapAuthor(value: unknown): BlogAuthorSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return { id, name };
}

function mapSummary(value: unknown): PublicBlogPostSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asString(record.id);
  const title = asString(record.title);
  const slug = asString(record.slug);

  if (!id || !title || !slug) {
    return null;
  }

  const featuredImage = mapMedia(record.featuredImage);
  const author = mapAuthor(record.author);

  return {
    id,
    title,
    slug,
    excerpt: asString(record.excerpt),
    publishedAt: asNullableString(record.publishedAt),
    categories: mapCategories(record.categories),
    authorName: author?.name ?? null,
    featuredImageUrl: featuredImage?.url ?? null,
    featuredImageAlt: featuredImage?.alt ?? "",
  };
}

function mapDetail(value: unknown): PublicBlogPostDetail | null {
  const summary = mapSummary(value);
  const record = asRecord(value);

  if (!summary || !record) {
    return null;
  }

  const ogImage = mapMedia(record.ogImage);

  return {
    ...summary,
    content: record.content ?? null,
    metaTitle: asString(record.metaTitle),
    metaDescription: asString(record.metaDescription),
    ogImageUrl: ogImage?.url ?? null,
    canonicalUrl: asNullableString(record.canonicalUrl),
  };
}

export async function listPublishedBlogPosts(limit = 20): Promise<PublicBlogPostSummary[]> {
  const payload = await getCmsPayload();
  const result = await payload.find({
    // Public pages fetch published posts explicitly without exposing CMS collection reads.
    ...buildPublishedBlogListQuery(limit),
    overrideAccess: true,
  });

  return result.docs
    .map((doc) => mapSummary(doc))
    .filter((entry): entry is PublicBlogPostSummary => Boolean(entry));
}

export async function findPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
  const detailQuery = buildPublishedBlogDetailQuery(slug);

  if (!detailQuery) {
    return null;
  }

  const payload = await getCmsPayload();
  const result = await payload.find({
    // Public pages fetch published posts explicitly without exposing CMS collection reads.
    ...detailQuery,
    overrideAccess: true,
  });

  if (result.docs.length === 0) {
    return null;
  }

  return mapDetail(result.docs[0]);
}
