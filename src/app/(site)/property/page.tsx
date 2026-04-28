import { PropertyFlatExperience } from "@/components/property/PropertyFlatExperience";
import { resolvePropertyFlatId } from "@/lib/property-flat-content";
import { buildSeoMetadata } from "@/lib/seo";

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
  const selectedFlatId = resolvePropertyFlatId(resolvedSearchParams.flat);

  return <PropertyFlatExperience key={selectedFlatId} initialFlatId={selectedFlatId} />;
}

