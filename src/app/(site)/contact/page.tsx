"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LocationMap } from "@/components/site/LocationMap";
import { Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Phone, Shield, Sparkles } from "@/lib/lucide-react";
import {
  SITE_ADDRESS_LINE_1,
  SITE_ADDRESS_LINE_2,
  SITE_LOCATION_LABEL,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
  SUPPORT_PHONE_E164,
  SUPPORT_PHONE_URL,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/site-config";

type InquiryType = "booking" | "availability" | "private-tour" | "stay-support" | "general";

interface ContactFormState {
  fullName: string;
  email: string;
  phone: string;
  inquiryType: InquiryType;
  message: string;
}

interface ContactSectionProps {
  id: string;
  subtitle: string;
  title: string;
  children: ReactNode;
  revealDelay?: number;
  className?: string;
}

const INITIAL_FORM_STATE: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  inquiryType: "booking",
  message: "",
};

function inquiryLabel(value: InquiryType): string {
  switch (value) {
    case "booking":
      return "Booking Assistance";
    case "availability":
      return "Availability Question";
    case "private-tour":
      return "Private Tour Request";
    case "stay-support":
      return "Current Stay Support";
    case "general":
      return "General Inquiry";
    default:
      return "General Inquiry";
  }
}

function buildInquiryMessage(formState: ContactFormState): string {
  const lines = [
    "Hello Blissful Place,",
    "",
    `I need help with: ${inquiryLabel(formState.inquiryType)}.`,
    `Name: ${formState.fullName || "Not provided"}`,
    `Email: ${formState.email || "Not provided"}`,
    `Phone: ${formState.phone || "Not provided"}`,
    "",
    "Message:",
    formState.message || "No message provided.",
  ];

  return lines.join("\n");
}

function ContactSection({ id, subtitle, title, children, revealDelay = 0, className }: ContactSectionProps) {
  return (
    <section
      id={id}
      className={`contact-section ${className ?? ""}`.trim()}
      aria-labelledby={`${id}-heading`}
      data-contact-reveal=""
      data-contact-reveal-delay={String(revealDelay)}
    >
      <div className="contact-section-heading">
        <span className="subtitle-tag">{subtitle}</span>
        <h2 id={`${id}-heading`} className="heading-md serif">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function ContactPage() {
  const [formState, setFormState] = useState<ContactFormState>(INITIAL_FORM_STATE);
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-contact-reveal]"));
    if (revealTargets.length === 0) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    revealTargets.forEach((element) => {
      const rawDelay = Number.parseInt(element.dataset.contactRevealDelay ?? "0", 10);
      const safeDelay = Number.isFinite(rawDelay) && rawDelay >= 0 ? rawDelay : 0;
      element.style.setProperty("--contact-reveal-delay", `${safeDelay}ms`);
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
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    revealTargets.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  const whatsappHref = useMemo(() => {
    const encoded = encodeURIComponent(buildInquiryMessage(formState));
    return `${SUPPORT_WHATSAPP_URL}?text=${encoded}`;
  }, [formState]);

  const emailHref = useMemo(() => {
    const subject = encodeURIComponent(`Blissful Place Inquiry: ${inquiryLabel(formState.inquiryType)}`);
    const body = encodeURIComponent(buildInquiryMessage(formState));
    return `${SUPPORT_EMAIL_URL}?subject=${subject}&body=${body}`;
  }, [formState]);

  const updateField = <K extends keyof ContactFormState>(field: K, value: ContactFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }));
    if (isSent) {
      setIsSent(false);
    }
    if (formError) {
      setFormError(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedFullName = formState.fullName.trim();
    const normalizedEmail = formState.email.trim();
    const normalizedMessage = formState.message.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedFullName.length < 2) {
      setFormError("Please enter your full name so we can address you correctly.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setFormError("Please provide a valid email address.");
      return;
    }

    if (normalizedMessage.length < 10) {
      setFormError("Please add a short message with enough detail to help us support you.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 260);
  };

  return (
    <main>
      <SiteHeader />

      <section className="contact-page">
        <div className="container contact-page-container">
          <section className="contact-hero" aria-labelledby="contact-hero-heading" data-contact-reveal="" data-contact-reveal-delay="0">
            <div className="contact-hero-copy">
              <span className="subtitle-tag">CONTACT BLISSFUL PLACE</span>
              <h1 id="contact-hero-heading" className="heading-lg serif">
                Direct support for inquiries, bookings, and active stays.
              </h1>
              <p className="text-secondary contact-hero-lead">
                Reach our team quickly, share what you need, and move confidently to the right next step.
              </p>
              <div className="contact-hero-actions">
                <Link href="#inquiry-form" className="btn btn-primary">
                  <MessageSquare size={16} />
                  Send an Inquiry
                </Link>
                <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white">
                  <MessageSquare size={16} />
                  Chat on WhatsApp
                </a>
              </div>
              <p className="contact-fast-alternative text-secondary">
                Need faster help right now?{" "}
                <a href={SUPPORT_PHONE_URL}>
                  Call support
                </a>
                .
              </p>
              <div className="contact-hero-badges">
                <span>Booking and Tour Guidance</span>
                <span>Stay Support</span>
                <span>Human, Practical Communication</span>
              </div>
              <div className="contact-cross-links">
                <span className="text-secondary">Need another path:</span>
                <Link href="/book">Book</Link>
                <Link href="/availability">Availability</Link>
                <Link href="/tour">Private Tour</Link>
                <Link href="/about">About</Link>
              </div>
            </div>
            <aside className="contact-hero-card" data-contact-reveal="" data-contact-reveal-delay="70">
              <p className="contact-mini-kicker">Support Focus</p>
              <ul>
                <li>
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Booking guidance in plain, practical language.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Fast routing for private tour and stay support requests.</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Clear handoff to the right person when urgent.</span>
                </li>
              </ul>
            </aside>
          </section>

          <ContactSection id="contact-options" subtitle="CONTACT OPTIONS" title="Choose your preferred support channel" revealDelay={20}>
            <div className="contact-options-grid">
              <article
                className="contact-channel-card contact-channel-card-whatsapp"
                data-contact-reveal=""
                data-contact-reveal-delay="90"
              >
                <span className="contact-channel-icon">
                  <MessageSquare size={18} className="text-primary" />
                </span>
                <div>
                  <h3 className="serif">WhatsApp Concierge</h3>
                  <p className="text-secondary">Best for quick back-and-forth and booking questions.</p>
                  <p className="contact-channel-priority">Fastest response path</p>
                  <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    Open WhatsApp
                  </a>
                </div>
              </article>
              <article
                className="contact-channel-card contact-channel-card-phone"
                data-contact-reveal=""
                data-contact-reveal-delay="130"
              >
                <span className="contact-channel-icon">
                  <Phone size={18} className="text-primary" />
                </span>
                <div>
                  <h3 className="serif">Phone Support</h3>
                  <p className="text-secondary">Use this for urgent issues that need direct voice support.</p>
                  <p className="contact-channel-priority">Best for urgent support</p>
                  <a href={SUPPORT_PHONE_URL}>{SUPPORT_PHONE_E164}</a>
                </div>
              </article>
              <article
                className="contact-channel-card contact-channel-card-email"
                data-contact-reveal=""
                data-contact-reveal-delay="170"
              >
                <span className="contact-channel-icon">
                  <Sparkles size={18} className="text-primary" />
                </span>
                <div>
                  <h3 className="serif">Email</h3>
                  <p className="text-secondary">A good option for detailed questions or records.</p>
                  <p className="contact-channel-priority">Best for detailed context</p>
                  <a href={SUPPORT_EMAIL_URL}>{SUPPORT_EMAIL}</a>
                </div>
              </article>
            </div>
          </ContactSection>

          <ContactSection id="inquiry-form" subtitle="INQUIRY FORM" title="Tell us what you need" revealDelay={40}>
            <div className="contact-form-layout">
              <div className="contact-form-card" data-contact-reveal="" data-contact-reveal-delay="100">
                <p className="contact-form-primary-note">Primary support path for most questions and booking help.</p>
                <p className="text-secondary">Share a few details and we will continue the conversation on your chosen channel.</p>
                <form className="contact-form" onSubmit={handleSubmit}>
                  <label className="contact-field">
                    <span className="contact-field-label">Full Name</span>
                    <input
                      className="standard-input"
                      type="text"
                      value={formState.fullName}
                      onChange={(event) => updateField("fullName", event.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </label>
                  <label className="contact-field">
                    <span className="contact-field-label">Email</span>
                    <input
                      className="standard-input"
                      type="email"
                      value={formState.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label className="contact-field">
                    <span className="contact-field-label">Phone (Optional)</span>
                    <input
                      className="standard-input"
                      type="tel"
                      value={formState.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="+234..."
                    />
                  </label>
                  <label className="contact-field">
                    <span className="contact-field-label">Inquiry Type</span>
                    <select
                      className="standard-input"
                      value={formState.inquiryType}
                      onChange={(event) => updateField("inquiryType", event.target.value as InquiryType)}
                    >
                      <option value="booking">Booking Assistance</option>
                      <option value="availability">Availability Question</option>
                      <option value="private-tour">Private Tour Request</option>
                      <option value="stay-support">Current Stay Support</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </label>
                  <label className="contact-field contact-field-full">
                    <span className="contact-field-label">Message</span>
                    <textarea
                      className="standard-input contact-message-input"
                      value={formState.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      rows={5}
                      placeholder="Share your question and preferred dates if relevant."
                      required
                    />
                  </label>
                  <div className="contact-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} aria-busy={isSubmitting}>
                      <MessageSquare size={16} />
                      {isSubmitting ? "Opening WhatsApp..." : "Send via WhatsApp"}
                    </button>
                    <a href={emailHref} className="btn btn-outline-white">
                      Send by Email
                    </a>
                  </div>
                  {formError ? (
                    <p className="contact-form-error" role="status" aria-live="polite">
                      {formError}
                    </p>
                  ) : null}
                  {isSent ? (
                    <p className="contact-success" role="status" aria-live="polite">
                      Your draft message has been opened in WhatsApp.
                    </p>
                  ) : null}
                </form>
              </div>
              <aside className="contact-form-side" data-contact-reveal="" data-contact-reveal-delay="140">
                <p className="contact-mini-kicker">Before You Send</p>
                <ul className="contact-side-list">
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>Include your preferred dates for faster booking guidance.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>Choose inquiry type so we route your request correctly.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>For urgent stay issues, call support directly.</span>
                  </li>
                </ul>
                <div className="contact-side-actions">
                  <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="contact-inline-action">
                    Open WhatsApp
                  </a>
                  <a href={SUPPORT_PHONE_URL} className="contact-inline-action">
                    Call {SUPPORT_PHONE_E164}
                  </a>
                  <Link href="/about" className="contact-inline-action">
                    Read About Our Hosting Standards
                  </Link>
                </div>
              </aside>
            </div>
          </ContactSection>

          <ContactSection
            id="quick-support"
            subtitle="QUICK SUPPORT"
            title="Need immediate help?"
            revealDelay={60}
            className="contact-section-highlight"
          >
            <div className="contact-quick-support">
              <p className="text-secondary">For fastest response, use WhatsApp. For urgent in-stay issues, call directly.</p>
              <div className="contact-quick-pill">Support-first path for urgent needs</div>
              <div className="contact-hero-actions">
                <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <MessageSquare size={16} />
                  Chat Now
                </a>
                <a href={SUPPORT_PHONE_URL} className="btn btn-outline-white">
                  <Phone size={16} />
                  Call {SUPPORT_PHONE_E164}
                </a>
              </div>
            </div>
          </ContactSection>

          <ContactSection id="what-we-help" subtitle="WHAT WE CAN HELP WITH" title="Common support requests" revealDelay={80}>
            <div className="contact-help-grid">
              <article className="contact-help-card" data-contact-reveal="" data-contact-reveal-delay="110">
                <Calendar size={18} className="text-primary" />
                <h3 className="serif">Booking and Dates</h3>
                <p className="text-secondary">Choosing dates, clarifying terms, and moving from inquiry to confirmed stay.</p>
                <Link href="/availability" className="contact-card-link">
                  Check Availability
                </Link>
              </article>
              <article className="contact-help-card" data-contact-reveal="" data-contact-reveal-delay="150">
                <Sparkles size={18} className="text-primary" />
                <h3 className="serif">Private Tours</h3>
                <p className="text-secondary">Tour slot support and pre-visit questions before you book.</p>
                <Link href="/tour" className="contact-card-link">
                  Request Private Tour
                </Link>
              </article>
              <article className="contact-help-card" data-contact-reveal="" data-contact-reveal-delay="190">
                <Shield size={18} className="text-primary" />
                <h3 className="serif">Stay Support</h3>
                <p className="text-secondary">During-stay guidance and issue routing with clear follow-up.</p>
                <Link href="/about" className="contact-card-link">
                  Learn How We Operate
                </Link>
              </article>
            </div>
          </ContactSection>

          <ContactSection
            id="trust-response"
            subtitle="TRUST AND RESPONSE"
            title="Clear communication from first message"
            revealDelay={100}
            className="contact-section-soft"
          >
            <div className="contact-trust-layout">
              <article className="contact-trust-anchor" data-contact-reveal="" data-contact-reveal-delay="120">
                <p className="contact-mini-kicker">Reassurance</p>
                <h3 className="serif">You can expect practical updates and clear next steps.</h3>
                <p className="text-secondary">Our support flow is designed to reduce uncertainty, not add more back-and-forth.</p>
                <Link href="/about" className="contact-inline-action">
                  See Our Approach
                </Link>
              </article>
              <div className="contact-trust-grid">
                <div className="contact-trust-item" data-contact-reveal="" data-contact-reveal-delay="145">
                  <Clock size={16} className="text-primary" />
                  <span>We keep response channels practical and monitored.</span>
                </div>
                <div className="contact-trust-item" data-contact-reveal="" data-contact-reveal-delay="170">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Your request is routed based on urgency and type.</span>
                </div>
                <div className="contact-trust-item" data-contact-reveal="" data-contact-reveal-delay="195">
                  <Shield size={16} className="text-primary" />
                  <span>Details are handled with professionalism and discretion.</span>
                </div>
              </div>
            </div>
          </ContactSection>

          <ContactSection id="location-details" subtitle="LOCATION AND DETAILS" title="Where and how to reach us" revealDelay={120}>
            <div className="contact-details-grid">
              <article className="contact-location-card" data-contact-reveal="" data-contact-reveal-delay="135">
                <p className="contact-mini-kicker">Location</p>
                <h3 className="serif">{SITE_LOCATION_LABEL}</h3>
                <p className="text-secondary">Support and operations are centered around our Ijaiye, Agbado, and Kollington service area.</p>
                <div className="contact-location-meta">
                  <span>
                    <MapPin size={14} /> {SITE_ADDRESS_LINE_1}
                  </span>
                  <span>
                    <MapPin size={14} /> {SITE_ADDRESS_LINE_2}
                  </span>
                </div>
              </article>
              <article className="contact-location-card" data-contact-reveal="" data-contact-reveal-delay="170">
                <p className="contact-mini-kicker">Direct Lines</p>
                <h3 className="serif">Contact Details</h3>
                <div className="contact-location-meta">
                  <span>
                    <Phone size={14} /> <a href={SUPPORT_PHONE_URL}>{SUPPORT_PHONE_E164}</a>
                  </span>
                  <span>
                    <MessageSquare size={14} /> <a href={SUPPORT_WHATSAPP_URL}>WhatsApp Concierge</a>
                  </span>
                  <span>
                    <Sparkles size={14} /> <a href={SUPPORT_EMAIL_URL}>{SUPPORT_EMAIL}</a>
                  </span>
                </div>
              </article>
              <article className="contact-location-card" data-contact-reveal="" data-contact-reveal-delay="200" style={{ gridColumn: "1 / -1" }}>
                <p className="contact-mini-kicker">Find Us</p>
                <h3 className="serif">Agbado, Lagos</h3>
                <p className="text-secondary" style={{ marginBottom: "1rem" }}>
                  16 Tebun Fagbemi Street, Agbado — accessible via the Lagos-Abeokuta expressway. Short drive from Ikeja, Abule Egba, Meiran, and Egbeda.
                </p>
                <LocationMap height="280px" />
              </article>
            </div>
          </ContactSection>

          <section className="contact-final-cta" aria-labelledby="contact-final-cta-heading" data-contact-reveal="" data-contact-reveal-delay="140">
            <h2 id="contact-final-cta-heading" className="heading-sm serif">
              Ready for your next step?
            </h2>
            <p className="text-secondary">Move directly into inquiry, support, or booking from this page.</p>
            <div className="contact-hero-actions">
              <Link href="#inquiry-form" className="btn btn-outline-white">
                Send an Inquiry
              </Link>
              <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white">
                <MessageSquare size={16} />
                Chat on WhatsApp
              </a>
              <Link href="/book" className="btn btn-primary">
                Book Your Stay
              </Link>
            </div>
            <div className="contact-cross-links">
              <span className="text-secondary">Need to explore first:</span>
              <Link href="/availability">Availability</Link>
              <Link href="/tour">Private Tour</Link>
              <Link href="/about">About</Link>
            </div>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
