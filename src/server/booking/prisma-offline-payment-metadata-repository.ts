import { prisma } from "../db/prisma";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";
import type { OfflinePaymentMetadataRepository } from "./offline-payment-service";

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

export class PrismaOfflinePaymentMetadataRepository implements OfflinePaymentMetadataRepository {
  async createTransferMetadata(
    input: Omit<TransferVerificationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TransferVerificationMetadataRecord> {
    const created = await prisma.transferVerificationMetadata.create({
      data: {
        reservationId: input.reservationId,
        transferReference: input.transferReference,
        proofNote: input.proofNote,
        proofReceivedAt: new Date(input.proofReceivedAt),
        verificationStatus: input.verificationStatus,
        verifiedByStaffId: input.verifiedByStaffId ?? undefined,
        verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : undefined,
        verificationNote: input.verificationNote ?? undefined,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return mapTransfer(created);
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

  async updateTransferMetadata(
    id: string,
    patch: Partial<TransferVerificationMetadataRecord>
  ): Promise<TransferVerificationMetadataRecord> {
    const updated = await prisma.transferVerificationMetadata.update({
      where: { id },
      data: {
        ...(patch.verificationStatus !== undefined && { verificationStatus: patch.verificationStatus }),
        ...(patch.verifiedByStaffId !== undefined && { verifiedByStaffId: patch.verifiedByStaffId }),
        ...(patch.verifiedAt !== undefined && {
          verifiedAt: patch.verifiedAt ? new Date(patch.verifiedAt) : null,
        }),
        ...(patch.verificationNote !== undefined && { verificationNote: patch.verificationNote }),
      },
    });

    return mapTransfer(updated);
  }

  async createPosMetadata(
    input: Omit<PosCoordinationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<PosCoordinationMetadataRecord> {
    const created = await prisma.posCoordinationMetadata.create({
      data: {
        reservationId: input.reservationId,
        contactWindow: input.contactWindow,
        coordinationNote: input.coordinationNote ?? undefined,
        status: input.status,
        requestedAt: new Date(input.requestedAt),
        completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
        completedByStaffId: input.completedByStaffId ?? undefined,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return mapPos(created);
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const found = await prisma.posCoordinationMetadata.findFirst({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapPos(found) : null;
  }

  async updatePosMetadata(
    id: string,
    patch: Partial<PosCoordinationMetadataRecord>
  ): Promise<PosCoordinationMetadataRecord> {
    const updated = await prisma.posCoordinationMetadata.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.completedAt !== undefined && {
          completedAt: patch.completedAt ? new Date(patch.completedAt) : null,
        }),
        ...(patch.completedByStaffId !== undefined && {
          completedByStaffId: patch.completedByStaffId,
        }),
        ...(patch.coordinationNote !== undefined && { coordinationNote: patch.coordinationNote }),
      },
    });

    return mapPos(updated);
  }
}

export const prismaOfflinePaymentMetadataRepository = new PrismaOfflinePaymentMetadataRepository();
