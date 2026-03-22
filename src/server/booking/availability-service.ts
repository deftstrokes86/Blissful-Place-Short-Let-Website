import { randomUUID } from "node:crypto";

import { calculateNightCount, parseIsoDate } from "../../lib/booking-pricing";
import {
  CalendarAvailabilityService,
  type CalendarAvailabilityBlock,
} from "./calendar-availability-service";
import type {
  AvailabilityCheckpoint,
  AvailabilityConflict,
  AvailabilityResult,
  FlatId,
  PaymentMethod,
  ReservationStatus,
  StayDetailsInput,
} from "../../types/booking";
import type { FlatReadinessRecord } from "../../types/booking-backend";

const INVENTORY_BLOCKING_STATUSES: readonly ReservationStatus[] = [
  "pending_transfer_submission",
  "awaiting_transfer_verification",
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

export interface AvailabilityRepositoryBlock {
  id: string;
  flatId: FlatId;
  sourceType: "reservation" | "manual";
  sourceId: string;
  blockType: "hard_block" | "soft_hold";
  startDate: string;
  endDate: string;
  status: "active" | "released";
  expiresAt: string | null;
}

export interface AvailabilityRepository {
  findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null>;
  listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]>;
  listAvailabilityBlocksByFlat?(flatId: FlatId): Promise<AvailabilityRepositoryBlock[]>;
  findFlatReadiness?(flatId: FlatId): Promise<FlatReadinessRecord | null>;
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
  const firstStart = parseIsoDate(firstStartIso.slice(0, 10) as never);
  const firstEnd = parseIsoDate(firstEndIso.slice(0, 10) as never);
  const secondStart = parseIsoDate(secondStartIso.slice(0, 10) as never);
  const secondEnd = parseIsoDate(secondEndIso.slice(0, 10) as never);

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) {
    return false;
  }

  // Check-in inclusive, check-out exclusive.
  return firstStart < secondEnd && secondStart < firstEnd;
}

export class AvailabilityService {
  private readonly repository: AvailabilityRepository;
  private readonly nowProvider: () => Date;
  private readonly inventoryVersionFactory: () => string;
  private readonly calendarAvailabilityService: CalendarAvailabilityService | null;

  constructor(dependencies: AvailabilityServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.inventoryVersionFactory = dependencies.createInventoryVersion ?? (() => `inventory-${randomUUID()}`);
    this.calendarAvailabilityService = this.createCalendarAvailabilityService();
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
    const now = this.nowProvider();
    const checkedAt = now.toISOString();
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

    if (nightCount !== null) {
      const overlapReason = await this.findOverlappingConflict(input);
      if (overlapReason) {
        conflicts.push({
          code: "sold_out",
          field: "stay",
          message: "Those dates are currently held or booked for the selected residence.",
        });
        reasons.push(overlapReason);
      }
    }

    const readiness = await this.findFlatReadiness(input.stay.flatId);
    if (readiness?.readinessStatus === "out_of_service") {
      conflicts.push({
        code: "sold_out",
        field: "flat",
        message: "Selected residence is currently out of service.",
      });
      reasons.push("Selected residence is currently out of service due operational readiness.");
    } else if (readiness?.readinessStatus === "needs_attention") {
      reasons.push("Selected residence readiness needs attention. Staff follow-up may be required.");
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

  private createCalendarAvailabilityService(): CalendarAvailabilityService | null {
    if (!this.repository.listAvailabilityBlocksByFlat) {
      return null;
    }

    const listBlocksByFlat = this.repository.listAvailabilityBlocksByFlat.bind(this.repository);

    return new CalendarAvailabilityService({
      repository: {
        listByFlat: async (flatId: FlatId): Promise<CalendarAvailabilityBlock[]> => {
          const blocks = await listBlocksByFlat(flatId);
          return blocks.map((block) => ({
            id: block.id,
            flatId: block.flatId,
            sourceType: block.sourceType,
            sourceId: block.sourceId,
            blockType: block.blockType,
            startDate: block.startDate,
            endDate: block.endDate,
            status: block.status,
            expiresAt: block.expiresAt,
          }));
        },
      },
      now: this.nowProvider,
    });
  }

  private async findOverlappingConflict(input: CheckInput): Promise<string | null> {
    if (this.calendarAvailabilityService) {
      const overlap = await this.calendarAvailabilityService.checkProposedStayAvailability({
        flatId: input.stay.flatId,
        checkIn: input.stay.checkIn,
        checkOut: input.stay.checkOut,
        excludeSourceId: input.reservationId,
      });

      if (overlap.overlappingBlocks.length > 0) {
        return `Inventory overlap found with availability block ${overlap.overlappingBlocks[0].blockId}.`;
      }
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

    if (!overlappingReservation) {
      return null;
    }

    return `Inventory overlap found with reservation ${overlappingReservation.id}.`;
  }

  private async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    if (!this.repository.findFlatReadiness) {
      return null;
    }

    return this.repository.findFlatReadiness(flatId);
  }
}
