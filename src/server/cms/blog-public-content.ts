import type { SerializedEditorState } from "lexical";
import type { Metadata } from "next";

import { resolveRenderableBlogImageUrl } from "@/lib/blog-image";

const siteUrl = "https://www.blissfulplaceresidences.com";
const siteName = "Blissful Place Residences";
const defaultBlogPostingImage = `${siteUrl}/Hero-Image.png`;

export interface PublicBlogPostMetadataInput {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  featuredImageUrl: string | null;
}

export interface PublicBlogPostingSchemaInput {
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  ogImageUrl: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
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

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${siteUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function toIsoDate(value: string | Date | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function buildPublicBlogPostMetadata(input: PublicBlogPostMetadataInput): Metadata {
  const title = asNonEmptyString(input.metaTitle) ?? input.title;
  const description =
    asNonEmptyString(input.metaDescription) ??
    asNonEmptyString(input.excerpt) ??
    "Read this article on Blissful Place Residences.";
  const socialImage =
    resolveRenderableBlogImageUrl(input.ogImageUrl) ?? resolveRenderableBlogImageUrl(input.featuredImageUrl) ?? defaultBlogPostingImage;
  const canonical = `/blog/${input.slug}`;
  const canonicalUrl = `${siteUrl}${canonical}`;

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
      url: canonicalUrl,
      siteName,
      images: [{ url: socialImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export function buildPublicBlogPostingSchema(input: PublicBlogPostingSchemaInput) {
  const canonicalUrl = `${siteUrl}/blog/${input.slug}`;
  const description =
    asNonEmptyString(input.excerpt) ??
    asNonEmptyString(input.metaDescription) ??
    "Read this article on Blissful Place Residences.";
  const imageCandidate =
    resolveRenderableBlogImageUrl(input.ogImageUrl) ?? resolveRenderableBlogImageUrl(input.featuredImageUrl);
  const image = imageCandidate ? toAbsoluteUrl(imageCandidate) : defaultBlogPostingImage;
  const datePublished = toIsoDate(input.publishedAt ?? input.createdAt ?? input.updatedAt);
  const dateModified = toIsoDate(input.updatedAt ?? input.publishedAt ?? input.createdAt);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    url: canonicalUrl,
    headline: input.title,
    description,
    image,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: "Blissful Place Residences",
    },
    publisher: {
      "@type": "Organization",
      name: "Blissful Place Residences",
      logo: {
        "@type": "ImageObject",
        url: defaultBlogPostingImage,
      },
    },
  };
}
