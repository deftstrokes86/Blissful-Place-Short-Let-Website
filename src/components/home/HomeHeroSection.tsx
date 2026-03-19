import Link from "next/link";

import { Calendar, User } from "@/lib/lucide-react";
import { SITE_LOCATION_LABEL } from "@/lib/site-config";

export function HomeHeroSection() {
  return (
    <section className="hero" style={{ backgroundImage: 'url("/hero-opulence.png")' }}>
      <div className="container hero-content">
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem", opacity: 0.9 }}>
          <span className="subtitle-tag" style={{ margin: 0 }}>
            5-STAR GUEST RATING 4.9/5
          </span>
          <span className="subtitle-tag" style={{ margin: 0 }}>
            •
          </span>
          <span className="subtitle-tag" style={{ margin: 0 }}>
            {SITE_LOCATION_LABEL.toUpperCase()}
          </span>
        </div>
        <h1 className="heading-xl">
          <span className="serif">Elevate Your Stay.</span>
          <br />
          <span className="serif text-primary">Uncompromised Luxury.</span>
        </h1>
        <p className="hero-desc" style={{ fontSize: "1.25rem", color: "#fff" }}>
          Experience Lagos&apos; most refined, secure, and seamlessly managed premium short-let residences. Discerning
          guests book direct.
        </p>

        <div className="booking-bar">
          <div className="booking-field">
            <Calendar className="booking-icon" size={20} />
            <div className="booking-input-group">
              <span className="booking-label">CHECK-IN / OUT</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="date" className="date-input" aria-label="Check-in date" />
                <span style={{ color: "var(--text-secondary)" }}>-</span>
                <input type="date" className="date-input" aria-label="Check-out date" />
              </div>
            </div>
          </div>
          <div className="booking-field">
            <User className="booking-icon" size={20} />
            <div className="booking-input-group">
              <span className="booking-label">GUESTS</span>
              <select className="guest-select" aria-label="Select Guests">
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5 Guests</option>
                <option value="6">6 Guests</option>
              </select>
            </div>
          </div>
          <Link href="/book" className="btn btn-primary booking-cta" style={{ padding: "1.25rem 2rem" }}>
            Check Availability
          </Link>
        </div>
      </div>
    </section>
  );
}

