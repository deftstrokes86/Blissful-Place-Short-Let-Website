import { PageIntro } from "@/components/common/PageIntro";
import { MessageSquare, Phone, Shield, Wifi, Zap } from "@/lib/lucide-react";
import { SITE_CITY_NAME, SUPPORT_PHONE_URL, SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

export default function GuestGuide() {
  return (
    <main className="container" style={{ paddingTop: "8rem", paddingBottom: "4rem", minHeight: "100vh", maxWidth: "800px" }}>
      <PageIntro
        title="Digital Guest Concierge"
        description={`Everything you need for a seamless, luxurious stay in ${SITE_CITY_NAME}.`}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <section className="booking-section">
          <h2 className="heading-sm serif" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Zap className="text-primary" size={24} /> 24/7 Power Management
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            {SITE_CITY_NAME} power grids can fluctuate, but your experience will not. Our building operates a fully automated
            dual-grid system hooked directly to heavy-duty industrial backup generators.
          </p>
          <div style={{ background: "rgba(238, 29, 82, 0.05)", borderLeft: "4px solid var(--primary)", padding: "1rem", borderRadius: "0 4px 4px 0" }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>No Action Required</strong>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              If city power drops, our generators kick in automatically within 3 seconds. The AC, lights, and WiFi
              remain uninterrupted.
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
              <strong style={{ color: "var(--text-primary)" }}>Primary Network:</strong> Enterprise Starlink (Avg 150
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
            Your safety is our absolute priority. The estate is fortified with 24/7 armed mobile police patrols,
            comprehensive CCTV, and biometric access control.
          </p>
          <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>No unverified guests are permitted past the main gate without your direct authorization via intercom.</li>
            <li>Use the provided smart keycard for elevator and door access.</li>
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
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
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

