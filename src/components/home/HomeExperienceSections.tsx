import Image from "next/image";

import {
  CheckCircle2,
  Coffee,
  MapPin,
  MessageSquare,
  Plane,
  Shield,
  Sparkles,
  Star,
  Wifi,
  Zap,
} from "@/lib/lucide-react";
import { SITE_CITY_NAME } from "@/lib/site-config";

export function HomeExperienceSections() {
  return (
    <>
      <section id="promise" className="section promise-section container">
        <div className="promise-content text-left">
          <span className="subtitle-tag">OUR COMMITMENT</span>
          <h2 className="heading-lg serif">
            The Blissful
            <br />
            Promise
          </h2>
          <p className="promise-desc">
            Every Blissful Place residence runs on the same infrastructure: full solar power, fiber internet, gated security with CCTV coverage, and professional management. No guesswork, no surprises.
          </p>

          <div className="promise-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="serif">Silent 24/7 Solar Power</h4>
                <p>Full solar and battery system — no generator noise, no diesel fumes, no power cuts. Runs silently around the clock, every day of your stay.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Wifi size={24} />
              </div>
              <div>
                <h4 className="serif">Fiber Optic Internet</h4>
                <p>Dedicated fiber optic connection for reliable remote work, video calls, and streaming. Not shared estate WiFi — a real line to your flat.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="serif">Gated Compound Security</h4>
                <p>Secure gated compound with on-site guards, CCTV coverage, and controlled vehicle access. Quiet residential setting on a private road.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="promise-image-wrapper">
          <Image
            src="/living-room-collage.webp"
            alt="Blissful Place Residences interior collage"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      <section className="section container text-center">
        <span className="subtitle-tag">WHY BOOK DIRECT</span>
        <h2 className="heading-lg serif">The Smartest Way to Stay</h2>
        <p className="hero-desc" style={{ marginBottom: "3rem" }}>
          Skip Airbnb fees. Booking directly can save you up to 15%, gets you priority WhatsApp support, and gives you access to optional extras like airport transfers and pantry pre-stocking.
        </p>

        <div className="home-advantages-grid">
          <div className="advantage-card">
            <CheckCircle2 className="text-primary" size={28} />
            <h4 className="serif">Up to 15% Lower Rates</h4>
            <p>
              Avoid hidden platform fees on Airbnb or Booking.com. You will always find our guaranteed best available
              rate right here.
            </p>
          </div>
          <div className="advantage-card">
            <MessageSquare className="text-primary" size={28} />
            <h4 className="serif">Instant WhatsApp Concierge</h4>
            <p>Get a direct line to our hospitality team for quick assistance via WhatsApp throughout your stay.</p>
          </div>
          <div className="advantage-card">
            <Sparkles className="text-primary" size={28} />
            <h4 className="serif">Early Check-in Priority</h4>
            <p>
              Direct bookings get priority for early check-in and late checkout requests. Early check-in depends on
              apartment readiness, while late checkout is available only when there is no immediate incoming booking.
            </p>
          </div>
          <div className="advantage-card">
            <Star className="text-primary" size={28} />
            <h4 className="serif">Welcome & Loyalty Perks</h4>
            <p>
              Enjoy secure parking, a smooth check-in experience, and special rates for returning guests visiting {SITE_CITY_NAME}.
            </p>
          </div>
        </div>

        <div className="comparison-table">
          <h3 className="heading-sm serif text-center" style={{ marginBottom: "3rem", fontSize: "1.75rem" }}>
            The True Cost of Third-Party Booking
          </h3>
          <div className="comparison-grid">
            <div className="comparison-grid-labels">
              <span>Booking Fees</span>
              <span>Customer Support</span>
              <span>Check-in / Out</span>
              <span>Loyalty Rewards</span>
            </div>

            <div className="comparison-grid-panel">
              <div className="comparison-grid-panel-header is-muted">AIRBNB / BOOKING.COM</div>
              <div className="comparison-grid-stack">
                <span>Up to 15% Extra (Hidden Fees)</span>
                <span>Platform Ticketing System</span>
                <span>Strict Standard Times</span>
                <span>None</span>
              </div>
            </div>

            <div className="comparison-grid-panel comparison-grid-panel-featured">
              <div className="comparison-grid-badge">MOST REWARDING</div>
              <div className="comparison-grid-panel-header is-featured">BLISSFUL DIRECT</div>
              <div className="comparison-grid-stack is-featured">
                <span>0% Hidden Fees (Best Rate Guaranteed)</span>
                <span>Instant Priority WhatsApp Concierge</span>
                <span>Priority Early / Late Requests</span>
                <span>15% Off Your Next Stay + Upgrades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light-panel">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="subtitle-tag">TAILORED EXPERIENCES</span>
            <h2 className="heading-lg serif">Curated Add-ons</h2>
            <p className="hero-desc">Elevate your stay with our bespoke hospitality services, seamlessly arranged prior to your arrival.</p>
          </div>

          <div className="addon-grid">
            <div className="addon-card">
              <Plane className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  Premium Airport Transfer
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Chauffeur-driven executive pickup from MMA directly to your residence. Avoid the hassle of negotiating
                  taxis.
                </p>
              </div>
            </div>
            <div className="addon-card">
              <Coffee className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  Pantry Pre-Stocking
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Arrive to a fully stocked fridge with your preferred groceries, premium coffee, snacks, and beverages.
                </p>
              </div>
            </div>
            <div className="addon-card">
              <Sparkles className="text-primary" size={32} />
              <div>
                <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  Celebration Setup
                </h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Custom decor, roses, and curated lighting settings to celebrate birthdays, anniversaries, or welcome surprises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container neighborhood-split">
        <div className="promise-image-wrapper" style={{ height: "500px" }}>
          <Image
            src="/bedroom-plus-extras.webp"
            alt="Bedroom and guest amenities at Blissful Place Residences"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div>
          <span className="subtitle-tag">LOCATION & ACCESS</span>
          <h2 className="heading-lg serif">Quiet Base, Easy Access</h2>
          <p className="promise-desc" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
            Blissful Place Residences is located in Agbado, a quiet residential area on the Lagos-Abeokuta expressway. Close enough to mainland Lagos for easy access, far enough for genuine peace and quiet.
          </p>
          <div className="neighborhood-points">
            <div className="neighborhood-point">
              <MapPin className="text-primary" size={24} />
              <div>
                <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Minutes from Ikeja, Abule Egba, Meiran, and Egbeda via the Lagos-Abeokuta expressway. Easy access to business districts, markets, and transport links across mainland Lagos.
                </span>
              </div>
            </div>
            <div className="neighborhood-point">
              <Coffee className="text-primary" size={24} />
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem" }}>A Calmer Alternative</strong>
                <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  If you&apos;re finding limited availability or noisy generators in Ikeja or Abule Egba, Agbado offers a quieter option with better infrastructure — silent solar power, fiber internet, and a secure gated compound.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light-panel text-center">
        <div className="container">
          <span className="subtitle-tag">YOUR STAY</span>
          <h2 className="heading-lg serif" style={{ marginBottom: "4rem" }}>What to Expect</h2>

          <div className="testimonial-grid">
            <div className="testimonial-card">
              <CheckCircle2 className="text-primary" size={32} style={{ marginBottom: "1rem" }} />
              <h4 className="serif">Consistent Standard, Every Unit</h4>
              <p className="testimonial-text">All three apartments share the same layout, solar power system, fiber internet, equipped kitchen, AI-powered washing machine access, and professional care. No matter which you book, the core experience is consistent.</p>
            </div>
            <div className="testimonial-card">
              <Zap className="text-primary" size={32} style={{ marginBottom: "1rem" }} />
              <h4 className="serif">Silent Power, Day and Night</h4>
              <p className="testimonial-text">Our full solar and battery system runs without noise, fumes, or interruptions. No generators, no diesel, no 2am engine startups. Just clean, quiet, continuous power.</p>
            </div>
            <div className="testimonial-card">
              <MessageSquare className="text-primary" size={32} style={{ marginBottom: "1rem" }} />
              <h4 className="serif">Real Support, Not a Call Centre</h4>
              <p className="testimonial-text">Reach our team directly on WhatsApp for anything you need — check-in coordination, local tips, or help during your stay. No ticketing systems, no hold music.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
