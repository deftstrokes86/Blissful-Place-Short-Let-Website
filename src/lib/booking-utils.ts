import { getBranchStepLabels } from "@/lib/booking-branch-config";
import { calculateNightCount } from "@/lib/booking-pricing";
import { STEP0, STEP2, STEP3 } from "@/lib/constants";
import type {
  BookingStepLabels,
  GuestFormState,
  PaymentMethod,
  StayFormState,
  StayValidation,
  GuestValidation,
} from "@/types/booking";

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseDate(value: string): Date | null {
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
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getNightCount(checkIn: string, checkOut: string): number | null {
  return calculateNightCount(checkIn, checkOut);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getStayValidation(stay: StayFormState): StayValidation {
  const nights = getNightCount(stay.checkIn, stay.checkOut);

  return {
    flatId: stay.flatId ? null : "Choose a flat.",
    checkIn: stay.checkIn ? null : "Add a check-in date.",
    checkOut: !stay.checkOut
      ? "Add a check-out date."
      : nights === null
        ? "Check-out must be after check-in."
        : null,
    guests: stay.guests > 0 ? null : "Select number of guests.",
  };
}

export function getGuestValidation(guest: GuestFormState): GuestValidation {
  return {
    firstName: guest.firstName.trim() ? null : "Add first name.",
    lastName: guest.lastName.trim() ? null : "Add last name.",
    email: !guest.email.trim()
      ? "Add email."
      : isValidEmail(guest.email)
        ? null
        : "Enter a valid email address.",
    phone: guest.phone.trim() ? null : "Add phone number.",
  };
}

export function getStepLabels(paymentMethod: PaymentMethod | null): BookingStepLabels {
  return getBranchStepLabels(paymentMethod);
}

export function getAvailabilityReasonForStep(stepIndex: number, paymentMethod: PaymentMethod | null): string {
  if (stepIndex === STEP0) {
    return "when stay details were entered";
  }
  if (stepIndex === STEP2) {
    return "before creating hold/request";
  }
  if (stepIndex === STEP3 && paymentMethod === "website") {
    return "before online payment handoff";
  }

  return "before proceeding";
}

export function formatTransferHoldLabel(expiresAt: number | null): string {
  if (!expiresAt) {
    return "Hold timer starts once transfer request is created.";
  }

  const expiresAtText = new Date(expiresAt).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Hold expires at ${expiresAtText}.`;
}

