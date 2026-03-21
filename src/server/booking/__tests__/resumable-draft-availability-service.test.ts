import assert from "node:assert/strict";

import {
  ResumedDraftAvailabilityError,
  ResumedDraftAvailabilityService,
} from "../resumable-draft-availability-service";
import type { AvailabilityCheckResult } from "../availability-service";
import type { BookingToken, PaymentMethod } from "../../../types/booking";
import type { ResumableDraftSession } from "../resumable-draft-service";
import type { ReservationRepositoryReservation } from "../reservation-repository";

class StubDraftService {
  private readonly sessions = new Map<BookingToken, ResumableDraftSession>();

  constructor(initial: ResumableDraftSession[]) {
    for (const session of initial) {
      this.sessions.set(session.resumeToken, cloneSession(session));
    }
  }

  async loadResumableDraft(token: BookingToken): Promise<ResumableDraftSession> {
    const session = this.sessions.get(token);
    if (!session) {
      throw new Error("Draft reservation not found.");
    }

    return cloneSession(session);
  }
}

class StubAvailabilityService {
  nextByCheckpoint = new Map<string, AvailabilityCheckResult>();
  calls: Array<{ checkpoint: string; method: PaymentMethod | null; reservationId: string }> = [];

  async runPreHoldRecheck(
    stay: ReservationRepositoryReservation["stay"],
    method: PaymentMethod,
    reservationId?: string
  ): Promise<AvailabilityCheckResult> {
    this.calls.push({
      checkpoint: "pre_hold_request",
      method,
      reservationId: reservationId ?? "",
    });

    return this.resolve("pre_hold_request", stay.flatId);
  }

  async runPreCheckoutRecheck(
    stay: ReservationRepositoryReservation["stay"],
    reservationId?: string
  ): Promise<AvailabilityCheckResult> {
    this.calls.push({
      checkpoint: "pre_online_payment_handoff",
      method: "website",
      reservationId: reservationId ?? "",
    });

    return this.resolve("pre_online_payment_handoff", stay.flatId);
  }

  async runPreConfirmationRecheck(
    stay: ReservationRepositoryReservation["stay"],
    method: "transfer" | "pos",
    reservationId?: string
  ): Promise<AvailabilityCheckResult> {
    const checkpoint = method === "transfer" ? "pre_transfer_confirmation" : "pre_pos_confirmation";
    this.calls.push({
      checkpoint,
      method,
      reservationId: reservationId ?? "",
    });

    return this.resolve(checkpoint, stay.flatId);
  }

  private resolve(checkpoint: string, flatId: string): AvailabilityCheckResult {
    const found = this.nextByCheckpoint.get(checkpoint);
    if (found) {
      return found;
    }

    return createAvailabilityResult(checkpoint, true, `Availability passed for ${flatId}`);
  }
}

function createReservation(overrides?: Partial<ReservationRepositoryReservation>): ReservationRepositoryReservation {
  return {
    id: "res_resume",
    token: "token_resume_1",
    status: "draft",
    paymentMethod: "transfer",
    stay: {
      flatId: "mayfair",
      checkIn: "2026-12-10",
      checkOut: "2026-12-14",
      guests: 2,
      extraIds: ["airport", "pantry"],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "Quiet floor please",
    },
    pricing: {
      currency: "NGN",
      nightlyRate: 250000,
      nights: 4,
      staySubtotal: 1000000,
      extrasSubtotal: 110000,
      estimatedTotal: 1110000,
    },
    progressContext: {
      currentStep: 4,
      activeBranch: "transfer",
    },
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    lastTouchedAt: "2026-11-01T10:00:00.000Z",
    ...overrides,
  };
}

function createSession(reservation: ReservationRepositoryReservation): ResumableDraftSession {
  return {
    resumeToken: reservation.token,
    reservation: cloneReservation(reservation),
    branchContext: {
      resolvedPaymentMethod: reservation.paymentMethod,
      resumeStepIndex: 4,
      savedProgressStep: reservation.progressContext.currentStep,
      stepLabels: [
        "Stay Details",
        "Guest Details",
        "Payment Method",
        "Review Reservation",
        "Transfer Details",
        "Awaiting Payment Confirmation",
      ],
      stayReady: true,
      guestReady: true,
    },
    availabilityRevalidationNeeds: {
      createBranchRequest: reservation.status === "draft",
      onlinePaymentHandoff: reservation.status === "pending_online_payment",
      transferConfirmation: reservation.status === "awaiting_transfer_verification",
      posConfirmation: reservation.status === "pending_pos_coordination",
      requiredCheckpoints: reservation.status === "draft" ? ["pre_hold_request"] : [],
    },
  };
}

function createAvailabilityResult(
  checkpoint: string,
  isAvailable: boolean,
  reason: string
): AvailabilityCheckResult {
  return {
    intent: "pre_hold",
    checkpoint: checkpoint as AvailabilityCheckResult["checkpoint"],
    isAvailable,
    checkedAt: "2026-11-01T10:05:00.000Z",
    reasons: [reason],
    conflicts: isAvailable
      ? []
      : [
          {
            code: "sold_out",
            field: "stay",
            message: "Those dates are currently held or booked for the selected residence.",
          },
        ],
    inventoryVersion: "inventory-test",
  };
}

function cloneReservation(value: ReservationRepositoryReservation): ReservationRepositoryReservation {
  return {
    ...value,
    stay: {
      ...value.stay,
      extraIds: [...value.stay.extraIds],
    },
    guest: {
      ...value.guest,
    },
    pricing: {
      ...value.pricing,
    },
    progressContext: {
      ...value.progressContext,
    },
  };
}

function cloneSession(value: ResumableDraftSession): ResumableDraftSession {
  return {
    ...value,
    reservation: cloneReservation(value.reservation),
    branchContext: {
      ...value.branchContext,
      stepLabels: [...value.branchContext.stepLabels] as typeof value.branchContext.stepLabels,
    },
    availabilityRevalidationNeeds: {
      ...value.availabilityRevalidationNeeds,
      requiredCheckpoints: [...value.availabilityRevalidationNeeds.requiredCheckpoints],
    },
  };
}

function createHarness(
  reservationOverrides?: Partial<ReservationRepositoryReservation>,
  availabilityOverrides?: Partial<AvailabilityCheckResult>
) {
  const reservation = createReservation(reservationOverrides);
  const session = createSession(reservation);
  const draftService = new StubDraftService([session]);
  const availabilityService = new StubAvailabilityService();

  if (availabilityOverrides) {
    availabilityService.nextByCheckpoint.set("pre_hold_request", {
      ...createAvailabilityResult("pre_hold_request", true, "pre-hold passed"),
      ...availabilityOverrides,
    });
  }

  const service = new ResumedDraftAvailabilityService({
    draftService,
    availabilityService,
  });

  return {
    service,
    reservation,
    availabilityService,
  };
}

async function testResumedDraftWithStillValidDates(): Promise<void> {
  const { service, availabilityService } = createHarness(undefined, {
    isAvailable: true,
    reasons: ["Availability check passed at pre_hold_request."],
    conflicts: [],
  });

  const result = await service.revalidateBeforeCriticalProgression({
    token: "token_resume_1",
    checkpoint: "pre_hold_request",
  });

  assert.equal(result.canProceed, true);
  assert.equal(result.requiresStayUpdate, false);
  assert.equal(result.blockingMessage, null);
  assert.equal(availabilityService.calls.length, 1);
  assert.equal(availabilityService.calls[0].checkpoint, "pre_hold_request");
}

async function testResumedDraftWithNowInvalidDates(): Promise<void> {
  const { service } = createHarness(undefined, {
    isAvailable: false,
    reasons: ["Inventory overlap found with availability block block_1."],
    conflicts: [
      {
        code: "sold_out",
        field: "stay",
        message: "Those dates are currently held or booked for the selected residence.",
      },
    ],
  });

  const result = await service.revalidateBeforeCriticalProgression({
    token: "token_resume_1",
    checkpoint: "pre_hold_request",
  });

  assert.equal(result.canProceed, false);
  assert.equal(result.requiresStayUpdate, true);
  assert.match(result.blockingMessage ?? "", /no longer available/i);
}

async function testBlockedProgressionWhenDatesNoLongerAvailable(): Promise<void> {
  const { service } = createHarness(undefined, {
    isAvailable: false,
    reasons: ["Inventory overlap found with availability block block_1."],
    conflicts: [
      {
        code: "sold_out",
        field: "stay",
        message: "Those dates are currently held or booked for the selected residence.",
      },
    ],
  });

  await assert.rejects(
    async () => {
      await service.assertCriticalProgressionAvailable({
        token: "token_resume_1",
        checkpoint: "pre_hold_request",
      });
    },
    (error: unknown) =>
      error instanceof ResumedDraftAvailabilityError &&
      /no longer available/i.test(error.message) &&
      error.result.canProceed === false
  );
}

async function testPreservesNonDateDataWhenRevalidationFails(): Promise<void> {
  const { service, reservation } = createHarness(
    {
      paymentMethod: "pos",
      guest: {
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@example.com",
        phone: "+23411111111",
        specialRequests: "Late check-in",
      },
      stay: {
        flatId: "kensington",
        checkIn: "2026-12-20",
        checkOut: "2026-12-24",
        guests: 3,
        extraIds: ["celebration"],
      },
      progressContext: {
        currentStep: 4,
        activeBranch: "pos",
      },
    },
    {
      isAvailable: false,
      reasons: ["Inventory overlap found with availability block block_2."],
      conflicts: [
        {
          code: "sold_out",
          field: "stay",
          message: "Those dates are currently held or booked for the selected residence.",
        },
      ],
    }
  );

  const result = await service.revalidateBeforeCriticalProgression({
    token: "token_resume_1",
    checkpoint: "pre_hold_request",
  });

  assert.equal(result.canProceed, false);
  assert.equal(result.session.reservation.guest.email, "grace@example.com");
  assert.equal(result.session.reservation.paymentMethod, "pos");
  assert.equal(result.session.reservation.stay.extraIds[0], "celebration");
  assert.equal(result.session.reservation.progressContext.currentStep, 4);
  assert.equal(reservation.token, result.session.resumeToken);
}

async function run(): Promise<void> {
  await testResumedDraftWithStillValidDates();
  await testResumedDraftWithNowInvalidDates();
  await testBlockedProgressionWhenDatesNoLongerAvailable();
  await testPreservesNonDateDataWhenRevalidationFails();

  console.log("resumable-draft-availability-service: ok");
}

void run();
