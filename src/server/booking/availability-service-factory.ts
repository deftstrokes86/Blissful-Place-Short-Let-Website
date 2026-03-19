import { AvailabilityService } from "./availability-service";
import { fileAvailabilityRepository } from "./file-availability-repository";

let sharedAvailabilityService: AvailabilityService | null = null;

export function getSharedAvailabilityService(): AvailabilityService {
  if (sharedAvailabilityService) {
    return sharedAvailabilityService;
  }

  sharedAvailabilityService = new AvailabilityService({
    repository: fileAvailabilityRepository,
  });

  return sharedAvailabilityService;
}
