import type { Metadata } from "next";

import { PageIntro } from "@/components/common/PageIntro";

export const metadata: Metadata = {
  title: "Payment Policy",
  description: "Accepted payment methods, booking confirmation, transfer verification, POS payments, caution deposits, and non-refundable payment terms.",
  alternates: {
    canonical: "/payment-policy",
  },
};

export default function PaymentPolicyPage() {
  return (
    <main className="container guest-guide-page">
      <PageIntro
        title="Payment Policy"
        description="How payments, confirmations, transfer proof, POS coordination, caution deposits, and unpaid charges are handled."
      />

      <div className="guest-guide-stack">
        <section className="booking-section">
          <div className="guest-guide-callout">
            <strong>Effective date: April 2026</strong>
          </div>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">1. Accepted Payment Methods</h2>
          <p>Blissful Place Residences may accept:</p>
          <ul>
            <li>online payment through the website or approved payment processor</li>
            <li>bank transfer</li>
            <li>POS or staff-assisted card payment where available</li>
            <li>other approved payment methods confirmed by management in writing</li>
          </ul>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">2. Booking Is Not Confirmed Until Payment Is Verified</h2>
          <p>
            Submitting a booking form, selecting dates, uploading proof of transfer, or sending a WhatsApp message
            does not by itself confirm a booking. A booking is confirmed only when payment has been received and
            verified or when Blissful Place Residences expressly confirms the reservation in writing.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">3. Online Payments</h2>
          <p>
            Online payments are processed through approved payment providers. A payment may be treated as pending until
            the provider confirms successful settlement. Failed, reversed, incomplete, suspicious, or disputed
            transactions do not confirm a booking.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">4. Bank Transfers</h2>
          <p>
            For bank transfer bookings, the guest must send valid proof of payment. Proof of transfer is not final
            confirmation. Staff must verify receipt in the designated account before the booking is confirmed. If
            payment cannot be verified within the stated hold window, the dates may be released.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">5. POS Payments</h2>
          <p>
            POS payments are staff-assisted and subject to coordination. A POS booking is not confirmed until the
            transaction is successful and staff confirms payment receipt. Declined, reversed, or disputed POS
            transactions do not confirm a booking.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">6. Non-Refundable Booking Payments</h2>
          <p>
            Booking payments are non-refundable once confirmed. Guests should verify dates, apartment choice, guest
            count, payment method, and total amount before payment.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">7. Caution Deposit</h2>
          <p>A caution deposit may be required before check-in. It is separate from the booking payment.</p>
          <p>The caution deposit may be applied toward:</p>
          <ul>
            <li>property damage</li>
            <li>missing items</li>
            <li>excessive cleaning</li>
            <li>smoking penalties</li>
            <li>unauthorised parties or events</li>
            <li>late checkout charges</li>
            <li>unpaid service/add-on fees</li>
            <li>breach of house rules</li>
            <li>losses caused by guests or visitors</li>
          </ul>
          <p>If charges exceed the caution deposit, the guest remains responsible for the outstanding amount.</p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">8. Add-ons and Extra Charges</h2>
          <p>
            Optional add-ons such as airport pickup, pantry stocking, celebration setup, laundry assistance, or late
            checkout may attract separate fees. Add-ons are confirmed only after availability and pricing are
            confirmed.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">9. Payment Errors</h2>
          <p>
            Guests must report payment errors immediately. Blissful Place Residences may request bank statements,
            transaction references, payment receipts, or payment provider confirmation to investigate.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">10. Chargebacks and Disputes</h2>
          <p>
            If a guest initiates a chargeback or payment dispute after receiving accommodation or services, Blissful
            Place Residences reserves the right to provide booking records, check-in records, communication records,
            CCTV/common-area access records where relevant, invoices, and other evidence to the payment provider, bank,
            platform, or lawful authority.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">11. Failed or Suspicious Payments</h2>
          <p>
            We may refuse, pause, or cancel a booking where payment appears fraudulent, incomplete, reversed,
            suspicious, unverifiable, or linked to inaccurate guest information.
          </p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">12. Receipts and Records</h2>
          <p>Guests may request payment confirmation or receipts through the official email or WhatsApp channel.</p>
        </section>

        <section className="booking-section">
          <h2 className="heading-sm serif">13. Contact</h2>
          <p>Payment questions should be sent to:</p>
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

