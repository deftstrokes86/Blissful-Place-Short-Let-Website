// LEGACY FILE-DB BOUNDARY:
// This repository persists booking data to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { createDatabaseId, readBookingDatabase, withBookingDatabase } from "../db/file-database";
import { nowIso } from "../db/db-utils";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";
import type { OfflinePaymentMetadataRepository } from "./offline-payment-service";

function cloneTransferMetadata(
  record: TransferVerificationMetadataRecord
): TransferVerificationMetadataRecord {
  return {
    ...record,
  };
}

function clonePosMetadata(record: PosCoordinationMetadataRecord): PosCoordinationMetadataRecord {
  return {
    ...record,
  };
}

export class FileOfflinePaymentMetadataRepository implements OfflinePaymentMetadataRepository {
  async createTransferMetadata(
    input: Omit<TransferVerificationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TransferVerificationMetadataRecord> {
    return withBookingDatabase(async (db) => {
      const createdAt = nowIso();
      const record: TransferVerificationMetadataRecord = {
        id: createDatabaseId("trf"),
        createdAt,
        updatedAt: createdAt,
        ...input,
      };

      db.transferVerifications.push(record);
      return cloneTransferMetadata(record);
    });
  }

  async findLatestTransferMetadata(
    reservationId: string
  ): Promise<TransferVerificationMetadataRecord | null> {
    const db = await readBookingDatabase();

    const latest = db.transferVerifications
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? cloneTransferMetadata(latest) : null;
  }

  async updateTransferMetadata(
    id: string,
    patch: Partial<TransferVerificationMetadataRecord>
  ): Promise<TransferVerificationMetadataRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.transferVerifications.findIndex((record) => record.id === id);
      if (index < 0) {
        throw new Error("Transfer metadata not found.");
      }

      const previous = db.transferVerifications[index];
      const updated: TransferVerificationMetadataRecord = {
        ...previous,
        ...patch,
        id: previous.id,
        reservationId: previous.reservationId,
        createdAt: previous.createdAt,
        updatedAt: nowIso(),
      };

      db.transferVerifications[index] = updated;
      return cloneTransferMetadata(updated);
    });
  }

  async createPosMetadata(
    input: Omit<PosCoordinationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<PosCoordinationMetadataRecord> {
    return withBookingDatabase(async (db) => {
      const createdAt = nowIso();
      const record: PosCoordinationMetadataRecord = {
        id: createDatabaseId("pos"),
        createdAt,
        updatedAt: createdAt,
        ...input,
      };

      db.posCoordinations.push(record);
      return clonePosMetadata(record);
    });
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const db = await readBookingDatabase();

    const latest = db.posCoordinations
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? clonePosMetadata(latest) : null;
  }

  async updatePosMetadata(
    id: string,
    patch: Partial<PosCoordinationMetadataRecord>
  ): Promise<PosCoordinationMetadataRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.posCoordinations.findIndex((record) => record.id === id);
      if (index < 0) {
        throw new Error("POS metadata not found.");
      }

      const previous = db.posCoordinations[index];
      const updated: PosCoordinationMetadataRecord = {
        ...previous,
        ...patch,
        id: previous.id,
        reservationId: previous.reservationId,
        createdAt: previous.createdAt,
        updatedAt: nowIso(),
      };

      db.posCoordinations[index] = updated;
      return clonePosMetadata(updated);
    });
  }
}

export const fileOfflinePaymentMetadataRepository = new FileOfflinePaymentMetadataRepository();

