import type { AvailabilityCheckpoint, BookingToken, PaymentMethod } from "../../types/booking";
import type { AvailabilityCheckResult } from "./availability-service";
import type { ResumableDraftService, ResumableDraftSession } from "./resumable-draft-service";

export type ResumableDraftCriticalCheckpoint =
  | "pre_hold_request"
  | "pre_online_payment_handoff"
  | "pre_transfer_confirmation"
  | "pre_pos_confirmation";

interface ResumedDraftAvailabilityDependencies {
  draftService: Pick<ResumableDraftService, "loadResumableDraft">;
  availabilityService: {
    runPreHoldRecheck(
      stay: ResumableDraftSession["reservation"]["stay"],
      paymentMethod: PaymentMethod,
      reservationId?: string
    ): Promise<AvailabilityCheckResult>;
    runPreCheckoutRecheck(
      stay: ResumableDraftSession["reservation"]["stay"],
      reservationId?: string
    ): Promise<AvailabilityCheckResult>;
    runPreConfirmationRecheck(
      stay: ResumableDraftSession["reservation"]["stay"],
      paymentMethod: "transfer" | "pos",
      reservationId?: string
    ): Promise<AvailabilityCheckResult>;
  };
}

export interface ResumedDraftRevalidationResult {
  token: BookingToken;
  checkpoint: AvailabilityCheckpoint;
  session: ResumableDraftSession;
  availability: AvailabilityCheckResult;
  canProceed: boolean;
  requiresStayUpdate: boolean;
  blockingMessage: string | null;
  guidance: string | null;
}

const STALE_AVAILABILITY_MESSAGE =
  "Saved dates are no longer available. Update your stay details or choose another residence to continue.";
const STALE_AVAILABILITY_GUIDANCE = "Update your check-in/check-out or choose another residence, then continue.";

export class ResumedDraftAvailabilityError extends Error {
  readonly result: ResumedDraftRevalidationResult;

  constructor(result: ResumedDraftRevalidationResult) {
    super(result.blockingMessage ?? "Availability revalidation failed for resumed draft.");
    this.name = "ResumedDraftAvailabilityError";
    this.result = result;
  }
}

export class ResumedDraftAvailabilityService {
  private readonly draftService: ResumedDraftAvailabilityDependencies["draftService"];
  private readonly availabilityService: ResumedDraftAvailabilityDependencies["availabilityService"];

  constructor(dependencies: ResumedDraftAvailabilityDependencies) {
    this.draftService = dependencies.draftService;
    this.availabilityService = dependencies.availabilityService;
  }

  async revalidateBeforeCriticalProgression(input: {
    token: BookingToken;
    checkpoint: ResumableDraftCriticalCheckpoint;
  }): Promise<ResumedDraftRevalidationResult> {
    const session = await this.draftService.loadResumableDraft(input.token);
    const availability = await this.runCheckpointCheck(session, input.checkpoint);

    if (availability.isAvailable) {
      return {
        token: input.token,
        checkpoint: input.checkpoint,
        session,
        availability,
        canProceed: true,
        requiresStayUpdate: false,
        blockingMessage: null,
        guidance: null,
      };
    }

    return {
      token: input.token,
      checkpoint: input.checkpoint,
      session,
      availability,
      canProceed: false,
      requiresStayUpdate: true,
      blockingMessage: STALE_AVAILABILITY_MESSAGE,
      guidance: STALE_AVAILABILITY_GUIDANCE,
    };
  }

  async assertCriticalProgressionAvailable(input: {
    token: BookingToken;
    checkpoint: ResumableDraftCriticalCheckpoint;
  }): Promise<ResumedDraftRevalidationResult> {
    const result = await this.revalidateBeforeCriticalProgression(input);

    if (!result.canProceed) {
      throw new ResumedDraftAvailabilityError(result);
    }

    return result;
  }

  private async runCheckpointCheck(
    session: ResumableDraftSession,
    checkpoint: ResumableDraftCriticalCheckpoint
  ): Promise<AvailabilityCheckResult> {
    const stay = session.reservation.stay;
    const reservationId = session.reservation.id;
    const paymentMethod = this.resolvePaymentMethod(session);

    if (checkpoint === "pre_hold_request") {
      if (!paymentMethod) {
        throw new Error("Payment method is required before pre-hold availability recheck.");
      }

      return this.availabilityService.runPreHoldRecheck(stay, paymentMethod, reservationId);
    }

    if (checkpoint === "pre_online_payment_handoff") {
      if (paymentMethod !== "website") {
        throw new Error("Pre-checkout availability recheck requires website payment method.");
      }

      return this.availabilityService.runPreCheckoutRecheck(stay, reservationId);
    }

    if (checkpoint === "pre_transfer_confirmation") {
      if (paymentMethod !== "transfer") {
        throw new Error("Transfer confirmation availability recheck requires transfer payment method.");
      }

      return this.availabilityService.runPreConfirmationRecheck(stay, "transfer", reservationId);
    }

    if (paymentMethod !== "pos") {
      throw new Error("POS confirmation availability recheck requires POS payment method.");
    }

    return this.availabilityService.runPreConfirmationRecheck(stay, "pos", reservationId);
  }

  private resolvePaymentMethod(session: ResumableDraftSession): PaymentMethod | null {
    return session.branchContext.resolvedPaymentMethod ?? session.reservation.paymentMethod;
  }
}
