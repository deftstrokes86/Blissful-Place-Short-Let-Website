// LEGACY FILE-DB BOUNDARY:
// This repository persists booking data to the JSON file database and is not part of the
// Prisma + Supabase Postgres runtime path. Keep it isolated until the legacy cleanup phase.
import { createDatabaseId, readBookingDatabase, withBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type {
  AvailabilityBlockRecord,
  AvailabilityBlockSourceType,
} from "../../types/booking-backend";
import type { AvailabilityBlockRepository } from "./availability-block-service";

function cloneBlock(value: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...value,
  };
}

export class FileAvailabilityBlockRepository implements AvailabilityBlockRepository {
  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    return withBookingDatabase(async (db) => {
      const nowIso = new Date().toISOString();
      const created: AvailabilityBlockRecord = cloneBlock({
        ...block,
        id: block.id || createDatabaseId("block"),
        createdAt: block.createdAt || nowIso,
        updatedAt: block.updatedAt || nowIso,
      });

      db.availabilityBlocks.push(created);
      return cloneBlock(created);
    });
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.availabilityBlocks.findIndex((entry) => entry.id === block.id);
      if (index < 0) {
        throw new Error("Availability block not found.");
      }

      const updated = cloneBlock(block);
      db.availabilityBlocks[index] = updated;
      return cloneBlock(updated);
    });
  }

  async findBySource(
    sourceType: AvailabilityBlockSourceType,
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null> {
    const db = await readBookingDatabase();
    const found = db.availabilityBlocks.find((entry) => entry.sourceType === sourceType && entry.sourceId === sourceId);

    return found ? cloneBlock(found) : null;
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    const db = await readBookingDatabase();
    return db.availabilityBlocks.filter((entry) => entry.flatId === flatId).map(cloneBlock);
  }
}

export const fileAvailabilityBlockRepository = new FileAvailabilityBlockRepository();

