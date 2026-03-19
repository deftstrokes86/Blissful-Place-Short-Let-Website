"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Home,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
} from "@/lib/lucide-react";

import {
  FLATS,
  EXTRAS,
  PAYMENT_OPTIONS,
  RESERVATION_STATUS_LABELS,
  PAYMENT_LABELS,
  TRANSFER_HOLD_MS,
  INITIAL_STAY,
  INITIAL_GUEST,
  INITIAL_STAY_TOUCHED,
  INITIAL_GUEST_TOUCHED,
  INITIAL_WEBSITE_STATE,
  INITIAL_TRANSFER_STATE,
  INITIAL_POS_STATE,
  STEP0,
  STEP1,
  STEP2,
  STEP3,
  STEP4,
  STEP5,
} from "@/lib/constants";

import {
  wait,
  formatCurrency,
  getNightCount,
  getStayValidation,
  getGuestValidation,
  getStepLabels,
  getAvailabilityReasonForStep,
  formatTransferHoldLabel,
} from "@/lib/booking-utils";

import type {
  PaymentMethod,
  ReservationStatus,
  StayFormState,
  GuestFormState,
  StayTouchedState,
  GuestTouchedState,
  WebsiteTransientState,
  TransferTransientState,
  PosTransientState,
  ExtraId,
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

  const stepLabels = useMemo(() => getStepLabels(paymentMethod), [paymentMethod]);
  const selectedFlat = useMemo(() => FLATS.find((flat) => flat.id === stay.flatId) ?? null, [stay.flatId]);
  const selectedExtras = useMemo(
    () => EXTRAS.filter((extra) => stay.extraIds.includes(extra.id)),
    [stay.extraIds]
  );

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

  function clearBranchTransientState() {
    setWebsiteState(INITIAL_WEBSITE_STATE);
    setTransferState(INITIAL_TRANSFER_STATE);
    setPosState(INITIAL_POS_STATE);
    setFlowNotice(null);
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

  function handlePaymentMethodChange(nextMethod: PaymentMethod) {
    setPaymentTouched(true);
    setBranchResetNotice(null);

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
    await wait(600); // Premium feel with a slightly longer, deliberate pause
    setIsCheckingAvailability(false);
    setAvailabilityNote(`Availability check passed ${reason}. Ready to proceed.`);
    return true;
  }

  async function handleContinue() {
    if (stepIndex === STEP0) {
      setStayTouched({ flatId: true, checkIn: true, checkOut: true, guests: true });
      if (!stayReady) return;

      const ok = await runAvailabilityCheckpoint(
        getAvailabilityReasonForStep(stepIndex, paymentMethod)
      );
      if (ok) setStepIndex(STEP1);
      return;
    }

    if (stepIndex === STEP1) {
      setGuestTouched({ firstName: true, lastName: true, email: true, phone: true });
      if (guestReady) setStepIndex(STEP2);
      return;
    }

    if (stepIndex === STEP2) {
      setPaymentTouched(true);
      if (!paymentReady || !paymentMethod) return;

      const ok = await runAvailabilityCheckpoint(
        getAvailabilityReasonForStep(stepIndex, paymentMethod)
      );
      if (!ok) return;

      setBranchResetNotice(null);
      setFlowNotice(null);

      if (paymentMethod === "website") {
        setReservationStatus("pending_online_payment");
      } else if (paymentMethod === "transfer") {
        setReservationStatus("pending_transfer_submission");
        if (!transferState.holdExpiresAt) {
          setTransferState((current) => ({
            ...current,
            holdExpiresAt: Date.now() + TRANSFER_HOLD_MS,
            error: null,
          }));
        }
      } else if (paymentMethod === "pos") {
        setReservationStatus("pending_pos_coordination");
      }

      setStepIndex(STEP3);
      return;
    }

    if (stepIndex === STEP3) {
      if (!paymentMethod) return;

      if (paymentMethod === "website") {
        const ok = await runAvailabilityCheckpoint(
          getAvailabilityReasonForStep(stepIndex, paymentMethod)
        );
        if (!ok) return;
      }

      setStepIndex(STEP4);
    }
  }

  function handleBack() {
    if (stepIndex <= STEP0) return;
    setStepIndex((current) => Math.max(STEP0, current - 1));
  }

  async function handleWebsiteOutcome(outcome: "success" | "failed" | "cancelled") {
    setWebsiteState((current) => ({ ...current, isProcessing: true, message: null }));
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
        message: "We couldn't process your payment. You can try again or switch to a different method.",
      });
      return;
    }

    setReservationStatus("cancelled");
    setWebsiteState({
      outcome: "cancelled",
      isProcessing: false,
      message: "The payment flow was cancelled. Please switch your payment method or contact support.",
    });
  }

  async function handleTryPaymentAgain() {
    const ok = await runAvailabilityCheckpoint("before online payment handoff");
    if (!ok) return;

    setReservationStatus("pending_online_payment");
    setWebsiteState({
      outcome: "idle",
      message: "Payment portal reset. You can now try again.",
      isProcessing: false,
    });
  }

  function handleSwitchPaymentMethodFromBranch() {
    clearBranchTransientState();
    setPaymentMethod(null);
    setPaymentTouched(false);
    setReservationStatus("draft");
    setBranchResetNotice("Payment method reset. Choose a new option to rebuild your booking path.");
    setStepIndex(STEP2);
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
      setFlowNotice("Transfer hold expired. This reservation has been cancelled.");
      setStepIndex(STEP5);
      return;
    }

    setTransferState((current) => ({ ...current, error: null, isSubmitting: true }));
    await wait(800);

    setTransferState((current) => ({ ...current, isSubmitting: false, error: null }));
    setReservationStatus("awaiting_transfer_verification");
    setFlowNotice("Transfer proof received. Our team will verify and confirm your booking shortly.");
    setStepIndex(STEP5);
  }

  async function handleSubmitPosRequest() {
    if (!posState.contactWindow.trim()) {
      setPosState((current) => ({
        ...current,
        error: "Please select your preferred window for coordination.",
      }));
      return;
    }

    setPosState((current) => ({ ...current, isSubmitting: true, error: null }));
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
  }

  const showContinueButton = stepIndex <= STEP3;
  const continueDisabled =
    isCheckingAvailability ||
    (stepIndex === STEP0 && !stayReady) ||
    (stepIndex === STEP1 && !guestReady) ||
    (stepIndex === STEP2 && !paymentReady) ||
    (stepIndex === STEP3 && !paymentMethod);

  const continueLabel =
    stepIndex === STEP0
      ? "Continue to Guest Details"
      : stepIndex === STEP1
        ? "Continue to Payment Method"
        : stepIndex === STEP2
          ? "Proceed to Review"
          : paymentMethod === "website"
            ? "Go to Payment Portal"
            : paymentMethod === "transfer"
              ? "Continue to Transfer Submission"
              : "Proceed to POS Coordination";

  return (
    <main className="booking-page" style={{ paddingBottom: 0 }}>
      {/* Header Section */}
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

      {/* Trust Bar */}
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
        {/* Progress Indicator */}
        <div className="booking-progress" role="list" aria-label="Booking flow progress">
          {stepLabels.map((label, index) => {
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;
            const stateClass = isActive ? "is-active" : isCompleted ? "is-completed" : "is-upcoming";

            return (
              <div
                key={`${label}-${index}`}
                className={`booking-progress-item ${stateClass}`}
                role="listitem"
                aria-current={isActive ? "step" : undefined}
              >
                <span className="booking-progress-index">{isCompleted ? "\u2713" : index + 1}</span>
                <span className="booking-progress-label">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="booking-layout">
          {/* Main Content Column */}
          <div className="booking-details-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Contextual Notices */}
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

            {/* Step 0: Stay Details */}
            {stepIndex === STEP0 && (
              <>
                <div className="booking-section">
                  <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="step-circle">1</span> Select Your Residence
                  </h2>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {FLATS.map((flat) => (
                      <button
                        key={flat.id}
                        type="button"
                        className={`payment-plan-card ${stay.flatId === flat.id ? "selected" : ""}`}
                        style={{ textAlign: "left" }}
                        onClick={() => {
                          handleStayChange("flatId", flat.id);
                          markStayTouched("flatId");
                        }}
                      >
                        <span className="radio-ring">{stay.flatId === flat.id && <span className="radio-dot" />}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{flat.name}</div>
                          <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{flat.blurb}</span>
                            <span style={{ fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap" }}>
                              {formatCurrency(flat.rate)} / night
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {stayTouched.flatId && stayValidation.flatId && <p className="booking-inline-error">{stayValidation.flatId}</p>}
                </div>

                <div className="booking-section">
                  <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="step-circle">1</span> Stay Schedule & Guests
                  </h2>
                  <div className="flex-grid">
                    <div className="input-group">
                      <label htmlFor="check-in">Check-in Date</label>
                      <div className="input-wrapper">
                        <CalendarDays size={18} className="input-icon" />
                        <input
                          id="check-in"
                          type="date"
                          value={stay.checkIn}
                          onChange={(e) => handleStayChange("checkIn", e.target.value)}
                          onBlur={() => markStayTouched("checkIn")}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {stayTouched.checkIn && stayValidation.checkIn && <p className="booking-inline-error">{stayValidation.checkIn}</p>}
                    </div>
                    <div className="input-group">
                      <label htmlFor="check-out">Check-out Date</label>
                      <div className="input-wrapper">
                        <CalendarDays size={18} className="input-icon" />
                        <input
                          id="check-out"
                          type="date"
                          value={stay.checkOut}
                          onChange={(e) => handleStayChange("checkOut", e.target.value)}
                          onBlur={() => markStayTouched("checkOut")}
                          min={stay.checkIn || new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {stayTouched.checkOut && stayValidation.checkOut && <p className="booking-inline-error">{stayValidation.checkOut}</p>}
                    </div>
                    <div className="input-group">
                      <label htmlFor="guests">Number of Guests</label>
                      <div className="input-wrapper">
                        <Users size={18} className="input-icon" />
                        <select
                          id="guests"
                          value={stay.guests || ""}
                          onChange={(e) => {
                            handleStayChange("guests", Number(e.target.value));
                            markStayTouched("guests");
                          }}
                          onBlur={() => markStayTouched("guests")}
                        >
                          <option value="">Select guests</option>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>{num} Guest{num > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                      {stayTouched.guests && stayValidation.guests && <p className="booking-inline-error">{stayValidation.guests}</p>}
                    </div>
                  </div>
                </div>

                <div className="booking-section">
                  <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="step-circle">1</span> Optional Enhancements (Flat Fee)
                  </h2>
                  <div style={{ display: "grid", gap: "0.9rem" }}>
                    {EXTRAS.map((extra) => {
                      const Icon = extra.icon;
                      const selected = stay.extraIds.includes(extra.id);
                      return (
                        <button key={extra.id} type="button" className={`addon-select-card ${selected ? "selected" : ""}`} onClick={() => toggleExtra(extra.id)}>
                          <span className="checkbox-ring">{selected && <span className="checkbox-dot" />}</span>
                          <Icon size={20} className="text-primary" />
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: 700 }}>{extra.title}</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{extra.desc}</div>
                            <div style={{ marginTop: "0.3rem", color: "var(--primary)", fontWeight: 600 }}>{formatCurrency(extra.price)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Guest Details */}
            {stepIndex === STEP1 && (
              <div className="booking-section">
                <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="step-circle">2</span> Guest Information
                </h2>
                <div className="flex-grid">
                  <div className="input-group">
                    <label htmlFor="first-name">First Name</label>
                    <input id="first-name" className="standard-input" value={guest.firstName} onChange={(e) => handleGuestChange("firstName", e.target.value)} onBlur={() => markGuestTouched("firstName")} placeholder="First name" />
                    {guestTouched.firstName && guestValidation.firstName && <p className="booking-inline-error">{guestValidation.firstName}</p>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="last-name">Last Name</label>
                    <input id="last-name" className="standard-input" value={guest.lastName} onChange={(e) => handleGuestChange("lastName", e.target.value)} onBlur={() => markGuestTouched("lastName")} placeholder="Last name" />
                    {guestTouched.lastName && guestValidation.lastName && <p className="booking-inline-error">{guestValidation.lastName}</p>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input id="email" type="email" className="standard-input" value={guest.email} onChange={(e) => handleGuestChange("email", e.target.value)} onBlur={() => markGuestTouched("email")} placeholder="you@example.com" />
                    {guestTouched.email && guestValidation.email && <p className="booking-inline-error">{guestValidation.email}</p>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input id="phone" className="standard-input" value={guest.phone} onChange={(e) => handleGuestChange("phone", e.target.value)} onBlur={() => markGuestTouched("phone")} placeholder="+234..." />
                    {guestTouched.phone && guestValidation.phone && <p className="booking-inline-error">{guestValidation.phone}</p>}
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <label htmlFor="special-requests">Special Requests (Optional)</label>
                  <textarea id="special-requests" className="standard-input" rows={4} value={guest.specialRequests} onChange={(e) => handleGuestChange("specialRequests", e.target.value)} placeholder="Tell us about special occasions or arrival preferences..." style={{ resize: "vertical" }} />
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {stepIndex === STEP2 && (
              <div className="booking-section">
                <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="step-circle">3</span> Choose Payment Method
                </h2>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {PAYMENT_OPTIONS.map((option) => (
                    <button key={option.id} type="button" className={`payment-plan-card ${paymentMethod === option.id ? "selected" : ""}`} onClick={() => handlePaymentMethodChange(option.id)}>
                      <span className="radio-ring">{paymentMethod === option.id && <span className="radio-dot" />}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>{option.title}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{option.desc}</div>
                        <div style={{ marginTop: "0.3rem", color: "var(--primary)", fontSize: "0.85rem" }}>{option.reassurance}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {paymentTouched && !paymentMethod && <p className="booking-inline-error" style={{ marginTop: "0.9rem" }}>Please select a payment method to proceed.</p>}
              </div>
            )}

            {/* Step 3: Branch Review */}
            {stepIndex === STEP3 && paymentMethod && (
              <div className="booking-section">
                <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="step-circle">4</span> {stepLabels[STEP3]}
                </h2>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div className="payment-plan-card" style={{ background: "transparent", cursor: "default" }}>
                    <Home size={18} className="text-primary" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Reservation Snapshot</div>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        {selectedFlat?.name} • {nights} night(s) • {stay.guests} guest(s)
                      </p>
                    </div>
                  </div>
                  <div className="payment-plan-card" style={{ background: "transparent", cursor: "default" }}>
                    <Lock size={18} className="text-primary" />
                    <div>
                      {paymentMethod === "website" && (
                        <>
                          <div style={{ fontWeight: 700 }}>Secure Website Payment</div>
                          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Redirecting to our secure payment gateway for immediate booking confirmation.</p>
                        </>
                      )}
                      {paymentMethod === "transfer" && (
                        <>
                          <div style={{ fontWeight: 700 }}>Bank Transfer Path</div>
                          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Next, you&apos;ll get our banking details. A 1-hour hold will be placed on your dates.</p>
                        </>
                      )}
                      {paymentMethod === "pos" && (
                        <>
                          <div style={{ fontWeight: 700 }}>POS Coordination Path</div>
                          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Submit your request now. Our concierge will contact you to coordinate card payment.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Branch Action */}
            {stepIndex === STEP4 && (
              <div className="booking-section">
                {paymentMethod === "website" && (
                  <>
                    <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="step-circle">5</span> Payment Portal Handoff
                    </h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Simulating the external payment gateway interaction.</p>
                    {websiteState.message && <div className="booking-inline-note" style={{ marginBottom: "1rem" }}>{websiteState.message}</div>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      <button type="button" className="btn btn-primary" onClick={() => handleWebsiteOutcome("success")} disabled={websiteState.isProcessing}>
                        {websiteState.isProcessing ? "Processing..." : "Simulate Payment Success"}
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={() => handleWebsiteOutcome("failed")} disabled={websiteState.isProcessing}>Failed</button>
                      <button type="button" className="btn btn-outline-primary" onClick={() => handleWebsiteOutcome("cancelled")} disabled={websiteState.isProcessing}>Cancel</button>
                    </div>
                    {(reservationStatus === "failed_payment" || reservationStatus === "cancelled") && (
                      <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        {reservationStatus === "failed_payment" && <button type="button" className="btn btn-primary" onClick={handleTryPaymentAgain}>Try Again</button>}
                        <button type="button" className="btn btn-outline-primary" onClick={handleSwitchPaymentMethodFromBranch}>Switch Method</button>
                      </div>
                    )}
                  </>
                )}

                {paymentMethod === "transfer" && (
                  <>
                    <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="step-circle">5</span> Bank Transfer Details
                    </h2>
                    <div className="payment-plan-card" style={{ background: "transparent", cursor: "default", marginBottom: "1.5rem" }}>
                      <Clock size={18} className="text-primary" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Active Transfer Hold</div>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Expires in 60 minutes. Provide proof within this window to secure your stay.</p>
                        <div style={{ marginTop: "0.35rem", color: "var(--primary)", fontWeight: 600 }}>{transferTimeLeft}</div>
                      </div>
                    </div>
                    <div className="flex-grid">
                      <div className="input-group">
                        <label htmlFor="transfer-ref">Transfer Reference ID</label>
                        <input id="transfer-ref" className="standard-input" value={transferState.reference} onChange={(e) => setTransferState(s => ({ ...s, reference: e.target.value, error: null }))} placeholder="e.g. TRX-882291" />
                      </div>
                      <div className="input-group">
                        <label htmlFor="transfer-proof">Proof Note / Filename</label>
                        <input id="transfer-proof" className="standard-input" value={transferState.proofNote} onChange={(e) => setTransferState(s => ({ ...s, proofNote: e.target.value, error: null }))} placeholder="Reference or screenshot note" />
                      </div>
                    </div>
                    {transferState.error && <p className="booking-inline-error">{transferState.error}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
                      <button type="button" className="btn btn-primary" onClick={handleSubmitTransferProof} disabled={transferState.isSubmitting}>
                        {transferState.isSubmitting ? "Submitting..." : "Submit Proof of Transfer"}
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={handleSwitchPaymentMethodFromBranch}>Switch Method</button>
                    </div>
                  </>
                )}

                {paymentMethod === "pos" && (
                  <>
                    <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="step-circle">5</span> POS Coordination Request
                    </h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Coordinate a physical card payment through our localized support team.</p>
                    <div className="flex-grid">
                      <div className="input-group">
                        <label htmlFor="pos-window">Preferred Contact Window</label>
                        <select id="pos-window" className="standard-input" value={posState.contactWindow} onChange={(e) => setPosState(s => ({ ...s, contactWindow: e.target.value, error: null }))}>
                          <option value="">Select a time window</option>
                          <option value="immediate">Within 15 mins (Immediate)</option>
                          <option value="morning">Morning (9am - 12pm)</option>
                          <option value="afternoon">Afternoon (12pm - 5pm)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="pos-note">Coordination Note</label>
                        <input id="pos-note" className="standard-input" value={posState.note} onChange={(e) => setPosState(s => ({ ...s, note: e.target.value, error: null }))} placeholder="Optional numbers or timing notes" />
                      </div>
                    </div>
                    {posState.error && <p className="booking-inline-error">{posState.error}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
                      <button type="button" className="btn btn-primary" onClick={handleSubmitPosRequest} disabled={posState.isSubmitting}>
                        {posState.isSubmitting ? "Submitting..." : "Submit Coordination Request"}
                      </button>
                      <button type="button" className="btn btn-outline-primary" onClick={handleSwitchPaymentMethodFromBranch}>Switch Method</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Branch Outcome */}
            {stepIndex === STEP5 && (
              <div className="booking-section animate-in">
                <h2 className="heading-sm serif" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="step-circle">6</span> {stepLabels[STEP5]}
                </h2>

                {paymentMethod === "website" && (
                  <div className="payment-plan-card selected" style={{ cursor: "default" }}>
                    <CheckCircle2 size={24} className="text-primary" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Confirmed • Your Stay Awaits</div>
                      <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>Digital receipts and check-in instructions have been sent to {guest.email}.</p>
                    </div>
                  </div>
                )}

                {paymentMethod === "transfer" && (
                  <div className={`payment-plan-card ${reservationStatus === "cancelled" ? "" : "selected"}`} style={{ cursor: "default" }}>
                    {reservationStatus === "cancelled" ? <Clock size={24} /> : <Clock size={24} className="text-primary" />}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {reservationStatus === "cancelled" ? "Transfer Window Expired" : "Proof Submitted • Verification Pending"}
                      </div>
                      <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
                        {reservationStatus === "cancelled" 
                          ? "Required transfer completion was not achieved within the hold window." 
                          : "Our team is verifying your transfer. You will receive an official confirmation within 30 minutes."}
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "pos" && (
                  <div className="payment-plan-card selected" style={{ cursor: "default" }}>
                    <MessageSquare size={24} className="text-primary" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Request Received • Concierge Assigning</div>
                      <p style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>A dedicated support member will contact you within your selected window to finalize payment.</p>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <button type="button" className="btn btn-outline-primary" onClick={handleSwitchPaymentMethodFromBranch}>Start New Booking</button>
                  <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">Contact Support</a>
                </div>
              </div>
            )}

            {/* Global Flow Controls */}
            <div className="booking-section" style={{ borderBottom: "none", marginBottom: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {stepIndex > STEP0 && stepIndex < STEP5 && (
                  <button type="button" className="btn btn-outline-primary" onClick={handleBack}>Go Back</button>
                )}
                {showContinueButton && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleContinue}
                    disabled={continueDisabled}
                    style={{ opacity: continueDisabled ? 0.6 : 1 }}
                  >
                    {isCheckingAvailability ? "Verifying Availability..." : continueLabel}
                  </button>
                )}
              </div>

              {/* Sticky Support Strip */}
              <div className="booking-support-strip">
                <div>
                  <div style={{ fontWeight: 700, marginBottom: "0.15rem" }}>Seamless Coordination</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Dedicated concierge support is active for every reservation path.</div>
                </div>
                <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                  <MessageSquare size={16} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Summary Column */}
          <div className="booking-summary-col">
            <div className="summary-card">
              <h3 className="heading-sm serif" style={{ marginBottom: "1.5rem" }}>Reservation Summary</h3>
              
              <div className="summary-row">
                <span>Process Step</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{stepLabels[stepIndex]}</span>
              </div>
              <div className="summary-row">
                <span>Current Status</span>
                <span className={`booking-status-pill booking-status-${reservationStatus}`}>
                  {RESERVATION_STATUS_LABELS[reservationStatus]}
                </span>
              </div>
              <div className="summary-row" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
                <span>Method Selected</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{paymentMethod ? PAYMENT_LABELS[paymentMethod] : "Choose path"}</span>
              </div>

              {/* Stay Breakdown */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Residence</div>
                  <div style={{ fontWeight: 600 }}>{selectedFlat?.name || "Not selected"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Guests</div>
                  <div style={{ fontWeight: 600 }}>{stay.guests || "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Check-in</div>
                  <div style={{ fontWeight: 600 }}>{stay.checkIn || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Check-out</div>
                  <div style={{ fontWeight: 600 }}>{stay.checkOut || "—"}</div>
                </div>
              </div>

              {/* Guest Summary (If available) */}
              {(guestName || guest.email) && (
                <div style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Primary Guest</div>
                  <div style={{ fontWeight: 600 }}>{guestName || "Guest"}</div>
                  {guest.email && <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{guest.email}</div>}
                </div>
              )}

              {/* Financials */}
              <div className="summary-row">
                <span>Nightly Rate</span>
                <span>{selectedFlat ? formatCurrency(selectedFlat.rate) : "—"}</span>
              </div>
              <div className="summary-row">
                <span>Total Nights</span>
                <span>{nights !== null ? nights : "—"}</span>
              </div>
              <div className="summary-row">
                <span>Stay Subtotal</span>
                <span>{staySubtotal !== null ? formatCurrency(staySubtotal) : "—"}</span>
              </div>
              <div className="summary-row" style={{ marginBottom: selectedExtras.length > 0 ? "0.5rem" : "1.25rem" }}>
                <span>Selected Extras</span>
                <span>{formatCurrency(extrasSubtotal)}</span>
              </div>

              {selectedExtras.map(extra => (
                <div key={extra.id} className="summary-row" style={{ fontSize: "0.83rem", paddingLeft: "0.75rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontStyle: "italic" }}>• {extra.title}</span>
                  <span>{formatCurrency(extra.price)}</span>
                </div>
              ))}

              <div className="summary-row grand-total" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem", marginTop: "1rem" }}>
                <span style={{ fontWeight: 500 }}>Total Estimate</span>
                <span>{estimatedTotal !== null ? formatCurrency(estimatedTotal) : "Pending details"}</span>
              </div>

              {/* Branch Policy Reinforcement */}
              <div className="payment-due-box">
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.5rem" }}>Flow Policy</div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.4, opacity: 0.9 }}>
                  {paymentMethod === "website" 
                    ? "Confirmation is issued only after real-time gateway success." 
                    : "End-state wording represents submission, not confirmed reservation truth."}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.4 }}>
                <ShieldCheck size={18} className="text-primary" style={{ flexShrink: 0 }} />
                <span>Encrypted submission filters enable secure data preservation across booking branches.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
