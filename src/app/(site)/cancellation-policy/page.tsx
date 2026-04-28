import { PageIntro } from "@/components/common/PageIntro";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "Cancellation Policy",
  description: "Cancellation, no-show, date-change, and non-refundable booking terms for Blissful Place Residences.",
  path: "/cancellation-policy",
});

export default function CancellationPolicyPage() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="Cancellation Policy"
        description="Clear rules for cancellations, date changes, no-shows, late arrivals, early departures, and confirmed bookings."
      />

      <div className="guest-guide-stack">
        <section className="booking-section">
          <div className="guest-guide-callout">
            <strong>Effective date: April 2026</strong>
          </div>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">1. Policy Summary</h2>
          <p>
            Bookings are non-refundable once confirmed. Guests should confirm dates, guest count, payment method, and
            stay details carefully before making payment.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">2. When a Booking Becomes Confirmed</h2>
          <p>
            A booking becomes confirmed only after payment has been received and verified or after Blissful Place
            Residences expressly confirms the reservation in writing. Transfer proof alone does not confirm a booking
            until receipt is verified.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">3. Guest Cancellation</h2>
          <p>
            If a guest cancels after confirmation, booking payments are non-refundable. This applies whether the
            cancellation is due to change of plans, travel disruption, illness, personal emergency, mistaken dates,
            third-party platform issue, or failure to arrive.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">4. No-Show</h2>
          <p>
            Failure to arrive on the check-in date is treated as a no-show. No-shows are non-refundable and do not
            create an automatic right to move the booking to another date.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">5. Early Departure</h2>
          <p>If a guest checks out before the booked checkout date, unused nights are non-refundable.</p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">6. Date Changes and Rescheduling</h2>
          <p>
            Date changes are not guaranteed. Blissful Place Residences may, at its discretion, consider a date change
            where:
          </p>
          <ul>
            <li>the request is made before check-in</li>
            <li>the apartment is available on the new dates</li>
            <li>the new dates are not lower in value unless management agrees</li>
            <li>any price difference, extension charge, or administrative charge is paid</li>
            <li>the request is confirmed in writing</li>
          </ul>
          <p>
            Approval of one date-change request does not create a general right to reschedule future bookings.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">7. Late Arrival</h2>
          <p>
            Late arrival does not reduce the booking price and does not extend checkout time unless separately
            approved.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">8. Early Check-in and Late Checkout</h2>
          <p>
            Early check-in is subject to apartment readiness. Late checkout is subject to no immediate incoming
            booking. Where approved, free late checkout is limited to 2 extra hours. Longer extensions attract a
            ₦50,000 flat fee and cannot exceed 6 hours.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">9. Cancellations by Blissful Place Residences</h2>
          <p>
            We may cancel or refuse a booking where there is suspected fraud, failed payment verification, unsafe
            conduct, property unavailability due to emergency maintenance, force majeure, breach of policy, or
            inaccurate guest information. Where cancellation is caused by our own operational inability to host and not
            by guest breach, we may offer an alternative date, alternative apartment, or other reasonable remedy at
            management&apos;s discretion.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">10. Third-Party Bookings</h2>
          <p>
            Bookings made through third-party platforms may also be subject to the cancellation rules of those
            platforms. Where there is a conflict between third-party platform terms and direct booking terms, the
            platform&apos;s confirmed booking rules may apply to that platform booking.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">11. Caution Deposit</h2>
          <p>
            The caution deposit is separate from the booking payment. It may be applied toward damages, missing items,
            excessive cleaning, late checkout charges, rule violations, unpaid charges, or losses caused during the
            stay.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">12. How to Request a Change</h2>
          <p>Requests must be sent through the official WhatsApp or email channel:</p>
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

