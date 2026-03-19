import { randomUUID } from "node:crypto";

import { calculateNightCount, parseIsoDate } from "../../lib/booking-pricing";
import type {
  AvailabilityCheckpoint,
  AvailabilityConflict,
  AvailabilityResult,
  FlatId,
  PaymentMethod,
  ReservationStatus,
  StayDetailsInput,
} from "../../types/booking";

const INVENTORY_BLOCKING_STATUSES: readonly ReservationStatus[] = [
  "pending_online_payment",
  "pending_transfer_submission",
  "awaiting_transfer_verification",
  "pending_pos_coordination",
  "confirmed",
];

export type AvailabilityCheckIntent =
  | "initial"
  | "pre_hold"
  | "pre_checkout"
  | "pre_confirmation_transfer"
  | "pre_confirmation_pos";

export interface AvailabilityCheckResult extends AvailabilityResult {
  intent: AvailabilityCheckIntent;
}

export interface AvailabilityRepositoryFlat {
  id: FlatId;
  maxGuests: number;
}

export interface AvailabilityRepositoryReservation {
  id: string;
  status: ReservationStatus;
  stay: Pick<StayDetailsInput, "flatId" | "checkIn" | "checkOut">;
}

export interface AvailabilityRepository {
  findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null>;
  listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]>;
}

interface AvailabilityServiceDependencies {
  repository: AvailabilityRepository;
  now?: () => Date;
  createInventoryVersion?: () => string;
}

interface CheckInput {
  intent: AvailabilityCheckIntent;
  checkpoint: AvailabilityCheckpoint;
  stay: StayDetailsInput;
  reservationId?: string;
}

function toUnavailable(
  input: CheckInput,
  checkedAt: string,
  inventoryVersion: string,
  conflicts: AvailabilityConflict[],
  reasons: string[]
): AvailabilityCheckResult {
  return {
    intent: input.intent,
    checkpoint: input.checkpoint,
    isAvailable: false,
    checkedAt,
    reasons,
    conflicts,
    inventoryVersion,
  };
}

function toAvailable(
  input: CheckInput,
  checkedAt: string,
  inventoryVersion: string,
  reasons: string[]
): AvailabilityCheckResult {
  return {
    intent: input.intent,
    checkpoint: input.checkpoint,
    isAvailable: true,
    checkedAt,
    reasons,
    conflicts: [],
    inventoryVersion,
  };
}

function dateRangesOverlap(
  firstStartIso: string,
  firstEndIso: string,
  secondStartIso: string,
  secondEndIso: string
): boolean {
  const firstStart = parseIsoDate(firstStartIso as never);
  const firstEnd = parseIsoDate(firstEndIso as never);
  const secondStart = parseIsoDate(secondStartIso as never);
  const secondEnd = parseIsoDate(secondEndIso as never);

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) {
    return false;
  }

  return firstStart < secondEnd && secondStart < firstEnd;
}

export class AvailabilityService {
  private readonly repository: AvailabilityRepository;
  private readonly nowProvider: () => Date;
  private readonly inventoryVersionFactory: () => string;

  constructor(dependencies: AvailabilityServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.inventoryVersionFactory = dependencies.createInventoryVersion ?? (() => `inventory-${randomUUID()}`);
  }

  async runInitialAvailabilityCheck(stay: StayDetailsInput, reservationId?: string): Promise<AvailabilityCheckResult> {
    return this.check({
      intent: "initial",
      checkpoint: "stay_details_entry",
      stay,
      reservationId,
    });
  }

  async runPreHoldRecheck(
    stay: StayDetailsInput,
    _paymentMethod: PaymentMethod,
    reservationId?: string
  ): Promise<AvailabilityCheckResult> {
    return this.check({
      intent: "pre_hold",
      checkpoint: "pre_hold_request",
      stay,
      reservationId,
    });
  }

  async runPreCheckoutRecheck(stay: StayDetailsInput, reservationId?: string): Promise<AvailabilityCheckResult> {
    return this.check({
      intent: "pre_checkout",
      checkpoint: "pre_online_payment_handoff",
      stay,
      reservationId,
    });
  }

  async runPreConfirmationRecheck(
    stay: StayDetailsInput,
    paymentMethod: "transfer" | "pos",
    reservationId?: string
  ): Promise<AvailabilityCheckResult> {
    if (paymentMethod === "transfer") {
      return this.check({
        intent: "pre_confirmation_transfer",
        checkpoint: "pre_transfer_confirmation",
        stay,
        reservationId,
      });
    }

    return this.check({
      intent: "pre_confirmation_pos",
      checkpoint: "pre_pos_confirmation",
      stay,
      reservationId,
    });
  }

  private async check(input: CheckInput): Promise<AvailabilityCheckResult> {
    const checkedAt = this.nowProvider().toISOString();
    const inventoryVersion = this.inventoryVersionFactory();

    const conflicts: AvailabilityConflict[] = [];
    const reasons: string[] = [];

    const nightCount = calculateNightCount(input.stay.checkIn, input.stay.checkOut);
    if (nightCount === null) {
      conflicts.push({
        code: "invalid_window",
        field: "dates",
        message: "Check-out must be after check-in.",
      });
    }

    if (input.stay.guests < 1) {
      conflicts.push({
        code: "capacity_exceeded",
        field: "guests",
        message: "At least one guest is required.",
      });
    }

    const flat = await this.repository.findFlatById(input.stay.flatId);
    if (!flat) {
      conflicts.push({
        code: "sold_out",
        field: "flat",
        message: "Selected residence is not available.",
      });
    } else if (input.stay.guests > flat.maxGuests) {
      conflicts.push({
        code: "capacity_exceeded",
        field: "guests",
        message: `Selected residence supports up to ${flat.maxGuests} guests.`,
      });
    }

    const reservations = await this.repository.listReservationsByFlat(input.stay.flatId);
    const overlappingReservation = reservations.find((reservation) => {
      if (!INVENTORY_BLOCKING_STATUSES.includes(reservation.status)) {
        return false;
      }

      if (input.reservationId && reservation.id === input.reservationId) {
        return false;
      }

      return dateRangesOverlap(
        reservation.stay.checkIn,
        reservation.stay.checkOut,
        input.stay.checkIn,
        input.stay.checkOut
      );
    });

    if (overlappingReservation) {
      conflicts.push({
        code: "sold_out",
        field: "stay",
        message: "Those dates are currently held or booked for the selected residence.",
      });
      reasons.push(`Inventory overlap found with reservation ${overlappingReservation.id}.`);
    }

    if (conflicts.length > 0) {
      if (reasons.length === 0) {
        reasons.push(`Availability check failed at ${input.checkpoint}.`);
      }

      return toUnavailable(input, checkedAt, inventoryVersion, conflicts, reasons);
    }

    reasons.push(`Availability check passed at ${input.checkpoint}.`);
    return toAvailable(input, checkedAt, inventoryVersion, reasons);
  }
}
