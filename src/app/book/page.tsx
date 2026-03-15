"use client";

import Link from "next/link";
import type { LucideIcon } from "@/lib/lucide-react";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Plane,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Home,
  ChevronDown,
  MessageSquare,
} from "@/lib/lucide-react";
import { useState } from "react";

type FlatId = "windsor" | "kensington" | "mayfair";
type ExtraId = "airport" | "pantry" | "celebration";
type PaymentMethod = "website" | "transfer" | "pos" | "inquiry-first";
type BookingStep = "stay-details" | "guest-details" | "payment" | "review";

interface FlatOption {
  id: FlatId;
  name: string;
  rate: number;
  blurb: string;
}

interface ExtraOption {
  id: ExtraId;
  title: string;
  price: number;
  desc: string;
  icon: LucideIcon;
}

interface PaymentMethodOption {
  id: Exclude<PaymentMethod, "inquiry-first">;
  title: string;
  desc: string;
  reassurance: string;
}

interface BookingFormState {
  flatId: FlatId | "";
  checkIn: string;
  checkOut: string;
  guests: number;
  extraIds: ExtraId[];
  paymentMethod: PaymentMethod | null;
}

interface BookingTouchedState {
  flatId: boolean;
  checkIn: boolean;
  checkOut: boolean;
  guests: boolean;
  paymentMethod: boolean;
}

interface GuestDetailsState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
  arrivalNotes: string;
}

interface GuestTouchedState {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
}

interface DateValidationResult {
  nights: number | null;
  message: string | null;
}

interface StayValidationState {
  flatId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: string | null;
}

interface GuestValidationState {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface PaymentValidationState {
  paymentMethod: string | null;
}

interface PaymentGuidance {
  title: string;
  message: string;
}

interface BookingSummaryValues {
  selectedFlat: FlatOption | null;
  selectedExtras: ExtraOption[];
  nights: number | null;
  nightlyRate: number | null;
  staySubtotal: number | null;
  extrasSubtotal: number;
  serviceFee: number | null;
  estimatedTotal: number | null;
  paymentLabel: string | null;
  canEstimate: boolean;
}

const FLATS: FlatOption[] = [
  {
    id: "windsor",
    name: "Windsor Residence",
    rate: 150000,
    blurb: "Premium fully-serviced flat",
  },
  {
    id: "kensington",
    name: "Kensington Lodge",
    rate: 180000,
    blurb: "Premium fully-serviced flat",
  },
  {
    id: "mayfair",
    name: "Mayfair Suite",
    rate: 250000,
    blurb: "Premium fully-serviced flat",
  },
];

const ADD_ONS: ExtraOption[] = [
  {
    id: "airport",
    title: "Premium Airport Transfer",
    price: 65000,
    desc: "Chauffeur-driven executive pickup from MMA directly to your residence.",
    icon: Plane,
  },
  {
    id: "pantry",
    title: "Pantry Pre-Stocking",
    price: 45000,
    desc: "Arrive to a fully stocked fridge with premium snacks, coffee, and beverages.",
    icon: ShoppingBag,
  },
  {
    id: "celebration",
    title: "Celebration Setup",
    price: 75000,
    desc: "Custom decor, roses, and champagne ready for your special occasion.",
    icon: Sparkles,
  },
];

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "website",
    title: "Pay via Website",
    desc: "Complete your booking online in a smooth guided flow.",
    reassurance: "You will proceed to a secure payment journey in the integrated version.",
  },
  {
    id: "transfer",
    title: "Bank Transfer",
    desc: "Proceed with calm, guided transfer support from our team.",
    reassurance: "Account details are shown only when Bank Transfer is selected.",
  },
  {
    id: "pos",
    title: "POS on Arrival",
    desc: "Arrange supported POS payment where applicable.",
    reassurance: "For stronger reservation security, Website or Bank Transfer is recommended.",
  },
];

const WEBSITE_PAYMENT_CHANNELS: ReadonlyArray<{ label: string; kind: "card" | "alt" }> = [
  { label: "Mastercard", kind: "card" },
  { label: "Visa", kind: "card" },
  { label: "Verve", kind: "card" },
  { label: "Bank Transfer", kind: "alt" },
  { label: "USSD Shortcodes", kind: "alt" },
  { label: "App Transfers", kind: "alt" },
];

const INITIAL_BOOKING_STATE: BookingFormState = {
  flatId: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
  extraIds: [],
  paymentMethod: null,
};

const INITIAL_TOUCHED_STATE: BookingTouchedState = {
  flatId: false,
  checkIn: false,
  checkOut: false,
  guests: false,
  paymentMethod: false,
};

const INITIAL_GUEST_DETAILS_STATE: GuestDetailsState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialRequests: "",
  arrivalNotes: "",
};

const INITIAL_GUEST_TOUCHED_STATE: GuestTouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
};

const BOOKING_STEPS: ReadonlyArray<{ id: BookingStep; label: string }> = [
  { id: "stay-details", label: "Stay Details" },
  { id: "guest-details", label: "Guest Details" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review & Confirm" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseDate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  const parsedYear = parsed.getUTCFullYear();
  const parsedMonth = parsed.getUTCMonth() + 1;
  const parsedDay = parsed.getUTCDate();

  if (parsedYear !== year || parsedMonth !== month || parsedDay !== day) {
    return null;
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateValidation(checkIn: string, checkOut: string): DateValidationResult {
  if (!checkIn || !checkOut) {
    return { nights: null, message: null };
  }

  const start = parseDate(checkIn);
  const end = parseDate(checkOut);

  if (!start || !end) {
    return { nights: null, message: "Choose valid stay dates." };
  }

  if (end <= start) {
    return { nights: null, message: "Choose a check-out after check-in." };
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);

  return { nights, message: null };
}

function getSelectedFlat(flatId: BookingFormState["flatId"]): FlatOption | null {
  return FLATS.find((flat) => flat.id === flatId) ?? null;
}

function getSelectedExtras(extraIds: ExtraId[]): ExtraOption[] {
  return ADD_ONS.filter((addOn) => extraIds.includes(addOn.id));
}

function getPaymentLabel(paymentMethod: PaymentMethod | null): string | null {
  if (paymentMethod === "inquiry-first") {
    return "Inquiry First";
  }

  return PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.title ?? null;
}

function getBookingSummary(form: BookingFormState): BookingSummaryValues {
  const selectedFlat = getSelectedFlat(form.flatId);
  const selectedExtras = getSelectedExtras(form.extraIds);
  const { nights } = getDateValidation(form.checkIn, form.checkOut);
  const extrasSubtotal = selectedExtras.reduce((total, addOn) => total + addOn.price, 0);
  const paymentLabel = getPaymentLabel(form.paymentMethod);

  if (!selectedFlat || nights === null) {
    return {
      selectedFlat,
      selectedExtras,
      nights,
      nightlyRate: selectedFlat?.rate ?? null,
      staySubtotal: null,
      extrasSubtotal,
      serviceFee: null,
      estimatedTotal: null,
      paymentLabel,
      canEstimate: false,
    };
  }

  const staySubtotal = selectedFlat.rate * nights;
  const serviceFee = staySubtotal * 0.05;
  const estimatedTotal = staySubtotal + serviceFee + extrasSubtotal;

  return {
    selectedFlat,
    selectedExtras,
    nights,
    nightlyRate: selectedFlat.rate,
    staySubtotal,
    extrasSubtotal,
    serviceFee,
    estimatedTotal,
    paymentLabel,
    canEstimate: true,
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getStayValidation(form: BookingFormState): StayValidationState {
  const dateValidation = getDateValidation(form.checkIn, form.checkOut);

  return {
    flatId: form.flatId ? null : "Choose a residence.",
    checkIn: form.checkIn ? null : "Add a check-in date.",
    checkOut: !form.checkOut ? "Add a check-out date." : dateValidation.message,
    guests: form.guests > 0 ? null : "Select how many guests are staying.",
  };
}

function getGuestValidation(guestDetails: GuestDetailsState): GuestValidationState {
  return {
    firstName: guestDetails.firstName.trim() ? null : "Add your first name.",
    lastName: guestDetails.lastName.trim() ? null : "Add your last name.",
    email: !guestDetails.email.trim()
      ? "Add your email."
      : isValidEmail(guestDetails.email)
        ? null
        : "Enter a valid email.",
    phone: guestDetails.phone.trim() ? null : "Add your phone number.",
  };
}

function getPaymentValidation(form: BookingFormState): PaymentValidationState {
  if (form.paymentMethod === "inquiry-first") {
    return {
      paymentMethod: "Choose Website, Bank Transfer, or POS to continue.",
    };
  }

  return {
    paymentMethod: form.paymentMethod ? null : "Choose how you'd like to continue.",
  };
}

function isDirectBookingMethod(
  paymentMethod: PaymentMethod | null
): paymentMethod is Exclude<PaymentMethod, "inquiry-first"> {
  return paymentMethod === "website" || paymentMethod === "transfer" || paymentMethod === "pos";
}

function getPaymentHelperCopy(paymentMethod: PaymentMethod | null, canEstimate: boolean): string {
  if (paymentMethod === "website") {
    return canEstimate
      ? "You will pay securely via our gateway on the next step."
      : "Select your stay details to preview your estimate before checkout.";
  }

  if (paymentMethod === "transfer") {
    return canEstimate
      ? "Bank transfer details will be shared once your stay is confirmed."
      : "Choose your stay details first, then we will tailor your transfer instructions.";
  }

  if (paymentMethod === "pos") {
    return canEstimate
      ? "POS payment can be arranged for check-in day after confirmation."
      : "Complete your stay details first so we can confirm arrival payment options.";
  }

  if (paymentMethod === "inquiry-first") {
    return "Our concierge can help you shape the stay before you commit to payment.";
  }

  return "Your estimate will update here as soon as your stay details are in place.";
}

function getPaymentGuidance(paymentMethod: PaymentMethod | null): PaymentGuidance {
  if (paymentMethod === "website") {
    return {
      title: "Secure Online Checkout",
      message:
        "In the integrated version, you will continue to a secure online payment flow after review.",
    };
  }

  if (paymentMethod === "transfer") {
    return {
      title: "Guided Bank Transfer",
      message:
        "Your official transfer instructions are shown only when Bank Transfer is selected, then hidden when another option is chosen.",
    };
  }

  if (paymentMethod === "pos") {
    return {
      title: "POS on Arrival",
      message:
        "POS can be coordinated on arrival, but if another guest confirms payment first, your reservation may be released. Website or transfer is safer.",
    };
  }

  return {
    title: "Choose Your Payment Path",
    message: "Select a payment method to view tailored guidance.",
  };
}

export default function BookingPage() {
  const [booking, setBooking] = useState<BookingFormState>(INITIAL_BOOKING_STATE);
  const [touched, setTouched] = useState<BookingTouchedState>(INITIAL_TOUCHED_STATE);
  const [guestDetails, setGuestDetails] = useState<GuestDetailsState>(INITIAL_GUEST_DETAILS_STATE);
  const [guestTouched, setGuestTouched] = useState<GuestTouchedState>(INITIAL_GUEST_TOUCHED_STATE);
  const [currentStep, setCurrentStep] = useState<BookingStep>("stay-details");
  const [checkoutIntent, setCheckoutIntent] = useState(false);

  const summary = getBookingSummary(booking);
  const stayValidation = getStayValidation(booking);
  const guestValidation = getGuestValidation(guestDetails);
  const paymentValidation = getPaymentValidation(booking);
  const paymentGuidance = getPaymentGuidance(booking.paymentMethod);
  const dateValidation = getDateValidation(booking.checkIn, booking.checkOut);
  const stayDetailsReady =
    !stayValidation.flatId && !stayValidation.checkIn && !stayValidation.checkOut && !stayValidation.guests;
  const guestDetailsReady =
    !guestValidation.firstName &&
    !guestValidation.lastName &&
    !guestValidation.email &&
    !guestValidation.phone;
  const paymentReady =
    !paymentValidation.paymentMethod && isDirectBookingMethod(booking.paymentMethod);
  const reviewReady = stayDetailsReady && guestDetailsReady && paymentReady;
  const currentStepIndex = BOOKING_STEPS.findIndex((step) => step.id === currentStep);
  const guestDisplayName = `${guestDetails.firstName} ${guestDetails.lastName}`.trim();

  const showDateValidation =
    Boolean(dateValidation.message) && (touched.checkOut || Boolean(booking.checkOut));

  function updateBooking<K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) {
    setBooking((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function markTouched(field: keyof BookingTouchedState) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function markGuestTouched(field: keyof GuestTouchedState) {
    setGuestTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function updateGuestDetails<K extends keyof GuestDetailsState>(
    field: K,
    value: GuestDetailsState[K]
  ) {
    setGuestDetails((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleAddOn(id: ExtraId) {
    setBooking((current) => ({
      ...current,
      extraIds: current.extraIds.includes(id)
        ? current.extraIds.filter((extraId) => extraId !== id)
        : [...current.extraIds, id],
    }));
  }

  function handleBack() {
    if (currentStep === "guest-details") {
      setCurrentStep("stay-details");
      return;
    }

    if (currentStep === "payment") {
      setCurrentStep("guest-details");
      return;
    }

    if (currentStep === "review") {
      setCurrentStep("payment");
    }
  }

  function handleNext() {
    if (currentStep === "stay-details") {
      setTouched((current) => ({
        ...current,
        flatId: true,
        checkIn: true,
        checkOut: true,
        guests: true,
      }));
      if (stayDetailsReady) {
        setCurrentStep("guest-details");
      }
      return;
    }

    if (currentStep === "guest-details") {
      setGuestTouched({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      });
      if (guestDetailsReady) {
        setCurrentStep("payment");
      }
      return;
    }

    if (currentStep === "payment") {
      setTouched((current) => ({
        ...current,
        paymentMethod: true,
      }));
      if (paymentReady) {
        if (booking.paymentMethod === "website") {
          setCheckoutIntent(true);
          return;
        }
        setCheckoutIntent(false);
        setCurrentStep("review");
      }
    }
  }

  return (
    <main className="booking-page" style={{ paddingBottom: "0" }}>
      <section
        className="container"
        style={{ paddingTop: "8rem", paddingBottom: "2rem", maxWidth: "1200px" }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
          className="hover-primary"
        >
          <ArrowLeft size={16} /> Back to Homepage
        </Link>
        <h1 className="heading-lg serif">Complete Your Booking</h1>
        <p className="text-secondary" style={{ fontSize: "1.1rem" }}>
          Secure your dates and customize your luxury stay in perfectly orchestrated detail.
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
            justifyItems: "center",
            justifyContent: "center",
            padding: "1rem 0",
            maxWidth: "1200px",
            flexWrap: "wrap",
            gap: "3rem",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} className="text-primary" /> 100% Verified Availability
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} className="text-primary" /> Free Cancellation (48hrs)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} className="text-primary" /> Best Rate Guaranteed
          </span>
        </div>
      </div>

      <section
        className="container"
        style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "1200px" }}
      >
        <div className="booking-progress" role="list" aria-label="Booking progress">
          {BOOKING_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const stepStateClass = isActive
              ? "is-active"
              : isCompleted
                ? "is-completed"
                : "is-upcoming";

            return (
              <div
                key={step.id}
                className={`booking-progress-item ${stepStateClass}`}
                role="listitem"
                aria-current={isActive ? "step" : undefined}
              >
                <span className="booking-progress-index">{isCompleted ? "\u2713" : index + 1}</span>
                <span className="booking-progress-label">{step.label}</span>
              </div>
            );
          })}
        </div>
        <div className="booking-layout">
          <div
            className="booking-details-col"
            style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
          >
            {currentStep === "stay-details" && (
              <>
            <div className="booking-section">
              <h2
                className="heading-sm serif"
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span className="step-circle">1</span> Select Residence
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {FLATS.map((flat) => (
                  <button
                    key={flat.id}
                    type="button"
                    className={`payment-plan-card ${booking.flatId === flat.id ? "selected" : ""}`}
                    onClick={() => {
                      updateBooking("flatId", flat.id);
                      markTouched("flatId");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "1rem", background: "transparent" }}
                  >
                    <div className="radio-ring" style={{ flexShrink: 0 }}>
                      {booking.flatId === flat.id && <div className="radio-dot" />}
                    </div>
                    <Home
                      size={24}
                      className={booking.flatId === flat.id ? "text-primary" : "text-secondary"}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{flat.name}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {flat.blurb}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: booking.flatId === flat.id ? "var(--primary)" : "inherit",
                      }}
                    >
                      {formatCurrency(flat.rate)}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {" "}
                        /night
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {touched.flatId && stayValidation.flatId && (
                <p style={{ marginTop: "1rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                  {stayValidation.flatId}
                </p>
              )}
            </div>

            <div className="booking-section">
              <h2
                className="heading-sm serif"
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span className="step-circle">2</span> Select Dates
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="input-group">
                  <label>Check-in Date</label>
                  <div className="input-wrapper">
                    <CalendarDays size={18} className="input-icon" />
                    <input
                      type="date"
                      value={booking.checkIn}
                      onChange={(event) => {
                        updateBooking("checkIn", event.target.value);
                        markTouched("checkIn");
                      }}
                      onBlur={() => markTouched("checkIn")}
                      className="standard-input"
                      style={{ paddingLeft: "3rem" }}
                    />
                  </div>
                  {touched.checkIn && stayValidation.checkIn && (
                    <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                      {stayValidation.checkIn}
                    </p>
                  )}
                </div>
                <div className="input-group">
                  <label>Check-out Date</label>
                  <div className="input-wrapper">
                    <CalendarDays size={18} className="input-icon" />
                    <input
                      type="date"
                      value={booking.checkOut}
                      onChange={(event) => {
                        updateBooking("checkOut", event.target.value);
                        markTouched("checkOut");
                      }}
                      onBlur={() => markTouched("checkOut")}
                      min={booking.checkIn || undefined}
                      className="standard-input"
                      style={{ paddingLeft: "3rem" }}
                    />
                  </div>
                  {!showDateValidation && touched.checkOut && stayValidation.checkOut && (
                    <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                      {stayValidation.checkOut}
                    </p>
                  )}
                </div>
              </div>
              {showDateValidation && (
                <p style={{ marginTop: "1rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                  {dateValidation.message}
                </p>
              )}
            </div>

            <div className="booking-section">
              <h2
                className="heading-sm serif"
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span className="step-circle">3</span> Guest Count
              </h2>
              <div className="input-group" style={{ maxWidth: "300px" }}>
                <div className="input-wrapper">
                  <Users size={18} className="input-icon" />
                  <select
                    value={booking.guests}
                    onChange={(event) => {
                      updateBooking("guests", Number(event.target.value));
                      markTouched("guests");
                    }}
                    onBlur={() => markTouched("guests")}
                    className="standard-input"
                    style={{ paddingLeft: "3rem", appearance: "none" }}
                  >
                    <option value={0}>Select guests</option>
                    {[1, 2, 3, 4, 5, 6].map((guestCount) => (
                      <option key={guestCount} value={guestCount}>
                        {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "var(--text-secondary)",
                    }}
                  />
                </div>
                {touched.guests && stayValidation.guests && (
                  <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                    {stayValidation.guests}
                  </p>
                )}
              </div>
            </div>

            <div className="booking-section">
              <h2
                className="heading-sm serif"
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span className="step-circle">4</span> Tailored Add-ons
              </h2>
              <p className="text-secondary" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                Select elegant extras to perfectly curate your arrival.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {ADD_ONS.map((addOn) => {
                  const isSelected = booking.extraIds.includes(addOn.id);
                  const Icon = addOn.icon;

                  return (
                    <button
                      key={addOn.id}
                      type="button"
                      className={`addon-select-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleAddOn(addOn.id)}
                    >
                      <div className="checkbox-ring" style={{ flexShrink: 0 }}>
                        {isSelected && <div className="checkbox-dot" />}
                      </div>
                      <Icon
                        size={24}
                        className={isSelected ? "text-primary" : "text-secondary"}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <h4
                          className="serif"
                          style={{
                            fontSize: "1.1rem",
                            marginBottom: "0.25rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {addOn.title}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {addOn.desc}
                        </p>
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--primary)" }}>
                        +{formatCurrency(addOn.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
              </>
            )}

            {currentStep === "payment" && (
            <div className="booking-section">
              <h2
                className="heading-sm serif"
                style={{
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span className="step-circle">3</span> Payment Method
              </h2>
              <p
                className="text-secondary"
                style={{ marginTop: "-0.5rem", marginBottom: "1.5rem", fontSize: "0.95rem" }}
              >
                Choose the payment path that feels most convenient for your stay.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-plan-card ${booking.paymentMethod === method.id ? "selected" : ""}`}
                    onClick={() => {
                      updateBooking("paymentMethod", method.id);
                      markTouched("paymentMethod");
                      setCheckoutIntent(false);
                    }}
                    style={{ background: "transparent" }}
                  >
                    <div className="radio-ring" style={{ flexShrink: 0 }}>
                      {booking.paymentMethod === method.id && <div className="radio-dot" />}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "1.05rem" }}>
                        {method.title}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {method.desc}
                      </div>
                      <div
                        style={{
                          fontSize: "0.83rem",
                          color: "var(--text-secondary)",
                          marginTop: "0.4rem",
                          opacity: 0.92,
                        }}
                      >
                        {method.reassurance}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {touched.paymentMethod && paymentValidation.paymentMethod && (
                <p style={{ marginTop: "1rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                  {paymentValidation.paymentMethod}
                </p>
              )}

              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem 1.1rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                  {paymentGuidance.title}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.86rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.55,
                  }}
                >
                  {paymentGuidance.message}
                </p>

                {booking.paymentMethod === "website" && (
                  <div style={{ marginTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {WEBSITE_PAYMENT_CHANNELS.map((channel) => (
                        <span
                          key={channel.label}
                          style={{
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "999px",
                            padding: "0.35rem 0.62rem",
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                            background: "rgba(255,255,255,0.02)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: "0.4rem",
                              height: "0.4rem",
                              borderRadius: "50%",
                              background:
                                channel.kind === "card"
                                  ? "rgba(238,29,82,0.75)"
                                  : "rgba(255,255,255,0.45)",
                            }}
                          />
                          {channel.label}
                        </span>
                      ))}
                  </div>
                )}

                {booking.paymentMethod === "transfer" && (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      gap: "0.45rem",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Account Details
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                      NGN Account: Shared securely after booking confirmation.
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                      USD Account: Shared securely after booking confirmation.
                    </div>
                  </div>
                )}
              </div>
              {currentStep === "payment" &&
                booking.paymentMethod === "website" &&
                checkoutIntent && (
                  <p style={{ marginTop: "0.85rem", color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                    Checkout handoff is ready for future integration. In production, this will continue to secure
                    online payment.
                  </p>
                )}

              <div
                style={{
                  marginTop: "2rem",
                  padding: "1rem 1.5rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    Need help choosing?
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    You can make an inquiry if you want guidance on the best payment option.
                  </div>
                </div>
                <a
                  href="https://wa.me/2340000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#25D366",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  <MessageSquare size={16} /> Chat on WhatsApp
                </a>
              </div>
            </div>
            )}

            {currentStep === "guest-details" && (
              <div className="booking-section">
                <h2
                  className="heading-sm serif"
                  style={{
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="step-circle">2</span> Guest Details
                </h2>
                <p className="text-secondary" style={{ marginTop: "-0.5rem", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  A few details help us personalize your arrival and coordinate your stay smoothly.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="input-group">
                    <label>First Name</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        value={guestDetails.firstName}
                        onChange={(event) => updateGuestDetails("firstName", event.target.value)}
                        onBlur={() => markGuestTouched("firstName")}
                        className="standard-input"
                        placeholder="Enter first name"
                      />
                    </div>
                    {guestTouched.firstName && guestValidation.firstName && (
                      <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                        {guestValidation.firstName}
                      </p>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        value={guestDetails.lastName}
                        onChange={(event) => updateGuestDetails("lastName", event.target.value)}
                        onBlur={() => markGuestTouched("lastName")}
                        className="standard-input"
                        placeholder="Enter last name"
                      />
                    </div>
                    {guestTouched.lastName && guestValidation.lastName && (
                      <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                        {guestValidation.lastName}
                      </p>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        value={guestDetails.email}
                        onChange={(event) => updateGuestDetails("email", event.target.value)}
                        onBlur={() => markGuestTouched("email")}
                        className="standard-input"
                        placeholder="name@email.com"
                      />
                    </div>
                    <p style={{ marginTop: "0.55rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      We will send your booking confirmation and stay updates here.
                    </p>
                    {guestTouched.email && guestValidation.email && (
                      <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                        {guestValidation.email}
                      </p>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <div className="input-wrapper">
                      <input
                        type="tel"
                        value={guestDetails.phone}
                        onChange={(event) => updateGuestDetails("phone", event.target.value)}
                        onBlur={() => markGuestTouched("phone")}
                        className="standard-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <p style={{ marginTop: "0.55rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      Used for check-in coordination and quick stay support.
                    </p>
                    {guestTouched.phone && guestValidation.phone && (
                      <p style={{ marginTop: "0.65rem", color: "var(--primary)", fontSize: "0.85rem" }}>
                        {guestValidation.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <label>Number of Guests</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      value={booking.guests > 0 ? `${booking.guests} ${booking.guests === 1 ? "Guest" : "Guests"}` : "Not selected"}
                      readOnly
                      className="standard-input"
                      style={{ cursor: "default", color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <label>Special Requests (Optional)</label>
                  <p style={{ margin: "0 0 0.55rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    Optional: share preferences so we can prepare ahead of arrival.
                  </p>
                  <textarea
                    value={guestDetails.specialRequests}
                    onChange={(event) => updateGuestDetails("specialRequests", event.target.value)}
                    className="standard-input"
                    rows={4}
                    placeholder="Celebration plans, bedding preferences, or concierge requests..."
                    style={{ paddingTop: "0.9rem", minHeight: "120px", resize: "vertical" }}
                  />
                </div>

                <div className="input-group" style={{ marginTop: "1.5rem" }}>
                  <label>Arrival Notes (Optional)</label>
                  <textarea
                    value={guestDetails.arrivalNotes}
                    onChange={(event) => updateGuestDetails("arrivalNotes", event.target.value)}
                    className="standard-input"
                    rows={3}
                    placeholder="Arrival time, flight details, or check-in timing notes..."
                    style={{ paddingTop: "0.9rem", minHeight: "120px", resize: "vertical" }}
                  />
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="booking-section">
                <h2
                  className="heading-sm serif"
                  style={{
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="step-circle">4</span> Review & Confirm
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="payment-plan-card" style={{ background: "transparent" }}>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Guest</div>
                      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {guestDisplayName || "Name not added"}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {guestDetails.email || "Email not added"}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {guestDetails.phone || "Phone not added"}
                      </div>
                    </div>
                  </div>
                  <div className="payment-plan-card" style={{ background: "transparent" }}>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Payment Path</div>
                      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {summary.paymentLabel ?? "Choose a payment path"}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Confirming now finalizes this booking request in the prototype flow and moves to confirmation.
                  </p>
                </div>
              </div>
            )}

            <div className="booking-section" style={{ borderBottom: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {currentStep !== "stay-details" && (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleBack}
                      style={{ padding: "1.05rem 1.5rem", minWidth: "160px" }}
                    >
                      Back
                    </button>
                  )}

                  {currentStep !== "review" && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={
                        (currentStep === "stay-details" && !stayDetailsReady) ||
                        (currentStep === "guest-details" && !guestDetailsReady)
                      }
                      style={{
                        padding: "1.05rem 1.5rem",
                        minWidth: "220px",
                        opacity:
                          (currentStep === "stay-details" && !stayDetailsReady) ||
                          (currentStep === "guest-details" && !guestDetailsReady)
                            ? 0.55
                            : 1,
                      }}
                    >
                      {currentStep === "stay-details" && "Continue to Guest Details"}
                      {currentStep === "guest-details" && "Continue to Payment"}
                      {currentStep === "payment" &&
                        (booking.paymentMethod === "website"
                          ? "Proceed to Checkout"
                          : "Continue to Review")}
                    </button>
                  )}

                  {currentStep === "review" && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!reviewReady}
                      style={{
                        padding: "1.05rem 1.5rem",
                        minWidth: "240px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        opacity: reviewReady ? 1 : 0.55,
                      }}
                    >
                      <Lock size={18} /> Confirm Booking
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                  Need help choosing?
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Concierge and inquiry support remain available at every step.
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                  href="https://wa.me/2340000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#25D366",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  <MessageSquare size={16} /> Chat on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => updateBooking("paymentMethod", "inquiry-first")}
                  className="btn btn-outline-primary"
                  style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}
                >
                  Make an Inquiry
                </button>
              </div>
            </div>
          </div>

          <div className="booking-summary-col">
            <div className="summary-card" style={{ position: "sticky", top: "100px" }}>
              <h3 className="heading-sm serif" style={{ marginBottom: "1.5rem" }}>
                Booking Summary
              </h3>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Residence
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {summary.selectedFlat?.name ?? "Choose your residence"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Guests
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {booking.guests > 0 ? `${booking.guests}` : "Add guests"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "1.5rem",
                  fontSize: "0.9rem",
                  display: "flex",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Check-in</div>
                  <div style={{ fontWeight: 500 }}>{booking.checkIn || "Add date"}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Check-out</div>
                  <div style={{ fontWeight: 500 }}>{booking.checkOut || "Add date"}</div>
                </div>
              </div>

              {(guestDisplayName || guestDetails.email || guestDetails.phone) && (
                <div
                  style={{
                    paddingBottom: "1rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Guest Details
                  </div>
                  {guestDisplayName && (
                    <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.2rem" }}>
                      {guestDisplayName}
                    </div>
                  )}
                  {guestDetails.email && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {guestDetails.email}
                    </div>
                  )}
                </div>
              )}

              <div className="summary-row">
                <span>Nightly rate</span>
                <span>{summary.nightlyRate ? formatCurrency(summary.nightlyRate) : "Select a residence"}</span>
              </div>

              <div className="summary-row">
                <span>Nights</span>
                <span>
                  {summary.nights !== null
                    ? `${summary.nights} ${summary.nights === 1 ? "night" : "nights"}`
                    : "Select valid dates"}
                </span>
              </div>

              <div className="summary-row">
                <span>Stay subtotal</span>
                <span>{summary.staySubtotal !== null ? formatCurrency(summary.staySubtotal) : "Awaiting dates"}</span>
              </div>

              {summary.selectedExtras.length > 0 && (
                <div className="summary-row">
                  <span>Tailored add-ons ({summary.selectedExtras.length})</span>
                  <span>{formatCurrency(summary.extrasSubtotal)}</span>
                </div>
              )}

              {summary.canEstimate && summary.serviceFee !== null && (
                <div className="summary-row" style={{ alignItems: "center" }}>
                  <span
                    style={{ textDecoration: "underline", textDecorationStyle: "dotted", cursor: "help" }}
                    title="Covers cleaning, fast Wi-Fi, and 24/7 security management."
                  >
                    Service & Maintenance Fee
                  </span>
                  <span>{formatCurrency(summary.serviceFee)}</span>
                </div>
              )}

              <div
                className="summary-row grand-total"
                style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem", marginTop: "1.5rem" }}
              >
                <span>
                  Estimated Total{" "}
                  <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-secondary)" }}>
                    (NGN)
                  </span>
                </span>
                <span>
                  {summary.estimatedTotal !== null
                    ? formatCurrency(summary.estimatedTotal)
                    : "Complete dates to estimate"}
                </span>
              </div>

              <div
                className="payment-due-box"
                style={{
                  background: "var(--bg-dark)",
                  padding: "1.5rem",
                  borderRadius: "var(--radius-sm)",
                  marginTop: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.8,
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Booking Path
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-serif)",
                    color: "var(--primary)",
                  }}
                >
                  {summary.paymentLabel ?? "Choose a path"}
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "0.5rem" }}>
                  {getPaymentHelperCopy(booking.paymentMethod, summary.canEstimate)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  margin: "1.5rem 0",
                }}
              >
                <ShieldCheck size={18} className="text-primary" style={{ flexShrink: 0, margin: "2px 0 0" }} />
                <p style={{ margin: 0 }}>
                  Your payment is 100% globally encrypted. We securely support Nigerian bank transfers, USSD,
                  Apple Pay, and all major local and international cards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "var(--bg-panel)",
          padding: "4rem 0",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1000px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "3rem",
          }}
        >
          <div>
            <h4 className="serif" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              Payment Security Guarantee
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
              All transactions are processed via our PCI-DSS compliant banking partners. Your card details are
              fully encrypted and never stored on our servers.
            </p>
          </div>
          <div>
            <h4 className="serif" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              The Blissful Promise
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
              We stand by our commitment to zero generator noise, uninterrupted fast internet, and immaculate
              cleanliness. If expectations are not met on arrival, we&apos;ll make it right.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "6rem 0", maxWidth: "800px", textAlign: "center" }}>
        <div style={{ marginBottom: "1rem" }}>
          <span className="subtitle-tag" style={{ margin: "0" }}>
            STILL DECIDING?
          </span>
        </div>
        <h2 className="heading-lg serif" style={{ marginBottom: "1.5rem" }}>
          Make a Direct Inquiry
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
          Prefer to speak with our concierge before confirming your booking? Reach out instantly on WhatsApp to
          ask about custom requests, dates, or specific flat details.
        </p>
        <a
          href="https://wa.me/2340000000000"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            updateBooking("paymentMethod", "inquiry-first");
            markTouched("paymentMethod");
          }}
          className="btn btn-outline-primary"
          style={{
            padding: "1.25rem 3rem",
            fontSize: "1rem",
            display: "inline-flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <MessageSquare size={18} /> Contact Concierge on WhatsApp
        </a>
      </section>

      <section
        style={{
          background: "var(--bg-panel)",
          padding: "5rem 0",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ maxWidth: "800px" }}>
          <h2 className="heading-md serif text-center" style={{ marginBottom: "3rem" }}>
            Booking Questions
          </h2>
          <div className="faq-container">
            <details className="faq-item">
              <summary className="serif">
                When is the deposit and final balance due? <ChevronDown size={20} className="text-primary" />
              </summary>
              <p style={{ margin: 0, marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                If you choose the deposit option, a 30% payment is required today to secure your dates. The
                remaining 70% will be automatically charged or invoiced 7 days prior to your check-in date.
              </p>
            </details>
            <details className="faq-item">
              <summary className="serif">
                How does the NGN 150,000 security deposit work?{" "}
                <ChevronDown size={20} className="text-primary" />
              </summary>
              <p style={{ margin: 0, marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                The refundable caution fee is collected prior to check-in to cover any incidental damages or
                house rule violations. It is immediately released within 24 hours after checkout following a
                satisfactory inspection.
              </p>
            </details>
            <details className="faq-item" style={{ borderBottom: "none" }}>
              <summary className="serif">
                What is your cancellation policy? <ChevronDown size={20} className="text-primary" />
              </summary>
              <p style={{ margin: 0, marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                You can cancel for a full refund up to 48 hours after booking, provided check-in is at least 14
                days away. Cancellations made at least 7 days before check-in receive a 50% refund.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
