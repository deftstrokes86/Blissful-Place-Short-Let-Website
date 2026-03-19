"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ArrowLeft, CheckCircle2 } from "@/lib/lucide-react";
import {
  EXTRAS,
  FLATS,
  INITIAL_GUEST,
  INITIAL_GUEST_TOUCHED,
  INITIAL_POS_STATE,
  INITIAL_STAY,
  INITIAL_STAY_TOUCHED,
  INITIAL_TRANSFER_STATE,
  INITIAL_WEBSITE_STATE,
  STEP0,
  STEP1,
  STEP2,
  STEP3,
  STEP4,
  STEP5,
  TRANSFER_HOLD_MS,
} from "@/lib/constants";
import {
  formatTransferHoldLabel,
  getAvailabilityReasonForStep,
  getGuestValidation,
  getNightCount,
  getStayValidation,
  getStepLabels,
  wait,
} from "@/lib/booking-utils";

import { BookingFlowControls } from "@/components/booking/BookingFlowControls";
import { getPendingStatusForMethod } from "@/lib/booking-branch-config";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { BranchActionStep } from "@/components/booking/steps/BranchActionStep";
import { BranchOutcomeStep } from "@/components/booking/steps/BranchOutcomeStep";
import { BranchReviewStep } from "@/components/booking/steps/BranchReviewStep";
import { GuestDetailsStep } from "@/components/booking/steps/GuestDetailsStep";
import { PaymentMethodStep } from "@/components/booking/steps/PaymentMethodStep";
import { StayDetailsStep } from "@/components/booking/steps/StayDetailsStep";

import type {
  ExtraId,
  GuestFormState,
  GuestTouchedState,
  PaymentMethod,
  PosTransientState,
  ReservationStatus,
  StayFormState,
  StayTouchedState,
  TransferTransientState,
  WebsiteTransientState,
} from "@/types/booking";

export default function BookingPage() {
  const [stay, setStay] = useState<StayFormState>(INITIAL_STAY);
  const [guest, setGuest] = useState<GuestFormState>(INITIAL_GUEST);
  const [stayTouched, setStayTouched] = useState<StayTouchedState>(INITIAL_STAY_TOUCHED);
  const [guestTouched, setGuestTouched] = useState<GuestTouchedState>(INITIAL_GUEST_TOUCHED);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(STEP0);
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>("draft");

  const [websiteState, setWebsiteState] = useState<WebsiteTransientState>(INITIAL_WEBSITE_STATE);
  const [transferState, setTransferState] = useState<TransferTransientState>(INITIAL_TRANSFER_STATE);
  const [posState, setPosState] = useState<PosTransientState>(INITIAL_POS_STATE);

  const [availabilityNote, setAvailabilityNote] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [branchResetNotice, setBranchResetNotice] = useState<string | null>(null);

  const branchActionLockRef = useRef(false);
  const [isBranchActionLocked, setIsBranchActionLocked] = useState(false);
  const checkInInputRef = useRef<HTMLInputElement | null>(null);
  const checkOutInputRef = useRef<HTMLInputElement | null>(null);

  const stepLabels = useMemo(() => getStepLabels(paymentMethod), [paymentMethod]);
  const selectedFlat = useMemo(() => FLATS.find((flat) => flat.id === stay.flatId) ?? null, [stay.flatId]);
  const selectedExtras = useMemo(() => EXTRAS.filter((extra) => stay.extraIds.includes(extra.id)), [stay.extraIds]);

  const nights = getNightCount(stay.checkIn, stay.checkOut);
  const extrasSubtotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const staySubtotal = selectedFlat && nights !== null ? selectedFlat.rate * nights : null;
  const estimatedTotal = staySubtotal !== null ? staySubtotal + extrasSubtotal : null;
  const stayValidation = getStayValidation(stay);
  const guestValidation = getGuestValidation(guest);

  const stayReady =
    !stayValidation.flatId && !stayValidation.checkIn && !stayValidation.checkOut && !stayValidation.guests;
  const guestReady =
    !guestValidation.firstName &&
    !guestValidation.lastName &&
    !guestValidation.email &&
    !guestValidation.phone;
  const paymentReady = paymentMethod !== null;

  const guestName = `${guest.firstName} ${guest.lastName}`.trim();
  const transferTimeLeft = formatTransferHoldLabel(transferState.holdExpiresAt);
  const reviewResidenceLabel = selectedFlat?.name ?? "Residence pending";
  const reviewNightsLabel = nights !== null ? `${nights} night${nights === 1 ? "" : "s"}` : "Nights pending";
  const reviewGuestsLabel = stay.guests > 0 ? `${stay.guests} guest${stay.guests === 1 ? "" : "s"}` : "Guests pending";

  function clearBranchTransientState() {
    setWebsiteState(INITIAL_WEBSITE_STATE);
    setTransferState(INITIAL_TRANSFER_STATE);
    setPosState(INITIAL_POS_STATE);
    setFlowNotice(null);
    setAvailabilityNote(null);
  }

  function toggleExtra(id: ExtraId) {
    setStay((current) => ({
      ...current,
      extraIds: current.extraIds.includes(id)
        ? current.extraIds.filter((extraId) => extraId !== id)
        : [...current.extraIds, id],
    }));
  }

  function handleStayChange<K extends keyof StayFormState>(field: K, value: StayFormState[K]) {
    setStay((current) => ({ ...current, [field]: value }));
  }

  function handleGuestChange<K extends keyof GuestFormState>(field: K, value: GuestFormState[K]) {
    setGuest((current) => ({ ...current, [field]: value }));
  }

  function markStayTouched(field: keyof StayTouchedState) {
    setStayTouched((current) => ({ ...current, [field]: true }));
  }

  function markGuestTouched(field: keyof GuestTouchedState) {
    setGuestTouched((current) => ({ ...current, [field]: true }));
  }

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) return;

    input.focus();
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
    }
  }

  function beginBranchActionLock(): boolean {
    if (branchActionLockRef.current) {
      return false;
    }

    branchActionLockRef.current = true;
    setIsBranchActionLocked(true);
    return true;
  }

  function endBranchActionLock() {
    branchActionLockRef.current = false;
    setIsBranchActionLocked(false);
  }

  function handlePaymentMethodChange(nextMethod: PaymentMethod) {
    if (paymentMethod === nextMethod) {
      return;
    }

    setPaymentTouched(true);
    setBranchResetNotice(null);
    setAvailabilityNote(null);

    if (paymentMethod && paymentMethod !== nextMethod) {
      clearBranchTransientState();
      setReservationStatus("draft");
      setBranchResetNotice(
        "Payment method changed. Path-specific details and messages were reset to preserve shared stay data."
      );
      if (stepIndex > STEP2) {
        setStepIndex(STEP2);
      }
    }

    setPaymentMethod(nextMethod);
  }

  async function runAvailabilityCheckpoint(reason: string): Promise<boolean> {
    if (!stayReady) {
      setAvailabilityNote("Complete valid stay details before running availability checks.");
      return false;
    }

    setIsCheckingAvailability(true);
    await wait(600);
    setIsCheckingAvailability(false);
    setAvailabilityNote(`Availability check passed ${reason}. Ready to proceed.`);
    return true;
  }

  async function handleContinue() {
    if (isBranchActionLocked) {
      return;
    }

    if (stepIndex === STEP0) {
      setStayTouched({ flatId: true, checkIn: true, checkOut: true, guests: true });
      if (!stayReady) return;

      const ok = await runAvailabilityCheckpoint(getAvailabilityReasonForStep(stepIndex, paymentMethod));
      if (ok) setStepIndex(STEP1);
      return;
    }

    if (stepIndex === STEP1) {
      setGuestTouched({ firstName: true, lastName: true, email: true, phone: true });
      if (guestReady) {
        setAvailabilityNote(null);
        setStepIndex(STEP2);
      }
      return;
    }

    if (stepIndex === STEP2) {
      setPaymentTouched(true);
      if (!paymentReady || !paymentMethod) return;

      const ok = await runAvailabilityCheckpoint(getAvailabilityReasonForStep(stepIndex, paymentMethod));
      if (!ok) return;

      setBranchResetNotice(null);
      setFlowNotice(null);

      setReservationStatus(getPendingStatusForMethod(paymentMethod));

      if (paymentMethod === "transfer" && !transferState.holdExpiresAt) {
        setTransferState((current) => ({
          ...current,
          holdExpiresAt: Date.now() + TRANSFER_HOLD_MS,
          error: null,
        }));
      }

      setStepIndex(STEP3);
      return;
    }

    if (stepIndex === STEP3) {
      if (!paymentMethod) return;

      if (paymentMethod === "website") {
        const ok = await runAvailabilityCheckpoint(getAvailabilityReasonForStep(stepIndex, paymentMethod));
        if (!ok) return;
      } else {
        setAvailabilityNote(null);
      }

      setStepIndex(STEP4);
    }
  }

  function handleBack() {
    if (stepIndex <= STEP0 || isCheckingAvailability || isBranchActionLocked) {
      return;
    }

    const previousStep = stepIndex;
    const nextStep = Math.max(STEP0, stepIndex - 1);

    setStepIndex(nextStep);
    setBranchResetNotice(null);
    setFlowNotice(null);

    if (nextStep <= STEP2) {
      setReservationStatus("draft");
      if (previousStep >= STEP3) {
        clearBranchTransientState();
      }
      return;
    }

    if (nextStep === STEP3 && paymentMethod) {
      setReservationStatus(getPendingStatusForMethod(paymentMethod));
      setAvailabilityNote(null);
    }
  }

  async function handleWebsiteOutcome(outcome: "success" | "failed" | "cancelled") {
    if (!beginBranchActionLock()) {
      return;
    }

    setWebsiteState((current) => ({ ...current, isProcessing: true, message: null }));

    try {
      await wait(800);

      if (outcome === "success") {
        setReservationStatus("confirmed");
        setWebsiteState({ outcome: "success", isProcessing: false, message: "Payment completed successfully." });
        setFlowNotice("Website payment succeeded. Your booking is now fully confirmed.");
        setStepIndex(STEP5);
        return;
      }

      if (outcome === "failed") {
        setReservationStatus("failed_payment");
        setWebsiteState({
          outcome: "failed",
          isProcessing: false,
          message: "We could not process your payment. You can try again or switch to a different method.",
        });
        setFlowNotice("Online payment did not complete. You can retry or switch your payment method.");
        return;
      }

      setReservationStatus("cancelled");
      setWebsiteState({
        outcome: "cancelled",
        isProcessing: false,
        message: "The payment flow was cancelled. Please switch your payment method or contact support.",
      });
      setFlowNotice("Payment was cancelled before completion. Your reservation remains unconfirmed.");
    } finally {
      endBranchActionLock();
      setWebsiteState((current) => (current.isProcessing ? { ...current, isProcessing: false } : current));
    }
  }

  async function handleTryPaymentAgain() {
    if (!beginBranchActionLock()) {
      return;
    }

    try {
      const ok = await runAvailabilityCheckpoint("before online payment handoff");
      if (!ok) return;

      setReservationStatus("pending_online_payment");
      setWebsiteState({
        outcome: "idle",
        message: "Payment portal reset. You can now try again.",
        isProcessing: false,
      });
      setFlowNotice("Gateway session reset. Continue when you are ready.");
    } finally {
      endBranchActionLock();
    }
  }

  function handleSwitchPaymentMethodFromBranch() {
    if (isBranchActionLocked || isCheckingAvailability) {
      return;
    }

    clearBranchTransientState();
    setPaymentMethod(null);
    setPaymentTouched(false);
    setReservationStatus("draft");
    setBranchResetNotice("Payment method reset. Choose a new option to rebuild your booking path.");
    setStepIndex(STEP2);
  }

  function handleTransferReferenceChange(value: string) {
    setTransferState((current) => ({ ...current, reference: value, error: null }));
  }

  function handleTransferProofNoteChange(value: string) {
    setTransferState((current) => ({ ...current, proofNote: value, error: null }));
  }

  async function handleSubmitTransferProof() {
    if (!transferState.reference.trim() || !transferState.proofNote.trim()) {
      setTransferState((current) => ({
        ...current,
        error: "Please provide both the transfer reference and proof details.",
      }));
      return;
    }

    if (transferState.holdExpiresAt && Date.now() > transferState.holdExpiresAt) {
      setReservationStatus("cancelled");
      setTransferState((current) => ({
        ...current,
        error: "The 1-hour transfer hold period has expired.",
      }));
      setFlowNotice("Transfer hold expired before proof submission. This reservation request has been cancelled.");
      setStepIndex(STEP5);
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setTransferState((current) => ({ ...current, error: null, isSubmitting: true }));

    try {
      await wait(800);
      setTransferState((current) => ({ ...current, isSubmitting: false, error: null }));
      setReservationStatus("awaiting_transfer_verification");
      setFlowNotice("Transfer proof received. Our team will verify and confirm your booking shortly.");
      setStepIndex(STEP5);
    } finally {
      endBranchActionLock();
      setTransferState((current) => (current.isSubmitting ? { ...current, isSubmitting: false } : current));
    }
  }

  function handlePosContactWindowChange(value: string) {
    setPosState((current) => ({ ...current, contactWindow: value, error: null }));
  }

  function handlePosNoteChange(value: string) {
    setPosState((current) => ({ ...current, note: value, error: null }));
  }

  async function handleSubmitPosRequest() {
    if (!posState.contactWindow.trim()) {
      setPosState((current) => ({
        ...current,
        error: "Please select your preferred window for coordination.",
      }));
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setPosState((current) => ({ ...current, isSubmitting: true, error: null }));

    try {
      await wait(800);

      setPosState((current) => ({
        ...current,
        isSubmitting: false,
        error: null,
        requestSubmitted: true,
      }));

      setReservationStatus("pending_pos_coordination");
      setFlowNotice("Coordination request submitted. A concierge representative will reach out to arrange your POS payment.");
      setStepIndex(STEP5);
    } finally {
      endBranchActionLock();
      setPosState((current) => (current.isSubmitting ? { ...current, isSubmitting: false } : current));
    }
  }

  const showContinueButton = stepIndex <= STEP3;
  const continueDisabled =
    isCheckingAvailability ||
    isBranchActionLocked ||
    (stepIndex === STEP0 && !stayReady) ||
    (stepIndex === STEP1 && !guestReady) ||
    (stepIndex === STEP2 && !paymentReady) ||
    (stepIndex === STEP3 && !paymentMethod);

  const outcomeStepLabel =
    paymentMethod === "transfer" && reservationStatus === "cancelled" ? "Reservation Cancelled" : stepLabels[STEP5];

  const continueLabel =
    stepIndex === STEP0
      ? "Continue to Guest Details"
      : stepIndex === STEP1
        ? "Continue to Payment Method"
        : stepIndex === STEP2
          ? paymentMethod === "website"
            ? "Review & Checkout"
            : "Proceed to Review"
          : paymentMethod === "website"
            ? "Go to Payment Portal"
            : paymentMethod === "transfer"
              ? "Continue to Transfer Submission"
              : "Proceed to POS Coordination";

  return (
    <main className="booking-page" style={{ paddingBottom: 0 }}>
      <section className="container" style={{ paddingTop: "8rem", paddingBottom: "2rem", maxWidth: "1200px" }}>
        <Link
          href="/"
          className="hover-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Homepage
        </Link>
        <h1 className="heading-lg serif">Complete Your Booking</h1>
        <p className="text-secondary" style={{ fontSize: "1.05rem" }}>
          Experience a seamless, secure, and personalized reservation process.
        </p>
      </section>

      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-panel)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
            padding: "0.9rem 0",
            maxWidth: "1200px",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> Verified Real-Time Availability
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> Secure Branched Payment Logic
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={15} className="text-primary" /> 24/7 Dedicated Concierge Support
          </span>
        </div>
      </div>

      <section className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "1200px" }}>
        <BookingProgress stepLabels={stepLabels} stepIndex={stepIndex} />

        <div className="booking-layout">
          <div className="booking-details-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {flowNotice && (
              <div className="booking-inline-note animate-in" role="status" aria-live="polite">
                {flowNotice}
              </div>
            )}

            {branchResetNotice && (
              <div className="booking-inline-note booking-inline-note-muted animate-in" role="status" aria-live="polite">
                {branchResetNotice}
              </div>
            )}

            {availabilityNote && (
              <div className="booking-inline-note booking-inline-note-ok animate-in" role="status" aria-live="polite">
                {availabilityNote}
              </div>
            )}

            {stepIndex === STEP0 && (
              <StayDetailsStep
                stay={stay}
                stayTouched={stayTouched}
                stayValidation={stayValidation}
                onSelectFlat={(flatId) => {
                  handleStayChange("flatId", flatId);
                  markStayTouched("flatId");
                }}
                onCheckInChange={(value) => handleStayChange("checkIn", value)}
                onCheckOutChange={(value) => handleStayChange("checkOut", value)}
                onGuestsChange={(value) => {
                  handleStayChange("guests", value);
                  markStayTouched("guests");
                }}
                onMarkTouched={markStayTouched}
                onToggleExtra={toggleExtra}
                onOpenCheckInPicker={() => openDatePicker(checkInInputRef.current)}
                onOpenCheckOutPicker={() => openDatePicker(checkOutInputRef.current)}
                checkInInputRef={checkInInputRef}
                checkOutInputRef={checkOutInputRef}
              />
            )}

            {stepIndex === STEP1 && (
              <GuestDetailsStep
                guest={guest}
                guestTouched={guestTouched}
                guestValidation={guestValidation}
                onFieldChange={handleGuestChange}
                onMarkTouched={markGuestTouched}
              />
            )}

            {stepIndex === STEP2 && (
              <PaymentMethodStep
                paymentMethod={paymentMethod}
                paymentTouched={paymentTouched}
                onPaymentMethodChange={handlePaymentMethodChange}
              />
            )}

            {stepIndex === STEP3 && paymentMethod && (
              <BranchReviewStep
                paymentMethod={paymentMethod}
                stepLabel={stepLabels[STEP3]}
                reviewResidenceLabel={reviewResidenceLabel}
                reviewNightsLabel={reviewNightsLabel}
                reviewGuestsLabel={reviewGuestsLabel}
              />
            )}

            {stepIndex === STEP4 && (
              <BranchActionStep
                stepLabel={stepLabels[STEP4]}
                paymentMethod={paymentMethod}
                websiteState={websiteState}
                transferState={transferState}
                posState={posState}
                reservationStatus={reservationStatus}
                transferTimeLeft={transferTimeLeft}
                isBranchActionLocked={isBranchActionLocked}
                isCheckingAvailability={isCheckingAvailability}
                onWebsiteOutcome={handleWebsiteOutcome}
                onTryPaymentAgain={handleTryPaymentAgain}
                onSwitchMethod={handleSwitchPaymentMethodFromBranch}
                onTransferReferenceChange={handleTransferReferenceChange}
                onTransferProofNoteChange={handleTransferProofNoteChange}
                onSubmitTransferProof={handleSubmitTransferProof}
                onPosContactWindowChange={handlePosContactWindowChange}
                onPosNoteChange={handlePosNoteChange}
                onSubmitPosRequest={handleSubmitPosRequest}
              />
            )}

            {stepIndex === STEP5 && (
              <BranchOutcomeStep
                paymentMethod={paymentMethod}
                reservationStatus={reservationStatus}
                finalStepLabel={outcomeStepLabel}
                guestEmail={guest.email}
                onSwitchPaymentMethod={handleSwitchPaymentMethodFromBranch}
              />
            )}

            <BookingFlowControls
              stepIndex={stepIndex}
              showContinueButton={showContinueButton}
              continueDisabled={continueDisabled}
              continueLabel={continueLabel}
              isCheckingAvailability={isCheckingAvailability}
              isBranchActionLocked={isBranchActionLocked}
              onBack={handleBack}
              onContinue={handleContinue}
            />
          </div>

          <div className="booking-summary-col">
            <BookingSummaryCard
              stepLabel={stepLabels[stepIndex]}
              reservationStatus={reservationStatus}
              paymentMethod={paymentMethod}
              selectedFlat={selectedFlat}
              stayGuests={stay.guests}
              checkIn={stay.checkIn}
              checkOut={stay.checkOut}
              guestName={guestName}
              guestEmail={guest.email}
              nights={nights}
              staySubtotal={staySubtotal}
              extrasSubtotal={extrasSubtotal}
              selectedExtras={selectedExtras}
              estimatedTotal={estimatedTotal}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

