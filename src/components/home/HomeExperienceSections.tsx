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
import { SITE_CITY_NAME, SITE_LOCATION_LABEL } from "@/lib/site-config";

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
            We don&apos;t just provide a space; we provide an experience defined by uncompromising standards and
            attention to detail.
          </p>

          <div className="promise-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="serif">24/7 Guaranteed Power</h4>
                <p>Dual-grid system with seamless automated industrial backup generators. Zero noise, zero downtime.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Wifi size={24} />
              </div>
              <div>
                <h4 className="serif">Enterprise Connectivity</h4>
                <p>Dedicated Starlink and dual-fiber networks ensuring blazing-fast internet for remote work and streaming.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="serif">Elite Biometric Security</h4>
                <p>Multi-tier fortified estate access, secure parking, and highly trained 24/7 on-site protection.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="promise-image-wrapper">
          <Image src="/promise.png" alt="Luxurious Interior Detail" fill style={{ objectFit: "cover" }} />
        </div>
      </section>

      <section className="section container text-center">
        <span className="subtitle-tag">WHY BOOK DIRECT</span>
        <h2 className="heading-lg serif">The Smartest Way to Stay</h2>
        <p className="hero-desc" style={{ marginBottom: "3rem" }}>
          Skip the middleman. Booking directly on our official platform guarantees the ultimate Blissful Place
          experience.
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
            <p>Get a direct, priority line to our on-ground hospitality team for immediate assistance, 24 hours a day.</p>
          </div>
          <div className="advantage-card">
            <Sparkles className="text-primary" size={28} />
            <h4 className="serif">Early Check-in Priority</h4>
            <p>
              Direct bookings automatically get placed at the top of the list for complimentary early arrivals and late
              departures.
            </p>
          </div>
          <div className="advantage-card">
            <Star className="text-primary" size={28} />
            <h4 className="serif">Welcome & Loyalty Perks</h4>
            <p>
              Enjoy complimentary premium coffee, dedicated secure parking, and exclusive discounts for your future
              {SITE_CITY_NAME} visits.
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
                <span>Priority Early / Late Access</span>
                <span>15% Off Your Next Stay + Upgrades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light-panel" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div className="vip-section-grid vip-section-panel">
            <div>
              <span className="subtitle-tag">VIP GUEST PROGRAM</span>
              <h2 className="heading-lg serif">Unlock the Inner Circle</h2>
              <p className="hero-desc" style={{ marginLeft: 0, textAlign: "left", marginTop: "1.5rem", maxWidth: "100%", color: "var(--text-secondary)" }}>
                Join our exclusive guest list and instantly receive a promo code for <strong>10% off your first direct booking</strong>. Returning guests unlock our Blissful Black tier, gaining complimentary upgrades, 15% off subsequent stays, and private chef access.
              </p>

              <div className="lead-capture-form" style={{ marginTop: "3rem" }}>
                <input
                  type="email"
                  placeholder="Enter your email for instant VIP access..."
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-panel)",
                    color: "white",
                    outline: "none",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                  }}
                />
                <button className="btn btn-primary" style={{ padding: "0 2.5rem" }}>
                  Unlock Access
                </button>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "1rem", opacity: 0.7 }}>
                No spam. Just exclusive luxury offers and priority booking windows for peak seasons in {SITE_CITY_NAME}.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="vip-member-card">
                <div className="vip-member-card-bar" />
                <Sparkles size={48} className="text-secondary" style={{ marginBottom: "1.5rem" }} />
                <h3 className="serif heading-sm" style={{ letterSpacing: "0.1em" }}>
                  BLISSFUL BLACK
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.75rem", textTransform: "uppercase", letterSpacing: "0.3em" }}>
                  Member Card
                </span>
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
                  Custom decor, roses, champagne, and curated lighting settings to celebrate birthdays or anniversaries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container neighborhood-split">
        <div className="promise-image-wrapper" style={{ height: "500px" }}>
          <Image src="/hero-opulence.png" alt={`${SITE_CITY_NAME} Skyline`} fill style={{ objectFit: "cover" }} />
        </div>
        <div>
          <span className="subtitle-tag">PRIME LOCATIONS</span>
          <h2 className="heading-lg serif">Positioned for Prestige</h2>
          <p className="promise-desc" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
            Our residences are strictly embedded within the safest, high-value corridors of {SITE_LOCATION_LABEL}. You are never
            more than a 10-minute drive from your next important meeting or exclusive reservation.
          </p>
          <div className="neighborhood-points">
            <div className="neighborhood-point">
              <MapPin className="text-primary" size={24} />
              <div>
                <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Seamless access to key business districts and corporate HQs. Less time in traffic, more time executing.
                </span>
              </div>
            </div>
            <div className="neighborhood-point">
              <Coffee className="text-primary" size={24} />
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem" }}>Elite Lifestyle Corridors</strong>
                <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Steps away from {SITE_CITY_NAME}&apos;s premier award-winning culinary scene, high-end shopping, and private lounges.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light-panel text-center">
        <div className="container">
          <span className="subtitle-tag">VERIFIED EXCELLENCE</span>
          <h2 className="heading-lg serif" style={{ marginBottom: "4rem" }}>
            Don&apos;t Just Take Our Word For It
          </h2>

          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">
                &ldquo;As a returning diaspora Nigerian, power and security are non-negotiable. Blissful Place delivered
                flawlessly. Zero generator noise, perfectly stable Starlink, and the aesthetics are stunning. I book direct
                every time I fly in now.&rdquo;
              </p>
              <div className="testimonial-author">Dr. Chuka O.</div>
              <div className="testimonial-type">Diaspora Executive / 2 Week Stay</div>
            </div>
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">
                &ldquo;The smartest booking decision we made for our team. The space was pristine, quiet, and highly
                corporate-friendly. The concierge arranging our airport pickup directly to the door at 2 AM was 5-star
                standard.&rdquo;
              </p>
              <div className="testimonial-author">Sarah &amp; Mark T.</div>
              <div className="testimonial-type">Corporate Team / 1 Month Stay</div>
            </div>
            <div className="testimonial-card">
              <div className="stars">
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
                <Star fill="currentColor" size={16} />
              </div>
              <p className="testimonial-text">
                &ldquo;The biometric security and 24/7 staff presence made me feel completely at ease traveling alone. The team
                is invisible when you want peace, but instantly responsive on WhatsApp when needed.&rdquo;
              </p>
              <div className="testimonial-author">Amina B.</div>
              <div className="testimonial-type">Solo Premium Traveler / 5 Night Stay</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
