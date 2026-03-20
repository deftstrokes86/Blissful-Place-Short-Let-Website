import type {
  PaymentMethod,
  PosTransientState,
  TransferTransientState,
  WebsiteTransientState,
} from "@/types/booking";
import { Clock } from "@/lib/lucide-react";

interface BranchActionStepProps {
  stepLabel: string;
  paymentMethod: PaymentMethod | null;
  websiteState: WebsiteTransientState;
  transferState: TransferTransientState;
  posState: PosTransientState;
  transferTimeLeft: string;
  isBranchActionLocked: boolean;
  isCheckingAvailability: boolean;
  onInitiateWebsiteCheckout: () => Promise<void>;
  onSwitchMethod: () => void;
  onTransferReferenceChange: (value: string) => void;
  onTransferProofNoteChange: (value: string) => void;
  onSubmitTransferProof: () => Promise<void>;
  onPosContactWindowChange: (value: string) => void;
  onPosNoteChange: (value: string) => void;
  onSubmitPosRequest: () => Promise<void>;
}

export function BranchActionStep({
  stepLabel,
  paymentMethod,
  websiteState,
  transferState,
  posState,
  transferTimeLeft,
  isBranchActionLocked,
  isCheckingAvailability,
  onInitiateWebsiteCheckout,
  onSwitchMethod,
  onTransferReferenceChange,
  onTransferProofNoteChange,
  onSubmitTransferProof,
  onPosContactWindowChange,
  onPosNoteChange,
  onSubmitPosRequest,
}: BranchActionStepProps) {
  if (!paymentMethod) {
    return null;
  }

  return (
    <div className="booking-section">
      {paymentMethod === "website" && (
        <>
          <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="step-circle">5</span> {stepLabel}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Continue to our secure payment partner to complete checkout. Confirmation only happens after verified payment.
          </p>
          {websiteState.message && (
            <div className="booking-inline-note" style={{ marginBottom: "1rem" }}>
              {websiteState.message}
            </div>
          )}
          {websiteState.isProcessing && (
            <div className="booking-inline-note booking-inline-note-muted" style={{ marginBottom: "1rem" }}>
              Preparing secure checkout...
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void onInitiateWebsiteCheckout();
              }}
              disabled={websiteState.isProcessing || isBranchActionLocked}
            >
              {websiteState.isProcessing || isBranchActionLocked
                ? "Preparing Checkout..."
                : websiteState.outcome === "failed"
                  ? "Retry Checkout"
                  : "Proceed to Secure Checkout"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onSwitchMethod}
              disabled={websiteState.isProcessing || isBranchActionLocked}
            >
              Switch Method
            </button>
          </div>
        </>
      )}

      {paymentMethod === "transfer" && (
        <>
          <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="step-circle">5</span> {stepLabel}
          </h2>
          <div className="payment-plan-card" style={{ background: "transparent", cursor: "default", marginBottom: "1.5rem" }}>
            <Clock size={18} className="text-primary" />
            <div>
              <div style={{ fontWeight: 700 }}>Active Transfer Hold</div>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Expires in 60 minutes. Provide proof within this window to secure your stay.
              </p>
              <div style={{ marginTop: "0.35rem", color: "var(--primary)", fontWeight: 600 }}>{transferTimeLeft}</div>
            </div>
          </div>
          <div className="flex-grid">
            <div className="input-group">
              <label htmlFor="transfer-ref">Transfer Reference ID</label>
              <input
                id="transfer-ref"
                className="standard-input"
                value={transferState.reference}
                onChange={(e) => onTransferReferenceChange(e.target.value)}
                placeholder="e.g. TRX-882291"
              />
            </div>
            <div className="input-group">
              <label htmlFor="transfer-proof">Proof Note / Filename</label>
              <input
                id="transfer-proof"
                className="standard-input"
                value={transferState.proofNote}
                onChange={(e) => onTransferProofNoteChange(e.target.value)}
                placeholder="Reference or screenshot note"
              />
            </div>
          </div>
          {transferState.error && <p className="booking-inline-error">{transferState.error}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void onSubmitTransferProof();
              }}
              disabled={transferState.isSubmitting || isBranchActionLocked}
            >
              {transferState.isSubmitting || isBranchActionLocked ? "Submitting..." : "Submit Proof of Transfer"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onSwitchMethod}
              disabled={isCheckingAvailability || isBranchActionLocked}
            >
              Switch Method
            </button>
          </div>
        </>
      )}

      {paymentMethod === "pos" && (
        <>
          <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="step-circle">5</span> {stepLabel}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Coordinate a physical card payment through our localized support team.
          </p>
          <div className="flex-grid">
            <div className="input-group">
              <label htmlFor="pos-window">Preferred Contact Window</label>
              <select
                id="pos-window"
                className="standard-input"
                value={posState.contactWindow}
                onChange={(e) => onPosContactWindowChange(e.target.value)}
              >
                <option value="">Select a time window</option>
                <option value="immediate">Within 15 mins (Immediate)</option>
                <option value="morning">Morning (9am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 5pm)</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="pos-note">Coordination Note</label>
              <input
                id="pos-note"
                className="standard-input"
                value={posState.note}
                onChange={(e) => onPosNoteChange(e.target.value)}
                placeholder="Optional numbers or timing notes"
              />
            </div>
          </div>
          {posState.error && <p className="booking-inline-error">{posState.error}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void onSubmitPosRequest();
              }}
              disabled={posState.isSubmitting || isBranchActionLocked}
            >
              {posState.isSubmitting || isBranchActionLocked ? "Submitting..." : "Submit Coordination Request"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onSwitchMethod}
              disabled={isCheckingAvailability || isBranchActionLocked}
            >
              Switch Method
            </button>
          </div>
        </>
      )}
    </div>
  );
}
