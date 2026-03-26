import { HomeClosingSections } from "@/components/home/HomeClosingSections";
import { HomeExperienceSections } from "@/components/home/HomeExperienceSections";
import { HomeFeaturedResidencesSection } from "@/components/home/HomeFeaturedResidencesSection";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

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
