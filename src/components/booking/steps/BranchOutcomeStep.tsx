import { CheckCircle2, Clock, MessageSquare } from "@/lib/lucide-react";
import type { PaymentMethod, ReservationStatus } from "@/types/booking";

interface BranchOutcomeStepProps {
  paymentMethod: PaymentMethod | null;
  reservationStatus: ReservationStatus;
  finalStepLabel: string;
  guestEmail: string;
  onSwitchPaymentMethod: () => void;
}

export function BranchOutcomeStep({
  paymentMethod,
  reservationStatus,
  finalStepLabel,
  guestEmail,
  onSwitchPaymentMethod,
}: BranchOutcomeStepProps) {
  const isTransferCancelled = reservationStatus === "cancelled";
  const isTransferExpired = reservationStatus === "expired";

  return (
    <div className="booking-section animate-in">
      <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="step-circle">6</span> {finalStepLabel}
      </h2>

      {paymentMethod === "website" && (
        <div className="payment-plan-card selected" style={{ cursor: "default" }}>
          <CheckCircle2 size={24} className="text-primary" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Payment Received - Booking Confirmed</div>
            <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
              Digital receipts and check-in instructions have been sent to {guestEmail}.
            </p>
          </div>
        </div>
      )}

      {paymentMethod === "transfer" && (
        <div
          className={`payment-plan-card ${isTransferCancelled || isTransferExpired ? "" : "selected"}`}
          style={{ cursor: "default" }}
        >
          {isTransferCancelled || isTransferExpired ? <Clock size={24} /> : <Clock size={24} className="text-primary" />}
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {isTransferCancelled || isTransferExpired ? "Reservation Cancelled" : "Proof Submitted - Verification Pending"}
            </div>
            <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
              {isTransferCancelled || isTransferExpired
                ? "Transfer hold window elapsed before required completion. Please switch method to continue your booking."
                : "Our team is verifying your transfer. You will receive an official confirmation within 30 minutes."}
            </p>
          </div>
        </div>
      )}

      {paymentMethod === "pos" && (
        <div className="payment-plan-card selected" style={{ cursor: "default" }}>
          <MessageSquare size={24} className="text-primary" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Reservation Request Submitted</div>
            <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
              A dedicated support member will contact you within your selected window to coordinate card payment
              completion.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <button type="button" className="btn btn-outline-primary" onClick={onSwitchPaymentMethod}>
          Choose New Payment Path
        </button>
        <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
          Contact Support
        </a>
      </div>
    </div>
  );
}

