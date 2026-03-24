import { createDatabaseId } from "../db/file-database";
import { fileInventoryOperationsRepository } from "./file-inventory-operations-repository";
import { StockMovementService } from "./stock-movement-service";

let sharedStockMovementService: StockMovementService | null = null;

export function getSharedStockMovementService(): StockMovementService {
  if (sharedStockMovementService) {
    return sharedStockMovementService;
  }

  sharedStockMovementService = new StockMovementService({
    repository: fileInventoryOperationsRepository,
    createId: (prefix) => createDatabaseId(prefix),
  });

  return sharedStockMovementService;
}
