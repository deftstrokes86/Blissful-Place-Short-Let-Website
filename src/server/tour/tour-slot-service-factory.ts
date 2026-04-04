import { createDatabaseId } from "../db/database-identifiers";
import { prismaTourSlotRepository } from "./prisma-tour-slot-repository";
import { TourSlotService } from "./tour-slot-service";

let sharedTourSlotService: TourSlotService | null = null;

export function getSharedTourSlotService(): TourSlotService {
  if (sharedTourSlotService) {
    return sharedTourSlotService;
  }

  sharedTourSlotService = new TourSlotService({
    repository: prismaTourSlotRepository,
    createId: () => createDatabaseId("tour_appt"),
  });

  return sharedTourSlotService;
}

