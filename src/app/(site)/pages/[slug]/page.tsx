import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CmsPublicPageRenderer } from "@/components/cms/CmsPublicPageRenderer";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { findPublishedCmsPageBySlug } from "@/server/cms/cms-page-service";

interface CmsPublicPageRouteProps {
  params: Promise<{ slug: string }>;
}

const getPublishedCmsPage = cache(async (slug: string) => {
  return findPublishedCmsPageBySlug(slug);
});

function buildCmsPageMetadataTitle(pageTitle: string, metaTitle: string): string {
  return metaTitle || `${pageTitle} | Blissful Place Residences`;
}

function buildCmsPageMetadataDescription(metaDescription: string): string {
  return metaDescription || "Discover more from Blissful Place Residences.";
}

export async function generateMetadata({ params }: CmsPublicPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedCmsPage(slug);

  if (!page) {
    return {
      title: "Page Not Found | Blissful Place Residences",
      description: "The requested page could not be found.",
    };
  }

  const title = buildCmsPageMetadataTitle(page.title, page.metaTitle);
  const description = buildCmsPageMetadataDescription(page.metaDescription);

  return {
    title,
    description,
    alternates: {
      canonical: page.canonicalUrl || `/pages/${page.slug}`,
    },
    openGraph: {
      title,
      description,
      images: page.ogImageUrl
        ? [
            {
              url: page.ogImageUrl,
              alt: page.ogImageAlt || title,
            },
          ]
        : undefined,
    },
  };
}

export default async function CmsPublicPageRoute({ params }: CmsPublicPageRouteProps) {
  const { slug } = await params;
  const page = await getPublishedCmsPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="cms-public-page">
      <SiteHeader />
      <CmsPublicPageRenderer page={page} />
      <SiteFooter />
    </main>
  );
}
