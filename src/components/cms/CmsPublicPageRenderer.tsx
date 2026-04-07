import Image from "next/image";
import Link from "next/link";

import { resolveRenderableBlogImageUrl } from "@/lib/blog-image";
import {
  type CmsPageBlock,
  type CmsPageCtaStripBlock,
  type CmsPageDetail,
  type CmsPageFeatureGridBlock,
  type CmsPageHeroBlock,
  type CmsPageMedia,
  type CmsPageMediaSplitBlock,
  type CmsPageRichTextBlock,
} from "@/server/cms/cms-page-mappers";

import { CmsRichTextBlock } from "./CmsRichTextBlock";

interface CmsPublicPageRendererProps {
  page: CmsPageDetail | null | undefined;
}

function asNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSectionHeading(value: string | null | undefined, fallback: string): string {
  return asNonEmptyString(value) ?? fallback;
}

function resolveRenderableCmsMedia(
  value: CmsPageMedia | null | undefined,
  fallbackAlt: string
): { src: string; alt: string } | null {
  const src = resolveRenderableBlogImageUrl(value?.url);
  if (!src) {
    return null;
  }

  return {
    src,
    alt: asNonEmptyString(value?.alt) ?? fallbackAlt,
  };
}

function renderHeroBlock(block: CmsPageHeroBlock) {
  const heading = resolveSectionHeading(block.heading, "Blissful Place Residences");
  const backgroundImage = resolveRenderableCmsMedia(block.backgroundImage, heading);
  const primaryActionHref = asNonEmptyString(block.primaryActionHref);
  const secondaryActionHref = asNonEmptyString(block.secondaryActionHref);

  return (
    <section className="cms-page-hero cms-page-section" aria-label="Page introduction">
      {backgroundImage ? (
        <div className="cms-page-hero-image-wrap" aria-hidden="true">
          <Image
            src={backgroundImage.src}
            alt={backgroundImage.alt}
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
          />
          <div className="cms-page-hero-image-overlay" />
        </div>
      ) : null}

      <div className="cms-page-hero-content">
        {asNonEmptyString(block.eyebrow) ? <p className="cms-page-eyebrow">{block.eyebrow}</p> : null}
        <h1 className="serif cms-page-hero-title">{heading}</h1>
        {asNonEmptyString(block.subheading) ? <p className="cms-page-hero-subtitle">{block.subheading}</p> : null}

        {primaryActionHref || secondaryActionHref ? (
          <div className="cms-page-hero-actions">
            {primaryActionHref ? (
              <Link href={primaryActionHref} className="btn btn-primary">
                {asNonEmptyString(block.primaryActionLabel) ?? "Get Started"}
              </Link>
            ) : null}
            {secondaryActionHref ? (
              <Link href={secondaryActionHref} className="btn btn-outline-white">
                {asNonEmptyString(block.secondaryActionLabel) ?? "Learn More"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function renderFeatureGridBlock(block: CmsPageFeatureGridBlock) {
  const heading = asNonEmptyString(block.heading);
  const intro = asNonEmptyString(block.intro);
  const items = Array.isArray(block.items)
    ? block.items.filter((item) => asNonEmptyString(item.title) || asNonEmptyString(item.description))
    : [];

  if (!heading && !intro && items.length === 0) {
    return null;
  }

  return (
    <section className="cms-page-section cms-page-feature-grid" aria-label={heading || "Key points"}>
      {heading ? <h2 className="serif cms-page-section-heading">{heading}</h2> : null}
      {intro ? <p className="cms-page-section-intro">{intro}</p> : null}

      {items.length > 0 ? (
        <div className="cms-page-feature-grid-items">
          {items.map((item, index) => (
            <article key={`${item.title || item.description || "feature"}-${index}`} className="cms-page-feature-item">
              {asNonEmptyString(item.title) ? <h3 className="cms-page-feature-title">{item.title}</h3> : null}
              {asNonEmptyString(item.description) ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function renderRichTextBlock(block: CmsPageRichTextBlock) {
  const heading = asNonEmptyString(block.heading);

  if (!block.body) {
    if (!heading) {
      return null;
    }

    return (
      <section className="cms-page-section cms-page-richtext-empty" aria-label={heading}>
        <h2 className="serif cms-page-section-heading">{heading}</h2>
      </section>
    );
  }

  return (
    <CmsRichTextBlock
      block={{
        heading,
        body: block.body,
      }}
      className="cms-page-section cms-page-richtext"
      headingClassName="cms-page-section-heading"
    />
  );
}

function renderMediaSplitBlock(block: CmsPageMediaSplitBlock) {
  const heading = resolveSectionHeading(block.heading, "Page section");
  const textColumn = block.body ? (
    <CmsRichTextBlock
      block={{
        heading,
        body: block.body,
      }}
      className="cms-page-media-richtext"
      headingClassName="cms-page-section-heading"
    />
  ) : asNonEmptyString(block.heading) ? (
    <section className="cms-page-media-richtext">
      <h2 className="serif cms-page-section-heading">{heading}</h2>
    </section>
  ) : null;

  const image = resolveRenderableCmsMedia(block.image, heading);
  const imageColumn = image ? (
    <div className="cms-page-media-image-wrap" aria-hidden="true">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 900px) 100vw, 560px"
      />
    </div>
  ) : null;

  if (!textColumn && !imageColumn) {
    return null;
  }

  return (
    <section className="cms-page-section cms-page-media-split" aria-label={heading} data-image-position={block.imagePosition}>
      <div className="cms-page-media-split-grid">
        {block.imagePosition === "left" ? (
          <>
            {imageColumn}
            {textColumn}
          </>
        ) : (
          <>
            {textColumn}
            {imageColumn}
          </>
        )}
      </div>
    </section>
  );
}

function renderCtaStripBlock(block: CmsPageCtaStripBlock) {
  const heading = resolveSectionHeading(block.heading, "Explore more");
  const primaryActionHref = asNonEmptyString(block.primaryActionHref);
  const secondaryActionHref = asNonEmptyString(block.secondaryActionHref);
  const eyebrow = asNonEmptyString(block.eyebrow);
  const body = asNonEmptyString(block.body);

  return (
    <section className="cms-page-section cms-page-cta-strip" aria-label={heading}>
      {eyebrow ? <p className="cms-page-eyebrow">{eyebrow}</p> : null}
      <h2 className="serif cms-page-section-heading">{heading}</h2>
      {body ? <p className="cms-page-section-intro">{body}</p> : null}

      {primaryActionHref || secondaryActionHref ? (
        <div className="cms-page-cta-actions">
          {primaryActionHref ? (
            <Link href={primaryActionHref} className="btn btn-primary">
              {asNonEmptyString(block.primaryActionLabel) ?? "Get Started"}
            </Link>
          ) : null}
          {secondaryActionHref ? (
            <Link href={secondaryActionHref} className="btn btn-outline-white">
              {asNonEmptyString(block.secondaryActionLabel) ?? "Learn More"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function renderBlock(block: CmsPageBlock) {
  switch (block.blockType) {
    case "hero":
      return renderHeroBlock(block);
    case "richText":
      return renderRichTextBlock(block);
    case "featureGrid":
      return renderFeatureGridBlock(block);
    case "mediaSplit":
      return renderMediaSplitBlock(block);
    case "ctaStrip":
      return renderCtaStripBlock(block);
    default:
      return null;
  }
}

export function CmsPublicPageRenderer({ page }: CmsPublicPageRendererProps) {
  const pageTitle = resolveSectionHeading(page?.title, "Page");
  const pageSlug = asNonEmptyString(page?.slug) ?? "cms-page";
  const layout = Array.isArray(page?.layout) ? page.layout : [];

  if (!page) {
    return (
      <article className="container cms-public-page-shell" data-cms-page-slug={pageSlug}>
        <section className="cms-page-section cms-page-richtext-empty" aria-label="Page unavailable">
          <h1 className="serif cms-page-section-heading">Page unavailable</h1>
          <p className="text-secondary">This page could not be loaded right now.</p>
        </section>
      </article>
    );
  }

  if (layout.length === 0) {
    return (
      <article className="container cms-public-page-shell" data-cms-page-slug={pageSlug}>
        <section className="cms-page-section cms-page-richtext-empty" aria-label={pageTitle}>
          <h1 className="serif cms-page-section-heading">{pageTitle}</h1>
          <p className="text-secondary">This page has no published sections yet.</p>
        </section>
      </article>
    );
  }

  return (
    <article className="container cms-public-page-shell" data-cms-page-slug={pageSlug}>
      {layout.map((block, index) => {
        const renderedBlock = renderBlock(block);
        if (!renderedBlock) {
          return null;
        }

        return (
          <div key={`${block.id || block.blockType || "block"}-${index}`} className="cms-page-block-wrap">
            {renderedBlock}
          </div>
        );
      })}
    </article>
  );
}
