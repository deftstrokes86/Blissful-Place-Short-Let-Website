import type { Metadata } from "next";

import { PropertyFlatExperience } from "@/components/property/PropertyFlatExperience";
import { resolvePropertyFlatId } from "@/lib/property-flat-content";

export const metadata: Metadata = {
  title: "Our Residences — 3-Bedroom Short-Let Apartments Near Ikeja & Abule Egba",
  description: "Three professionally managed 3-bedroom, 3-bathroom apartments in a secure gated compound in Agbado, Lagos. Silent solar power, fiber internet, and easy access to Ikeja, Abule Egba, Meiran & Egbeda.",
};

interface PropertyPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedFlatId = resolvePropertyFlatId(resolvedSearchParams.flat);

  return <PropertyFlatExperience key={selectedFlatId} initialFlatId={selectedFlatId} />;
}

