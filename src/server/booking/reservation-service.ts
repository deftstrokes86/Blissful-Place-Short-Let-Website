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
  DraftCreateInput,
  DraftUpdateInput,
  ReservationPricingSnapshot,
} from "../../types/booking-backend";
import type {
  ReservationRepository,
  ReservationRepositoryReservation,
} from "./reservation-repository";

export interface ReservationInventoryGateway {
  reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void>;
}

interface ReservationServiceDependencies {
  repository: ReservationRepository;
  inventoryGateway: ReservationInventoryGateway;
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
  }
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

export class ReservationService {
  private readonly repository: ReservationRepository;
  private readonly inventoryGateway: ReservationInventoryGateway;
  private readonly nowProvider: () => Date;
  private readonly createId: () => string;
  private readonly createToken: () => string;

  constructor(dependencies: ReservationServiceDependencies) {
    this.repository = dependencies.repository;
    this.inventoryGateway = dependencies.inventoryGateway;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => `res_${randomUUID()}`);
    this.createToken = dependencies.createToken ?? (() => randomUUID());
  }

  async createDraftReservation(input: DraftCreateInput): Promise<ReservationRepositoryReservation> {
    const now = this.nowProvider();

    const reservation: ReservationRepositoryReservation = {
      id: this.createId(),
      token: this.createToken(),
      status: "draft",
      paymentMethod: input.paymentMethod ?? null,
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
      transferHoldStartedAt: null,
      transferHoldExpiresAt: null,
      inventoryReopenedAt: null,
      lastAvailabilityResult: null,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: toIso(now),
      updatedAt: toIso(now),
    };

    applyDraftPatch(reservation, input);
    reservation.pricing = await this.calculatePricingSnapshot(reservation.stay);

    return this.repository.create(reservation);
  }

  async updateDraftReservation(token: BookingToken, input: DraftUpdateInput): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(token);

    if (reservation.status !== "draft") {
      throw new Error("Only draft reservations can be updated.");
    }

    applyDraftPatch(reservation, input);
    reservation.pricing = await this.calculatePricingSnapshot(reservation.stay);
    reservation.updatedAt = toIso(this.nowProvider());

    return this.repository.update(reservation);
  }

  async getReservationByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    return this.repository.findByToken(token);
  }

  async transitionReservation(input: TransitionReservationInput): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(input.token);
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

    reservation.status = decision.to;
    reservation.updatedAt = toIso(now);

    if (input.event === "branch_request_created") {
      if (!input.paymentMethod) {
        throw new Error("Payment method is required when creating a branch request.");
      }

      reservation.paymentMethod = input.paymentMethod;
      if (input.paymentMethod === "transfer") {
        applyTransferHold(reservation, now);
      } else {
        clearTransferHold(reservation);
      }
    }

    if (input.event === "switch_payment_method" && input.paymentMethod) {
      reservation.paymentMethod = input.paymentMethod;
      if (input.paymentMethod === "transfer") {
        applyTransferHold(reservation, now);
      } else {
        clearTransferHold(reservation);
      }
    }

    if (decision.to === "confirmed") {
      reservation.confirmedAt = toIso(now);
    }

    if (decision.to === "cancelled") {
      reservation.cancelledAt = toIso(now);
    }

    if (shouldReopenInventory(decision.to)) {
      reservation.inventoryReopenedAt = toIso(now);
      await this.inventoryGateway.reopenAvailability(reservation.id, decision.to);
    }

    return this.repository.update(reservation);
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

