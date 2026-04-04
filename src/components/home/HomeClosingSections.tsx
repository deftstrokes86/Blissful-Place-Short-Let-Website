import Image from "next/image";
import Link from "next/link";

import { ChevronDown, MessageSquare } from "@/lib/lucide-react";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

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
            <Image src="/windsor.png" alt="Gallery 1" fill />
          </div>
          <div className="gallery-item">
            <Image src="/mayfair.png" alt="Gallery 2" fill />
          </div>
          <div className="gallery-item">
            <Image src="/promise.png" alt="Gallery 3" fill />
          </div>
          <div className="gallery-item">
            <Image src="/kensington.png" alt="Gallery 4" fill />
          </div>
          <div className="gallery-item">
            <Image src="/hero-opulence.png" alt="Gallery 5" fill />
          </div>
          <div className="gallery-item">
            <Image src="/pool.png" alt="Gallery 6" fill />
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
              We guarantee 24/7 uninterrupted power through a dual-grid system with industrial backup generators. Our
              internet setup delivers lightning-fast internet through dedicated fiber optics, making it perfectly suited for remote
              work and heavy streaming.
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
              Booking directly on our website eliminates high third-party service fees (saving you up to 15%), grants
              you priority support via WhatsApp, offers more flexible check-in times upon request, and unlocks exclusive
              add-ons like airport transfers.
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
            Secure your dates now to lock in our guaranteed lowest rates and unlock exclusive complimentary perks.
            Seamless payment, zero extra fees.
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

