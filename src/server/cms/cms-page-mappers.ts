import type { SerializedEditorState } from "lexical";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
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
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNullableDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return asNullableString(value);
}

function isLexicalState(value: unknown): value is SerializedEditorState {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  const root = asRecord(record.root);

  if (!root) {
    return false;
  }

  if (typeof root.type === "string" && root.type !== "root") {
    return false;
  }

  return Array.isArray(root.children);
}

export interface CmsPageMedia {
  id: string;
  url: string;
  alt: string;
}

export interface CmsPageFeatureGridItem {
  title: string;
  description: string;
  iconName: string;
}

interface CmsPageBlockBase {
  id: string;
  blockType: string;
}

export interface CmsPageHeroBlock extends CmsPageBlockBase {
  blockType: "hero";
  eyebrow: string;
  heading: string;
  subheading: string;
  backgroundImage: CmsPageMedia | null;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
}

export interface CmsPageRichTextBlock extends CmsPageBlockBase {
  blockType: "richText";
  heading: string;
  body: SerializedEditorState | null;
}

export interface CmsPageFeatureGridBlock extends CmsPageBlockBase {
  blockType: "featureGrid";
  heading: string;
  intro: string;
  items: CmsPageFeatureGridItem[];
}

export interface CmsPageMediaSplitBlock extends CmsPageBlockBase {
  blockType: "mediaSplit";
  heading: string;
  body: SerializedEditorState | null;
  image: CmsPageMedia | null;
  imagePosition: "left" | "right";
}

export interface CmsPageCtaStripBlock extends CmsPageBlockBase {
  blockType: "ctaStrip";
  eyebrow: string;
  heading: string;
  body: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
}

export interface CmsPageUnknownBlock extends CmsPageBlockBase {
  blockType: "unknown";
}

export type CmsPageBlock =
  | CmsPageHeroBlock
  | CmsPageRichTextBlock
  | CmsPageFeatureGridBlock
  | CmsPageMediaSplitBlock
  | CmsPageCtaStripBlock
  | CmsPageUnknownBlock;

export interface CmsPageDetail {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string;
  layout: CmsPageBlock[];
}

function mapMedia(value: unknown): CmsPageMedia | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = asIdentifier(record.id);
  const url = asNullableString(record.url);

  if (!id || !url) {
    return null;
  }

  return {
    id,
    url,
    alt: asString(record.alt),
  };
}

function mapFeatureItems(value: unknown): CmsPageFeatureGridItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({
      title: asString(entry.title),
      description: asString(entry.description),
      iconName: asString(entry.iconName),
    }))
    .filter((entry) => entry.title.length > 0 || entry.description.length > 0);
}

function mapBlock(entry: unknown): CmsPageBlock | null {
  const record = asRecord(entry);

  if (!record) {
    return null;
  }

  const rawBlockType = asString(record.blockType);
  const id = asIdentifier(record.id) || asIdentifier(record._id) || `${rawBlockType}-block`;

  if (rawBlockType === "hero") {
    return {
      id,
      blockType: "hero",
      eyebrow: asString(record.eyebrow),
      heading: asString(record.heading),
      subheading: asString(record.subheading),
      backgroundImage: mapMedia(record.backgroundImage),
      primaryActionLabel: asString(record.primaryActionLabel),
      primaryActionHref: asString(record.primaryActionHref),
      secondaryActionLabel: asString(record.secondaryActionLabel),
      secondaryActionHref: asString(record.secondaryActionHref),
    };
  }

  if (rawBlockType === "richText") {
    return {
      id,
      blockType: "richText",
      heading: asString(record.heading),
      body: isLexicalState(record.body) ? record.body : null,
    };
  }

  if (rawBlockType === "featureGrid") {
    return {
      id,
      blockType: "featureGrid",
      heading: asString(record.heading),
      intro: asString(record.intro),
      items: mapFeatureItems(record.items),
    };
  }

  if (rawBlockType === "mediaSplit") {
    const imagePosition = asString(record.imagePosition) === "left" ? "left" : "right";

    return {
      id,
      blockType: "mediaSplit",
      heading: asString(record.heading),
      body: isLexicalState(record.body) ? record.body : null,
      image: mapMedia(record.image),
      imagePosition,
    };
  }

  if (rawBlockType === "ctaStrip") {
    return {
      id,
      blockType: "ctaStrip",
      eyebrow: asString(record.eyebrow),
      heading: asString(record.heading),
      body: asString(record.body),
      primaryActionLabel: asString(record.primaryActionLabel),
      primaryActionHref: asString(record.primaryActionHref),
      secondaryActionLabel: asString(record.secondaryActionLabel),
      secondaryActionHref: asString(record.secondaryActionHref),
    };
  }

  return {
    id,
    blockType: "unknown",
  };
}

function mapLayout(value: unknown): CmsPageBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => mapBlock(entry))
    .filter((entry): entry is CmsPageBlock => Boolean(entry));
}

export function mapPublicCmsPageDetail(value: unknown): CmsPageDetail | null {
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

  const ogImage = mapMedia(record.ogImage);

  return {
    id,
    title,
    slug,
    status: asString(record.status),
    publishedAt: asNullableDate(record.publishedAt),
    metaTitle: asString(record.metaTitle),
    metaDescription: asString(record.metaDescription),
    canonicalUrl: asNullableString(record.canonicalUrl),
    ogImageUrl: ogImage?.url ?? null,
    ogImageAlt: ogImage?.alt ?? "",
    layout: mapLayout(record.layout),
  };
}
