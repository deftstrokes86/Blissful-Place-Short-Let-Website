export const BLOG_POST_STATUS_VALUES = ["draft", "published"] as const;

export type BlogPostStatus = (typeof BLOG_POST_STATUS_VALUES)[number];

interface LexicalSerializedTextNode {
  detail: number;
  format: number;
  mode: "normal";
  style: string;
  text: string;
  type: "text";
  version: 1;
}

interface LexicalSerializedParagraphNode {
  children: LexicalSerializedTextNode[];
  direction: null;
  format: "";
  indent: number;
  textFormat: number;
  textStyle: string;
  type: "paragraph";
  version: 1;
}

interface LexicalSerializedRootNode {
  children: LexicalSerializedParagraphNode[];
  direction: null;
  format: "";
  indent: number;
  type: "root";
  version: 1;
}

export interface LexicalSerializedContentState {
  root: LexicalSerializedRootNode;
}

function collapseHyphens(value: string): string {
  return value.replace(/-+/g, "-");
}

function trimEdgeHyphens(value: string): string {
  return value.replace(/^-+/, "").replace(/-+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
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

function isLexicalSerializedContentState(value: unknown): value is LexicalSerializedContentState {
  if (!isRecord(value)) {
    return false;
  }

  const root = value.root;

  if (!isRecord(root)) {
    return false;
  }

  return root.type === "root" && Array.isArray(root.children);
}

function createLexicalContentState(text: string): LexicalSerializedContentState {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

export function resolveBlogContent(content: unknown, excerpt: unknown, title: unknown): LexicalSerializedContentState | null {
  if (isLexicalSerializedContentState(content)) {
    return content;
  }

  const fallbackText =
    toNonEmptyString(content) ??
    toNonEmptyString(excerpt) ??
    toNonEmptyString(title);

  if (!fallbackText) {
    return null;
  }

  return createLexicalContentState(fallbackText);
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
