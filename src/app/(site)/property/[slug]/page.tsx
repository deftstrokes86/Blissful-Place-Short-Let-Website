import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyFlatExperience } from "@/components/property/PropertyFlatExperience";
import { FLATS } from "@/lib/constants";
import {
  getPropertyFlatRoute,
  PROPERTY_FLAT_CONTENT,
  PROPERTY_FLAT_IDS,
  resolvePropertyFlatIdFromRouteSlug,
} from "@/lib/property-flat-content";
import { buildSeoMetadata } from "@/lib/seo";
import type { FlatId } from "@/types/booking";

interface PropertyFlatPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = "https://www.blissfulplaceresidences.com";
const fallbackPropertyImageUrl = `${siteUrl}/Hero-Image.png`;

const flatAmenityFeatures = [
  "Equipped kitchen",
  "Induction cooker",
  "Microwave",
  "Blender",
  "Cooking utensils",
  "Fiber internet",
  "Solar-backed power",
  "AI-powered washing machine access",
  "Gated access",
  "CCTV coverage in external/common areas",
  "On-site security",
  "Controlled vehicle access",
  "Guest support",
].map((name) => ({
  "@type": "LocationFeatureSpecification",
  name,
  value: true,
}));

const propertyProvider = {
  "@type": "LodgingBusiness",
  name: "Blissful Place Residences",
  url: siteUrl,
  telephone: "+2349013673587",
  email: "reservations@blissfulplaceresidences.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "16 Tebun Fagbemi Street",
    addressLocality: "Agbado",
    addressRegion: "Lagos",
    addressCountry: "NG",
  },
  checkinTime: "13:00",
  checkoutTime: "12:00",
};

function absoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) {
    return fallbackPropertyImageUrl;
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${siteUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function findFlat(flatId: FlatId) {
  return FLATS.find((flat) => flat.id === flatId) ?? null;
}

function buildFlatSchema(flatId: FlatId) {
  const flat = findFlat(flatId);

  if (!flat) {
    return null;
  }

  const content = PROPERTY_FLAT_CONTENT[flatId];
  const flatUrl = `${siteUrl}${getPropertyFlatRoute(flatId)}`;

  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: flat.name,
    description: content.metaDescription,
    url: flatUrl,
    image: absoluteUrl(content.heroImage.src),
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: 6,
      unitText: "guests",
    },
    amenityFeature: flatAmenityFeatures,
    containedInPlace: propertyProvider,
  };
}

export function generateStaticParams() {
  return PROPERTY_FLAT_IDS.map((flatId) => ({
    slug: PROPERTY_FLAT_CONTENT[flatId].routeSlug,
  }));
}

export async function generateMetadata({ params }: PropertyFlatPageProps): Promise<Metadata> {
  const { slug } = await params;
  const flatId = resolvePropertyFlatIdFromRouteSlug(slug);

  if (!flatId) {
    return {};
  }

  const flat = findFlat(flatId);

  if (!flat) {
    return {};
  }

  const content = PROPERTY_FLAT_CONTENT[flatId];

  return buildSeoMetadata({
    title: flat.name,
    description: content.metaDescription,
    path: getPropertyFlatRoute(flatId),
    image: content.heroImage.src,
  });
}

export default async function PropertyFlatPage({ params }: PropertyFlatPageProps) {
  const { slug } = await params;
  const flatId = resolvePropertyFlatIdFromRouteSlug(slug);

  if (!flatId || !findFlat(flatId)) {
    notFound();
  }

  const flatSchema = buildFlatSchema(flatId);

  return (
    <>
      {flatSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(flatSchema),
          }}
        />
      ) : null}
      <PropertyFlatExperience key={flatId} initialFlatId={flatId} />
    </>
  );
}
