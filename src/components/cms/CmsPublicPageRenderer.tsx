import Image from "next/image";
import Link from "next/link";

import {
  type CmsPageBlock,
  type CmsPageCtaStripBlock,
  type CmsPageDetail,
  type CmsPageFeatureGridBlock,
  type CmsPageHeroBlock,
  type CmsPageMediaSplitBlock,
  type CmsPageRichTextBlock,
} from "@/server/cms/cms-page-mappers";

import { CmsRichTextBlock } from "./CmsRichTextBlock";

interface CmsPublicPageRendererProps {
  page: CmsPageDetail;
}

function renderHeroBlock(block: CmsPageHeroBlock): JSX.Element {
  return (
    <section className="cms-page-hero cms-page-section" aria-label="Page introduction">
      {block.backgroundImage ? (
        <div className="cms-page-hero-image-wrap" aria-hidden="true">
          <Image
            src={block.backgroundImage.url}
            alt={block.backgroundImage.alt || block.heading}
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
          />
          <div className="cms-page-hero-image-overlay" />
        </div>
      ) : null}

      <div className="cms-page-hero-content">
        {block.eyebrow ? <p className="cms-page-eyebrow">{block.eyebrow}</p> : null}
        <h1 className="serif cms-page-hero-title">{block.heading}</h1>
        {block.subheading ? <p className="cms-page-hero-subtitle">{block.subheading}</p> : null}

        {block.primaryActionHref || block.secondaryActionHref ? (
          <div className="cms-page-hero-actions">
            {block.primaryActionHref ? (
              <Link href={block.primaryActionHref} className="btn btn-primary">
                {block.primaryActionLabel || "Get Started"}
              </Link>
            ) : null}
            {block.secondaryActionHref ? (
              <Link href={block.secondaryActionHref} className="btn btn-outline-white">
                {block.secondaryActionLabel || "Learn More"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function renderFeatureGridBlock(block: CmsPageFeatureGridBlock): JSX.Element {
  return (
    <section className="cms-page-section cms-page-feature-grid" aria-label={block.heading || "Key points"}>
      {block.heading ? <h2 className="serif cms-page-section-heading">{block.heading}</h2> : null}
      {block.intro ? <p className="cms-page-section-intro">{block.intro}</p> : null}

      <div className="cms-page-feature-grid-items">
        {block.items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="cms-page-feature-item">
            <h3 className="cms-page-feature-title">{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderRichTextBlock(block: CmsPageRichTextBlock): JSX.Element | null {
  if (!block.body) {
    if (!block.heading) {
      return null;
    }

    return (
      <section className="cms-page-section cms-page-richtext-empty" aria-label={block.heading}>
        <h2 className="serif cms-page-section-heading">{block.heading}</h2>
      </section>
    );
  }

  return (
    <CmsRichTextBlock
      block={{
        heading: block.heading,
        body: block.body,
      }}
      className="cms-page-section cms-page-richtext"
      headingClassName="cms-page-section-heading"
    />
  );
}

function renderMediaSplitBlock(block: CmsPageMediaSplitBlock): JSX.Element {
  const textColumn = block.body ? (
    <CmsRichTextBlock
      block={{
        heading: block.heading,
        body: block.body,
      }}
      className="cms-page-media-richtext"
      headingClassName="cms-page-section-heading"
    />
  ) : (
    <section className="cms-page-media-richtext">
      <h2 className="serif cms-page-section-heading">{block.heading}</h2>
    </section>
  );

  const imageColumn = block.image ? (
    <div className="cms-page-media-image-wrap" aria-hidden="true">
      <Image
        src={block.image.url}
        alt={block.image.alt || block.heading}
        fill
        sizes="(max-width: 900px) 100vw, 560px"
      />
    </div>
  ) : null;

  return (
    <section className="cms-page-section cms-page-media-split" aria-label={block.heading} data-image-position={block.imagePosition}>
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

function renderCtaStripBlock(block: CmsPageCtaStripBlock): JSX.Element {
  return (
    <section className="cms-page-section cms-page-cta-strip" aria-label={block.heading}>
      {block.eyebrow ? <p className="cms-page-eyebrow">{block.eyebrow}</p> : null}
      <h2 className="serif cms-page-section-heading">{block.heading}</h2>
      {block.body ? <p className="cms-page-section-intro">{block.body}</p> : null}

      <div className="cms-page-cta-actions">
        <Link href={block.primaryActionHref} className="btn btn-primary">
          {block.primaryActionLabel}
        </Link>
        {block.secondaryActionHref ? (
          <Link href={block.secondaryActionHref} className="btn btn-outline-white">
            {block.secondaryActionLabel || "Learn More"}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function renderBlock(block: CmsPageBlock): JSX.Element | null {
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
  return (
    <article className="container cms-public-page-shell" data-cms-page-slug={page.slug}>
      {page.layout.map((block, index) => (
        <div key={`${block.id}-${index}`} className="cms-page-block-wrap">
          {renderBlock(block)}
        </div>
      ))}
    </article>
  );
}
