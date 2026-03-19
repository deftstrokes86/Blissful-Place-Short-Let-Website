import { calculateNightCount } from "@/lib/booking-pricing";
import type {
  GuestDetailsInput,
  PaymentMethod,
  ReservationStatus,
  StayDetailsInput,
  ValidationError,
  ValidationResult,
} from "@/types/booking";

export type StayValidationField = "flatId" | "checkIn" | "checkOut" | "guests";
export type GuestValidationField = "firstName" | "lastName" | "email" | "phone";
export type PaymentValidationField = "paymentMethod";
export type BranchProgressionField =
  | "paymentMethod"
  | "status"
  | "availability"
  | "transferReference"
  | "transferProof"
  | "transferHold"
  | "transferVerification"
  | "posContactWindow"
  | "posPayment"
  | "branchReset";

export type BranchProgressionIntent =
  | "create_request"
  | "handoff_online_payment"
  | "submit_transfer_proof"
  | "confirm_transfer"
  | "submit_pos_request"
  | "confirm_pos"
  | "switch_payment_method";

export interface BranchProgressionCheckInput {
  intent: BranchProgressionIntent;
  paymentMethod: PaymentMethod | null;
  currentStatus: ReservationStatus;
  availabilityPassed: boolean;
  transferReference?: string;
  transferProofNote?: string;
  withinTransferHold?: boolean;
  staffTransferVerified?: boolean;
  posContactWindow?: string;
  posPaymentCompleted?: boolean;
  branchResetApplied?: boolean;
}

function createValidationResult<TField extends string>(errors: ValidationError<TField>[]): ValidationResult<TField> {
  return {
    isValid: errors.length === 0,
    errors,
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function validateStayDetails(stay: StayDetailsInput): ValidationResult<StayValidationField> {
  const errors: ValidationError<StayValidationField>[] = [];

  if (!stay.flatId) {
    errors.push({ field: "flatId", code: "required", message: "A residence must be selected." });
  }

  if (!stay.checkIn) {
    errors.push({ field: "checkIn", code: "required", message: "Check-in date is required." });
  }

  if (!stay.checkOut) {
    errors.push({ field: "checkOut", code: "required", message: "Check-out date is required." });
  }

  if (stay.checkIn && stay.checkOut && calculateNightCount(stay.checkIn, stay.checkOut) === null) {
    errors.push({
      field: "checkOut",
      code: "invalid_range",
      message: "Check-out must be after check-in.",
    });
  }

  if (stay.guests < 1) {
    errors.push({ field: "guests", code: "invalid_guest_count", message: "At least one guest is required." });
  }

  return createValidationResult(errors);
}

export function validateGuestDetails(guest: GuestDetailsInput): ValidationResult<GuestValidationField> {
  const errors: ValidationError<GuestValidationField>[] = [];

  if (!guest.firstName.trim()) {
    errors.push({ field: "firstName", code: "required", message: "First name is required." });
  }

  if (!guest.lastName.trim()) {
    errors.push({ field: "lastName", code: "required", message: "Last name is required." });
  }

  if (!guest.email.trim()) {
    errors.push({ field: "email", code: "required", message: "Email is required." });
  } else if (!isValidEmail(guest.email)) {
    errors.push({ field: "email", code: "invalid_email", message: "Email format is invalid." });
  }

  if (!guest.phone.trim()) {
    errors.push({ field: "phone", code: "required", message: "Phone number is required." });
  }

  return createValidationResult(errors);
}

export function validatePaymentMethodSelection(method: PaymentMethod | null): ValidationResult<PaymentValidationField> {
  const errors: ValidationError<PaymentValidationField>[] = [];

  if (!method) {
    errors.push({
      field: "paymentMethod",
      code: "required",
      message: "A payment method must be selected before proceeding.",
    });
  }

  return createValidationResult(errors);
}

export function validateBranchProgression(input: BranchProgressionCheckInput): ValidationResult<BranchProgressionField> {
  const errors: ValidationError<BranchProgressionField>[] = [];

  if (!input.paymentMethod) {
    errors.push({
      field: "paymentMethod",
      code: "required",
      message: "A payment method is required for branch progression.",
    });
    return createValidationResult(errors);
  }

  if (input.intent === "create_request") {
    if (input.currentStatus !== "draft") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "Branch request creation is only allowed from draft status.",
      });
    }

    if (!input.availabilityPassed) {
      errors.push({
        field: "availability",
        code: "availability_required",
        message: "Availability must pass before creating a branch hold/request.",
      });
    }
  }

  if (input.intent === "switch_payment_method") {
    if (input.currentStatus !== "failed_payment") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "Payment-method switching is only supported from failed payment status in this scope.",
      });
    }

    if (!input.branchResetApplied) {
      errors.push({
        field: "branchReset",
        code: "branch_reset_required",
        message: "Branch reset must be applied before switching payment method.",
      });
    }

    if (!input.availabilityPassed) {
      errors.push({
        field: "availability",
        code: "availability_required",
        message: "Availability must pass before switching to a new payment branch.",
      });
    }

    if (input.paymentMethod === "website") {
      errors.push({
        field: "paymentMethod",
        code: "wrong_branch",
        message: "Use try-again flow for website payment; switch is for transfer or POS in this scope.",
      });
    }
  }
  if (input.intent === "handoff_online_payment") {
    if (input.paymentMethod !== "website") {
      errors.push({
        field: "paymentMethod",
        code: "wrong_branch",
        message: "Online handoff is only valid for website payment branch.",
      });
    }

    if (input.currentStatus !== "pending_online_payment") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "Online handoff requires pending online payment status.",
      });
    }

    if (!input.availabilityPassed) {
      errors.push({
        field: "availability",
        code: "availability_required",
        message: "Availability must pass before online payment handoff.",
      });
    }
  }

  if (input.intent === "submit_transfer_proof") {
    if (input.paymentMethod !== "transfer") {
      errors.push({ field: "paymentMethod", code: "wrong_branch", message: "Transfer proof is only valid for transfer branch." });
    }

    if (input.currentStatus !== "pending_transfer_submission") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "Transfer proof submission requires pending transfer submission status.",
      });
    }

    if (!input.transferReference?.trim()) {
      errors.push({
        field: "transferReference",
        code: "required",
        message: "Transfer reference is required.",
      });
    }

    if (!input.transferProofNote?.trim()) {
      errors.push({
        field: "transferProof",
        code: "required",
        message: "Transfer proof note is required.",
      });
    }

    if (!input.withinTransferHold) {
      errors.push({
        field: "transferHold",
        code: "hold_expired",
        message: "Transfer proof must be submitted within the active transfer hold window.",
      });
    }
  }

  if (input.intent === "confirm_transfer") {
    if (input.paymentMethod !== "transfer") {
      errors.push({
        field: "paymentMethod",
        code: "wrong_branch",
        message: "Transfer confirmation is only valid for transfer branch.",
      });
    }

    if (input.currentStatus !== "awaiting_transfer_verification") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "Transfer confirmation requires awaiting transfer verification status.",
      });
    }

    if (!input.withinTransferHold) {
      errors.push({
        field: "transferHold",
        code: "hold_expired",
        message: "Transfer confirmation cannot happen after hold expiry.",
      });
    }

    if (!input.staffTransferVerified) {
      errors.push({
        field: "transferVerification",
        code: "staff_verification_required",
        message: "Staff verification is required before transfer confirmation.",
      });
    }

    if (!input.availabilityPassed) {
      errors.push({
        field: "availability",
        code: "availability_required",
        message: "Final availability check must pass before transfer confirmation.",
      });
    }
  }

  if (input.intent === "submit_pos_request") {
    if (input.paymentMethod !== "pos") {
      errors.push({ field: "paymentMethod", code: "wrong_branch", message: "POS request is only valid for POS branch." });
    }

    if (input.currentStatus !== "pending_pos_coordination") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "POS request submission requires pending POS coordination status.",
      });
    }

    if (!input.posContactWindow?.trim()) {
      errors.push({
        field: "posContactWindow",
        code: "required",
        message: "Preferred contact window is required for POS coordination.",
      });
    }
  }

  if (input.intent === "confirm_pos") {
    if (input.paymentMethod !== "pos") {
      errors.push({
        field: "paymentMethod",
        code: "wrong_branch",
        message: "POS confirmation is only valid for POS branch.",
      });
    }

    if (input.currentStatus !== "pending_pos_coordination") {
      errors.push({
        field: "status",
        code: "invalid_status",
        message: "POS confirmation requires pending POS coordination status.",
      });
    }

    if (!input.posPaymentCompleted) {
      errors.push({
        field: "posPayment",
        code: "payment_required",
        message: "POS payment must be completed before confirmation.",
      });
    }

    if (!input.availabilityPassed) {
      errors.push({
        field: "availability",
        code: "availability_required",
        message: "Final availability check must pass before POS confirmation.",
      });
    }
  }

  return createValidationResult(errors);
}

