import type {
  BookingStepIndex,
  BookingStepLabels,
  BranchStepId,
  PaymentMethod,
  ReservationStatus,
  SharedStepId,
  TransferBranchStepId,
  WebsiteBranchStepId,
  PosBranchStepId,
} from "@/types/booking";

type StepPosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface BranchStepDefinition<TStepId extends BranchStepId = BranchStepId> {
  id: TStepId;
  label: string;
  position: StepPosition;
}

export interface BookingBranchConfig<TStepId extends BranchStepId = BranchStepId> {
  method: PaymentMethod;
  pendingStatus: ReservationStatus;
  endLabel: string;
  steps: BookingStepLabels;
  stepDefinitions: [
    BranchStepDefinition<SharedStepId>,
    BranchStepDefinition<SharedStepId>,
    BranchStepDefinition<SharedStepId>,
    BranchStepDefinition<TStepId>,
    BranchStepDefinition<TStepId>,
    BranchStepDefinition<TStepId>,
  ];
  requiresPreCheckoutAvailability: boolean;
  requiresPreConfirmationAvailability: boolean;
  usesTransferHold: boolean;
}

export interface ContinueDisabledInput {
  stepIndex: number;
  isCheckingAvailability: boolean;
  isBranchActionLocked: boolean;
  stayReady: boolean;
  guestReady: boolean;
  paymentMethod: PaymentMethod | null;
}

const WEBSITE_BRANCH_CONFIG: BookingBranchConfig<WebsiteBranchStepId> = {
  method: "website",
  pendingStatus: "pending_online_payment",
  endLabel: "Booking Confirmed",
  steps: [
    "Stay Details",
    "Guest Details",
    "Payment Method",
    "Review & Checkout",
    "Payment Portal",
    "Booking Confirmed",
  ],
  stepDefinitions: [
    { id: "stay_details", label: "Stay Details", position: 1 },
    { id: "guest_details", label: "Guest Details", position: 2 },
    { id: "payment_method", label: "Payment Method", position: 3 },
    { id: "review_checkout", label: "Review & Checkout", position: 4 },
    { id: "payment_portal", label: "Payment Portal", position: 5 },
    { id: "booking_confirmed", label: "Booking Confirmed", position: 6 },
  ],
  requiresPreCheckoutAvailability: true,
  requiresPreConfirmationAvailability: false,
  usesTransferHold: false,
};

const TRANSFER_BRANCH_CONFIG: BookingBranchConfig<TransferBranchStepId> = {
  method: "transfer",
  pendingStatus: "pending_transfer_submission",
  endLabel: "Awaiting Payment Confirmation",
  steps: [
    "Stay Details",
    "Guest Details",
    "Payment Method",
    "Review Reservation",
    "Transfer Details",
    "Awaiting Payment Confirmation",
  ],
  stepDefinitions: [
    { id: "stay_details", label: "Stay Details", position: 1 },
    { id: "guest_details", label: "Guest Details", position: 2 },
    { id: "payment_method", label: "Payment Method", position: 3 },
    { id: "review_reservation", label: "Review Reservation", position: 4 },
    { id: "transfer_details", label: "Transfer Details", position: 5 },
    { id: "awaiting_payment_confirmation", label: "Awaiting Payment Confirmation", position: 6 },
  ],
  requiresPreCheckoutAvailability: false,
  requiresPreConfirmationAvailability: true,
  usesTransferHold: true,
};

const POS_BRANCH_CONFIG: BookingBranchConfig<PosBranchStepId> = {
  method: "pos",
  pendingStatus: "pending_pos_coordination",
  endLabel: "Reservation Request Submitted",
  steps: [
    "Stay Details",
    "Guest Details",
    "Payment Method",
    "Review Reservation",
    "POS Coordination",
    "Reservation Request Submitted",
  ],
  stepDefinitions: [
    { id: "stay_details", label: "Stay Details", position: 1 },
    { id: "guest_details", label: "Guest Details", position: 2 },
    { id: "payment_method", label: "Payment Method", position: 3 },
    { id: "review_reservation", label: "Review Reservation", position: 4 },
    { id: "pos_coordination", label: "POS Coordination", position: 5 },
    { id: "reservation_request_submitted", label: "Reservation Request Submitted", position: 6 },
  ],
  requiresPreCheckoutAvailability: false,
  requiresPreConfirmationAvailability: true,
  usesTransferHold: false,
};

export const BOOKING_BRANCH_CONFIG: Record<PaymentMethod, BookingBranchConfig> = {
  website: WEBSITE_BRANCH_CONFIG,
  transfer: TRANSFER_BRANCH_CONFIG,
  pos: POS_BRANCH_CONFIG,
};

export function getBranchConfig(method: PaymentMethod): BookingBranchConfig {
  return BOOKING_BRANCH_CONFIG[method];
}

export function getBranchStepLabels(method: PaymentMethod | null): BookingStepLabels {
  if (!method) {
    return [
      "Stay Details",
      "Guest Details",
      "Payment Method",
      "Review Reservation",
      "Branch Action",
      "Branch Outcome",
    ];
  }

  return getBranchConfig(method).steps;
}

export function getBranchEndLabel(method: PaymentMethod): string {
  return getBranchConfig(method).endLabel;
}

export function getPendingStatusForMethod(method: PaymentMethod): ReservationStatus {
  return getBranchConfig(method).pendingStatus;
}

export function shouldShowContinueButton(stepIndex: number): boolean {
  return stepIndex <= 3;
}

export function getContinueLabel(stepIndex: number, paymentMethod: PaymentMethod | null): string {
  if (stepIndex === 0) {
    return "Continue to Guest Details";
  }

  if (stepIndex === 1) {
    return "Continue to Payment Method";
  }

  if (stepIndex === 2) {
    return paymentMethod === "website" ? "Review & Checkout" : "Proceed to Review";
  }

  if (stepIndex === 3) {
    if (paymentMethod === "website") {
      return "Go to Payment Portal";
    }

    if (paymentMethod === "transfer") {
      return "Continue to Transfer Submission";
    }

    return "Proceed to POS Coordination";
  }

  return "Continue";
}

export function getOutcomeStepLabel(
  paymentMethod: PaymentMethod | null,
  reservationStatus: ReservationStatus,
  stepLabels: BookingStepLabels
): string {
  if (paymentMethod === "transfer" && reservationStatus === "cancelled") {
    return "Reservation Cancelled";
  }

  return stepLabels[5 as BookingStepIndex];
}

export function getAvailabilityReasonForStep(stepIndex: number, paymentMethod: PaymentMethod | null): string {
  if (stepIndex === 0) {
    return "when stay details were entered";
  }

  if (stepIndex === 2) {
    return "before creating hold/request";
  }

  if (stepIndex === 3 && paymentMethod === "website") {
    return "before online payment handoff";
  }

  return "before proceeding";
}

export function isContinueDisabled(input: ContinueDisabledInput): boolean {
  if (input.isCheckingAvailability || input.isBranchActionLocked) {
    return true;
  }

  if (input.stepIndex === 0) {
    return !input.stayReady;
  }

  if (input.stepIndex === 1) {
    return !input.guestReady;
  }

  if (input.stepIndex === 2 || input.stepIndex === 3) {
    return input.paymentMethod === null;
  }

  return false;
}

