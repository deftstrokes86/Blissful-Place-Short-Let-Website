import assert from "node:assert/strict";

import {
  deriveResumeStepIndex,
  resolveResumePaymentMethod,
} from "../../../lib/booking-draft-resume";
import type { PaymentMethod, ReservationStatus } from "../../../types/booking";

interface ResumeInput {
  status: ReservationStatus;
  paymentMethod: PaymentMethod | null;
  stayReady: boolean;
  guestReady: boolean;
}

function createInput(overrides?: Partial<ResumeInput>): ResumeInput {
  return {
    status: "draft",
    paymentMethod: null,
    stayReady: false,
    guestReady: false,
    ...overrides,
  };
}

async function testResolvePaymentMethodFromDraft(): Promise<void> {
  assert.equal(resolveResumePaymentMethod("draft", "website"), "website");
  assert.equal(resolveResumePaymentMethod("draft", null), null);
}

async function testResolvePaymentMethodFromPendingStatuses(): Promise<void> {
  assert.equal(resolveResumePaymentMethod("pending_online_payment", null), "website");
  assert.equal(resolveResumePaymentMethod("pending_transfer_submission", null), "transfer");
  assert.equal(resolveResumePaymentMethod("awaiting_transfer_verification", null), "transfer");
  assert.equal(resolveResumePaymentMethod("pending_pos_coordination", null), "pos");
}

async function testResolvePaymentMethodKeepsPersistedValueWhenKnown(): Promise<void> {
  assert.equal(resolveResumePaymentMethod("pending_transfer_submission", "transfer"), "transfer");
  assert.equal(resolveResumePaymentMethod("pending_pos_coordination", "pos"), "pos");
}

async function testResumeStepForDraftProgression(): Promise<void> {
  assert.equal(deriveResumeStepIndex(createInput()), 0);
  assert.equal(deriveResumeStepIndex(createInput({ stayReady: true })), 1);
  assert.equal(deriveResumeStepIndex(createInput({ stayReady: true, guestReady: true })), 2);
  assert.equal(
    deriveResumeStepIndex(
      createInput({
        stayReady: true,
        guestReady: true,
        paymentMethod: "website",
      })
    ),
    2
  );
}

async function testResumeStepForPendingAndFinalStates(): Promise<void> {
  assert.equal(
    deriveResumeStepIndex(
      createInput({
        status: "pending_online_payment",
        paymentMethod: "website",
        stayReady: true,
        guestReady: true,
      })
    ),
    4
  );
  assert.equal(
    deriveResumeStepIndex(
      createInput({
        status: "pending_transfer_submission",
        paymentMethod: "transfer",
        stayReady: true,
        guestReady: true,
      })
    ),
    4
  );
  assert.equal(
    deriveResumeStepIndex(
      createInput({
        status: "awaiting_transfer_verification",
        paymentMethod: "transfer",
        stayReady: true,
        guestReady: true,
      })
    ),
    5
  );
  assert.equal(
    deriveResumeStepIndex(
      createInput({
        status: "confirmed",
        paymentMethod: "website",
        stayReady: true,
        guestReady: true,
      })
    ),
    5
  );
}

async function run(): Promise<void> {
  await testResolvePaymentMethodFromDraft();
  await testResolvePaymentMethodFromPendingStatuses();
  await testResolvePaymentMethodKeepsPersistedValueWhenKnown();
  await testResumeStepForDraftProgression();
  await testResumeStepForPendingAndFinalStates();

  console.log("booking-draft-resume: ok");
}

void run();

