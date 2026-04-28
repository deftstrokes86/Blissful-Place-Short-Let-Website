import type { Metadata } from "next";

const siteName = "Blissful Place Residences";
const siteUrl = "https://www.blissfulplaceresidences.com";
const defaultOgImage = "/Hero-Image.png";

type BuildSeoMetadataArgs = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

export function buildSeoMetadata({
  title,
  description,
  path,
  image = defaultOgImage,
  type = "website",
}: BuildSeoMetadataArgs): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const absoluteUrl = `${siteUrl}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${siteName} preview image`,
        },
      ],
      locale: "en_NG",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

