export interface BookingResumeUxInput {
  isResumingDraft: boolean;
  showDraftRestoredNotice: boolean;
  staleAvailabilityRecoveryNotice: string | null;
  flowNotice: string | null;
  isPersistingDraft: boolean;
}

export interface BookingResumeUxState {
  resumingNotice: string | null;
  restoredNotice: string | null;
  recoveryNotice: string | null;
  effectiveFlowNotice: string | null;
  showContinueEditingAction: boolean;
  disableProgressActions: boolean;
  continueLabelOverride: string | null;
}

const DEFAULT_RESTORED_NOTICE = "Draft restored. Continue from where you left off.";
const DEFAULT_SAVE_NOTICE = "Saving your booking draft...";

export function deriveBookingResumeUxState(input: BookingResumeUxInput): BookingResumeUxState {
  const resumingNotice = input.isResumingDraft ? "Resuming your booking..." : null;
  const recoveryNotice = input.staleAvailabilityRecoveryNotice;
  const restoredNotice = input.showDraftRestoredNotice && !recoveryNotice ? DEFAULT_RESTORED_NOTICE : null;
  const effectiveFlowNotice = input.flowNotice ?? (input.isPersistingDraft ? DEFAULT_SAVE_NOTICE : null);

  return {
    resumingNotice,
    restoredNotice,
    recoveryNotice,
    effectiveFlowNotice,
    showContinueEditingAction: Boolean(restoredNotice || recoveryNotice),
    disableProgressActions: input.isResumingDraft || input.isPersistingDraft,
    continueLabelOverride: input.isPersistingDraft ? "Saving Draft..." : null,
  };
}
