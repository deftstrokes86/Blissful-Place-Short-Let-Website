import { Home, Lock } from "@/lib/lucide-react";
import { getBranchReviewCopy } from "@/lib/booking-branch";
import type { PaymentMethod } from "@/types/booking";

interface BranchReviewStepProps {
  paymentMethod: PaymentMethod;
  stepLabel: string;
  reviewResidenceLabel: string;
  reviewNightsLabel: string;
  reviewGuestsLabel: string;
}

export function BranchReviewStep({
  paymentMethod,
  stepLabel,
  reviewResidenceLabel,
  reviewNightsLabel,
  reviewGuestsLabel,
}: BranchReviewStepProps) {
  const reviewCopy = getBranchReviewCopy(paymentMethod);

  return (
    <div className="booking-section">
      <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="step-circle">4</span> {stepLabel}
      </h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div className="payment-plan-card" style={{ background: "transparent", cursor: "default" }}>
          <Home size={18} className="text-primary" />
          <div>
            <div style={{ fontWeight: 700 }}>Reservation Snapshot</div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {reviewResidenceLabel} - {reviewNightsLabel} - {reviewGuestsLabel}
            </p>
          </div>
        </div>
        <div className="payment-plan-card" style={{ background: "transparent", cursor: "default" }}>
          <Lock size={18} className="text-primary" />
          <div>
            <div style={{ fontWeight: 700 }}>{reviewCopy.title}</div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {reviewCopy.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
