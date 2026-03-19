import { getPendingStatusForMethod } from "@/lib/booking-branch-config";
import type {
  AvailabilityCheckpoint,
  PaymentMethod,
  ReservationEventType,
  ReservationStatus,
} from "@/types/booking";

const ALLOWED_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  draft: ["pending_online_payment", "pending_transfer_submission", "pending_pos_coordination", "cancelled"],
  pending_online_payment: ["pending_online_payment", "confirmed", "failed_payment", "cancelled"],
  pending_transfer_submission: ["awaiting_transfer_verification", "cancelled"],
  awaiting_transfer_verification: ["confirmed", "cancelled"],
  pending_pos_coordination: ["confirmed", "cancelled"],
  confirmed: [],
  expired: [],
  cancelled: [],
  failed_payment: ["pending_online_payment", "pending_transfer_submission", "pending_pos_coordination", "cancelled"],
};

const FORBIDDEN_TRANSITION_REASONS: Partial<Record<`${ReservationStatus}->${ReservationStatus}`, string>> = {
  "pending_transfer_submission->confirmed": "Transfer flow requires proof submission and staff verification before confirmation.",
  "awaiting_transfer_verification->confirmed": "Transfer confirmation requires a still-valid hold window.",
  "pending_pos_coordination->confirmed": "POS flow requires completed POS payment before confirmation.",
  "failed_payment->confirmed": "Failed website payments must be retried or switched before confirmation.",
  "pending_online_payment->confirmed": "Website confirmation requires online payment success.",
  "draft->awaiting_transfer_verification": "Draft bookings cannot skip transfer submission state.",
  "draft->failed_payment": "Draft bookings cannot enter failed payment directly.",
  "cancelled->pending_online_payment": "Cancelled bookings cannot re-enter pending states directly.",
  "cancelled->pending_transfer_submission": "Cancelled bookings cannot re-enter pending states directly.",
  "cancelled->pending_pos_coordination": "Cancelled bookings cannot re-enter pending states directly.",
  "confirmed->pending_online_payment": "Confirmed bookings cannot re-enter pending states directly.",
  "confirmed->pending_transfer_submission": "Confirmed bookings cannot re-enter pending states directly.",
  "confirmed->pending_pos_coordination": "Confirmed bookings cannot re-enter pending states directly.",
};

const AVAILABILITY_REQUIREMENTS_BY_EVENT: Partial<Record<ReservationEventType, AvailabilityCheckpoint>> = {
  stay_details_submitted: "stay_details_entry",
  branch_request_created: "pre_hold_request",
  online_payment_handoff_requested: "pre_online_payment_handoff",
  try_online_payment_again: "pre_online_payment_handoff",
  switch_payment_method: "pre_hold_request",
  transfer_verified: "pre_transfer_confirmation",
  pos_payment_completed: "pre_pos_confirmation",
};

export interface TransitionInput {
  from: ReservationStatus;
  event: ReservationEventType;
  paymentMethod?: PaymentMethod;
  availabilityPassed?: boolean;
  withinTransferHold?: boolean;
  branchResetApplied?: boolean;
}

export interface TransitionDecision {
  allowed: boolean;
  from: ReservationStatus;
  to: ReservationStatus | null;
  event: ReservationEventType;
  reason: string;
  requiredAvailabilityCheckpoint: AvailabilityCheckpoint | null;
}

export interface BranchResetPlan {
  preserve: ["stay", "guest"];
  discard: ["website_transient", "transfer_transient", "pos_transient", "branch_messages"];
  rebuildFromStep: 3;
}

export const TRANSFER_HOLD_DURATION_MS = 60 * 60 * 1000;

export const BRANCH_RESET_PLAN: BranchResetPlan = {
  preserve: ["stay", "guest"],
  discard: ["website_transient", "transfer_transient", "pos_transient", "branch_messages"],
  rebuildFromStep: 3,
};

export function isTerminalReservationStatus(status: ReservationStatus): boolean {
  return status === "confirmed" || status === "cancelled" || status === "expired";
}

// Status-adjacency helper; use canTransitionForEvent for full guarded transition checks.
export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function canTransitionForEvent(input: TransitionInput): boolean {
  return getNextReservationState(input).allowed;
}

export function getForbiddenTransitionReason(from: ReservationStatus, to: ReservationStatus): string | null {
  const key: `${ReservationStatus}->${ReservationStatus}` = `${from}->${to}`;

  if (canTransition(from, to)) {
    return null;
  }

  return FORBIDDEN_TRANSITION_REASONS[key] ?? "Transition is not allowed by the booking state machine.";
}

export function getPendingStatusForPaymentMethod(method: PaymentMethod): ReservationStatus {
  return getPendingStatusForMethod(method);
}

export function getRequiredAvailabilityCheckpoint(event: ReservationEventType): AvailabilityCheckpoint | null {
  return AVAILABILITY_REQUIREMENTS_BY_EVENT[event] ?? null;
}

function guardAvailability(input: TransitionInput): string | null {
  const requiredCheckpoint = getRequiredAvailabilityCheckpoint(input.event);
  if (!requiredCheckpoint) {
    return null;
  }

  if (!input.availabilityPassed) {
    return `Availability checkpoint '${requiredCheckpoint}' must pass before this transition.`;
  }

  return null;
}

export function getNextReservationState(input: TransitionInput): TransitionDecision {
  const availabilityError = guardAvailability(input);
  if (availabilityError) {
    return {
      allowed: false,
      from: input.from,
      to: null,
      event: input.event,
      reason: availabilityError,
      requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
    };
  }

  if (input.from === "draft" && input.event === "stay_details_submitted") {
    return {
      allowed: true,
      from: input.from,
      to: "draft",
      event: input.event,
      reason: "Stay details checkpoint passed; reservation remains in draft until branch request creation.",
      requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
    };
  }

  if (input.from === "draft" && input.event === "payment_method_selected") {
    return {
      allowed: true,
      from: input.from,
      to: "draft",
      event: input.event,
      reason: "Payment method selected; reservation status remains draft until branch request creation.",
      requiredAvailabilityCheckpoint: null,
    };
  }

  if (input.event === "cancel_requested") {
    return {
      allowed: canTransition(input.from, "cancelled"),
      from: input.from,
      to: canTransition(input.from, "cancelled") ? "cancelled" : null,
      event: input.event,
      reason: canTransition(input.from, "cancelled")
        ? "Cancellation transition accepted."
        : getForbiddenTransitionReason(input.from, "cancelled") ?? "Cancellation transition denied.",
      requiredAvailabilityCheckpoint: null,
    };
  }

  if (input.from === "draft" && input.event === "branch_request_created") {
    if (!input.paymentMethod) {
      return {
        allowed: false,
        from: input.from,
        to: null,
        event: input.event,
        reason: "A payment method is required before creating a branch request.",
        requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
      };
    }

    const to = getPendingStatusForPaymentMethod(input.paymentMethod);
    return {
      allowed: canTransition(input.from, to),
      from: input.from,
      to,
      event: input.event,
      reason: "Branch request created and pending status activated.",
      requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
    };
  }

  if (input.from === "pending_online_payment") {
    if (input.event === "online_payment_handoff_requested") {
      return {
        allowed: true,
        from: input.from,
        to: "pending_online_payment",
        event: input.event,
        reason: "Online payment handoff requested while staying in pending online payment.",
        requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
      };
    }

    if (input.event === "online_payment_confirmed") {
      return {
        allowed: canTransition(input.from, "confirmed"),
        from: input.from,
        to: "confirmed",
        event: input.event,
        reason: "Online payment confirmed successfully.",
        requiredAvailabilityCheckpoint: null,
      };
    }

    if (input.event === "online_payment_failed") {
      return {
        allowed: canTransition(input.from, "failed_payment"),
        from: input.from,
        to: "failed_payment",
        event: input.event,
        reason: "Online payment failed.",
        requiredAvailabilityCheckpoint: null,
      };
    }

    if (input.event === "online_payment_cancelled") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        from: input.from,
        to: "cancelled",
        event: input.event,
        reason: "Online payment was cancelled.",
        requiredAvailabilityCheckpoint: null,
      };
    }
  }

  if (input.from === "failed_payment") {
    if (input.event === "try_online_payment_again") {
      return {
        allowed: canTransition(input.from, "pending_online_payment"),
        from: input.from,
        to: "pending_online_payment",
        event: input.event,
        reason: "Retrying website payment flow.",
        requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
      };
    }

    if (input.event === "switch_payment_method") {
      if (!input.paymentMethod) {
        return {
          allowed: false,
          from: input.from,
          to: null,
          event: input.event,
          reason: "Switching payment method requires a target payment method.",
          requiredAvailabilityCheckpoint: null,
        };
      }

      if (input.paymentMethod === "website") {
        return {
          allowed: false,
          from: input.from,
          to: null,
          event: input.event,
          reason: "Use 'try_online_payment_again' to continue website checkout after failed payment.",
          requiredAvailabilityCheckpoint: null,
        };
      }

      if (!input.branchResetApplied) {
        return {
          allowed: false,
          from: input.from,
          to: null,
          event: input.event,
          reason: "Branch reset must be applied before switching payment method.",
          requiredAvailabilityCheckpoint: null,
        };
      }

      const to = getPendingStatusForPaymentMethod(input.paymentMethod);
      return {
        allowed: canTransition(input.from, to),
        from: input.from,
        to,
        event: input.event,
        reason: "Payment method switched after failed payment with branch reset and availability recheck.",
        requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
      };
    }
  }

  if (input.from === "pending_transfer_submission") {
    if (input.event === "transfer_proof_submitted") {
      if (!input.withinTransferHold) {
        return {
          allowed: canTransition(input.from, "cancelled"),
          from: input.from,
          to: "cancelled",
          event: "transfer_hold_expired",
          reason: "Transfer hold expired before proof submission completed.",
          requiredAvailabilityCheckpoint: null,
        };
      }

      return {
        allowed: canTransition(input.from, "awaiting_transfer_verification"),
        from: input.from,
        to: "awaiting_transfer_verification",
        event: input.event,
        reason: "Transfer proof submitted within hold window.",
        requiredAvailabilityCheckpoint: null,
      };
    }

    if (input.event === "transfer_hold_expired") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        from: input.from,
        to: "cancelled",
        event: input.event,
        reason: "Transfer hold expired before required completion.",
        requiredAvailabilityCheckpoint: null,
      };
    }
  }

  if (input.from === "awaiting_transfer_verification") {
    if (input.event === "transfer_verified") {
      if (!input.withinTransferHold) {
        return {
          allowed: canTransition(input.from, "cancelled"),
          from: input.from,
          to: "cancelled",
          event: "transfer_hold_expired",
          reason: "Transfer verification attempted after hold expiry.",
          requiredAvailabilityCheckpoint: null,
        };
      }

      return {
        allowed: canTransition(input.from, "confirmed"),
        from: input.from,
        to: "confirmed",
        event: input.event,
        reason: "Transfer verified within hold window with final availability pass.",
        requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
      };
    }

    if (input.event === "transfer_hold_expired") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        from: input.from,
        to: "cancelled",
        event: input.event,
        reason: "Transfer hold expired before staff verification.",
        requiredAvailabilityCheckpoint: null,
      };
    }
  }

  if (input.from === "pending_pos_coordination" && input.event === "pos_payment_completed") {
    return {
      allowed: canTransition(input.from, "confirmed"),
      from: input.from,
      to: "confirmed",
      event: input.event,
      reason: "POS payment completed with final availability pass.",
      requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
    };
  }

  return {
    allowed: false,
    from: input.from,
    to: null,
    event: input.event,
    reason: "Event is not valid for the current reservation state.",
    requiredAvailabilityCheckpoint: getRequiredAvailabilityCheckpoint(input.event),
  };
}

export function getBranchResetPlan(): BranchResetPlan {
  return BRANCH_RESET_PLAN;
}

export function getAllowedTransitionsMap(): Readonly<Record<ReservationStatus, readonly ReservationStatus[]>> {
  return ALLOWED_TRANSITIONS;
}



