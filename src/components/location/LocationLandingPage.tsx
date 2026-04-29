import Link from "next/link";

import { PageIntro } from "@/components/common/PageIntro";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import type { LocationLandingPageContent } from "@/lib/location-landing-pages";

type LocationLandingPageProps = {
  page: LocationLandingPageContent;
};

function buildFaqSchema(page: LocationLandingPageContent) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function LocationLandingPage({ page }: LocationLandingPageProps) {
  const faqSchema = buildFaqSchema(page);

  return (
    <main className="blog-page">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <article className="container guest-guide-page">
        <PageIntro title={page.title} subtitle={page.eyebrow} description={page.intro} />

        <div className="blog-empty-actions" style={{ marginBottom: "2rem" }}>
          <Link href={page.primaryCta.href} className="btn btn-primary">
            {page.primaryCta.label}
          </Link>
          <Link href={page.secondaryCta.href} className="btn btn-outline-white">
            {page.secondaryCta.label}
          </Link>
        </div>

        <div className="guest-guide-stack">
          {page.sections.map((section) => (
            <section key={section.title} className="booking-section">
              <h2 className="heading-sm serif">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="booking-section" aria-labelledby={`${page.slug}-apartments-heading`}>
            <h2 id={`${page.slug}-apartments-heading`} className="heading-sm serif">
              Choose your apartment
            </h2>
            <p>{page.apartmentIntro}</p>

            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
                marginTop: "1.25rem",
              }}
            >
              {page.apartmentLinks.map((apartment) => (
                <article key={apartment.href} className="guest-guide-callout">
                  <h3 className="heading-sm serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    <Link href={apartment.href} style={{ color: "inherit", textDecoration: "none" }}>
                      {apartment.name}
                    </Link>
                  </h3>
                  <p style={{ marginBottom: "0.75rem" }}>{apartment.description}</p>
                  <Link href={apartment.href} className="blog-read-link">
                    View apartment
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="booking-section" aria-labelledby={`${page.slug}-planning-heading`}>
            <h2 id={`${page.slug}-planning-heading`} className="heading-sm serif">
              Plan the next step
            </h2>
            <p>
              Use these links to review the property, confirm guest guidance, or speak with the team before you book.
            </p>
            <div className="blog-empty-actions" style={{ marginTop: "1rem" }}>
              {page.guideLinks.map((link) => (
                <Link key={link.href} href={link.href} className="btn btn-outline-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="booking-section" aria-labelledby={`${page.slug}-faq-heading`}>
            <h2 id={`${page.slug}-faq-heading`} className="heading-sm serif">
              Frequently asked questions
            </h2>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              {page.faqs.map((faq) => (
                <details key={faq.question} className="guest-guide-callout">
                  <summary style={{ cursor: "pointer", color: "var(--text-primary)", fontWeight: 600 }}>
                    {faq.question}
                  </summary>
                  <p style={{ marginTop: "0.75rem" }}>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">Ready to plan your stay?</h2>
            <p>
              Compare the apartments, confirm your preferred dates, or contact the reservations team if you need
              help choosing the best fit.
            </p>
            <div className="blog-empty-actions" style={{ marginTop: "1rem" }}>
              <Link href="/property" className="btn btn-outline-white">
                View all apartments
              </Link>
              <Link href="/book" className="btn btn-primary">
                Check availability
              </Link>
              <Link href="/contact" className="btn btn-outline-white">
                Contact reservations
              </Link>
            </div>
          </section>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
