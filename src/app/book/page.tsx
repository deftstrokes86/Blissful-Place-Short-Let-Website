"use client";

import { useMemo, useRef, useState } from "react";

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
  getAvailabilityReasonForStep,
  getBranchStepLabels,
  getContinueLabel,
  getOutcomeStepLabel,
  getPendingStatusForMethod,
  isContinueDisabled,
  shouldShowContinueButton,
} from "@/lib/booking-branch-config";
import { calculateBookingPricing, createBookingReviewLabels } from "@/lib/booking-pricing";
import { getNextReservationState, isWithinTransferHold, resolveTransition } from "@/lib/booking-state-machine";
import { createIdempotencyKey, createWebsiteDraft, initiateWebsiteCheckout } from "@/lib/booking-frontend-api";
import { formatTransferHoldLabel, wait } from "@/lib/booking-utils";
import {
  getGuestValidationState,
  getStayValidationState,
  isGuestValidationReady,
  isStayValidationReady,
  validateBranchProgression,
} from "@/lib/booking-validation";

import { BookingFlowControls } from "@/components/booking/BookingFlowControls";
import { BookingInlineNotices } from "@/components/booking/BookingInlineNotices";
import { BookingPageIntro } from "@/components/booking/BookingPageIntro";
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
  const [draftToken, setDraftToken] = useState<string | null>(null);

  // Prevent duplicate prototype submissions when branch actions are triggered quickly.
  const branchActionLockRef = useRef(false);
  const [isBranchActionLocked, setIsBranchActionLocked] = useState(false);
  const checkInInputRef = useRef<HTMLInputElement | null>(null);
  const checkOutInputRef = useRef<HTMLInputElement | null>(null);

  const stepLabels = useMemo(() => getBranchStepLabels(paymentMethod), [paymentMethod]);
  const selectedFlat = useMemo(() => FLATS.find((flat) => flat.id === stay.flatId) ?? null, [stay.flatId]);
  const selectedExtras = useMemo(() => EXTRAS.filter((extra) => stay.extraIds.includes(extra.id)), [stay.extraIds]);

  const { nights, extrasSubtotal, staySubtotal, estimatedTotal } = useMemo(
    () =>
      calculateBookingPricing({
        selectedFlatRate: selectedFlat?.rate ?? null,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        selectedExtraIds: stay.extraIds,
        extrasCatalog: EXTRAS,
      }),
    [selectedFlat?.rate, stay.checkIn, stay.checkOut, stay.extraIds],
  );

  const stayValidation = useMemo(() => getStayValidationState(stay), [stay]);
  const guestValidation = useMemo(() => getGuestValidationState(guest), [guest]);

  const stayReady = isStayValidationReady(stayValidation);
  const guestReady = isGuestValidationReady(guestValidation);

  const guestName = `${guest.firstName} ${guest.lastName}`.trim();
  const transferTimeLeft = formatTransferHoldLabel(transferState.holdExpiresAt);
  const reviewLabels = useMemo(
    () =>
      createBookingReviewLabels({
        residenceName: selectedFlat?.name ?? null,
        nights,
        guests: stay.guests,
      }),
    [selectedFlat?.name, nights, stay.guests],
  );

  function clearBranchTransientState() {
    setWebsiteState(INITIAL_WEBSITE_STATE);
    setTransferState(INITIAL_TRANSFER_STATE);
    setPosState(INITIAL_POS_STATE);
    setFlowNotice(null);
    setAvailabilityNote(null);
    setDraftToken(null);
  }

  function toggleExtra(id: ExtraId) {
    setDraftToken(null);
    setStay((current) => ({
      ...current,
      extraIds: current.extraIds.includes(id)
        ? current.extraIds.filter((extraId) => extraId !== id)
        : [...current.extraIds, id],
    }));
  }

  function handleStayChange<K extends keyof StayFormState>(field: K, value: StayFormState[K]) {
    setDraftToken(null);
    setStay((current) => ({ ...current, [field]: value }));
  }

  function handleGuestChange<K extends keyof GuestFormState>(field: K, value: GuestFormState[K]) {
    setDraftToken(null);
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
    setDraftToken(null);

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

  // Drives the shared pre-branch flow and hands off into the selected payment branch.
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
      if (!paymentMethod) return;

      const ok = await runAvailabilityCheckpoint(getAvailabilityReasonForStep(stepIndex, paymentMethod));
      if (!ok) return;

      setBranchResetNotice(null);
      setFlowNotice(null);

      const pendingStatus = resolveTransition({
        from: reservationStatus,
        event: "branch_request_created",
        paymentMethod,
        availabilityPassed: true,
      });

      if (!pendingStatus) {
        return;
      }

      setReservationStatus(pendingStatus);

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
        setWebsiteState(INITIAL_WEBSITE_STATE);
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

  function getRequestErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return "Unable to start checkout right now. Please try again.";
  }

  function buildWebsiteDraftPayload() {
    if (!stay.flatId || !stay.checkIn || !stay.checkOut || stay.guests < 1) {
      throw new Error("Complete valid stay details before starting checkout.");
    }

    if (!guest.firstName || !guest.lastName || !guest.email || !guest.phone) {
      throw new Error("Complete guest details before starting checkout.");
    }

    return {
      stay: {
        flatId: stay.flatId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: stay.guests,
        extraIds: [...stay.extraIds],
      },
      guest: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        specialRequests: guest.specialRequests,
      },
      paymentMethod: "website" as const,
    };
  }

  async function ensureWebsiteDraftToken(): Promise<string> {
    if (draftToken) {
      return draftToken;
    }

    const draft = await createWebsiteDraft(buildWebsiteDraftPayload());
    setDraftToken(draft.resumeToken);
    return draft.resumeToken;
  }

  async function handleInitiateWebsiteCheckout() {
    if (paymentMethod !== "website") {
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setWebsiteState((current) => ({ ...current, isProcessing: true, message: null }));
    setFlowNotice("Preparing secure checkout...");

    try {
      const token = await ensureWebsiteDraftToken();
      const checkout = await initiateWebsiteCheckout({
        token,
        idempotencyKey: createIdempotencyKey("website-checkout"),
      });

      setDraftToken(checkout.reservation.token);
      setReservationStatus(checkout.reservation.status);
      setFlowNotice("Redirecting to secure checkout...");
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      const message = getRequestErrorMessage(error);
      setWebsiteState({
        outcome: "failed",
        isProcessing: false,
        message,
      });
      setFlowNotice("We could not start secure checkout. Your details were kept, so you can retry.");
    } finally {
      endBranchActionLock();
      setWebsiteState((current) => (current.isProcessing ? { ...current, isProcessing: false } : current));
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
    const withinHold = isWithinTransferHold(transferState.holdExpiresAt);
    const progression = validateBranchProgression({
      intent: "submit_transfer_proof",
      paymentMethod,
      currentStatus: reservationStatus,
      availabilityPassed: true,
      transferReference: transferState.reference,
      transferProofNote: transferState.proofNote,
      withinTransferHold: withinHold,
    });

    if (!progression.isValid) {
      const holdExpired = progression.errors.some((error) => error.field === "transferHold");

      if (holdExpired) {
        setReservationStatus("cancelled");
        setTransferState((current) => ({
          ...current,
          error: "The 1-hour transfer hold period has expired.",
        }));
        setFlowNotice("Transfer hold expired before proof submission. This reservation request has been cancelled.");
        setStepIndex(STEP5);
        return;
      }

      const firstError = progression.errors[0];
      setTransferState((current) => ({
        ...current,
        error: firstError?.message ?? "Please review the transfer details and try again.",
      }));
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setTransferState((current) => ({ ...current, error: null, isSubmitting: true }));

    try {
      await wait(800);

      const nextStatus = getNextReservationState({
        from: reservationStatus,
        event: "transfer_proof_submitted",
        withinTransferHold: true,
      }).to;

      if (!nextStatus) {
        setTransferState((current) => ({
          ...current,
          isSubmitting: false,
          error: "Transfer submission could not be processed from this status.",
        }));
        return;
      }

      setTransferState((current) => ({ ...current, isSubmitting: false, error: null }));
      setReservationStatus(nextStatus);
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
    const progression = validateBranchProgression({
      intent: "submit_pos_request",
      paymentMethod,
      currentStatus: reservationStatus,
      availabilityPassed: true,
      posContactWindow: posState.contactWindow,
    });

    if (!progression.isValid) {
      const firstError = progression.errors[0];
      setPosState((current) => ({
        ...current,
        error: firstError?.message ?? "Please select your preferred window for coordination.",
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

  const showContinueButton = shouldShowContinueButton(stepIndex);
  const continueDisabled = isContinueDisabled({
    stepIndex,
    isCheckingAvailability,
    isBranchActionLocked,
    stayReady,
    guestReady,
    paymentMethod,
  });

  const outcomeStepLabel = getOutcomeStepLabel(paymentMethod, reservationStatus, stepLabels);
  const continueLabel = getContinueLabel(stepIndex, paymentMethod);

  return (
    <main className="booking-page" style={{ paddingBottom: 0 }}>
      <BookingPageIntro />

      <section className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "1200px" }}>
        <BookingProgress stepLabels={stepLabels} stepIndex={stepIndex} />

        <div className="booking-layout">
          <div className="booking-details-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <BookingInlineNotices flowNotice={flowNotice} branchResetNotice={branchResetNotice} availabilityNote={availabilityNote} />

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
                reviewResidenceLabel={reviewLabels.residence}
                reviewNightsLabel={reviewLabels.nights}
                reviewGuestsLabel={reviewLabels.guests}
              />
            )}

            {stepIndex === STEP4 && (
              <BranchActionStep
                stepLabel={stepLabels[STEP4]}
                paymentMethod={paymentMethod}
                websiteState={websiteState}
                transferState={transferState}
                posState={posState}
                transferTimeLeft={transferTimeLeft}
                isBranchActionLocked={isBranchActionLocked}
                isCheckingAvailability={isCheckingAvailability}
                onInitiateWebsiteCheckout={handleInitiateWebsiteCheckout}
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


