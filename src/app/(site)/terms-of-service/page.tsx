import {
  HelpfulLinks,
  type HelpfulLink,
} from "@/components/common/HelpfulLinks";
import { PageIntro } from "@/components/common/PageIntro";
import { PublicInfoPageShell } from "@/components/common/PublicInfoPageShell";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Terms of Service",
  description:
    "Terms governing bookings, stays, payments, guest responsibilities, and use of Blissful Place Residences.",
  path: "/terms-of-service",
});

const helpfulLinks: HelpfulLink[] = [
  { href: "/payment-policy", label: "Payment Policy" },
  { href: "/cancellation-policy", label: "Cancellation Policy" },
  { href: "/house-rules", label: "House Rules" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/book", label: "Check availability" },
  { href: "/contact", label: "Contact reservations" },
];

export default function TermsOfServicePage() {
  return (
    <PublicInfoPageShell>
      <article className="container guest-guide-page">
        <PageIntro
          title="Terms of Service"
          description="The terms that apply when you use our website, make enquiries, book a stay, or occupy any Blissful Place residence."
        />

        <div className="guest-guide-stack">
          <section className="booking-section">
            <div className="guest-guide-callout">
              <strong>Effective date: April 2026</strong>
            </div>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">1. Agreement to These Terms</h2>
            <p>
              By using this website, making an enquiry, submitting a booking
              request, making payment, checking in, or staying at Blissful Place
              Residences, you agree to these Terms of Service, our Privacy
              Policy, Cancellation Policy, House Rules, and Payment Policy.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">2. Our Services</h2>
            <p>
              Blissful Place Residences provides short-let apartment
              accommodation in Agbado, Lagos, including furnished flats, guest
              support, direct booking assistance, optional add-ons, and related
              hospitality services.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">3. Booking Eligibility</h2>
            <p>
              The person making the booking must be legally capable of entering
              into a binding agreement and may be required to provide accurate
              identity, contact, payment, and guest information. We may refuse
              or cancel a booking if information is false, incomplete,
              suspicious, or inconsistent.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">4. Booking Confirmation</h2>
            <p>
              A booking is not confirmed merely because a guest submits a form,
              sends a WhatsApp message, uploads proof of transfer, or selects
              dates. A booking is confirmed only when payment is received and
              verified, or when Blissful Place Residences expressly confirms the
              reservation in writing.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">5. Rates and Availability</h2>
            <p>
              Rates, availability, fees, and add-ons may change until a booking
              is confirmed. Displayed availability is subject to final
              confirmation because bookings, maintenance blocks, staff
              verification, and payment timing may affect actual availability.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">6. Guest Responsibility</h2>
            <p>The booking guest is responsible for:</p>
            <ul>
              <li>all guests and visitors linked to the booking</li>
              <li>accurate booking information</li>
              <li>
                payment of all fees, deposits, penalties, damages, and unpaid
                charges
              </li>
              <li>compliance with the House Rules</li>
              <li>safe and responsible use of the apartment and amenities</li>
              <li>reporting issues promptly</li>
            </ul>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">7. Check-in and Checkout</h2>
            <p>
              Standard check-in is from 1:00 PM WAT. Checkout is by 12:00 PM
              noon WAT. Early check-in is subject to apartment readiness and
              must be approved in advance. Late checkout is subject to
              availability and must be approved in advance.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">
              8. Early Check-in and Late Checkout
            </h2>
            <p>
              Early check-in is not guaranteed. Late checkout is available only
              where there is no immediate incoming booking. Where approved, free
              late checkout is limited to 2 extra hours. Longer extensions
              attract a ₦50,000 flat fee and cannot exceed 6 hours.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">9. Guest Limit</h2>
            <p>
              The maximum guest count is 6 per flat unless written approval is
              provided by management. Exceeding the approved guest count may
              lead to additional charges, refusal of entry, cancellation,
              eviction, or deduction from the caution deposit.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">10. Use of the Property</h2>
            <p>
              Guests must use the property only for lawful residential
              short-stay purposes. Parties, commercial filming, events, loud
              gatherings, illegal activity, nuisance, or unauthorised commercial
              use are prohibited unless expressly approved in writing.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">11. Caution Deposit</h2>
            <p>
              A caution deposit may be required before check-in. It is separate
              from the booking payment and may be applied toward damages,
              missing items, excessive cleaning, rule violations, late checkout
              charges, unpaid fees, or other losses caused during the stay.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">
              12. Non-Refundable Booking Payments
            </h2>
            <p>
              Booking payments are non-refundable once confirmed, except where
              Blissful Place Residences expressly agrees otherwise in writing.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">13. Damage, Loss, and Charges</h2>
            <p>
              Guests are responsible for damage, loss, missing items, excessive
              cleaning, broken appliances, unauthorised parties, smoking
              penalties, security incidents caused by guests or visitors, and
              any costs exceeding the caution deposit.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">14. Security and Access</h2>
            <p>
              The premises include gated access, on-site security, controlled
              vehicle access, and CCTV coverage in external/common areas. Guests
              must not bypass security procedures, share access irresponsibly,
              or allow unauthorised persons into the premises.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">15. Amenities and Utilities</h2>
            <p>
              We aim to provide reliable power, internet, appliances, kitchen
              facilities, and support. Guests must use all amenities safely and
              responsibly. Temporary interruptions caused by maintenance,
              network providers, public infrastructure, weather, force majeure,
              or events outside our reasonable control do not automatically
              create a refund entitlement.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">16. Optional Add-ons</h2>
            <p>
              Optional add-ons such as airport pickup, pantry stocking,
              celebration setup, or laundry support are subject to availability,
              advance request, separate pricing, and staff confirmation.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">
              17. Refusal of Service or Removal
            </h2>
            <p>
              We may refuse check-in, cancel a stay, remove guests, or involve
              security/law enforcement where there is suspected fraud, unsafe
              conduct, illegal activity, property damage, nuisance, unauthorised
              parties, threats, abuse, or breach of these terms.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">18. Website Use</h2>
            <p>
              Users must not misuse the website, attempt unauthorised access,
              scrape data, disrupt services, submit false information, or
              interfere with booking or payment systems.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">19. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Blissful Place Residences
              is not liable for indirect loss, loss of profit, loss of
              opportunity, personal items left unattended, third-party service
              failures, guest negligence, or events outside our reasonable
              control.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">20. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of
              Nigeria. Disputes should first be addressed through good-faith
              communication with Blissful Place Residences. Where unresolved,
              disputes may be handled through appropriate courts or dispute
              resolution channels in Nigeria.
            </p>
          </section>

          <section className="booking-section">
            <h2 className="heading-sm serif">21. Contact</h2>
            <p>For questions about these Terms, contact:</p>
            <p>
              reservations@blissfulplaceresidences.com
              <br />
              +2349013673587
            </p>
          </section>

          <HelpfulLinks links={helpfulLinks} />
        </div>
      </article>
    </PublicInfoPageShell>
  );
}
