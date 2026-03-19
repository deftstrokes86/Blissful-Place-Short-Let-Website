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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
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

        <div
          className="comparison-table"
          style={{
            marginTop: "5rem",
            background: "var(--bg-panel)",
            borderRadius: "var(--radius-lg)",
            padding: "3.5rem",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          }}
        >
          <h3 className="heading-sm serif text-center" style={{ marginBottom: "3rem", fontSize: "1.75rem" }}>
            The True Cost of Third-Party Booking
          </h3>
          <div
            className="comparison-grid"
            style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) 1.5fr 1.5fr", gap: "1.5rem", textAlign: "left", alignItems: "center" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.9rem",
                paddingTop: "3.5rem",
              }}
            >
              <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Booking Fees</span>
              <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Customer Support</span>
              <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Check-in / Out</span>
              <span>Loyalty Rewards</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", padding: "2rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontWeight: 700, marginBottom: "2rem", color: "var(--text-secondary)", textAlign: "center", letterSpacing: "0.05em" }}>
                AIRBNB / BOOKING.COM
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "var(--text-secondary)" }}>
                <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Up to 15% Extra (Hidden Fees)</span>
                <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Platform Ticketing System</span>
                <span style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>Strict Standard Times</span>
                <span>None</span>
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--primary)",
                background: "rgba(238,29,82,0.05)",
                padding: "2.5rem 2rem",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 10px 30px rgba(238,29,82,0.1)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--primary)",
                  color: "white",
                  padding: "0.25rem 1rem",
                  borderRadius: "100px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap",
                }}
              >
                MOST REWARDING
              </div>
              <div style={{ fontWeight: 700, marginBottom: "2rem", color: "var(--primary)", textAlign: "center", letterSpacing: "0.05em" }}>
                BLISSFUL DIRECT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontWeight: 600, color: "white" }}>
                <span style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>0% Hidden Fees (Best Rate Guaranteed)</span>
                <span style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>Instant Priority WhatsApp Concierge</span>
                <span style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>Priority Early / Late Access</span>
                <span>15% Off Your Next Stay + Upgrades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light-panel" style={{ paddingBottom: "2rem" }}>
        <div className="container">
          <div
            className="vip-section-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "4rem",
              alignItems: "center",
              background: "var(--bg-dark)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "4rem",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div>
              <span className="subtitle-tag">VIP GUEST PROGRAM</span>
              <h2 className="heading-lg serif">Unlock the Inner Circle</h2>
              <p className="hero-desc" style={{ marginLeft: 0, textAlign: "left", marginTop: "1.5rem", maxWidth: "100%", color: "var(--text-secondary)" }}>
                Join our exclusive guest list and instantly receive a promo code for <strong>10% off your first direct booking</strong>. Returning guests unlock our Blissful Black tier, gaining complimentary upgrades, 15% off subsequent stays, and private chef access.
              </p>

              <div className="lead-capture-form" style={{ display: "flex", gap: "1rem", marginTop: "3rem" }}>
                <input
                  type="email"
                  placeholder="Enter your email for instant VIP access..."
                  style={{
                    flex: 1,
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
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(22,21,23,0.8) 0%, rgba(10,10,11,1) 100%)",
                  height: "320px",
                  width: "100%",
                  maxWidth: "380px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, #d4af37, #f3e5ab, #d4af37)",
                  }}
                />
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <MapPin className="text-primary" size={24} />
              <div>
                <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Seamless access to key business districts and corporate HQs. Less time in traffic, more time executing.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", textAlign: "left" }}>
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
              <div className="testimonial-type">Diaspora Executive • 2 Week Stay</div>
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
              <div className="testimonial-author">Sarah & Mark T.</div>
              <div className="testimonial-type">Corporate Team • 1 Month Stay</div>
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
              <div className="testimonial-type">Solo Premium Traveler • 5 Night Stay</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


