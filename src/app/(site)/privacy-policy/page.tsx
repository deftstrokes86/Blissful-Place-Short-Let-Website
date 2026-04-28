import { PageIntro } from "@/components/common/PageIntro";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Privacy Policy",
  description: "How Blissful Place Residences collects, uses, protects, and retains guest and website visitor information.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="Privacy Policy"
        description="How we collect, use, protect, and retain personal information when you visit our website, make enquiries, or book a stay."
      />

      <div className="guest-guide-stack">
        <section className="booking-section">
          <div className="guest-guide-callout">
            <strong>Effective date: April 2026</strong>
          </div>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">1. Who We Are</h2>
          <p>
            Blissful Place Residences operates professionally managed short-let apartments in Agbado, Lagos. This
            Privacy Policy explains how we collect and process personal information when guests, prospective guests,
            visitors, or service providers interact with our website, booking channels, WhatsApp support, payment
            channels, or property.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">2. Information We Collect</h2>
          <p>We may collect:</p>
          <ul>
            <li>full name</li>
            <li>phone number</li>
            <li>email address</li>
            <li>WhatsApp messages and communication history</li>
            <li>booking dates, selected apartment, guest count, preferences, and special requests</li>
            <li>payment references, transfer proof, transaction status, and billing details</li>
            <li>
              identity or verification information where required for check-in, security, fraud prevention, or legal
              compliance
            </li>
            <li>emergency contact or visitor details where reasonably necessary</li>
            <li>CCTV footage from external and common-area security coverage on the premises</li>
            <li>website usage information such as device, browser, IP address, pages visited, and enquiry activity</li>
            <li>any information voluntarily submitted through forms, calls, messages, or booking channels</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">3. How We Use Information</h2>
          <p>We use information to:</p>
          <ul>
            <li>respond to enquiries</li>
            <li>process reservations</li>
            <li>verify payments</li>
            <li>coordinate check-in and checkout</li>
            <li>prepare the apartment before arrival</li>
            <li>provide guest support during stays</li>
            <li>manage security, access control, and incident reporting</li>
            <li>prevent fraud, misuse, unauthorised bookings, and property damage</li>
            <li>comply with legal, tax, accounting, security, and regulatory obligations</li>
            <li>improve our website, services, guest communication, and operational quality</li>
            <li>send booking-related updates and service messages</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">4. Lawful Basis</h2>
          <p>We process personal data where necessary for:</p>
          <ul>
            <li>performance of a booking or service contract</li>
            <li>compliance with legal obligations</li>
            <li>
              legitimate business interests such as security, fraud prevention, guest support, and property protection
            </li>
            <li>consent, where required, such as optional marketing or non-essential communications</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">5. CCTV and Property Security</h2>
          <p>
            CCTV may operate in external and common areas of the premises for safety, access control, incident review,
            and property protection. CCTV is not intended for private areas such as bedrooms or bathrooms. Footage may
            be reviewed where there is a security incident, suspected rule violation, damage, dispute, emergency, or
            legal requirement.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">6. Sharing of Information</h2>
          <p>We may share information with:</p>
          <ul>
            <li>authorised staff and property representatives</li>
            <li>payment processors, banks, and transaction verification providers</li>
            <li>IT, hosting, website, communication, and booking service providers</li>
            <li>security personnel or maintenance personnel where necessary</li>
            <li>professional advisers, insurers, auditors, or legal representatives</li>
            <li>regulators, law enforcement, courts, or government authorities where required by law</li>
            <li>third-party booking platforms if the booking was made through those platforms</li>
          </ul>
          <p>We do not sell guest personal information.</p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">7. Payment Information</h2>
          <p>
            We do not intentionally store full card details on our website. Online payment details are processed by
            payment providers or financial institutions according to their own security standards. We may store
            transaction references, payment status, amount paid, payment method, and confirmation records for booking,
            accounting, fraud prevention, and dispute management.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">8. Data Retention</h2>
          <p>
            We retain information only as long as reasonably necessary for bookings, guest support, accounting, legal
            compliance, security, dispute resolution, fraud prevention, and business records. CCTV footage may be
            retained for a limited period unless needed for an incident, investigation, claim, dispute, or legal
            requirement.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">9. Data Security</h2>
          <p>
            We use reasonable administrative, technical, and operational safeguards to protect personal information.
            However, no website, payment channel, email, or messaging platform can be guaranteed to be completely
            secure. Guests are responsible for keeping their own devices, payment credentials, and communication
            channels secure.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">10. Guest Rights</h2>
          <p>
            Subject to applicable law, guests and website visitors may request access to, correction of, deletion of,
            restriction of, or objection to certain processing of their personal data. Where processing is based on
            consent, consent may be withdrawn, but this does not affect processing already carried out lawfully before
            withdrawal.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">11. Cookies and Analytics</h2>
          <p>
            The website may use necessary cookies or similar technologies for site functionality, security,
            performance, analytics, or booking flow improvement. If optional analytics or marketing tools are
            introduced, they should be used in line with applicable privacy requirements.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">12. Third-Party Links</h2>
          <p>
            Our website may link to third-party platforms such as payment providers, social media platforms, maps, or
            booking platforms. We are not responsible for the privacy practices, content, or security of those
            third-party websites.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">13. Children&apos;s Privacy</h2>
          <p>
            Our services are intended for adults making accommodation bookings. We do not knowingly collect personal
            information from children except where provided by an adult guest or guardian as part of a legitimate stay
            or safety requirement.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">14. Updates to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The latest version posted on this website will apply
            from the stated effective date.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">15. Contact</h2>
          <p>For privacy questions or requests, contact:</p>
          <p>
            reservations@blissfulplaceresidences.com
            <br />
            +2349013673587
          </p>
        </section>
      </div>
    </main>
  );
}

