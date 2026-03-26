export const BLOG_POST_STATUS_VALUES = ["draft", "published"] as const;

export type BlogPostStatus = (typeof BLOG_POST_STATUS_VALUES)[number];

function collapseHyphens(value: string): string {
  return value.replace(/-+/g, "-");
}

function trimEdgeHyphens(value: string): string {
  return value.replace(/^-+/, "").replace(/-+$/, "");
}

export function normalizeBlogSlug(input: string): string {
  const lower = input.trim().toLowerCase();
  const dashed = lower
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/[_\s]+/g, "-");

  return trimEdgeHyphens(collapseHyphens(dashed));
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveBlogSlug(currentSlug: unknown, title: unknown): string | null {
  const explicitSlug = toNonEmptyString(currentSlug);

  if (explicitSlug) {
    const normalizedExplicitSlug = normalizeBlogSlug(explicitSlug);
    return normalizedExplicitSlug.length > 0 ? normalizedExplicitSlug : null;
  }

  const titleValue = toNonEmptyString(title);

  if (!titleValue) {
    return null;
  }

  const normalizedTitleSlug = normalizeBlogSlug(titleValue);
  return normalizedTitleSlug.length > 0 ? normalizedTitleSlug : null;
}

export function coerceBlogPostStatus(value: unknown): BlogPostStatus | null {
  return value === "draft" || value === "published" ? value : null;
}

export function shouldAutoSetPublishedAt(status: BlogPostStatus, publishedAt: unknown): boolean {
  if (status !== "published") {
    return false;
  }

  return typeof publishedAt !== "string" || publishedAt.trim().length === 0;
}
