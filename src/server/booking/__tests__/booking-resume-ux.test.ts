import assert from "node:assert/strict";

import { deriveBookingResumeUxState } from "../../../lib/booking-resume-ux";

async function testRestoredDraftStateRendering(): Promise<void> {
  const state = deriveBookingResumeUxState({
    isResumingDraft: false,
    showDraftRestoredNotice: true,
    staleAvailabilityRecoveryNotice: null,
    flowNotice: null,
    isPersistingDraft: false,
  });

  assert.equal(state.restoredNotice, "Draft restored. Continue from where you left off.");
  assert.equal(state.showContinueEditingAction, true);
  assert.equal(state.resumingNotice, null);
}

async function testInvalidDateRecoveryMessaging(): Promise<void> {
  const state = deriveBookingResumeUxState({
    isResumingDraft: false,
    showDraftRestoredNotice: false,
    staleAvailabilityRecoveryNotice:
      "Saved dates are no longer available. Update your stay details or choose another residence to continue.",
    flowNotice: null,
    isPersistingDraft: false,
  });

  assert.match(state.recoveryNotice ?? "", /no longer available/i);
  assert.equal(state.showContinueEditingAction, true);
}

async function testRecoveryNoticeSuppressesRestoredBanner(): Promise<void> {
  const state = deriveBookingResumeUxState({
    isResumingDraft: false,
    showDraftRestoredNotice: true,
    staleAvailabilityRecoveryNotice:
      "Saved dates are no longer available. Update your stay details or choose another residence to continue.",
    flowNotice: null,
    isPersistingDraft: false,
  });

  assert.equal(state.restoredNotice, null);
  assert.match(state.recoveryNotice ?? "", /no longer available/i);
}

async function testLoadingAndDisabledSaveBehavior(): Promise<void> {
  const state = deriveBookingResumeUxState({
    isResumingDraft: false,
    showDraftRestoredNotice: false,
    staleAvailabilityRecoveryNotice: null,
    flowNotice: null,
    isPersistingDraft: true,
  });

  assert.equal(state.effectiveFlowNotice, "Saving your booking draft...");
  assert.equal(state.disableProgressActions, true);
  assert.equal(state.continueLabelOverride, "Saving Draft...");
}

async function run(): Promise<void> {
  await testRestoredDraftStateRendering();
  await testInvalidDateRecoveryMessaging();
  await testRecoveryNoticeSuppressesRestoredBanner();
  await testLoadingAndDisabledSaveBehavior();

  console.log("booking-resume-ux: ok");
}

void run();
