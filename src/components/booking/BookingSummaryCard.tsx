import { PAYMENT_LABELS, RESERVATION_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/booking-utils";
import { getBranchPolicyText } from "@/lib/booking-branch";
import { ShieldCheck } from "@/lib/lucide-react";
import type { ExtraOption, FlatOption, PaymentMethod, ReservationStatus } from "@/types/booking";

interface BookingSummaryCardProps {
  stepLabel: string;
  reservationStatus: ReservationStatus;
  paymentMethod: PaymentMethod | null;
  selectedFlat: FlatOption | null;
  stayGuests: number;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  nights: number | null;
  staySubtotal: number | null;
  extrasSubtotal: number;
  selectedExtras: ExtraOption[];
  estimatedTotal: number | null;
}

export function BookingSummaryCard({
  stepLabel,
  reservationStatus,
  paymentMethod,
  selectedFlat,
  stayGuests,
  checkIn,
  checkOut,
  guestName,
  guestEmail,
  nights,
  staySubtotal,
  extrasSubtotal,
  selectedExtras,
  estimatedTotal,
}: BookingSummaryCardProps) {
  return (
    <div className="summary-card">
      <h3 className="heading-sm serif" style={{ marginBottom: "1.5rem" }}>
        Reservation Summary
      </h3>

      <div className="summary-row">
        <span>Process Step</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stepLabel}</span>
      </div>
      <div className="summary-row">
        <span>Current Status</span>
        <span className={`booking-status-pill booking-status-${reservationStatus}`}>
          {RESERVATION_STATUS_LABELS[reservationStatus]}
        </span>
      </div>
      <div className="summary-row" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
        <span>Method Selected</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {paymentMethod ? PAYMENT_LABELS[paymentMethod] : "Not selected"}
        </span>
      </div>

      <div className="summary-split-row">
        <div className="summary-meta-block">
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Residence
          </div>
          <div style={{ fontWeight: 600 }}>{selectedFlat?.name || "Pending"}</div>
        </div>
        <div className="summary-meta-block summary-meta-block-end">
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Guests
          </div>
          <div style={{ fontWeight: 600 }}>{stayGuests || "--"}</div>
        </div>
      </div>

      <div className="summary-split-row" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
        <div className="summary-meta-block">
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Check-in
          </div>
          <div style={{ fontWeight: 600 }}>{checkIn || "--"}</div>
        </div>
        <div className="summary-meta-block summary-meta-block-end">
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.2rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Check-out
          </div>
          <div style={{ fontWeight: 600 }}>{checkOut || "--"}</div>
        </div>
      </div>

      {(guestName || guestEmail) && (
        <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginBottom: "0.35rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Primary Guest
          </div>
          <div style={{ fontWeight: 600 }}>{guestName || "Guest"}</div>
          {guestEmail && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{guestEmail}</div>}
        </div>
      )}

      <div className="summary-row">
        <span>Nightly Rate</span>
        <span>{selectedFlat ? formatCurrency(selectedFlat.rate) : "--"}</span>
      </div>
      <div className="summary-row">
        <span>Total Nights</span>
        <span>{nights !== null ? nights : "--"}</span>
      </div>
      <div className="summary-row">
        <span>Stay Subtotal</span>
        <span>{staySubtotal !== null ? formatCurrency(staySubtotal) : "--"}</span>
      </div>
      <div className="summary-row" style={{ marginBottom: selectedExtras.length > 0 ? "0.5rem" : "1.25rem" }}>
        <span>Selected Extras</span>
        <span>{formatCurrency(extrasSubtotal)}</span>
      </div>

      {selectedExtras.map((extra) => (
        <div key={extra.id} className="summary-row" style={{ fontSize: "0.83rem", paddingLeft: "0.75rem", marginBottom: "0.35rem" }}>
          <span style={{ fontStyle: "italic" }}>- {extra.title}</span>
          <span>{formatCurrency(extra.price)}</span>
        </div>
      ))}

      <div className="summary-row grand-total" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem", marginTop: "1rem" }}>
        <span style={{ fontWeight: 500 }}>Total Estimate</span>
        <span>{estimatedTotal !== null ? formatCurrency(estimatedTotal) : "Complete stay details"}</span>
      </div>

      <div className="payment-due-box">
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>
          Flow Policy
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.4, opacity: 0.9 }}>{getBranchPolicyText(paymentMethod)}</div>
      </div>

      <div className="summary-security-note">
        <ShieldCheck size={18} className="text-primary" style={{ flexShrink: 0 }} />
        <span>Encrypted submission filters enable secure data preservation across booking branches.</span>
      </div>
    </div>
  );
}
