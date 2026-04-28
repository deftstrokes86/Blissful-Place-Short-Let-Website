import { PageIntro } from "@/components/common/PageIntro";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "House Rules",
  description: "Guest conduct, check-in, checkout, visitor, security, kitchen, laundry, and property care rules for Blissful Place Residences.",
  path: "/house-rules",
});

export default function HouseRulesPage() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="House Rules"
        description="Clear rules designed to protect guests, the apartments, neighbours, staff, and the calm residential environment."
      />

      <div className="guest-guide-stack">
        <section className="booking-section">
          <div className="guest-guide-callout">
            <strong>Effective date: April 2026</strong>
          </div>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">1. Respect for the Property</h2>
          <p>
            Guests must treat the apartment, appliances, furniture, fittings, linens, utensils, electronics, and
            common areas with care. Damage, missing items, misuse, excessive cleaning, or rule violations may be
            charged to the guest.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">2. Guest Count</h2>
          <p>
            Maximum occupancy is 6 guests per flat unless written approval is given by management. The person who made
            the booking is responsible for every guest and visitor.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">3. Check-in and Checkout</h2>
          <p>
            Standard check-in starts from 1:00 PM WAT. Checkout is by 12:00 PM noon WAT. Early check-in is subject to
            apartment readiness and must be approved. Late checkout must be approved in advance.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">4. Late Checkout Charges</h2>
          <p>
            Where approved and available, free late checkout is limited to 2 extra hours. Late checkout beyond 2 hours
            attracts a ₦50,000 flat fee and cannot exceed 6 hours. Unapproved late checkout may attract additional
            charges and may affect the caution deposit.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">5. Visitors</h2>
          <p>
            Visitors must be authorised by the booking guest and may be subject to security checks. Visitors are not
            allowed to stay overnight unless approved as part of the guest count. The booking guest is responsible for
            visitor conduct.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">6. No Parties or Loud Gatherings</h2>
          <p>
            Parties, loud gatherings, commercial events, filming, large meetings, or disruptive activities are not
            allowed without written approval. Noise must be kept reasonable, especially at night.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">7. Smoking</h2>
          <p>
            Smoking is not allowed inside the apartment. Any smoking damage, smell removal, burns, stains, or extra
            cleaning may be charged to the guest.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">8. Pets</h2>
          <p>Pets are not allowed unless management gives written approval before booking.</p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">9. Security</h2>
          <p>
            The premises include gated access, on-site security, controlled vehicle access, and CCTV coverage in
            external/common areas. Guests must cooperate with security procedures and must not allow unauthorised
            persons into the premises.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">10. Keys and Access</h2>
          <p>
            Guests must keep keys safe. Lost keys, lock damage, or access-related costs caused by the guest may be
            charged. Guests must not duplicate keys or share access without approval.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">11. Kitchen Use</h2>
          <p>
            Guests may use the kitchen to prepare meals. The kitchen includes an induction cooker, microwave, blender,
            and cooking utensils. Guests must switch off appliances after use, clean up after cooking, and avoid unsafe
            cooking practices.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">12. Laundry</h2>
          <p>
            Guests have access to an AI-powered washing machine for self-laundry. Laundry support may be arranged for a
            fee. Guests must follow appliance instructions and avoid washing items that may damage the machine. Damage
            caused by misuse may be charged.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">13. Power, Internet, and Appliances</h2>
          <p>
            Guests should use power, internet, air conditioning, and appliances responsibly. Report faults promptly. Do
            not tamper with electrical systems, routers, batteries, inverters, security devices, plumbing, or
            appliances.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">14. Cleanliness</h2>
          <p>
            Guests should keep the apartment reasonably clean during their stay. Excessive dirt, stains, blocked
            drains, damaged linens, strong odours, or unusual cleaning needs may attract extra charges.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">15. Prohibited Conduct</h2>
          <p>The following are prohibited:</p>
          <ul>
            <li>illegal activity</li>
            <li>drug use or possession</li>
            <li>violence, threats, harassment, or abuse</li>
            <li>property damage</li>
            <li>unauthorised parties</li>
            <li>indoor smoking</li>
            <li>excessive noise</li>
            <li>tampering with CCTV, locks, routers, electrical systems, or appliances</li>
            <li>exceeding approved guest count</li>
            <li>bringing weapons or dangerous items onto the premises</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">16. Breach of Rules</h2>
          <p>
            Breach of these rules may result in additional charges, deduction from the caution deposit, refusal of
            entry, cancellation, eviction without refund, involvement of security or law enforcement, or recovery of
            additional losses.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">17. Emergency and Support</h2>
          <p>For urgent support during your stay, contact us through WhatsApp or phone:</p>
          <p>+2349013673587</p>
        </section>
      </div>
    </main>
  );
}

