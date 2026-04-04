import type { SerializedEditorState } from "lexical";
import type { Metadata } from "next";

import { resolveRenderableBlogImageUrl } from "@/lib/blog-image";

export interface PublicBlogPostMetadataInput {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  featuredImageUrl: string | null;
  canonicalUrl: string | null;
}

function asNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectTextContent(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  const children = Array.isArray(record.children) ? record.children : [];

  const nestedText = children.flatMap((child) => collectTextContent(child));

  if (text.length > 0) {
    return [text, ...nestedText];
  }

  return nestedText;
}

export function resolvePublicLexicalContentState(content: unknown): SerializedEditorState | null {
  if (!isRecord(content)) {
    return null;
  }

  const root = content.root;

  if (!isRecord(root)) {
    return null;
  }

  const children = root.children;

  if (!Array.isArray(children)) {
    return null;
  }

  if (typeof root.type === "string" && root.type !== "root") {
    return null;
  }

  return content as unknown as SerializedEditorState;
}

export function extractLexicalParagraphs(content: unknown): string[] {
  const lexicalContent = resolvePublicLexicalContentState(content);

  if (!lexicalContent) {
    return [];
  }

  const rootRecord = lexicalContent.root as unknown as Record<string, unknown>;
  const nestedChildren = Array.isArray(rootRecord.children) ? rootRecord.children : [];

  const rawParagraphs = nestedChildren
    .flatMap((entry) => collectTextContent(entry))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(rawParagraphs));
}

export function resolvePublicBlogIntro(excerpt: string, paragraphs: string[]): string {
  return asNonEmptyString(excerpt) ?? paragraphs[0] ?? "";
}

export function buildPublicBlogPostMetadata(input: PublicBlogPostMetadataInput): Metadata {
  const title = asNonEmptyString(input.metaTitle) ?? input.title;
  const description =
    asNonEmptyString(input.metaDescription) ??
    asNonEmptyString(input.excerpt) ??
    "Read this article on Blissful Place Residences.";
  const socialImage =
    resolveRenderableBlogImageUrl(input.ogImageUrl) ?? resolveRenderableBlogImageUrl(input.featuredImageUrl);
  const canonical = asNonEmptyString(input.canonicalUrl) ?? `/blog/${input.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title,
      description,
      images: socialImage ? [{ url: socialImage, alt: title }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}
