function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asIdentifier(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return "";
}

function asNullableString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

export interface BlogCategorySummary {
  id: string;
  title: string;
  slug: string;
}

export interface BlogMediaSummary {
  id: string;
  url: string;
  alt: string;
}

export interface BlogAuthorSummary {
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

export function mapBlogCategorySummary(value: unknown): BlogCategorySummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asIdentifier(record.id);
  const title = asString(record.title);
  const slug = asString(record.slug);

  if (!id || !title || !slug) {
    return null;
  }

  return { id, title, slug };
}

function mapBlogCategories(value: unknown): BlogCategorySummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => mapBlogCategorySummary(entry))
    .filter((entry): entry is BlogCategorySummary => Boolean(entry));
}

export function mapBlogMediaSummary(value: unknown): BlogMediaSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asIdentifier(record.id);
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

export function mapBlogAuthorSummary(value: unknown): BlogAuthorSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asIdentifier(record.id);
  const name = asString(record.name);

  if (!id || !name) {
    return null;
  }

  return { id, name };
}

export function mapPublicBlogPostSummary(value: unknown): PublicBlogPostSummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asIdentifier(record.id);
  const title = asString(record.title);
  const slug = asString(record.slug);

  if (!id || !title || !slug) {
    return null;
  }

  const featuredImage = mapBlogMediaSummary(record.featuredImage);
  const author = mapBlogAuthorSummary(record.author);

  return {
    id,
    title,
    slug,
    excerpt: asString(record.excerpt),
    publishedAt: asNullableString(record.publishedAt),
    categories: mapBlogCategories(record.categories),
    authorName: author?.name ?? null,
    featuredImageUrl: featuredImage?.url ?? null,
    featuredImageAlt: featuredImage?.alt ?? "",
  };
}

export function mapPublicBlogPostDetail(value: unknown): PublicBlogPostDetail | null {
  const summary = mapPublicBlogPostSummary(value);
  const record = asRecord(value);

  if (!summary || !record) {
    return null;
  }

  const ogImage = mapBlogMediaSummary(record.ogImage);

  return {
    ...summary,
    content: record.content ?? null,
    metaTitle: asString(record.metaTitle),
    metaDescription: asString(record.metaDescription),
    ogImageUrl: ogImage?.url ?? null,
    canonicalUrl: asNullableString(record.canonicalUrl),
  };
}
