import Image from "next/image";
import Link from "next/link";

import { PageIntro } from "@/components/common/PageIntro";
import { FLATS } from "@/lib/constants";
import { formatCurrency } from "@/lib/booking-utils";
import { SITE_CITY_NAME, SITE_DISTRICT_NAME } from "@/lib/site-config";
import { Bath, BedDouble, Car, Check, CheckCircle2, Shield, Users, Wifi, Zap } from "@/lib/lucide-react";

export default function PropertyPage() {
  const mayfairRate = FLATS.find((flat) => flat.id === "mayfair")?.rate ?? 250000;
  const securityDeposit = 150000;
  return (
    <main className="container" style={{ paddingTop: "8rem", paddingBottom: "4rem", minHeight: "100vh", maxWidth: "1200px" }}>
      <PageIntro
        subtitle="THE SIGNATURE PENTHOUSE"
        title="Mayfair Suite"
        description={`Our flagship 3-bedroom penthouse featuring 360-degree panoramic views of ${SITE_DISTRICT_NAME}. Engineered for elite corporate retreats and luxurious diaspora stays.`}
        descriptionStyle={{ maxWidth: "800px" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) 1fr", gap: "4rem", alignItems: "start" }} className="property-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <Image src="/mayfair.png" alt="Mayfair Suite Penthouse" fill style={{ objectFit: "cover" }} />
          </div>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              Property Overview
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "2rem" }}>
              Designed to exceed the expectations of discerning guests, the Mayfair Suite offers fully serviced,
              uncompromised luxury. Every technical detail from power redundancy to biometric security has been
              orchestrated to guarantee absolute peace of mind during your time in {SITE_CITY_NAME}.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Users size={20} className="text-primary" />
                <span>Max 6 Guests</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <BedDouble size={20} className="text-primary" />
                <span>3 King Bedrooms</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Bath size={20} className="text-primary" />
                <span>3.5 Bathrooms</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <Car size={20} className="text-primary" />
                <span>2 Secure Parking Spots</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              The {SITE_CITY_NAME} Guarantee
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", background: "var(--bg-panel)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <Zap size={24} className="text-primary" style={{ flexShrink: 0 }} />
                <div>
                  <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    Uninterrupted Power (Zero Generator Noise)
                  </h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Automated dual-grid system hooked to industrial backup generators. Seamless transition within 3
                    seconds so your AC and lights never drop.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", background: "var(--bg-panel)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <Wifi size={24} className="text-primary" style={{ flexShrink: 0 }} />
                <div>
                  <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    Enterprise Dual-Failover WiFi
                  </h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Fitted with dedicated Starlink and Fiber Optics (avg 150 Mbps down). Perfect for uninterrupted
                    corporate Zoom calls and heavy streaming.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", background: "var(--bg-panel)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <Shield size={24} className="text-primary" style={{ flexShrink: 0 }} />
                <div>
                  <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                    Fortified Biometric Security
                  </h4>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Estate relies on 24/7 armed mobile police patrols, comprehensive CCTV, and smart-card elevator
                    access.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              House Rules Summary
            </h2>
            <ul style={{ color: "var(--text-secondary)", lineHeight: 2, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={16} className="text-primary" /> Max capacity strictly enforced to preserve luxury
                standards.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={16} className="text-primary" /> No parties or unauthorized commercial
                events/photoshoots.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={16} className="text-primary" /> Pets are not allowed on the premises.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check size={16} className="text-primary" /> Refundable {formatCurrency(securityDeposit)} security deposit required prior
                to check-in.
              </li>
            </ul>
          </section>
        </div>

        <div style={{ position: "sticky", top: "100px" }}>
          <div className="summary-card" style={{ padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-serif)" }}>{formatCurrency(mayfairRate)}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                / Night
              </span>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Guaranteed lowest rate when booking direct. Excellent availability for this month.
            </p>

            <Link href="/book" className="btn btn-primary btn-full" style={{ padding: "1.25rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              Check Dates & Secure Booking
            </Link>

            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
              <Link href="/availability" className="btn btn-outline-primary btn-full" style={{ padding: "0.9rem", fontSize: "0.9rem" }}>
                Check Availability
              </Link>
              <Link href="/tour" className="btn btn-outline-white btn-full" style={{ padding: "0.9rem", fontSize: "0.9rem" }}>
                Schedule a Private Tour
              </Link>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              No charges until you confirm dates.
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "2rem", paddingTop: "1.5rem" }}>
              <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                Included in this rate:
              </h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={14} className="text-primary" /> Dedicated 24/7 WhatsApp Concierge
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={14} className="text-primary" /> Uninterrupted Fast Starlink WiFi
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={14} className="text-primary" /> Premium Housekeeping
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}





