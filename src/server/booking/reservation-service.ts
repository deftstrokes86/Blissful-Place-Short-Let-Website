import { randomUUID } from "node:crypto";

import {
  getNextReservationState,
  isWithinTransferHold,
  TRANSFER_HOLD_DURATION_MS,
} from "./reservation-state-machine";
import { computeReservationPricing } from "./reservation-pricing";
import type {
  BookingActor,
  BookingToken,
  PaymentMethod,
  ReservationEventType,
  ReservationStatus,
  StayDetailsInput,
} from "../../types/booking";
import type {
  DraftProgressContext,
  DraftProgressStep,
  DraftCreateInput,
  DraftUpdateInput,
  ReservationPricingSnapshot,
} from "../../types/booking-backend";
import type { ReservationNotificationGateway } from "./notification-service";
import type {
  ReservationRepository,
  ReservationRepositoryReservation,
} from "./reservation-repository";

export interface ReservationInventoryGateway {
  syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void>;
  reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void>;
}

interface ReservationServiceDependencies {
  repository: ReservationRepository;
  inventoryGateway: ReservationInventoryGateway;
  notificationGateway?: ReservationNotificationGateway;
  now?: () => Date;
  createId?: () => string;
  createToken?: () => string;
}

export interface TransitionReservationInput {
  token: BookingToken;
  event: ReservationEventType;
  actor: BookingActor;
  paymentMethod?: PaymentMethod;
  availabilityPassed?: boolean;
  branchResetApplied?: boolean;
  metadata?: Record<string, string | number | boolean | null>;
}

export class ReservationTransitionError extends Error {
  readonly code = "reservation_transition_denied";
}

function toIso(date: Date): string {
  return date.toISOString();
}

function createDefaultStay(now: Date): StayDetailsInput {
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

const MIN_DRAFT_STEP: DraftProgressStep = 0;
const MAX_DRAFT_STEP: DraftProgressStep = 5;

function isValidDraftStep(value: number): value is DraftProgressStep {
  return Number.isInteger(value) && value >= MIN_DRAFT_STEP && value <= MAX_DRAFT_STEP;
}

function normalizeProgressStep(
  step: DraftProgressStep | null | undefined,
  fallback: DraftProgressStep | null
): DraftProgressStep | null {
  if (step === undefined) {
    return fallback;
  }

  if (step === null) {
    return null;
  }

  if (!isValidDraftStep(step)) {
    throw new Error("Invalid draft progress currentStep. Expected a step between 0 and 5.");
  }

  return step;
}

function defaultProgressContext(paymentMethod: PaymentMethod | null): DraftProgressContext {
  return {
    currentStep: MIN_DRAFT_STEP,
    activeBranch: paymentMethod,
  };
}

function applyDraftProgressPatch(
  reservation: ReservationRepositoryReservation,
  input: DraftCreateInput | DraftUpdateInput
): void {
  if (!input.progressContext) {
    return;
  }

  reservation.progressContext = {
    currentStep: normalizeProgressStep(input.progressContext.currentStep, reservation.progressContext.currentStep),
    activeBranch:
      input.progressContext.activeBranch === undefined
        ? reservation.progressContext.activeBranch
        : input.progressContext.activeBranch,
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

function applyDraftPatch(reservation: ReservationRepositoryReservation, input: DraftCreateInput | DraftUpdateInput): void {
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
      reservation.progressContext = {
        ...reservation.progressContext,
        activeBranch: reservation.paymentMethod,
      };
    }
  }

  applyDraftProgressPatch(reservation, input);
}

function shouldReopenInventory(status: ReservationStatus): status is "cancelled" | "expired" {
  return status === "cancelled" || status === "expired";
}

function applyTransferHold(reservation: ReservationRepositoryReservation, now: Date): void {
  reservation.transferHoldStartedAt = toIso(now);
  reservation.transferHoldExpiresAt = toIso(new Date(now.getTime() + TRANSFER_HOLD_DURATION_MS));
}

function clearTransferHold(reservation: ReservationRepositoryReservation): void {
  reservation.transferHoldStartedAt = null;
  reservation.transferHoldExpiresAt = null;
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

export class ReservationService {
  private readonly repository: ReservationRepository;
  private readonly inventoryGateway: ReservationInventoryGateway;
  private readonly notificationGateway: ReservationNotificationGateway | null;
  private readonly nowProvider: () => Date;
  private readonly createId: () => string;
  private readonly createToken: () => string;

  constructor(dependencies: ReservationServiceDependencies) {
    this.repository = dependencies.repository;
    this.inventoryGateway = dependencies.inventoryGateway;
    this.notificationGateway = dependencies.notificationGateway ?? null;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => `res_${randomUUID()}`);
    this.createToken = dependencies.createToken ?? (() => randomUUID());
  }

  async createDraftReservation(input: DraftCreateInput): Promise<ReservationRepositoryReservation> {
    const now = this.nowProvider();
    const nowIso = toIso(now);
    const paymentMethod = input.paymentMethod ?? null;

    const reservation: ReservationRepositoryReservation = {
      id: this.createId(),
      token: this.createToken(),
      status: "draft",
      paymentMethod,
      stay: createDefaultStay(now),
      guest: createDefaultGuest(),
      pricing: {
        currency: "NGN",
        nightlyRate: null,
        nights: null,
        staySubtotal: null,
        extrasSubtotal: 0,
        estimatedTotal: null,
      },
      progressContext: defaultProgressContext(paymentMethod),
      transferHoldStartedAt: null,
      transferHoldExpiresAt: null,
      inventoryReopenedAt: null,
      lastAvailabilityResult: null,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastTouchedAt: nowIso,
    };

    applyDraftPatch(reservation, input);
    reservation.pricing = await this.calculatePricingSnapshot(reservation.stay);
    await this.inventoryGateway.syncAvailabilityBlock(reservation);

    return this.repository.create(reservation);
  }

  async updateDraftReservation(token: BookingToken, input: DraftUpdateInput): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(token);

    if (reservation.status !== "draft") {
      throw new Error("Only draft reservations can be updated.");
    }

    applyDraftPatch(reservation, input);
    reservation.pricing = await this.calculatePricingSnapshot(reservation.stay);
    const now = this.nowProvider();
    const nowIso = toIso(now);
    reservation.updatedAt = nowIso;
    reservation.lastTouchedAt = nowIso;
    await this.inventoryGateway.syncAvailabilityBlock(reservation);

    return this.repository.update(reservation);
  }

  async getReservationByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    return this.repository.findByToken(token);
  }

  async transitionReservation(input: TransitionReservationInput): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(input.token);
    const previous = cloneReservation(reservation);
    const now = this.nowProvider();

    const decision = getNextReservationState({
      from: reservation.status,
      event: input.event,
      paymentMethod: input.paymentMethod ?? reservation.paymentMethod ?? undefined,
      availabilityPassed: input.availabilityPassed,
      branchResetApplied: input.branchResetApplied,
      withinTransferHold: isWithinTransferHold(
        reservation.transferHoldExpiresAt ? new Date(reservation.transferHoldExpiresAt).getTime() : null,
        now.getTime()
      ),
    });

    if (!decision.allowed || !decision.to) {
      throw new ReservationTransitionError(decision.reason);
    }

    const nowIso = toIso(now);
    reservation.status = decision.to;
    reservation.updatedAt = nowIso;
    reservation.lastTouchedAt = nowIso;

    if (input.event === "branch_request_created") {
      if (!input.paymentMethod) {
        throw new Error("Payment method is required when creating a branch request.");
      }

      reservation.paymentMethod = input.paymentMethod;
      reservation.progressContext = {
        ...reservation.progressContext,
        activeBranch: input.paymentMethod,
      };

      if (input.paymentMethod === "transfer") {
        applyTransferHold(reservation, now);
      } else {
        clearTransferHold(reservation);
      }
    }

    if (input.event === "switch_payment_method" && input.paymentMethod) {
      reservation.paymentMethod = input.paymentMethod;
      reservation.progressContext = {
        ...reservation.progressContext,
        activeBranch: input.paymentMethod,
      };

      if (input.paymentMethod === "transfer") {
        applyTransferHold(reservation, now);
      } else {
        clearTransferHold(reservation);
      }
    }

    if (decision.to === "confirmed") {
      reservation.confirmedAt = nowIso;
    }

    if (decision.to === "cancelled") {
      reservation.cancelledAt = nowIso;
    }

    await this.inventoryGateway.syncAvailabilityBlock(reservation);

    if (shouldReopenInventory(decision.to)) {
      reservation.inventoryReopenedAt = nowIso;
      await this.inventoryGateway.reopenAvailability(reservation.id, decision.to);
    }

    const persisted = await this.repository.update(reservation);

    if (this.notificationGateway) {
      await this.notificationGateway.onReservationTransition({
        previous,
        current: persisted,
        event: input.event,
        actor: input.actor,
        metadata: input.metadata,
      });
    }

    return persisted;
  }

  async expireTransferHolds(): Promise<ReservationRepositoryReservation[]> {
    const nowIso = toIso(this.nowProvider());
    const candidates = await this.repository.listTransferHoldExpiringBefore(nowIso);

    const updated: ReservationRepositoryReservation[] = [];
    for (const candidate of candidates) {
      const transitioned = await this.transitionReservation({
        token: candidate.token,
        event: "transfer_hold_expired",
        actor: "system",
        availabilityPassed: true,
      });
      updated.push(transitioned);
    }

    return updated;
  }

  private async calculatePricingSnapshot(stay: StayDetailsInput): Promise<ReservationPricingSnapshot> {
    const flat = await this.repository.findFlatById(stay.flatId);
    const extras = await this.repository.listExtras();

    const computed = computeReservationPricing({
      nightlyRate: flat?.nightlyRate ?? null,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      selectedExtraIds: [...stay.extraIds],
      extrasCatalog: extras,
    });

    return {
      currency: "NGN",
      nightlyRate: flat?.nightlyRate ?? null,
      nights: computed.nights,
      staySubtotal: computed.staySubtotal,
      extrasSubtotal: computed.extrasSubtotal,
      estimatedTotal: computed.estimatedTotal,
    };
  }

  private async requireReservation(token: BookingToken): Promise<ReservationRepositoryReservation> {
    const reservation = await this.repository.findByToken(token);
    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    return reservation;
  }
}
