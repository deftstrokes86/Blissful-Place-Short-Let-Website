import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";
import { ReadinessService } from "./readiness-service";

let sharedReadinessService: ReadinessService | null = null;

export function getSharedReadinessService(): ReadinessService {
  if (sharedReadinessService) {
    return sharedReadinessService;
  }

  sharedReadinessService = new ReadinessService({
    repository: prismaInventoryOperationsRepository,
  });

  return sharedReadinessService;
}
