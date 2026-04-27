import type { Metadata } from "next";

import { HomeClosingSections } from "@/components/home/HomeClosingSections";
import { HomeExperienceSections } from "@/components/home/HomeExperienceSections";
import { HomeFeaturedResidencesSection } from "@/components/home/HomeFeaturedResidencesSection";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Premium Short-Let Apartments in Agbado, Lagos | Near Ikeja, Abule Egba, Meiran",
  alternates: {
    canonical: "/",
  },
  description: "Book directly and save up to 15%. Three identical 3-bedroom apartments with silent 24/7 solar power, fiber internet, and gated security in Agbado, Lagos — minutes from Ikeja, Abule Egba, Meiran & Egbeda.",
};

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
