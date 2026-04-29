import { LocationLandingPage } from "@/components/location/LocationLandingPage";
import { locationLandingPages } from "@/lib/location-landing-pages";
import { buildSeoMetadata } from "@/lib/seo";

const page = locationLandingPages.lagosAirport;

export const metadata = buildSeoMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.path,
});

export default function ShortLetNearLagosAirportPage() {
  return <LocationLandingPage page={page} />;
}
