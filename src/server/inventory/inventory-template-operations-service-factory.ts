import { createDatabaseId } from "../db/file-database";
import { FlatInventoryService } from "./flat-inventory-service";
import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";
import { InventoryTemplateService } from "./inventory-template-service";
import type { InventoryTemplateOperationsService } from "./inventory-template-http";

let sharedTemplateOperationsService: InventoryTemplateOperationsService | null = null;

export function getSharedInventoryTemplateOperationsService(): InventoryTemplateOperationsService {
  if (sharedTemplateOperationsService) {
    return sharedTemplateOperationsService;
  }

  const repository = prismaInventoryOperationsRepository;

  const templateService = new InventoryTemplateService({
    repository,
    createId: (prefix) => createDatabaseId(prefix),
  });

  const flatInventoryService = new FlatInventoryService({
    repository,
    createId: (prefix) => createDatabaseId(prefix),
  });

  sharedTemplateOperationsService = {
    listTemplates: async () => templateService.listTemplates(),
    getTemplate: async (templateId) => templateService.getTemplate(templateId),
    createTemplate: async (input) => templateService.createTemplate(input),
    updateTemplate: async (input) => templateService.updateTemplate(input),
    addTemplateItem: async (input) => templateService.addTemplateItem(input),
    updateTemplateItemQuantity: async (input) => templateService.updateTemplateItemQuantity(input),
    removeTemplateItem: async (input) => templateService.removeTemplateItem(input),
    applyTemplateToFlat: async (input) =>
      flatInventoryService.applyTemplateToFlat({
        templateId: input.templateId,
        flatId: input.flatId,
      }),
  };

  return sharedTemplateOperationsService;
}
