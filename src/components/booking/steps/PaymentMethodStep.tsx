import { PAYMENT_OPTIONS } from "@/lib/constants";
import type { PaymentMethod } from "@/types/booking";

interface PaymentMethodStepProps {
  paymentMethod: PaymentMethod | null;
  paymentTouched: boolean;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}

export function PaymentMethodStep({
  paymentMethod,
  paymentTouched,
  onPaymentMethodChange,
}: PaymentMethodStepProps) {
  return (
    <div className="booking-section">
      <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="step-circle">3</span> Choose Payment Method
      </h2>
      <div style={{ display: "grid", gap: "1rem" }}>
        {PAYMENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`payment-plan-card ${paymentMethod === option.id ? "selected" : ""}`}
            onClick={() => onPaymentMethodChange(option.id)}
          >
            <span className="radio-ring">{paymentMethod === option.id && <span className="radio-dot" />}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700 }}>{option.title}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{option.desc}</div>
              <div style={{ marginTop: "0.3rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                {option.reassurance}
              </div>
            </div>
          </button>
        ))}
      </div>
      {paymentTouched && !paymentMethod && (
        <p className="booking-inline-error" style={{ marginTop: "0.9rem" }}>
          Please select a payment method to proceed.
        </p>
      )}
    </div>
  );
}
