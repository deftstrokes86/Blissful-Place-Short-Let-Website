import Link from "next/link";

import { BrandLogo } from "@/components/common/BrandLogo";
import { Instagram, Linkedin, MapPin, MessageSquare, Twitter } from "@/lib/lucide-react";
import {
  SITE_ADDRESS_LINE_1,
  SITE_ADDRESS_LINE_2,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_URL,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/site-config";

export function SiteFooter() {
  return (
    <>
      <footer
        className="footer"
        style={{ padding: "6rem 0 3rem", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-dark)" }}
      >
        <div className="container">
          <div
            className="footer-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "4rem", alignItems: "start" }}
          >
            <div
              className="footer-brand"
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem", gridColumn: "1 / span 2", maxWidth: "380px" }}
            >
              <div style={{ display: "inline-block" }}>
                <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                  <BrandLogo variant="footer" />
                </Link>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.90rem", lineHeight: "1.8" }}>
                Curating Lagos&apos; most refined stays. We guarantee absolute calm, elite biometric security,
                uninterrupted power, and blazing enterprise connectivity for the discerning traveler.
              </p>
              <div className="footer-socials" style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <a href={SOCIAL_LINKS.instagram} className="social-circle" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <a href={SOCIAL_LINKS.linkedin} className="social-circle" aria-label="LinkedIn">
                  <Linkedin size={16} />
                </a>
                <a href={SOCIAL_LINKS.twitter} className="social-circle" aria-label="Twitter">
                  <Twitter size={16} />
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "white", letterSpacing: "0.05em" }}>
                Residences
              </h4>
              <ul
                className="footer-links-list"
                style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}
              >
                <li>
                  <Link href="/property" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Windsor Residence
                  </Link>
                </li>
                <li>
                  <Link href="/property" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Kensington Lodge
                  </Link>
                </li>
                <li>
                  <Link href="/property" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Mayfair Suite
                  </Link>
                </li>
                <li>
                  <Link href="/guide" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Digital Guest Guide
                  </Link>
                </li>
                <li>
                  <Link href="/availability" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Availability Calendar
                  </Link>
                </li>
                <li>
                  <Link href="/tour" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Private Tour
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "white", letterSpacing: "0.05em" }}>
                Company
              </h4>
              <ul
                className="footer-links-list"
                style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}
              >
                <li>
                  <Link href="/#promise" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    The Blissful Promise
                  </Link>
                </li>
                <li>
                  <Link href="/#gallery" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link href="/" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/" style={{ color: "var(--text-secondary)", transition: "color 0.2s" }} className="hover-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-column" id="contact">
              <h4 className="serif" style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "white", letterSpacing: "0.05em" }}>
                Connect
              </h4>
              <ul
                className="footer-contact-list"
                style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                <li style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <MapPin size={20} className="text-primary" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                    {SITE_ADDRESS_LINE_1},<br />
                    {SITE_ADDRESS_LINE_2}
                  </span>
                </li>
                <li style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <MessageSquare size={20} className="text-primary" style={{ flexShrink: 0 }} />
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      transition: "color 0.2s",
                      textDecoration: "underline",
                      textDecorationColor: "rgba(255,255,255,0.2)",
                    }}
                    className="hover-white"
                  >
                    24/7 WhatsApp Concierge
                  </a>
                </li>
                <li style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "20px", display: "flex", justifyContent: "center" }}>
                    <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: "1.1rem" }}>@</span>
                  </div>
                  <a href={SUPPORT_EMAIL_URL} style={{ color: "var(--text-secondary)", fontSize: "0.9rem", transition: "color 0.2s" }} className="hover-white">
                    {SUPPORT_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="footer-bottom"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "2.5rem",
              marginTop: "5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              &copy; {new Date().getFullYear()} Blissful Place Residences. All rights reserved.
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
              <span className="serif" style={{ fontStyle: "italic" }}>
                Uncompromised Luxury.
              </span>
            </div>
          </div>
        </div>
      </footer>

      <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat with us on WhatsApp">
        <MessageSquare size={28} />
      </a>
    </>
  );
}
