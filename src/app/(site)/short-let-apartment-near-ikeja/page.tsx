import { LocationLandingPage } from "@/components/location/LocationLandingPage";
import { locationLandingPages } from "@/lib/location-landing-pages";
import { buildSeoMetadata } from "@/lib/seo";

const page = locationLandingPages.ikeja;

export const metadata = buildSeoMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.path,
});

export default function ShortLetApartmentNearIkejaPage() {
  return <LocationLandingPage page={page} />;
}
