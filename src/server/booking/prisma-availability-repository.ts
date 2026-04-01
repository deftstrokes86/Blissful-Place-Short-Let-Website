import { prisma } from "../db/prisma";
import type { FlatId } from "../../types/booking";
import type { FlatReadinessRecord } from "../../types/booking-backend";
import type {
  AvailabilityRepository,
  AvailabilityRepositoryBlock,
  AvailabilityRepositoryFlat,
  AvailabilityRepositoryReservation,
} from "./availability-service";

export class PrismaAvailabilityRepository implements AvailabilityRepository {
  async findFlatById(flatId: FlatId): Promise<AvailabilityRepositoryFlat | null> {
    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (!flat) return null;
    return { id: flat.id as FlatId, maxGuests: flat.maxGuests };
  }

  async listReservationsByFlat(flatId: FlatId): Promise<AvailabilityRepositoryReservation[]> {
    const rows = await prisma.reservation.findMany({ where: { flatId } });

    return rows.map((row) => ({
      id: row.id,
      status: row.status as AvailabilityRepositoryReservation["status"],
      stay: {
        flatId: row.flatId as FlatId,
        checkIn: row.checkIn.toISOString().slice(0, 10),
        checkOut: row.checkOut.toISOString().slice(0, 10),
      },
    }));
  }

  async listAvailabilityBlocksByFlat(flatId: FlatId): Promise<AvailabilityRepositoryBlock[]> {
    const rows = await prisma.availabilityBlock.findMany({ where: { flatId } });

    return rows.map((row) => ({
      id: row.id,
      flatId: row.flatId as FlatId,
      sourceType: row.sourceType as AvailabilityRepositoryBlock["sourceType"],
      sourceId: row.sourceId,
      blockType: row.blockType as AvailabilityRepositoryBlock["blockType"],
      startDate: row.startDate.toISOString().slice(0, 10),
      endDate: row.endDate.toISOString().slice(0, 10),
      status: row.status as AvailabilityRepositoryBlock["status"],
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    }));
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = await prisma.flatReadiness.findUnique({ where: { flatId } });
    if (!found) return null;

    return {
      flatId: found.flatId as FlatId,
      cleaningStatus: found.cleaningStatus as FlatReadinessRecord["cleaningStatus"],
      linenStatus: found.linenStatus as FlatReadinessRecord["linenStatus"],
      consumablesStatus: found.consumablesStatus as FlatReadinessRecord["consumablesStatus"],
      maintenanceStatus: found.maintenanceStatus as FlatReadinessRecord["maintenanceStatus"],
      criticalAssetStatus: found.criticalAssetStatus as FlatReadinessRecord["criticalAssetStatus"],
      readinessStatus: found.readinessStatus as FlatReadinessRecord["readinessStatus"],
      overrideStatus: (found.overrideStatus ?? null) as FlatReadinessRecord["overrideStatus"],
      overrideReason: found.overrideReason ?? null,
      updatedAt: found.updatedAt.toISOString(),
    };
  }
}

export const prismaAvailabilityRepository = new PrismaAvailabilityRepository();
