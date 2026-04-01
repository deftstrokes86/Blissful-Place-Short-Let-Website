import type { Prisma } from "@prisma/client";

import { prisma } from "../db/prisma";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";
import type { ReservationStatus, FlatId, ExtraId } from "../../types/booking";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { OperationsQueryRepository } from "./operations-service";
import type { StaffOperationsQueryRepository } from "./staff-operations-service";

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
            checkpoint: row.lastAvailabilityCheckpoint as ReservationRepositoryReservation["lastAvailabilityResult"] extends null ? never : NonNullable<ReservationRepositoryReservation["lastAvailabilityResult"]>["checkpoint"],
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

function mapTransfer(row: {
  id: string;
  reservationId: string;
  transferReference: string;
  proofNote: string;
  proofReceivedAt: Date;
  verificationStatus: string;
  verifiedByStaffId: string | null;
  verifiedAt: Date | null;
  verificationNote: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}): TransferVerificationMetadataRecord {
  return {
    id: row.id,
    reservationId: row.reservationId,
    transferReference: row.transferReference,
    proofNote: row.proofNote,
    proofReceivedAt: row.proofReceivedAt.toISOString(),
    verificationStatus: row.verificationStatus as TransferVerificationMetadataRecord["verificationStatus"],
    verifiedByStaffId: row.verifiedByStaffId ?? null,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    verificationNote: row.verificationNote ?? null,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapPos(row: {
  id: string;
  reservationId: string;
  contactWindow: string;
  coordinationNote: string | null;
  status: string;
  requestedAt: Date;
  completedAt: Date | null;
  completedByStaffId: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}): PosCoordinationMetadataRecord {
  return {
    id: row.id,
    reservationId: row.reservationId,
    contactWindow: row.contactWindow,
    coordinationNote: row.coordinationNote ?? null,
    status: row.status as PosCoordinationMetadataRecord["status"],
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    completedByStaffId: row.completedByStaffId ?? null,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaOperationsQueryRepository
  implements OperationsQueryRepository, StaffOperationsQueryRepository
{
  async listReservationsByStatuses(
    statuses: readonly ReservationStatus[]
  ): Promise<ReservationRepositoryReservation[]> {
    const rows = await prisma.reservation.findMany({
      where: { status: { in: statuses as ReservationStatus[] } },
      include: reservationInclude,
    });

    return rows.map(mapReservation);
  }

  async findReservationByToken(token: string): Promise<ReservationRepositoryReservation | null> {
    const found = await prisma.reservation.findUnique({
      where: { token },
      include: reservationInclude,
    });

    return found ? mapReservation(found) : null;
  }

  async findLatestTransferMetadata(
    reservationId: string
  ): Promise<TransferVerificationMetadataRecord | null> {
    const found = await prisma.transferVerificationMetadata.findFirst({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapTransfer(found) : null;
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const found = await prisma.posCoordinationMetadata.findFirst({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapPos(found) : null;
  }
}

export const prismaOperationsQueryRepository = new PrismaOperationsQueryRepository();
