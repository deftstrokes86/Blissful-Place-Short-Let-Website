// LEGACY FILE-DB BOUNDARY:
// This service still persists to the JSON file database and is pending future migration or removal.
// It is not part of the Prisma + Payload + Supabase runtime path.
// Active runtime routes should use the Prisma-backed services under src/server/booking/*.

import { randomUUID } from "node:crypto";

import { calculateNightCount, parseIsoDate } from "@/lib/booking-pricing";
import { readBookingDatabase } from "@/server/db/file-database";
import type {
  AvailabilityCheckpoint,
  AvailabilityConflict,
  AvailabilityResult,
  PaymentMethod,
  ReservationStatus,
  StayDetailsInput,
} from "@/types/booking";

const INVENTORY_BLOCKING_STATUSES: readonly ReservationStatus[] = [
  "pending_online_payment",
  "pending_transfer_submission",
  "awaiting_transfer_verification",
  "pending_pos_coordination",
  "confirmed",
];

interface AvailabilityCheckInput {
  checkpoint: AvailabilityCheckpoint;
  stay: StayDetailsInput;
  reservationId?: string;
  paymentMethod?: PaymentMethod;
}

function nowIso(): string {
  return new Date().toISOString();
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

function toUnavailable(
  checkpoint: AvailabilityCheckpoint,
  conflicts: AvailabilityConflict[],
  reasons: string[]
): AvailabilityResult {
  return {
    checkpoint,
    isAvailable: false,
    checkedAt: nowIso(),
    reasons,
    conflicts,
    inventoryVersion: `inventory-${randomUUID()}`,
  };
}

function toAvailable(
  checkpoint: AvailabilityCheckpoint,
  reasons: string[]
): AvailabilityResult {
  return {
    checkpoint,
    isAvailable: true,
    checkedAt: nowIso(),
    reasons,
    conflicts: [],
    inventoryVersion: `inventory-${randomUUID()}`,
  };
}

export class BookingAvailabilityService {
  async runInitialAvailabilityCheck(stay: StayDetailsInput, reservationId?: string): Promise<AvailabilityResult> {
    return this.check({ checkpoint: "stay_details_entry", stay, reservationId });
  }

  async runPreHoldRecheck(
    stay: StayDetailsInput,
    paymentMethod: PaymentMethod,
    reservationId?: string
  ): Promise<AvailabilityResult> {
    return this.check({ checkpoint: "pre_hold_request", stay, paymentMethod, reservationId });
  }

  async runPreCheckoutRecheck(
    stay: StayDetailsInput,
    reservationId?: string
  ): Promise<AvailabilityResult> {
    return this.check({ checkpoint: "pre_online_payment_handoff", stay, paymentMethod: "website", reservationId });
  }

  async runPreConfirmationRecheck(
    stay: StayDetailsInput,
    paymentMethod: "transfer" | "pos",
    reservationId?: string
  ): Promise<AvailabilityResult> {
    const checkpoint: AvailabilityCheckpoint =
      paymentMethod === "transfer" ? "pre_transfer_confirmation" : "pre_pos_confirmation";

    return this.check({ checkpoint, stay, paymentMethod, reservationId });
  }

  private async check(input: AvailabilityCheckInput): Promise<AvailabilityResult> {
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

    const db = await readBookingDatabase();
    const flat = db.flats.find((item) => item.id === input.stay.flatId);

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

    const overlappingReservation = db.reservations.find((reservation) => {
      if (!INVENTORY_BLOCKING_STATUSES.includes(reservation.status)) {
        return false;
      }

      if (input.reservationId && reservation.id === input.reservationId) {
        return false;
      }

      if (reservation.stay.flatId !== input.stay.flatId) {
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
        reasons.push("Availability check failed.");
      }
      return toUnavailable(input.checkpoint, conflicts, reasons);
    }

    reasons.push("Availability check passed.");
    return toAvailable(input.checkpoint, reasons);
  }
}

export const bookingAvailabilityService = new BookingAvailabilityService();




