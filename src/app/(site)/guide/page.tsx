import type { Metadata } from "next";

import { PageIntro } from "@/components/common/PageIntro";
import { CheckCircle2, Clock, MapPin, MessageSquare, Phone, Shield, Sparkles, Wifi, Zap } from "@/lib/lucide-react";
import { SUPPORT_PHONE_URL, SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/guide",
  },
  title: "Guest Guide — What to Know Before Your Stay",
  description: "Everything you need for a smooth stay at Blissful Place Residences. Check-in details, house rules, local tips, and how to reach us in Agbado, Lagos.",
};

export default function GuestGuide() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="Guest Guide"
        description="Everything you need for a smooth, comfortable stay at Blissful Place Residences."
      />

      <div className="guest-guide-stack">

        {/* Check-in & Check-out */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Clock className="text-primary" size={24} /> Check-in & Check-out
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Standard check-in is from <strong style={{ color: "var(--text-primary)" }}>2:00 PM</strong> and check-out is by <strong style={{ color: "var(--text-primary)" }}>12:00 PM (noon)</strong>. If you need an early arrival or late departure, let us know in advance and we will do our best to accommodate.
          </p>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Keys and orientation details are provided on arrival. We recommend messaging us on WhatsApp at least one hour before you arrive so someone is ready to receive you.
          </p>
          <div className="guest-guide-callout">
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>Before You Arrive</strong>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Send us your expected arrival time, flight number if applicable, and number of guests. This helps us prepare the flat and coordinate your entry smoothly.
            </span>
          </div>
        </section>

        {/* Silent Solar Power */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Zap className="text-primary" size={24} /> Silent 24/7 Solar Power
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Every flat runs on a full solar and battery system. There are no generators, no diesel smell, and no interruption when city supply goes off. Power runs silently around the clock — the AC, lights, and appliances stay on throughout your stay.
          </p>
          <div className="guest-guide-callout">
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>No Action Required</strong>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              The system operates automatically. You do not need to manage switches or inverters. If you notice any issue with power, message us immediately and we will respond.
            </span>
          </div>
        </section>

        {/* Fiber Internet */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Wifi className="text-primary" size={24} /> Fiber Optic Internet
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Each flat has a dedicated fiber connection. This supports reliable remote work, video calls, and streaming. WiFi credentials are provided in the flat — check the router label or the welcome card on the table.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Network name and password are printed in the flat.</li>
            <li>If you experience connectivity issues, restart the router or contact us on WhatsApp.</li>
            <li>The connection is shared within the flat only — each unit has its own dedicated line.</li>
          </ul>
        </section>

        {/* Security & Access */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Shield className="text-primary" size={24} /> Security & Access
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            The property is a secure gated compound with on-site security guards and controlled vehicle access. Entry is via physical keys provided at check-in. The compound sits on a quiet residential road with a single staffed gate.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Keep your keys safe — report any loss immediately so we can assist.</li>
            <li>Visitors must be authorised by you at the gate. Unverified guests are not permitted entry.</li>
            <li>Vehicles can park inside the compound in the designated area.</li>
            <li>Do not share your flat number or compound access with anyone you do not trust.</li>
          </ul>
        </section>

        {/* House Rules */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <CheckCircle2 className="text-primary" size={24} /> House Rules
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            These rules apply to all Blissful Place residences. They exist to protect the property, your stay, and the experience of other guests in the compound.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>Guest count must stay within the approved maximum of 6 per flat.</li>
            <li>No parties, loud gatherings, or events without prior written approval.</li>
            <li>Smoking is not permitted indoors.</li>
            <li>Pets are not allowed inside the flat.</li>
            <li>Please treat the property with care. Any damage beyond normal wear will be deducted from the security deposit.</li>
            <li>Checkout must be by 12:00 PM unless a late checkout has been agreed in advance.</li>
          </ul>
        </section>

        {/* Getting Here */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MapPin className="text-primary" size={24} /> Getting Here
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            We are located in Agbado, Lagos — a quiet residential area with good road access. The compound is approximately 15–25 minutes from Ikeja, Abule Egba, Meiran, and Egbeda depending on traffic.
          </p>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            When you confirm your booking, we will send you the full address and a pin to the compound gate via WhatsApp. We do not publish the street address publicly.
          </p>
          <div className="guest-guide-callout">
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>Airport Pickup Available</strong>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              We offer an airport pickup add-on from Murtala Muhammed International Airport (Lagos). Book it when you reserve the flat or arrange it via WhatsApp before your arrival.
            </span>
          </div>
        </section>

        {/* Add-ons */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Sparkles className="text-primary" size={24} /> Optional Add-ons
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            A few extras are available to make your stay more comfortable. These can be added when booking or arranged in advance via WhatsApp.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li><strong style={{ color: "var(--text-primary)" }}>Airport Pickup</strong> — from Murtala Muhammed International Airport to the compound.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Pantry Stocking</strong> — we will stock the kitchen with your preferred groceries before you arrive.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Celebration Setup</strong> — decorations and setup for birthdays, anniversaries, or welcome surprises.</li>
          </ul>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem", lineHeight: 1.6 }}>
            Pricing for add-ons is shown during the booking process. Contact us on WhatsApp if you want to arrange anything not listed.
          </p>
        </section>

        {/* Support */}
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MessageSquare className="text-primary" size={24} /> Support During Your Stay
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            We are available via WhatsApp throughout your stay for questions, maintenance reports, or any request. For urgent matters, you can also call directly.
          </p>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            We aim to respond to WhatsApp messages within minutes. For non-urgent requests, sending a message is preferable so we can track and action it properly.
          </p>
          <div className="guest-guide-actions">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <MessageSquare size={16} /> WhatsApp
            </a>
            <a
              href={SUPPORT_PHONE_URL}
              className="btn btn-outline-white"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
            >
              <Phone size={16} /> Call Us
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
