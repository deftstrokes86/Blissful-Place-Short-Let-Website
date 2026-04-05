// LEGACY FILE-DB BOUNDARY:
// This service still persists to the JSON file database and is pending future migration or removal.
// It is not part of the Prisma + Payload + Supabase runtime path.
// Active runtime routes should use the Prisma-backed services under src/server/booking/*.

import { randomUUID } from "node:crypto";

import { calculateBookingPricing } from "@/lib/booking-pricing";
import {
  getNextReservationState,
  getRequiredAvailabilityCheckpoint,
  isWithinTransferHold,
  TRANSFER_HOLD_DURATION_MS,
} from "@/lib/booking-state-machine";
import {
  createDatabaseId,
  readBookingDatabase,
  withBookingDatabase,
} from "@/server/db/file-database";
import { bookingAvailabilityService } from "@/server/services/availability-service";
import { executeWithIdempotency } from "@/server/services/idempotency-service";
import type {
  BookingActor,
  BookingId,
  BookingToken,
  ExtraId,
  PaymentMethod,
  ReservationEventType,
  ReservationStatus,
  StayDetailsInput,
} from "@/types/booking";
import type {
  DraftCreateInput,
  DraftProgressContext,
  DraftProgressStep,
  DraftUpdateInput,
  ReservationEventRecord,
  ReservationPricingSnapshot,
  ReservationRecord,
} from "@/types/booking-backend";

interface TransitionInput {
  token: BookingToken;
  event: ReservationEventType;
  actor: BookingActor;
  paymentMethod?: PaymentMethod;
  availabilityPassed?: boolean;
  branchResetApplied?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

interface BranchRequestInput {
  token: BookingToken;
  paymentMethod: PaymentMethod;
  actor: BookingActor;
  idempotencyKey: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createDefaultStay(): StayDetailsInput {
  const now = new Date();
  const checkIn = now.toISOString().slice(0, 10);
  const checkOut = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    flatId: "mayfair",
    checkIn,
    checkOut,
    guests: 1,
    extraIds: [],
  };
}

function createDefaultGuest() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  };
}

const MIN_DRAFT_STEP: DraftProgressStep = 0;
const MAX_DRAFT_STEP: DraftProgressStep = 5;

function isDraftProgressStep(value: unknown): value is DraftProgressStep {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_DRAFT_STEP && value <= MAX_DRAFT_STEP;
}

function defaultProgressContext(paymentMethod: PaymentMethod | null): DraftProgressContext {
  return {
    currentStep: MIN_DRAFT_STEP,
    activeBranch: paymentMethod,
  };
}

function applyProgressContextPatch(reservation: ReservationRecord, input: DraftUpdateInput | DraftCreateInput): void {
  if (!input.progressContext) {
    return;
  }

  if (Object.prototype.hasOwnProperty.call(input.progressContext, "currentStep")) {
    const nextStep = input.progressContext.currentStep;
    if (nextStep === null) {
      reservation.progressContext.currentStep = null;
    } else if (isDraftProgressStep(nextStep)) {
      reservation.progressContext.currentStep = nextStep;
    } else {
      throw new Error("Invalid draft progress currentStep. Expected a step between 0 and 5.");
    }
  }

  if (Object.prototype.hasOwnProperty.call(input.progressContext, "activeBranch")) {
    reservation.progressContext.activeBranch = input.progressContext.activeBranch ?? null;
  }
}

function buildPricingSnapshot(
  reservation: Pick<ReservationRecord, "stay">,
  nightlyRate: number | null,
  extrasCatalog: readonly { id: ExtraId; flatFee: number }[]
): ReservationPricingSnapshot {
  const pricing = calculateBookingPricing({
    selectedFlatRate: nightlyRate,
    checkIn: reservation.stay.checkIn,
    checkOut: reservation.stay.checkOut,
    selectedExtraIds: reservation.stay.extraIds,
    extrasCatalog: extrasCatalog.map((item) => ({ id: item.id, price: item.flatFee })),
  });

  return {
    currency: "NGN",
    nightlyRate,
    nights: pricing.nights,
    staySubtotal: pricing.staySubtotal,
    extrasSubtotal: pricing.extrasSubtotal,
    estimatedTotal: pricing.estimatedTotal,
  };
}

function createEventRecord(
  reservationId: BookingId,
  event: ReservationEventType,
  actor: BookingActor,
  metadata: Record<string, string | number | boolean | null>
): ReservationEventRecord {
  return {
    id: createDatabaseId("evt"),
    reservationId,
    type: event,
    actor,
    at: nowIso(),
    metadata,
  };
}

function applyDraftPatch(reservation: ReservationRecord, input: DraftUpdateInput | DraftCreateInput): void {
  if (input.stay) {
    reservation.stay = {
      ...reservation.stay,
      ...input.stay,
      extraIds: input.stay.extraIds ? [...input.stay.extraIds] : reservation.stay.extraIds,
    };
  }

  if (input.guest) {
    reservation.guest = {
      ...reservation.guest,
      ...input.guest,
    };
  }

  if (Object.prototype.hasOwnProperty.call(input, "paymentMethod")) {
    reservation.paymentMethod = input.paymentMethod ?? null;
    if (!input.progressContext || input.progressContext.activeBranch === undefined) {
      reservation.progressContext.activeBranch = reservation.paymentMethod;
    }
  }

  applyProgressContextPatch(reservation, input);
}

function shouldReopenInventory(status: ReservationStatus): boolean {
  return status === "cancelled" || status === "expired";
}

function applyTransferHoldForMethodChange(reservation: ReservationRecord, status: ReservationStatus): void {
  if (status === "pending_transfer_submission") {
    const startedAt = nowIso();
    const expiresAt = new Date(Date.now() + TRANSFER_HOLD_DURATION_MS).toISOString();
    reservation.transferHoldStartedAt = startedAt;
    reservation.transferHoldExpiresAt = expiresAt;
    return;
  }

  if (status === "pending_online_payment" || status === "pending_pos_coordination") {
    reservation.transferHoldStartedAt = null;
    reservation.transferHoldExpiresAt = null;
  }
}

export class ReservationDomainService {
  async createDraft(input: DraftCreateInput, idempotencyKey: string): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: idempotencyKey,
      action: "reservation.create_draft",
      payload: input,
      execute: async () => {
        return withBookingDatabase(async (db) => {
          const createdAt = nowIso();
          const reservation: ReservationRecord = {
            id: createDatabaseId("res"),
            token: randomUUID(),
            status: "draft",
            paymentMethod: input.paymentMethod ?? null,
            progressContext: defaultProgressContext(input.paymentMethod ?? null),
            stay: createDefaultStay(),
            guest: createDefaultGuest(),
            pricing: {
              currency: "NGN",
              nightlyRate: null,
              nights: null,
              staySubtotal: null,
              extrasSubtotal: 0,
              estimatedTotal: null,
            },
            transferHoldStartedAt: null,
            transferHoldExpiresAt: null,
            inventoryReopenedAt: null,
            lastAvailabilityResult: null,
            confirmedAt: null,
            cancelledAt: null,
            createdAt,
            updatedAt: createdAt,
            lastTouchedAt: createdAt,
          };

          applyDraftPatch(reservation, input);

          const flat = db.flats.find((item) => item.id === reservation.stay.flatId) ?? null;
          reservation.pricing = buildPricingSnapshot(reservation, flat?.nightlyRate ?? null, db.extras);
          reservation.lastAvailabilityResult = await bookingAvailabilityService.runInitialAvailabilityCheck(
            reservation.stay
          );

          db.reservations.push(reservation);
          db.reservationEvents.push(
            createEventRecord(reservation.id, "stay_details_submitted", "guest", {
              source: "createDraft",
              availabilityPassed: reservation.lastAvailabilityResult.isAvailable,
            })
          );

          return reservation;
        });
      },
    });
  }

  async updateDraft(token: BookingToken, input: DraftUpdateInput, idempotencyKey: string): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: idempotencyKey,
      action: "reservation.update_draft",
      payload: { token, input },
      execute: async () => {
        return withBookingDatabase(async (db) => {
          const reservation = db.reservations.find((item) => item.token === token);
          if (!reservation) {
            throw new Error("Reservation draft not found.");
          }

          if (reservation.status !== "draft") {
            throw new Error("Only draft reservations can be updated directly.");
          }

          applyDraftPatch(reservation, input);

          const flat = db.flats.find((item) => item.id === reservation.stay.flatId) ?? null;
          reservation.pricing = buildPricingSnapshot(reservation, flat?.nightlyRate ?? null, db.extras);
          reservation.lastAvailabilityResult = await bookingAvailabilityService.runInitialAvailabilityCheck(
            reservation.stay,
            reservation.id
          );
          const updatedAt = nowIso();
          reservation.updatedAt = updatedAt;
          reservation.lastTouchedAt = updatedAt;

          return reservation;
        });
      },
    });
  }

  async getDraft(token: BookingToken): Promise<ReservationRecord | null> {
    const db = await readBookingDatabase();
    return db.reservations.find((item) => item.token === token) ?? null;
  }

  async getReservationByToken(token: BookingToken): Promise<ReservationRecord | null> {
    return this.getDraft(token);
  }

  async createBranchRequest(input: BranchRequestInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "reservation.create_branch_request",
      reservationId: null,
      payload: input,
      execute: async () => {
        return withBookingDatabase(async (db) => {
          const reservation = db.reservations.find((item) => item.token === input.token);
          if (!reservation) {
            throw new Error("Reservation not found.");
          }

          reservation.paymentMethod = input.paymentMethod;
          reservation.progressContext.activeBranch = input.paymentMethod;

          const availability = await bookingAvailabilityService.runPreHoldRecheck(
            reservation.stay,
            input.paymentMethod,
            reservation.id
          );
          reservation.lastAvailabilityResult = availability;

          const decision = getNextReservationState({
            from: reservation.status,
            event: "branch_request_created",
            paymentMethod: input.paymentMethod,
            availabilityPassed: availability.isAvailable,
          });

          if (!decision.allowed || !decision.to) {
            throw new Error(decision.reason);
          }

          reservation.status = decision.to;
          const updatedAt = nowIso();
          reservation.updatedAt = updatedAt;
          reservation.lastTouchedAt = updatedAt;

          if (input.paymentMethod === "transfer") {
            const startedAt = nowIso();
            const expiresAt = new Date(Date.now() + TRANSFER_HOLD_DURATION_MS).toISOString();
            reservation.transferHoldStartedAt = startedAt;
            reservation.transferHoldExpiresAt = expiresAt;
          } else {
            reservation.transferHoldStartedAt = null;
            reservation.transferHoldExpiresAt = null;
          }

          db.reservationEvents.push(
            createEventRecord(reservation.id, "branch_request_created", input.actor, {
              paymentMethod: input.paymentMethod,
              availabilityPassed: availability.isAvailable,
            })
          );

          return reservation;
        });
      },
    });
  }

  async transitionReservationStatus(input: TransitionInput): Promise<ReservationRecord> {
    return withBookingDatabase(async (db) => {
      const reservation = db.reservations.find((item) => item.token === input.token);
      if (!reservation) {
        throw new Error("Reservation not found.");
      }

      let availabilityPassed = input.availabilityPassed ?? false;
      const requiredCheckpoint = getRequiredAvailabilityCheckpoint(input.event);

      if (requiredCheckpoint && input.availabilityPassed === undefined) {
        if (requiredCheckpoint === "pre_online_payment_handoff") {
          const availability = await bookingAvailabilityService.runPreCheckoutRecheck(reservation.stay, reservation.id);
          reservation.lastAvailabilityResult = availability;
          availabilityPassed = availability.isAvailable;
        }

        if (requiredCheckpoint === "pre_transfer_confirmation") {
          const availability = await bookingAvailabilityService.runPreConfirmationRecheck(
            reservation.stay,
            "transfer",
            reservation.id
          );
          reservation.lastAvailabilityResult = availability;
          availabilityPassed = availability.isAvailable;
        }

        if (requiredCheckpoint === "pre_pos_confirmation") {
          const availability = await bookingAvailabilityService.runPreConfirmationRecheck(
            reservation.stay,
            "pos",
            reservation.id
          );
          reservation.lastAvailabilityResult = availability;
          availabilityPassed = availability.isAvailable;
        }
      }

      const decision = getNextReservationState({
        from: reservation.status,
        event: input.event,
        paymentMethod: input.paymentMethod ?? reservation.paymentMethod ?? undefined,
        availabilityPassed,
        withinTransferHold: isWithinTransferHold(
          reservation.transferHoldExpiresAt ? new Date(reservation.transferHoldExpiresAt).getTime() : null
        ),
        branchResetApplied: input.branchResetApplied,
      });

      if (!decision.allowed || !decision.to) {
        throw new Error(decision.reason);
      }

      reservation.status = decision.to;
      const updatedAt = nowIso();
      reservation.updatedAt = updatedAt;
      reservation.lastTouchedAt = updatedAt;

      if (input.event === "switch_payment_method" && input.paymentMethod) {
        reservation.paymentMethod = input.paymentMethod;
        reservation.progressContext.activeBranch = input.paymentMethod;
        applyTransferHoldForMethodChange(reservation, decision.to);
      }

      if (decision.to === "confirmed") {
        reservation.confirmedAt = nowIso();
      }

      if (shouldReopenInventory(decision.to)) {
        reservation.inventoryReopenedAt = nowIso();
        if (decision.to === "cancelled") {
          reservation.cancelledAt = reservation.inventoryReopenedAt;
        }
      }

      db.reservationEvents.push(
        createEventRecord(reservation.id, decision.event, input.actor, {
          availabilityPassed,
          ...input.metadata,
        })
      );

      return reservation;
    });
  }

  async cancelReservation(token: BookingToken, actor: BookingActor): Promise<ReservationRecord> {
    return this.transitionReservationStatus({
      token,
      event: "cancel_requested",
      actor,
      availabilityPassed: true,
    });
  }

  async expireTransferHolds(nowMs: number = Date.now()): Promise<ReservationRecord[]> {
    const db = await readBookingDatabase();
    const candidates = db.reservations.filter((reservation) => {
      if (
        reservation.status !== "pending_transfer_submission" &&
        reservation.status !== "awaiting_transfer_verification"
      ) {
        return false;
      }

      if (!reservation.transferHoldExpiresAt) {
        return false;
      }

      return new Date(reservation.transferHoldExpiresAt).getTime() < nowMs;
    });

    const updated: ReservationRecord[] = [];

    for (const reservation of candidates) {
      const transitioned = await this.transitionReservationStatus({
        token: reservation.token,
        event: "transfer_hold_expired",
        actor: "system",
        availabilityPassed: true,
        metadata: {
          expiredAt: new Date(nowMs).toISOString(),
        },
      });
      updated.push(transitioned);
    }

    return updated;
  }
}

export const reservationDomainService = new ReservationDomainService();







