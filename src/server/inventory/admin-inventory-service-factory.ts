import { createDatabaseId } from "../db/database-identifiers";
import { InventoryAlertService } from "./inventory-alert-service";
import { ReadinessService } from "./readiness-service";
import { MaintenanceIssueService } from "./maintenance-issue-service";
import { AdminInventoryService } from "./admin-inventory-service";
import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";

let sharedAdminInventoryService: AdminInventoryService | null = null;

export function getSharedAdminInventoryService(): AdminInventoryService {
  if (sharedAdminInventoryService) {
    return sharedAdminInventoryService;
  }

  const repository = prismaInventoryOperationsRepository;

  const readinessService = new ReadinessService({
    repository,
  });

  const maintenanceIssueService = new MaintenanceIssueService({
    repository,
    readinessGateway: {
      syncFlatReadiness: async (flatId) => {
        const current = await readinessService.getReadiness(flatId);
        await readinessService.recomputeReadiness({
          flatId,
          cleaningStatus: current?.cleaningStatus ?? "ready",
          linenStatus: current?.linenStatus ?? "ready",
          consumablesStatus: current?.consumablesStatus ?? "ready",
          maintenanceStatus: current?.maintenanceStatus ?? "ready",
          criticalAssetStatus: current?.criticalAssetStatus ?? "ready",
        });
      },
    },
    createId: () => createDatabaseId("maintenance_issue"),
  });

  const inventoryAlertService = new InventoryAlertService({
    repository,
    createId: () => createDatabaseId("inventory_alert"),
  });

  sharedAdminInventoryService = new AdminInventoryService({
    maintenanceIssueService,
    inventoryAlertService,
  });

  return sharedAdminInventoryService;
}

