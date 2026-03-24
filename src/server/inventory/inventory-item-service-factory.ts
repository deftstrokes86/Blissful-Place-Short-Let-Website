import { createDatabaseId } from "../db/file-database";
import { fileInventoryOperationsRepository } from "./file-inventory-operations-repository";
import { InventoryItemService } from "./inventory-item-service";

let sharedInventoryItemService: InventoryItemService | null = null;

export function getSharedInventoryItemService(): InventoryItemService {
  if (sharedInventoryItemService) {
    return sharedInventoryItemService;
  }

  sharedInventoryItemService = new InventoryItemService({
    repository: fileInventoryOperationsRepository,
    createId: () => createDatabaseId("inventory_item"),
  });

  return sharedInventoryItemService;
}
