import type { PublicBlogPostSummary } from "@/server/cms/blog-public-mappers";

export interface BlogTopicOption {
  value: string;
  label: string;
  matchSlugs: readonly string[];
}

export const BLOG_TOPIC_OPTIONS: readonly BlogTopicOption[] = [
  {
    value: "all-posts",
    label: "All Posts",
    matchSlugs: [],
  },
  {
    value: "short-let-guides",
    label: "Short-Let Guides",
    matchSlugs: ["short-let-guides", "short-let-guide", "short-let", "shortlet-guides"],
  },
  {
    value: "lagos-area-guides",
    label: "Lagos Area Guides",
    matchSlugs: ["lagos-area-guides", "lagos-guides", "lagos-area-guide", "lagos"],
  },
  {
    value: "corporate-stays",
    label: "Corporate Stays",
    matchSlugs: ["corporate-stays", "corporate-stay", "business-stays", "business-travel"],
  },
  {
    value: "stay-experience",
    label: "Stay Experience",
    matchSlugs: ["stay-experience", "guest-experience", "stay-tips", "experience"],
  },
];

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asIdentifier(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return asTrimmedString(value);
}

function asOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBlogCategories(value: unknown): PublicBlogPostSummary["categories"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = asIdentifier(record.id);
    const title = asTrimmedString(record.title);
    const slug = asTrimmedString(record.slug);

    if (!id || !title || !slug) {
      return [];
    }

    return [{ id, title, slug }];
  });
}

export function normalizeRenderableBlogPostSummary(value: unknown): PublicBlogPostSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asIdentifier(record.id);
  const title = asTrimmedString(record.title);
  const slug = asTrimmedString(record.slug);

  if (!id || !title || !slug) {
    return null;
  }

  return {
    id,
    title,
    slug,
    excerpt: asOptionalString(record.excerpt),
    publishedAt: asOptionalNullableString(record.publishedAt),
    categories: normalizeBlogCategories(record.categories),
    authorName: asOptionalNullableString(record.authorName),
    featuredImageUrl: asOptionalNullableString(record.featuredImageUrl),
    featuredImageAlt: asOptionalString(record.featuredImageAlt),
  };
}

export function sanitizeBlogPagePosts(posts: unknown): PublicBlogPostSummary[] {
  if (!Array.isArray(posts)) {
    return [];
  }

  return posts.flatMap((post) => {
    const normalizedPost = normalizeRenderableBlogPostSummary(post);
    return normalizedPost ? [normalizedPost] : [];
  });
}

export function formatBlogPublishedDate(value: string | null): string {
  const normalizedValue = asOptionalNullableString(value);

  if (!normalizedValue) {
    return "Unscheduled";
  }

  const publishedDate = new Date(normalizedValue);

  if (Number.isNaN(publishedDate.getTime())) {
    return "Unscheduled";
  }

  return publishedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function normalizeBlogTopicParam(value: string | string[] | undefined): string {
  const topicValue = Array.isArray(value) ? value[0] : value;
  return topicValue?.trim().toLowerCase() ?? "";
}

export function resolveSelectedBlogTopic(value: string): BlogTopicOption {
  return BLOG_TOPIC_OPTIONS.find((topic) => topic.value === value) ?? BLOG_TOPIC_OPTIONS[0];
}

export function buildBlogTopicLink(value: string): string {
  if (value === "all-posts") {
    return "/blog";
  }

  return `/blog?topic=${encodeURIComponent(value)}`;
}

export function postMatchesBlogTopic(categorySlugs: readonly string[], topic: BlogTopicOption): boolean {
  if (topic.value === "all-posts") {
    return true;
  }

  return categorySlugs.some((slug) => topic.matchSlugs.includes(slug));
}

export function resolvePrimaryBlogCategoryLabel(value: Pick<PublicBlogPostSummary, "categories">): string {
  return value.categories[0]?.title ?? "General";
}
