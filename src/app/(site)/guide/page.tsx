import type { Metadata } from "next";

import { PageIntro } from "@/components/common/PageIntro";

export const metadata: Metadata = {
  title: "Guest Guide — What to Know Before Your Stay",
  description: "Everything you need for a smooth stay at Blissful Place Residences. Check-in details, house rules, local tips, and how to reach us in Agbado, Lagos.",
};
import { MessageSquare, Phone, Shield, Wifi, Zap } from "@/lib/lucide-react";
import { SITE_CITY_NAME, SUPPORT_PHONE_URL, SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

export default function GuestGuide() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="Digital Guest Concierge"
        description={`Everything you need for a seamless, luxurious stay in ${SITE_CITY_NAME}.`}
      />

      <div className="guest-guide-stack">
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Zap className="text-primary" size={24} /> 24/7 Power Management
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Every flat runs on a full solar and battery system — silent, clean, and uninterrupted 24/7. No generators, no diesel smell, no noise. The power runs continuously whether city supply is up or not.
          </p>
          <div className="guest-guide-callout">
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>No Action Required</strong>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              The solar and battery system operates automatically. The AC, lights, and WiFi remain uninterrupted throughout your stay.
            </span>
          </div>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Wifi className="text-primary" size={24} /> High-Speed Internet
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            We understand that reliable internet is crucial for our corporate and diaspora guests. We use a blended
            hybrid approach to guarantee uptime.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Primary Network:</strong> Lightning-fast internet (Avg 150
              Mbps down)
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Failover Network:</strong> Dedicated Fiber Optics
            </li>
            <li>
              <em>Login details are provided securely in your WhatsApp orientation packet upon check-in.</em>
            </li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Shield className="text-primary" size={24} /> Estate Security & Access
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            The property is a secure gated compound with on-site guards and controlled vehicle access. The compound is on a quiet residential road with a single entry point.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>No unverified guests are permitted past the main gate without your direct authorization.</li>
            <li>Access is via physical keys provided at check-in.</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MessageSquare className="text-primary" size={24} /> Concierge & Support
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Our hospitality team is available 24/7 via WhatsApp to arrange airport pickups, grocery stocking,
            cleaning, or general maintenance requests.
          </p>
          <div className="guest-guide-actions">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <MessageSquare size={16} /> WhatsApp Concierge
            </a>
            <a
              href={SUPPORT_PHONE_URL}
              className="btn btn-outline-white"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <Phone size={16} /> Emergency Call
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

