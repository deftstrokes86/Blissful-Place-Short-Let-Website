import { AvailabilityService } from "./availability-service";
import { prismaAvailabilityRepository } from "./prisma-availability-repository";

let sharedAvailabilityService: AvailabilityService | null = null;

export function getSharedAvailabilityService(): AvailabilityService {
  if (sharedAvailabilityService) {
    return sharedAvailabilityService;
  }

  sharedAvailabilityService = new AvailabilityService({
    repository: prismaAvailabilityRepository,
  });

  return sharedAvailabilityService;
}
