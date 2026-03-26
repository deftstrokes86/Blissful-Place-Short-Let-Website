import { PropertyFlatExperience } from "@/components/property/PropertyFlatExperience";
import { resolvePropertyFlatId } from "@/lib/property-flat-content";

interface PropertyPageProps {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const selectedFlatId = resolvePropertyFlatId(resolvedSearchParams.flat);

  return <PropertyFlatExperience key={selectedFlatId} initialFlatId={selectedFlatId} />;
}

