"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LocationMap } from "@/components/site/LocationMap";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
  Wifi,
  Zap,
} from "@/lib/lucide-react";
import { SITE_LOCATION_LABEL, SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

interface AboutSectionProps {
  id: string;
  subtitle: string;
  title: string;
  children: ReactNode;
  className?: string;
  revealDelay?: number;
}

function AboutSection({ id, subtitle, title, children, className, revealDelay = 0 }: AboutSectionProps) {
  return (
    <section
      id={id}
      className={`about-section ${className ?? ""}`.trim()}
      aria-labelledby={`${id}-heading`}
      data-reveal=""
      data-reveal-delay={String(revealDelay)}
    >
      <div className="about-section-heading">
        <span className="subtitle-tag">{subtitle}</span>
        <h2 id={`${id}-heading`} className="heading-md serif">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function AboutPage() {
  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (revealTargets.length === 0) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      revealTargets.forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    revealTargets.forEach((element) => {
      const rawDelay = Number.parseInt(element.dataset.revealDelay ?? "0", 10);
      const safeDelay = Number.isFinite(rawDelay) && rawDelay >= 0 ? rawDelay : 0;
      element.style.setProperty("--about-reveal-delay", `${safeDelay}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const target = entry.target as HTMLElement;
          target.classList.add("is-visible");
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealTargets.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main>
      <SiteHeader />

      <section className="about-page">
        <div className="container about-page-container">
          <section className="about-hero" aria-labelledby="about-hero-heading" data-reveal="" data-reveal-delay="0">
            <div className="about-hero-copy">
              <span className="subtitle-tag">ABOUT BLISSFUL PLACE RESIDENCES</span>
              <h1 id="about-hero-heading" className="heading-lg serif">
                Quiet, dependable short-let stays in {SITE_LOCATION_LABEL}.
              </h1>
              <p className="about-hero-lead text-secondary">
                Blissful Place Residences is built for guests who value comfort without guesswork. We host
                corporates and young professionals in prepared spaces, with clear communication,
                responsive support, and dependable essentials in place before you arrive.
              </p>
              <div className="about-hero-actions">
                <Link href="/book" className="btn btn-primary">
                  Book Your Stay
                </Link>
                <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white">
                  <MessageSquare size={16} />
                  Make an Inquiry
                </a>
              </div>
              <div className="about-hero-support-links" data-reveal="" data-reveal-delay="110">
                <span className="text-secondary">Prefer to compare dates first?</span>
                <Link href="/availability" className="about-inline-support-link">
                  Check Availability
                </Link>
              </div>
            </div>

            <aside className="about-hero-side" aria-label="about snapshot" data-reveal="" data-reveal-delay="90">
              <p className="about-hero-side-title">Why Guests Choose Us</p>
              <ul className="about-hero-side-list">
                <li data-reveal="" data-reveal-delay="130">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Premium short-let accommodation with practical hospitality.</span>
                </li>
                <li data-reveal="" data-reveal-delay="170">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Designed for corporate and professional stays.</span>
                </li>
                <li data-reveal="" data-reveal-delay="210">
                  <CheckCircle2 size={15} className="text-primary" />
                  <span>Located in Agbado, Lagos, with easy access to Ikeja, Abule Egba, Meiran, and Egbeda.</span>
                </li>
              </ul>
            </aside>
          </section>

          <AboutSection
            id="about-brand-positioning"
            subtitle="BRAND POSITIONING"
            title="Practical comfort, delivered with consistency"
            className="about-section-soft"
            revealDelay={30}
          >
            <div className="about-positioning-layout">
              <div className="about-copy-stack">
                <p className="text-secondary">
                  We focus on what makes a stay feel easy: calm surroundings, dependable service,
                  and thoughtful preparation before you arrive.
                </p>
                <p className="text-secondary">
                  Our style is polished and grounded. The goal is simple: help guests settle in quickly,
                  stay productive, and leave confident in the experience.
                </p>
              </div>
              <aside className="about-positioning-card" aria-label="operating principles" data-reveal="" data-reveal-delay="120">
                <p className="about-mini-kicker">How We Operate</p>
                <ul>
                  <li>Clear communication from inquiry to checkout.</li>
                  <li>Prepared spaces and reliable everyday essentials.</li>
                  <li>Responsive support without unnecessary back-and-forth.</li>
                </ul>
              </aside>
            </div>
          </AboutSection>

          <AboutSection
            id="about-who-for"
            subtitle="WHO THIS IS FOR"
            title="A strong fit for focused guests"
            className="about-section-contrast"
            revealDelay={40}
          >
            <div className="about-persona-grid">
              <article className="about-persona-card" data-reveal="" data-reveal-delay="80">
                <Users size={18} className="text-primary" />
                <h3 className="serif">Corporate Teams</h3>
                <p className="text-secondary">Project-based stays that need order, speed, and reliability.</p>
              </article>
              <article className="about-persona-card" data-reveal="" data-reveal-delay="110">
                <Sparkles size={18} className="text-primary" />
                <h3 className="serif">Young Professionals</h3>
                <p className="text-secondary">Transition periods that call for comfort, calm, and consistency.</p>
              </article>
              <article className="about-persona-card" data-reveal="" data-reveal-delay="140">
                <Wifi size={18} className="text-primary" />
                <h3 className="serif">Remote Work Guests</h3>
                <p className="text-secondary">Stable internet and a quiet setting that supports productive routines.</p>
              </article>
              <article className="about-persona-card" data-reveal="" data-reveal-delay="170">
                <Shield size={18} className="text-primary" />
                <h3 className="serif">Privacy-Focused Travelers</h3>
                <p className="text-secondary">Guests who value secure access and respectful on-ground operations.</p>
              </article>
            </div>
          </AboutSection>

          <AboutSection
            id="about-count-on"
            subtitle="WHAT GUESTS CAN COUNT ON"
            title="Dependable details, every time"
            revealDelay={50}
          >
            <div className="about-feature-grid">
              <article className="about-feature-card" data-reveal="" data-reveal-delay="90">
                <div className="about-card-icon">
                  <Zap size={20} />
                </div>
                <h3 className="serif">24/7 Power</h3>
                <p className="text-secondary">
                  Power continuity is treated as essential, not optional, so your stay remains steady.
                </p>
              </article>
              <article className="about-feature-card" data-reveal="" data-reveal-delay="120">
                <div className="about-card-icon">
                  <Wifi size={20} />
                </div>
                <h3 className="serif">High-Speed Internet</h3>
                <p className="text-secondary">
                  Fast, reliable connectivity for meetings, streaming, and everyday work routines.
                </p>
              </article>
              <article className="about-feature-card" data-reveal="" data-reveal-delay="150">
                <div className="about-card-icon">
                  <Sparkles size={20} />
                </div>
                <h3 className="serif">Smart, Guest-Ready Spaces</h3>
                <p className="text-secondary">
                  Clean interiors, smart TVs, and practical in-room essentials prepared before arrival.
                </p>
              </article>
              <article className="about-feature-card" data-reveal="" data-reveal-delay="180">
                <div className="about-card-icon">
                  <Shield size={20} />
                </div>
                <h3 className="serif">Gated Compound Security</h3>
                <p className="text-secondary">
                  Secure gated compound with on-site guards and controlled access that prioritize guest peace of mind.
                </p>
              </article>
            </div>
          </AboutSection>

          <AboutSection
            id="about-experience-journey"
            subtitle="EXPERIENCE JOURNEY"
            title="Simple from first click to check-in"
            className="about-section-soft"
            revealDelay={60}
          >
            <ol className="about-journey-track">
              <li className="about-journey-step" data-reveal="" data-reveal-delay="90">
                <span className="about-step-chip">1</span>
                <p className="about-step-title">Choose</p>
                <p className="text-secondary">Review dates and select the stay option that fits your plan.</p>
              </li>
              <li className="about-journey-step" data-reveal="" data-reveal-delay="120">
                <span className="about-step-chip">2</span>
                <p className="about-step-title">Confirm</p>
                <p className="text-secondary">Complete booking with clear terms and straightforward communication.</p>
              </li>
              <li className="about-journey-step" data-reveal="" data-reveal-delay="150">
                <span className="about-step-chip">3</span>
                <p className="about-step-title">Receive Support</p>
                <p className="text-secondary">Get practical updates and direct help through our support channels.</p>
              </li>
              <li className="about-journey-step" data-reveal="" data-reveal-delay="180">
                <span className="about-step-chip">4</span>
                <p className="about-step-title">Arrive Prepared</p>
                <p className="text-secondary">Check in to a space that is organized and ready for your stay.</p>
              </li>
            </ol>
          </AboutSection>

          <AboutSection
            id="about-trust-reassurance"
            subtitle="TRUST AND REASSURANCE"
            title="Clear, responsive, and professionally run"
            className="about-section-contrast"
            revealDelay={70}
          >
            <div className="about-trust-layout">
              <article className="about-trust-anchor" data-reveal="" data-reveal-delay="100">
                <p className="about-mini-kicker">Guest Confidence</p>
                <h3 className="serif">You always know what to expect.</h3>
                <p className="text-secondary">
                  Booking details, check-in guidance, and support options are shared clearly so guests do not
                  have to chase information.
                </p>
              </article>
              <div className="about-trust-grid">
                <div className="about-trust-item" data-reveal="" data-reveal-delay="120">
                  <Clock size={18} className="text-primary" />
                  <span>Fast-response support expectations built into daily operations.</span>
                </div>
                <div className="about-trust-item" data-reveal="" data-reveal-delay="150">
                  <CheckCircle2 size={18} className="text-primary" />
                  <span>Transparent process from first inquiry to departure.</span>
                </div>
                <div className="about-trust-item" data-reveal="" data-reveal-delay="180">
                  <Shield size={18} className="text-primary" />
                  <span>Operational discipline that protects comfort and privacy.</span>
                </div>
              </div>
            </div>
          </AboutSection>

          <AboutSection
            id="about-location-lifestyle"
            subtitle="LOCATION & ACCESS"
            title="Getting Here"
            revealDelay={80}
          >
            <div className="about-copy-stack">
              <p className="text-secondary">
                Blissful Place Residences is located at 16 Tebun Fagbemi Street in Agbado, a quiet residential
                area with direct access to the Lagos-Abeokuta expressway. We&apos;re a short drive from Ikeja,
                Abule Egba, Meiran, and Egbeda — close enough for easy access to mainland Lagos, far enough for
                genuine peace and quiet.
              </p>
              <p className="text-secondary">
                If you&apos;re looking for a short-let in Ikeja, Abule Egba, Meiran, or Egbeda and finding
                limited availability or noisy options, Agbado offers a calmer alternative with better
                infrastructure — silent solar power, fiber internet, and none of the generator noise that comes
                with most mainland short-lets.
              </p>
            </div>
            <LocationMap height="380px" />
          </AboutSection>

          <AboutSection
            id="about-standards-readiness"
            subtitle="STANDARDS AND READINESS"
            title="Prepared with care before you arrive"
            className="about-section-soft"
            revealDelay={90}
          >
            <div className="about-standards-grid">
              <article className="about-standards-card" data-reveal="" data-reveal-delay="120">
                <p className="about-mini-kicker">Before Check-In</p>
                <ul className="about-check-list">
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>Pre-arrival checks for cleanliness, power, and internet readiness.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>In-room setup reviewed so essentials are in place before arrival.</span>
                  </li>
                </ul>
              </article>
              <article className="about-standards-card" data-reveal="" data-reveal-delay="150">
                <p className="about-mini-kicker">During Your Stay</p>
                <ul className="about-check-list">
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>Consistent operational follow-through for maintenance and support requests.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>Clear escalation path when guests need fast issue resolution.</span>
                  </li>
                </ul>
              </article>
            </div>
          </AboutSection>

          <AboutSection
            id="about-inquiry-support"
            subtitle="INQUIRY AND SUPPORT"
            title="Ask questions before you commit"
            className="about-section-contrast"
            revealDelay={100}
          >
            <div className="about-inquiry-layout">
              <p className="text-secondary about-copy-max">
                If you are comparing options or unsure which stay setup fits your schedule, reach out first.
                We will respond clearly and help you decide with confidence.
              </p>
              <div className="about-cta-actions">
                <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <MessageSquare size={16} />
                  Make an Inquiry
                </a>
                <Link href="/availability" className="btn btn-outline-primary">
                  Check Availability
                </Link>
              </div>
              <p className="about-support-note text-secondary">
                Want to see the apartment first?{" "}
                <Link href="/tour" className="about-inline-support-link">
                  Request a Private Tour
                </Link>
                .
              </p>
            </div>
          </AboutSection>

          <section
            id="about-final-cta"
            className="about-final-cta"
            aria-labelledby="about-final-cta-heading"
            data-reveal=""
            data-reveal-delay="110"
          >
            <h2 id="about-final-cta-heading" className="heading-sm serif">
              When you are ready, we are ready.
            </h2>
            <p className="text-secondary">
              Check live dates and secure a stay that is calm, prepared, and professionally supported from inquiry to check-in.
            </p>
            <div className="about-cta-actions">
              <Link href="/book" className="btn btn-primary">
                Book Your Stay
              </Link>
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white">
                <MessageSquare size={16} />
                Make an Inquiry
              </a>
            </div>
            <p className="about-support-note text-secondary">
              Need to compare dates first?{" "}
              <Link href="/availability" className="about-inline-support-link">
                Check Availability
              </Link>
              .
            </p>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
