import { createDatabaseId } from "../db/file-database";
import { fileTourSlotRepository } from "./file-tour-slot-repository";
import { TourSlotService } from "./tour-slot-service";

let sharedTourSlotService: TourSlotService | null = null;

export function getSharedTourSlotService(): TourSlotService {
  if (sharedTourSlotService) {
    return sharedTourSlotService;
  }

  sharedTourSlotService = new TourSlotService({
    repository: fileTourSlotRepository,
    createId: () => createDatabaseId("tour_appt"),
  });

  return sharedTourSlotService;
}
