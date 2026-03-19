import Link from "next/link";

import { STEP0, STEP5 } from "@/lib/constants";
import { WhatsApp } from "@/lib/lucide-react";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-config";

interface BookingFlowControlsProps {
  stepIndex: number;
  showContinueButton: boolean;
  continueDisabled: boolean;
  continueLabel: string;
  isCheckingAvailability: boolean;
  isBranchActionLocked: boolean;
  onBack: () => void;
  onContinue: () => Promise<void>;
}

export function BookingFlowControls({
  stepIndex,
  showContinueButton,
  continueDisabled,
  continueLabel,
  isCheckingAvailability,
  isBranchActionLocked,
  onBack,
  onContinue,
}: BookingFlowControlsProps) {
  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      <div className="booking-section" style={{ borderBottom: "none", marginBottom: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {stepIndex > STEP0 && stepIndex < STEP5 && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onBack}
              disabled={isCheckingAvailability || isBranchActionLocked}
            >
              Go Back
            </button>
          )}
          {showContinueButton && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void onContinue();
              }}
              disabled={continueDisabled}
              style={{ opacity: continueDisabled ? 0.6 : 1 }}
            >
              {isCheckingAvailability ? "Verifying Availability..." : continueLabel}
            </button>
          )}
        </div>
      </div>

      <div className="booking-support-strip">
        <div>
          <div style={{ fontWeight: 700, marginBottom: "0.15rem" }}>Want More Information?</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
            Dedicated concierge support is active for every reservation path.
          </div>
          <div className="booking-support-links">
            <Link href="/availability" className="booking-support-link">
              Check Availability
            </Link>
            <Link href="/tour" className="booking-support-link">
              Schedule a Private Tour
            </Link>
          </div>
        </div>
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-primary booking-whatsapp-btn"
        >
          <WhatsApp size={16} /> Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
