import type { PaymentMethod, ReservationStatus } from "@/types/booking";

export type ResumeStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

function paymentMethodFromStatus(status: ReservationStatus): PaymentMethod | null {
  if (status === "pending_online_payment") {
    return "website";
  }

  if (status === "pending_transfer_submission" || status === "awaiting_transfer_verification") {
    return "transfer";
  }

  if (status === "pending_pos_coordination") {
    return "pos";
  }

  return null;
}

export function resolveResumePaymentMethod(
  status: ReservationStatus,
  savedPaymentMethod: PaymentMethod | null
): PaymentMethod | null {
  if (savedPaymentMethod) {
    return savedPaymentMethod;
  }

  return paymentMethodFromStatus(status);
}

export function deriveResumeStepIndex(input: {
  status: ReservationStatus;
  paymentMethod: PaymentMethod | null;
  stayReady: boolean;
  guestReady: boolean;
}): ResumeStepIndex {
  const method = resolveResumePaymentMethod(input.status, input.paymentMethod);

  if (input.status === "draft") {
    if (!input.stayReady) {
      return 0;
    }

    if (!input.guestReady) {
      return 1;
    }

    // Draft resumes before branch request creation, so we restart from payment method selection.
    return 2;
  }

  if (
    input.status === "pending_online_payment" ||
    input.status === "pending_transfer_submission" ||
    input.status === "pending_pos_coordination"
  ) {
    if (!method) {
      return 2;
    }

    return 4;
  }

  if (
    input.status === "awaiting_transfer_verification" ||
    input.status === "confirmed" ||
    input.status === "cancelled" ||
    input.status === "expired" ||
    input.status === "failed_payment"
  ) {
    return 5;
  }

  return 0;
}

