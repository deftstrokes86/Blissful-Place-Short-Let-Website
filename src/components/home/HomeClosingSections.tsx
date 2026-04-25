import Image from "next/image";
import Link from "next/link";

import { ChevronDown, MessageSquare } from "@/lib/lucide-react";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-config";
import { LocationMap } from "@/components/site/LocationMap";

export function HomeClosingSections() {
  return (
    <>
      <section id="gallery" className="gallery-section container">
        <div className="gallery-title-wrapper">
          <h2 className="heading-lg serif">A Glimpse of Grandeur</h2>
          <div className="gallery-line" />
        </div>

        <div className="gallery-grid">
          <div className="gallery-item">
            <Image src="/photo-living-room.jpeg" alt="Spacious living room with smart TV and chandelier" fill />
          </div>
          <div className="gallery-item">
            <Image src="/photo-bathroom.jpeg" alt="Marble-tiled bathroom with glass shower enclosure" fill />
          </div>
          <div className="gallery-item">
            <Image src="/photo-bedroom-2.jpeg" alt="Bedroom with black king bed and purple ceiling lights" fill />
          </div>
          <div className="gallery-item">
            <Image src="/photo-corridor.jpeg" alt="Marble-floored corridor with pendant lighting" fill />
          </div>
          <div className="gallery-item">
            <Image src="/photo-bedroom-5.jpeg" alt="Bedroom with wooden wardrobe and blue ceiling accent lights" fill />
          </div>
          <div className="gallery-item">
            <Image src="/photo-bedroom-1.jpeg" alt="Bedroom with dark headboard and coloured ceiling lights" fill />
          </div>
        </div>
      </section>

      <section className="section container">
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <span className="subtitle-tag">COMMON INQUIRIES</span>
          <h2 className="heading-lg serif">Frequently Asked Questions</h2>
        </div>

        <div className="faq-container">
          <details className="faq-item">
            <summary className="serif">
              How reliable is the power and internet in your properties? <ChevronDown size={20} className="text-primary" />
            </summary>
            <p>
              Every flat runs on a full solar and battery power system — silent, clean, and uninterrupted 24/7. No generators, no diesel, no noise. Internet is a dedicated fiber optic connection, strong enough for video calls and heavy streaming.
            </p>
          </details>
          <details className="faq-item">
            <summary className="serif">
              Are the photos a true representation of the properties? <ChevronDown size={20} className="text-primary" />
            </summary>
            <p>
              Absolutely. We operate a strict authenticity policy. What you see is exactly what you get. We manage all
              properties exclusively to ensure they are maintained to the exact premium standard showcased in our
              galleries.
            </p>
          </details>
          <details className="faq-item">
            <summary className="serif">
              What is the difference between booking here and on Airbnb? <ChevronDown size={20} className="text-primary" />
            </summary>
            <p>
              Booking directly eliminates Airbnb&apos;s service fees (saving you up to 15%), gives you priority WhatsApp support from our team, and unlocks add-on services like airport transfers and pantry pre-stocking that aren&apos;t available through third-party platforms.
            </p>
          </details>
          <details className="faq-item">
            <summary className="serif">
              Do you require a security deposit? <ChevronDown size={20} className="text-primary" />
            </summary>
            <p>
              Yes, a standard refundable caution deposit is required prior to check-in to protect against damages. It is
              fully refunded within 24 hours of checkout following a satisfactory property inspection.
            </p>
          </details>
          <details className="faq-item" style={{ borderBottom: "none" }}>
            <summary className="serif">
              Can I host a party or professional photoshoot? <ChevronDown size={20} className="text-primary" />
            </summary>
            <p>
              To preserve the pristine condition of our luxury units and respect our neighbors, parties and large events
              are strictly prohibited. Photoshoots require written pre-approval and may attract a specific commercial
              rate.
            </p>
          </details>
        </div>
      </section>

      <section className="section" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
        <div className="content-wrapper text-center" style={{ marginBottom: "2rem" }}>
          <span className="subtitle-tag">FIND US</span>
          <h2 className="heading-lg serif">Our Location</h2>
          <p className="text-secondary" style={{ maxWidth: "600px", margin: "1rem auto 0" }}>
            16 Tebun Fagbemi Street, Agbado, Lagos — on the Lagos-Abeokuta expressway, minutes from Ikeja, Abule Egba, Meiran, and Egbeda.
          </p>
        </div>
        <div className="content-wrapper">
          <LocationMap height="400px" />
        </div>
      </section>

      <section className="cta-section" style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: "radial-gradient(circle at center, rgba(238, 29, 82, 0.1) 0%, transparent 60%)",
            zIndex: 0,
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h2 className="heading-lg">
            <span className="serif">Ready for the Ultimate Stay?</span>
            <br />
            <span className="serif text-primary">Book Direct & Experience More.</span>
          </h2>
          <p style={{ fontSize: "1.1rem" }}>
            Book directly for the best rate — no Airbnb fees, no hidden charges. Three apartments, same premium standard, available now.
          </p>
          <div className="cta-actions">
            <Link href="/availability" className="btn btn-primary" style={{ padding: "1.25rem 3rem", fontSize: "1.1rem" }}>
              Check Availability
            </Link>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-white"
              style={{ padding: "1.25rem 3rem", fontSize: "1.1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <MessageSquare size={20} /> Chat with Concierge
            </a>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/tour" className="booking-support-link" style={{ fontSize: "0.95rem" }}>
              Schedule a Private Tour
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

