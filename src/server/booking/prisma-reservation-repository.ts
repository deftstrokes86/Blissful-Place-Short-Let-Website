import type { Prisma, Reservation as PrismaReservation } from "@prisma/client";

import { prisma } from "../db/prisma";
import type { BookingToken, ExtraId, FlatId } from "../../types/booking";
import type { ReservationRecord } from "../../types/booking-backend";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "./reservation-repository";

// --- Prisma include shape ---

const reservationInclude = {
  extras: true,
} satisfies Prisma.ReservationInclude;

type PrismaReservationWithExtras = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

// --- Mappers ---

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(iso: string): Date {
  return new Date(iso);
}

function mapFromPrisma(row: PrismaReservationWithExtras): ReservationRepositoryReservation {
  const extraIds = row.extras.map((e) => e.extraId as ExtraId);

  return {
    id: row.id,
    token: row.token,
    status: row.status as ReservationRecord["status"],
    paymentMethod: (row.paymentMethod ?? null) as ReservationRecord["paymentMethod"],
    stay: {
      flatId: row.flatId as FlatId,
      checkIn: toDateOnly(row.checkIn),
      checkOut: toDateOnly(row.checkOut),
      guests: row.guests,
      extraIds,
    },
    guest: {
      firstName: row.guestFirstName ?? "",
      lastName: row.guestLastName ?? "",
      email: row.guestEmail ?? "",
      phone: row.guestPhone ?? "",
      specialRequests: row.guestSpecialRequests ?? "",
    },
    pricing: {
      currency: "NGN",
      nightlyRate: row.nightlyRate ?? null,
      nights: row.nights ?? null,
      staySubtotal: row.staySubtotal ?? null,
      extrasSubtotal: row.extrasSubtotal,
      estimatedTotal: row.estimatedTotal ?? null,
    },
    progressContext: {
      currentStep: (row.draftCurrentStep ?? null) as ReservationRecord["progressContext"]["currentStep"],
      activeBranch: (row.draftActiveBranch ?? null) as ReservationRecord["progressContext"]["activeBranch"],
    },
    transferHoldStartedAt: toIso(row.transferHoldStartedAt),
    transferHoldExpiresAt: toIso(row.transferHoldExpiresAt),
    inventoryReopenedAt: toIso(row.inventoryReopenedAt),
    lastAvailabilityResult:
      row.lastAvailabilityCheckpoint !== null &&
      row.lastAvailabilityCheckedAt !== null &&
      row.lastAvailabilityVersion !== null &&
      row.lastAvailabilityPassed !== null
        ? {
            checkpoint: row.lastAvailabilityCheckpoint as ReservationRecord["lastAvailabilityResult"] extends null
              ? never
              : NonNullable<ReservationRecord["lastAvailabilityResult"]>["checkpoint"],
            isAvailable: row.lastAvailabilityPassed,
            checkedAt: row.lastAvailabilityCheckedAt.toISOString(),
            reasons: [],
            conflicts: [],
            inventoryVersion: row.lastAvailabilityVersion,
          }
        : null,
    confirmedAt: toIso(row.confirmedAt),
    cancelledAt: toIso(row.cancelledAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastTouchedAt: row.lastTouchedAt.toISOString(),
  };
}

function buildWriteData(
  reservation: ReservationRepositoryReservation
): Omit<Prisma.ReservationUncheckedCreateInput, "extras"> & { extras?: unknown } {
  return {
    id: reservation.id,
    token: reservation.token,
    status: reservation.status,
    paymentMethod: reservation.paymentMethod ?? undefined,
    flatId: reservation.stay.flatId,
    checkIn: parseDate(reservation.stay.checkIn),
    checkOut: parseDate(reservation.stay.checkOut),
    guests: reservation.stay.guests,
    guestFirstName: reservation.guest.firstName || null,
    guestLastName: reservation.guest.lastName || null,
    guestEmail: reservation.guest.email || null,
    guestPhone: reservation.guest.phone || null,
    guestSpecialRequests: reservation.guest.specialRequests || null,
    currency: reservation.pricing.currency,
    nightlyRate: reservation.pricing.nightlyRate ?? undefined,
    nights: reservation.pricing.nights ?? undefined,
    staySubtotal: reservation.pricing.staySubtotal ?? undefined,
    extrasSubtotal: reservation.pricing.extrasSubtotal,
    estimatedTotal: reservation.pricing.estimatedTotal ?? undefined,
    draftCurrentStep: reservation.progressContext.currentStep ?? undefined,
    draftActiveBranch: reservation.progressContext.activeBranch ?? undefined,
    transferHoldStartedAt: reservation.transferHoldStartedAt
      ? new Date(reservation.transferHoldStartedAt)
      : null,
    transferHoldExpiresAt: reservation.transferHoldExpiresAt
      ? new Date(reservation.transferHoldExpiresAt)
      : null,
    inventoryReopenedAt: reservation.inventoryReopenedAt
      ? new Date(reservation.inventoryReopenedAt)
      : null,
    lastAvailabilityCheckpoint: reservation.lastAvailabilityResult?.checkpoint ?? null,
    lastAvailabilityCheckedAt: reservation.lastAvailabilityResult?.checkedAt
      ? new Date(reservation.lastAvailabilityResult.checkedAt)
      : null,
    lastAvailabilityVersion: reservation.lastAvailabilityResult?.inventoryVersion ?? null,
    lastAvailabilityPassed: reservation.lastAvailabilityResult?.isAvailable ?? null,
    confirmedAt: reservation.confirmedAt ? new Date(reservation.confirmedAt) : null,
    cancelledAt: reservation.cancelledAt ? new Date(reservation.cancelledAt) : null,
    createdAt: new Date(reservation.createdAt),
    updatedAt: new Date(reservation.updatedAt),
    lastTouchedAt: new Date(reservation.lastTouchedAt),
  };
}

// --- Repository ---

export class PrismaReservationRepository implements ReservationRepository {
  async create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    const { extras: _extras, ...data } = buildWriteData(reservation) as Record<string, unknown>;

    const created = await prisma.reservation.create({
      data: {
        ...(data as Prisma.ReservationUncheckedCreateInput),
        extras: {
          create: reservation.stay.extraIds.map((extraId) => ({
            extraId,
            appliedFlatFee: 0,
          })),
        },
      },
      include: reservationInclude,
    });

    return mapFromPrisma(created);
  }

  async update(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    const { extras: _extras, id: _id, ...data } = buildWriteData(reservation) as Record<string, unknown>;

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        ...(data as Prisma.ReservationUncheckedUpdateInput),
        extras: {
          deleteMany: {},
          create: reservation.stay.extraIds.map((extraId) => ({
            extraId,
            appliedFlatFee: 0,
          })),
        },
      },
      include: reservationInclude,
    });

    return mapFromPrisma(updated);
  }

  async findByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    const found = await prisma.reservation.findUnique({
      where: { token },
      include: reservationInclude,
    });

    return found ? mapFromPrisma(found) : null;
  }

  async listTransferHoldExpiringBefore(beforeIso: string): Promise<ReservationRepositoryReservation[]> {
    const rows = await prisma.reservation.findMany({
      where: {
        status: { in: ["pending_transfer_submission", "awaiting_transfer_verification"] },
        transferHoldExpiresAt: { lt: new Date(beforeIso) },
      },
      include: reservationInclude,
    });

    return rows.map(mapFromPrisma);
  }

  async findFlatById(flatId: FlatId): Promise<ReservationRepositoryFlat | null> {
    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    return flat ? { id: flat.id as FlatId, nightlyRate: flat.nightlyRate } : null;
  }

  async listExtras(): Promise<readonly { id: ExtraId; flatFee: number }[]> {
    const extras = await prisma.extra.findMany();
    return extras.map((e) => ({ id: e.id as ExtraId, flatFee: e.flatFee }));
  }
}

export const prismaReservationRepository = new PrismaReservationRepository();
