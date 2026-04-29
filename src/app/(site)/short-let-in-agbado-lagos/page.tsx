import { LocationLandingPage } from "@/components/location/LocationLandingPage";
import { locationLandingPages } from "@/lib/location-landing-pages";
import { buildSeoMetadata } from "@/lib/seo";

const page = locationLandingPages.agbado;

export const metadata = buildSeoMetadata({
  title: page.metaTitle,
  description: page.metaDescription,
  path: page.path,
});

export default function ShortLetInAgbadoLagosPage() {
  return <LocationLandingPage page={page} />;
}
