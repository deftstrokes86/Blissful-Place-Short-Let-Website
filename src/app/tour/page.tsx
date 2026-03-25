"use client";

import { PageIntro } from "@/components/common/PageIntro";
import { TourSchedulerPanel } from "@/components/tour/TourSchedulerPanel";

export default function Tour() {
  return (
    <main className="tour-page">
      <section className="container tour-page-container">
        <PageIntro
          subtitle="Private Concierge"
          title="Schedule a Private Tour"
          description="Arrange a discreet in-person walkthrough with our team before you confirm your reservation."
          backLabel="Back to Home"
          wrapperStyle={{ marginBottom: "1.75rem" }}
          titleStyle={{ marginTop: "0.75rem" }}
          descriptionStyle={{ maxWidth: "56ch", fontSize: "1.03rem" }}
        />

        <TourSchedulerPanel />
      </section>
    </main>
  );
}
