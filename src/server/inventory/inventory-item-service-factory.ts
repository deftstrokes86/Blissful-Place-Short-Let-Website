import { createDatabaseId } from "../db/file-database";
import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";
import { InventoryItemService } from "./inventory-item-service";

let sharedInventoryItemService: InventoryItemService | null = null;

export function getSharedInventoryItemService(): InventoryItemService {
  if (sharedInventoryItemService) {
    return sharedInventoryItemService;
  }

  sharedInventoryItemService = new InventoryItemService({
    repository: prismaInventoryOperationsRepository,
    createId: () => createDatabaseId("inventory_item"),
  });

  return sharedInventoryItemService;
}
