import { createDatabaseId } from "../db/file-database";
import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";
import { StockMovementService } from "./stock-movement-service";

let sharedStockMovementService: StockMovementService | null = null;

export function getSharedStockMovementService(): StockMovementService {
  if (sharedStockMovementService) {
    return sharedStockMovementService;
  }

  sharedStockMovementService = new StockMovementService({
    repository: prismaInventoryOperationsRepository,
    createId: (prefix) => createDatabaseId(prefix),
  });

  return sharedStockMovementService;
}
