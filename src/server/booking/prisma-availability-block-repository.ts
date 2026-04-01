import type { AvailabilityBlock as PrismaBlock } from "@prisma/client";

import { prisma } from "../db/prisma";
import type { FlatId } from "../../types/booking";
import type { AvailabilityBlockRecord, AvailabilityBlockSourceType } from "../../types/booking-backend";
import type { AvailabilityBlockRepository } from "./availability-block-service";

function mapFromPrisma(row: PrismaBlock): AvailabilityBlockRecord {
  return {
    id: row.id,
    flatId: row.flatId as FlatId,
    sourceType: row.sourceType as AvailabilityBlockRecord["sourceType"],
    sourceId: row.sourceId,
    blockType: row.blockType as AvailabilityBlockRecord["blockType"],
    manualBlockType: (row.manualBlockType ?? null) as AvailabilityBlockRecord["manualBlockType"],
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    reason: row.reason ?? null,
    notes: row.notes ?? null,
    createdBy: row.createdBy ?? null,
    status: row.status as AvailabilityBlockRecord["status"],
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    releasedAt: row.releasedAt ? row.releasedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaAvailabilityBlockRepository implements AvailabilityBlockRepository {
  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    const created = await prisma.availabilityBlock.create({
      data: {
        id: block.id,
        flatId: block.flatId,
        sourceType: block.sourceType,
        sourceId: block.sourceId,
        blockType: block.blockType,
        manualBlockType: block.manualBlockType ?? undefined,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate),
        reason: block.reason ?? undefined,
        notes: block.notes ?? undefined,
        createdBy: block.createdBy ?? undefined,
        status: block.status,
        expiresAt: block.expiresAt ? new Date(block.expiresAt) : undefined,
        releasedAt: block.releasedAt ? new Date(block.releasedAt) : undefined,
      },
    });

    return mapFromPrisma(created);
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    const updated = await prisma.availabilityBlock.update({
      where: { id: block.id },
      data: {
        flatId: block.flatId,
        sourceType: block.sourceType,
        sourceId: block.sourceId,
        blockType: block.blockType,
        manualBlockType: block.manualBlockType ?? null,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate),
        reason: block.reason ?? null,
        notes: block.notes ?? null,
        createdBy: block.createdBy ?? null,
        status: block.status,
        expiresAt: block.expiresAt ? new Date(block.expiresAt) : null,
        releasedAt: block.releasedAt ? new Date(block.releasedAt) : null,
      },
    });

    return mapFromPrisma(updated);
  }

  async findBySource(
    sourceType: AvailabilityBlockSourceType,
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null> {
    const found = await prisma.availabilityBlock.findUnique({
      where: { sourceType_sourceId: { sourceType, sourceId } },
    });

    return found ? mapFromPrisma(found) : null;
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    const rows = await prisma.availabilityBlock.findMany({ where: { flatId } });
    return rows.map(mapFromPrisma);
  }
}

export const prismaAvailabilityBlockRepository = new PrismaAvailabilityBlockRepository();
