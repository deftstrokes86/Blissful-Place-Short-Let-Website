import { PropertyFlatExperience } from "@/components/property/PropertyFlatExperience";
import { FLATS } from "@/lib/constants";
import {
  DEFAULT_PROPERTY_FLAT_ID,
  getPropertyFlatRoute,
  PROPERTY_FLAT_CONTENT,
  resolveLegacyPropertyFlatRoute,
} from "@/lib/property-flat-content";
import { buildSeoMetadata } from "@/lib/seo";
import type { FlatId } from "@/types/booking";
import { permanentRedirect } from "next/navigation";

const siteUrl = "https://www.blissfulplaceresidences.com";
const propertyPageUrl = `${siteUrl}/property`;
const fallbackPropertyImageUrl = `${siteUrl}/Hero-Image.png`;

const propertyAmenityFeatures = [
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

function getFlatImage(flatId: FlatId): string {
  return absoluteUrl(PROPERTY_FLAT_CONTENT[flatId].heroImage.src);
}

function getFlatDescription(flatId: FlatId): string {
  const flatContent = PROPERTY_FLAT_CONTENT[flatId];

  return [flatContent.positioningLine, ...flatContent.overview].join(" ");
}

const propertySchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Blissful Place Residences short-let apartments",
  description: "Furnished short-let apartments in Agbado, Lagos.",
  url: propertyPageUrl,
  itemListElement: FLATS.map((flat, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Accommodation",
      name: flat.name,
      description: getFlatDescription(flat.id),
      url: `${siteUrl}${getPropertyFlatRoute(flat.id)}`,
      image: getFlatImage(flat.id),
      occupancy: {
        "@type": "QuantitativeValue",
        maxValue: 6,
        unitText: "guests",
      },
      amenityFeature: propertyAmenityFeatures,
      containedInPlace: propertyProvider,
    },
  })),
};

export const metadata = buildSeoMetadata({
  title: "Short-Let Apartments in Agbado, Lagos",
  description:
    "Explore the furnished flats at Blissful Place Residences, each with comfortable bedrooms, equipped kitchen, fiber internet, solar-backed power, and gated access.",
  path: "/property",
});

interface PropertyPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const legacyFlatRoute = resolveLegacyPropertyFlatRoute(resolvedSearchParams.flat);

  if (legacyFlatRoute) {
    permanentRedirect(legacyFlatRoute);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertySchema),
        }}
      />
      <PropertyFlatExperience key={DEFAULT_PROPERTY_FLAT_ID} initialFlatId={DEFAULT_PROPERTY_FLAT_ID} />
    </>
  );
}
