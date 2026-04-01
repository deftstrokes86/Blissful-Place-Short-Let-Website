import type { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import type { FlatId, ExtraId } from "../../types/booking";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { WebsitePaymentReservationQuery } from "./file-reservation-query";

const reservationInclude = { extras: true } satisfies Prisma.ReservationInclude;

type PrismaReservationRow = Prisma.ReservationGetPayload<{ include: typeof reservationInclude }>;

function mapReservation(row: PrismaReservationRow): ReservationRepositoryReservation {
  return {
    id: row.id,
    token: row.token,
    status: row.status as ReservationRepositoryReservation["status"],
    paymentMethod: (row.paymentMethod ?? null) as ReservationRepositoryReservation["paymentMethod"],
    stay: {
      flatId: row.flatId as FlatId,
      checkIn: row.checkIn.toISOString().slice(0, 10),
      checkOut: row.checkOut.toISOString().slice(0, 10),
      guests: row.guests,
      extraIds: row.extras.map((e) => e.extraId as ExtraId),
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
      currentStep: (row.draftCurrentStep ?? null) as ReservationRepositoryReservation["progressContext"]["currentStep"],
      activeBranch: (row.draftActiveBranch ?? null) as ReservationRepositoryReservation["progressContext"]["activeBranch"],
    },
    transferHoldStartedAt: row.transferHoldStartedAt ? row.transferHoldStartedAt.toISOString() : null,
    transferHoldExpiresAt: row.transferHoldExpiresAt ? row.transferHoldExpiresAt.toISOString() : null,
    inventoryReopenedAt: row.inventoryReopenedAt ? row.inventoryReopenedAt.toISOString() : null,
    lastAvailabilityResult:
      row.lastAvailabilityCheckpoint !== null &&
      row.lastAvailabilityCheckedAt !== null &&
      row.lastAvailabilityVersion !== null &&
      row.lastAvailabilityPassed !== null
        ? {
            checkpoint: row.lastAvailabilityCheckpoint as NonNullable<ReservationRepositoryReservation["lastAvailabilityResult"]>["checkpoint"],
            isAvailable: row.lastAvailabilityPassed,
            checkedAt: row.lastAvailabilityCheckedAt.toISOString(),
            reasons: [],
            conflicts: [],
            inventoryVersion: row.lastAvailabilityVersion,
          }
        : null,
    confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
    cancelledAt: row.cancelledAt ? row.cancelledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastTouchedAt: row.lastTouchedAt.toISOString(),
  };
}

export class PrismaWebsitePaymentReservationQuery implements WebsitePaymentReservationQuery {
  async findById(reservationId: string): Promise<ReservationRepositoryReservation | null> {
    const found = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    });

    return found ? mapReservation(found) : null;
  }
}

export const prismaWebsitePaymentReservationQuery = new PrismaWebsitePaymentReservationQuery();
