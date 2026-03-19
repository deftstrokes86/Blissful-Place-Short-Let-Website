import type { PaymentMethod, ReservationEventType, ReservationStatus } from "../../types/booking";

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

const AVAILABILITY_REQUIRED_EVENTS: Partial<Record<ReservationEventType, true>> = {
  stay_details_submitted: true,
  branch_request_created: true,
  online_payment_handoff_requested: true,
  try_online_payment_again: true,
  switch_payment_method: true,
  transfer_verified: true,
  pos_payment_completed: true,
};

export const TRANSFER_HOLD_DURATION_MS = 60 * 60 * 1000;

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
  to: ReservationStatus | null;
  event: ReservationEventType;
  reason: string;
}

function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function pendingStatusForPaymentMethod(method: PaymentMethod): ReservationStatus {
  if (method === "website") {
    return "pending_online_payment";
  }

  if (method === "transfer") {
    return "pending_transfer_submission";
  }

  return "pending_pos_coordination";
}

function requiresAvailability(event: ReservationEventType): boolean {
  return AVAILABILITY_REQUIRED_EVENTS[event] ?? false;
}

export function isWithinTransferHold(holdExpiresAt: number | null, nowMs: number): boolean {
  return holdExpiresAt !== null && nowMs <= holdExpiresAt;
}

export function getNextReservationState(input: TransitionInput): TransitionDecision {
  if (requiresAvailability(input.event) && !input.availabilityPassed) {
    return {
      allowed: false,
      to: null,
      event: input.event,
      reason: "Availability checkpoint must pass before this transition.",
    };
  }

  if (input.from === "draft" && input.event === "payment_method_selected") {
    return {
      allowed: true,
      to: "draft",
      event: input.event,
      reason: "Payment method selected while draft remains active.",
    };
  }

  if (input.from === "draft" && input.event === "stay_details_submitted") {
    return {
      allowed: true,
      to: "draft",
      event: input.event,
      reason: "Stay details captured while draft remains active.",
    };
  }

  if (input.event === "cancel_requested") {
    return {
      allowed: canTransition(input.from, "cancelled"),
      to: canTransition(input.from, "cancelled") ? "cancelled" : null,
      event: input.event,
      reason: canTransition(input.from, "cancelled") ? "Cancellation accepted." : "Cancellation transition denied.",
    };
  }

  if (input.from === "draft" && input.event === "branch_request_created") {
    if (!input.paymentMethod) {
      return {
        allowed: false,
        to: null,
        event: input.event,
        reason: "A payment method is required before branch request creation.",
      };
    }

    const to = pendingStatusForPaymentMethod(input.paymentMethod);
    return {
      allowed: canTransition(input.from, to),
      to,
      event: input.event,
      reason: "Branch request created.",
    };
  }

  if (input.from === "pending_online_payment") {
    if (input.event === "online_payment_handoff_requested") {
      return { allowed: true, to: "pending_online_payment", event: input.event, reason: "Handoff requested." };
    }

    if (input.event === "online_payment_confirmed") {
      return {
        allowed: canTransition(input.from, "confirmed"),
        to: canTransition(input.from, "confirmed") ? "confirmed" : null,
        event: input.event,
        reason: "Online payment confirmed.",
      };
    }

    if (input.event === "online_payment_failed") {
      return {
        allowed: canTransition(input.from, "failed_payment"),
        to: canTransition(input.from, "failed_payment") ? "failed_payment" : null,
        event: input.event,
        reason: "Online payment failed.",
      };
    }

    if (input.event === "online_payment_cancelled") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        to: canTransition(input.from, "cancelled") ? "cancelled" : null,
        event: input.event,
        reason: "Online payment cancelled.",
      };
    }
  }

  if (input.from === "failed_payment") {
    if (input.event === "try_online_payment_again") {
      return {
        allowed: canTransition(input.from, "pending_online_payment"),
        to: canTransition(input.from, "pending_online_payment") ? "pending_online_payment" : null,
        event: input.event,
        reason: "Retrying website payment.",
      };
    }

    if (input.event === "switch_payment_method") {
      if (!input.paymentMethod) {
        return { allowed: false, to: null, event: input.event, reason: "Target payment method is required." };
      }

      if (input.paymentMethod === "website") {
        return {
          allowed: false,
          to: null,
          event: input.event,
          reason: "Use try_online_payment_again for website retries.",
        };
      }

      if (!input.branchResetApplied) {
        return {
          allowed: false,
          to: null,
          event: input.event,
          reason: "Branch reset is required before switching payment method.",
        };
      }

      const to = pendingStatusForPaymentMethod(input.paymentMethod);
      return {
        allowed: canTransition(input.from, to),
        to: canTransition(input.from, to) ? to : null,
        event: input.event,
        reason: "Payment method switched after failed website payment.",
      };
    }
  }

  if (input.from === "pending_transfer_submission") {
    if (input.event === "transfer_proof_submitted") {
      if (!input.withinTransferHold) {
        return {
          allowed: canTransition(input.from, "cancelled"),
          to: canTransition(input.from, "cancelled") ? "cancelled" : null,
          event: "transfer_hold_expired",
          reason: "Transfer hold expired before proof submission.",
        };
      }

      return {
        allowed: canTransition(input.from, "awaiting_transfer_verification"),
        to: canTransition(input.from, "awaiting_transfer_verification") ? "awaiting_transfer_verification" : null,
        event: input.event,
        reason: "Transfer proof submitted in hold window.",
      };
    }

    if (input.event === "transfer_hold_expired") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        to: canTransition(input.from, "cancelled") ? "cancelled" : null,
        event: input.event,
        reason: "Transfer hold expired.",
      };
    }
  }

  if (input.from === "awaiting_transfer_verification") {
    if (input.event === "transfer_verified") {
      if (!input.withinTransferHold) {
        return {
          allowed: canTransition(input.from, "cancelled"),
          to: canTransition(input.from, "cancelled") ? "cancelled" : null,
          event: "transfer_hold_expired",
          reason: "Transfer verification attempted after hold expiry.",
        };
      }

      return {
        allowed: canTransition(input.from, "confirmed"),
        to: canTransition(input.from, "confirmed") ? "confirmed" : null,
        event: input.event,
        reason: "Transfer verified in hold window.",
      };
    }

    if (input.event === "transfer_hold_expired") {
      return {
        allowed: canTransition(input.from, "cancelled"),
        to: canTransition(input.from, "cancelled") ? "cancelled" : null,
        event: input.event,
        reason: "Transfer hold expired.",
      };
    }
  }

  if (input.from === "pending_pos_coordination" && input.event === "pos_payment_completed") {
    return {
      allowed: canTransition(input.from, "confirmed"),
      to: canTransition(input.from, "confirmed") ? "confirmed" : null,
      event: input.event,
      reason: "POS payment completed.",
    };
  }

  return {
    allowed: false,
    to: null,
    event: input.event,
    reason: "Event is not valid for the current reservation state.",
  };
}
