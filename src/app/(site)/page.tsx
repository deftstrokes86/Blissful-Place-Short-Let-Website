import { HomeClosingSections } from "@/components/home/HomeClosingSections";
import { HomeExperienceSections } from "@/components/home/HomeExperienceSections";
import { HomeFeaturedResidencesSection } from "@/components/home/HomeFeaturedResidencesSection";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Blissful Place Residences | Premium Short-Let Apartments in Agbado, Lagos",
  description:
    "Book professionally managed short-let apartments in Agbado, Lagos with solar-backed power, fiber internet, equipped kitchens, gated access, and guest support.",
  path: "/",
});

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <HomeHeroSection />
      <HomeFeaturedResidencesSection />
      <HomeExperienceSections />
      <HomeClosingSections />
      <SiteFooter />
    </main>
  );
}

