import assert from "node:assert/strict";

import type { BookingActor, BookingToken, PaymentMethod } from "../../../types/booking";
import type { DraftCreateInput, DraftUpdateInput, ReservationRecord } from "../../../types/booking-backend";
import type { AvailabilityCheckResult } from "../availability-service";
import type { WebsitePaymentIdempotencyGateway } from "../idempotency-service";
import { LegacyGuestReservationService } from "../legacy-guest-reservation-service";

class InMemoryIdempotencyGateway implements WebsitePaymentIdempotencyGateway {
  private readonly snapshots = new Map<string, { payload: string; result: unknown }>();

  async run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    reservationId?: string | null;
    execute: () => Promise<TResult>;
  }): Promise<TResult> {
    void input.reservationId;
    const snapshotKey = `${input.action}:${input.key}`;
    const payload = JSON.stringify(input.payload);
    const existing = this.snapshots.get(snapshotKey);

    if (existing) {
      if (existing.payload !== payload) {
        throw new Error(`Idempotency conflict for key '${input.key}' and action '${input.action}'.`);
      }

      return existing.result as TResult;
    }

    const result = await input.execute();
    this.snapshots.set(snapshotKey, { payload, result });
    return result;
  }
}

class StubDraftService {
  readonly createdInputs: DraftCreateInput[] = [];
  readonly savedInputs: Array<{ token: BookingToken; input: DraftUpdateInput }> = [];

  async createDraft(input: DraftCreateInput) {
    this.createdInputs.push(input);
    return {
      resumeToken: "draft_resume_token",
      reservation: createReservation({
        id: "res_created",
        token: "draft_resume_token",
        stay: {
          flatId: input.stay?.flatId ?? "mayfair",
          checkIn: input.stay?.checkIn ?? "2026-07-10",
          checkOut: input.stay?.checkOut ?? "2026-07-12",
          guests: input.stay?.guests ?? 2,
          extraIds: input.stay?.extraIds ?? [],
        },
      }),
    };
  }

  async saveDraftProgress(token: BookingToken, input: DraftUpdateInput) {
    this.savedInputs.push({ token, input });
    return {
      resumeToken: token,
      reservation: createReservation({
        token,
        paymentMethod: input.paymentMethod ?? null,
      }),
    };
  }
}

class StubReservationService {
  readonly transitionCalls: Array<{
    token: BookingToken;
    event: string;
    actor: BookingActor;
    paymentMethod?: PaymentMethod;
    availabilityPassed?: boolean;
  }> = [];
  private readonly reservations = new Map<BookingToken, ReservationRecord>();

  constructor(reservations: ReservationRecord[]) {
    for (const reservation of reservations) {
      this.reservations.set(reservation.token, cloneReservation(reservation));
    }
  }

  async getReservationByToken(token: BookingToken): Promise<ReservationRecord | null> {
    const reservation = this.reservations.get(token);
    return reservation ? cloneReservation(reservation) : null;
  }

  async transitionReservation(input: {
    token: BookingToken;
    event: "branch_request_created" | "cancel_requested";
    actor: BookingActor;
    paymentMethod?: PaymentMethod;
    availabilityPassed?: boolean;
  }): Promise<ReservationRecord> {
    const reservation = this.reservations.get(input.token);

    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    this.transitionCalls.push({
      token: input.token,
      event: input.event,
      actor: input.actor,
      paymentMethod: input.paymentMethod,
      availabilityPassed: input.availabilityPassed,
    });

    if (input.event === "branch_request_created") {
      reservation.paymentMethod = input.paymentMethod ?? reservation.paymentMethod;
      reservation.status =
        input.paymentMethod === "transfer"
          ? "pending_transfer_submission"
          : input.paymentMethod === "pos"
            ? "pending_pos_coordination"
            : "pending_online_payment";
    }

    if (input.event === "cancel_requested") {
      reservation.status = "cancelled";
      reservation.cancelledAt = "2026-07-01T12:00:00.000Z";
    }

    reservation.updatedAt = "2026-07-01T12:00:00.000Z";
    reservation.lastTouchedAt = reservation.updatedAt;

    return cloneReservation(reservation);
  }
}

class StubAvailabilityService {
  calls = 0;
  result: AvailabilityCheckResult;

  constructor(result: AvailabilityCheckResult) {
    this.result = result;
  }

  async runPreHoldRecheck(): Promise<AvailabilityCheckResult> {
    this.calls += 1;
    return this.result;
  }
}

function createAvailabilityResult(isAvailable: boolean): AvailabilityCheckResult {
  return {
    intent: "pre_hold",
    checkpoint: "pre_hold_request",
    isAvailable,
    checkedAt: "2026-07-01T11:00:00.000Z",
    reasons: isAvailable ? ["Availability check passed at pre_hold_request."] : ["Availability check failed."],
    conflicts: isAvailable
      ? []
      : [
          {
            code: "sold_out",
            field: "stay",
            message: "Those dates are currently held or booked for the selected residence.",
          },
        ],
    inventoryVersion: "inventory-version-1",
  };
}

function createReservation(overrides: Partial<ReservationRecord> = {}): ReservationRecord {
  return {
    id: "res_legacy",
    token: "token_legacy",
    status: "draft",
    paymentMethod: null,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
      guests: 2,
      extraIds: [],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "",
    },
    pricing: {
      currency: "NGN",
      nightlyRate: null,
      nights: null,
      staySubtotal: null,
      extrasSubtotal: 0,
      estimatedTotal: null,
    },
    progressContext: {
      currentStep: 2,
      activeBranch: null,
    },
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    lastTouchedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

function cloneReservation(value: ReservationRecord): ReservationRecord {
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
    lastAvailabilityResult: value.lastAvailabilityResult
      ? {
          ...value.lastAvailabilityResult,
          reasons: [...value.lastAvailabilityResult.reasons],
          conflicts: value.lastAvailabilityResult.conflicts.map((conflict) => ({ ...conflict })),
        }
      : null,
  };
}

function createServiceHarness(options?: {
  reservation?: ReservationRecord;
  availabilityResult?: AvailabilityCheckResult;
}) {
  const reservation = options?.reservation ?? createReservation();
  const draftService = new StubDraftService();
  const reservationService = new StubReservationService([reservation]);
  const availabilityService = new StubAvailabilityService(
    options?.availabilityResult ?? createAvailabilityResult(true)
  );
  const idempotencyGateway = new InMemoryIdempotencyGateway();

  const service = new LegacyGuestReservationService({
    draftService,
    reservationService,
    availabilityService,
    idempotencyGateway,
  });

  return {
    service,
    draftService,
    reservationService,
    availabilityService,
  };
}

async function testCreateDraftReturnsReservationPayload(): Promise<void> {
  const { service, draftService } = createServiceHarness();

  const reservation = await service.createDraft(
    {
      stay: {
        flatId: "mayfair",
        checkIn: "2026-08-01",
        checkOut: "2026-08-03",
        guests: 2,
        extraIds: ["airport"],
      },
    },
    "draft-key"
  );

  assert.equal(draftService.createdInputs.length, 1);
  assert.equal(reservation.id, "res_created");
  assert.equal(reservation.token, "draft_resume_token");
}

async function testBranchRequestIdempotentReplayDoesNotRepeatAvailabilityCheck(): Promise<void> {
  const { service, reservationService, availabilityService } = createServiceHarness();

  const first = await service.createBranchRequest({
    token: "token_legacy",
    paymentMethod: "website",
    actor: "guest",
    idempotencyKey: "branch-key",
  });
  const replay = await service.createBranchRequest({
    token: "token_legacy",
    paymentMethod: "website",
    actor: "guest",
    idempotencyKey: "branch-key",
  });

  assert.equal(first.status, "pending_online_payment");
  assert.equal(replay.status, "pending_online_payment");
  assert.equal(availabilityService.calls, 1);
  assert.equal(reservationService.transitionCalls.length, 1);
}

async function testBranchRequestAvailabilityFailureSurfacesConflictStatus(): Promise<void> {
  const { service } = createServiceHarness({
    availabilityResult: createAvailabilityResult(false),
  });

  await assert.rejects(
    async () => {
      await service.createBranchRequest({
        token: "token_legacy",
        paymentMethod: "transfer",
        actor: "guest",
        idempotencyKey: "branch-unavailable",
      });
    },
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, "Pre-hold availability recheck failed.");
      assert.equal((error as Error & { httpStatus?: number }).httpStatus, 409);
      return true;
    }
  );
}

async function testCancelReservationWithoutIdempotencyTransitionsDirectly(): Promise<void> {
  const { service, reservationService } = createServiceHarness();

  const reservation = await service.cancelReservation({
    token: "token_legacy",
    actor: "guest",
  });

  assert.equal(reservation.status, "cancelled");
  assert.equal(reservationService.transitionCalls.length, 1);
  assert.equal(reservationService.transitionCalls[0]?.event, "cancel_requested");
}

async function run(): Promise<void> {
  await testCreateDraftReturnsReservationPayload();
  await testBranchRequestIdempotentReplayDoesNotRepeatAvailabilityCheck();
  await testBranchRequestAvailabilityFailureSurfacesConflictStatus();
  await testCancelReservationWithoutIdempotencyTransitionsDirectly();

  console.log("legacy-guest-reservation-service: ok");
}

void run();
