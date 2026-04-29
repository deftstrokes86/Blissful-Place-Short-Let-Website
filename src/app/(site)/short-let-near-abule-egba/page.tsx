import { LocationLandingPage } from "@/components/location/LocationLandingPage";
import { locationLandingPages } from "@/lib/location-landing-pages";
import { buildSeoMetadata } from "@/lib/seo";

const page = locationLandingPages.abuleEgba;

export const metadata = buildSeoMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.path,
});

export default function ShortLetNearAbuleEgbaPage() {
  return <LocationLandingPage page={page} />;
}
