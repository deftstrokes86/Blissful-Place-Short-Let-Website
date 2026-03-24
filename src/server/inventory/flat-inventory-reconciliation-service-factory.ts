import { createDatabaseId } from "../db/file-database";
import { fileInventoryOperationsRepository } from "./file-inventory-operations-repository";
import { FlatInventoryReconciliationService } from "./flat-inventory-reconciliation-service";
import type { FlatInventoryReconciliationOperationsService } from "./flat-inventory-reconciliation-http";
import { InventoryAlertService } from "./inventory-alert-service";
import { ReadinessService } from "./readiness-service";

let sharedFlatInventoryReconciliationOperationsService: FlatInventoryReconciliationOperationsService | null = null;

export function getSharedFlatInventoryReconciliationOperationsService(): FlatInventoryReconciliationOperationsService {
  if (sharedFlatInventoryReconciliationOperationsService) {
    return sharedFlatInventoryReconciliationOperationsService;
  }

  const repository = fileInventoryOperationsRepository;

  const readinessService = new ReadinessService({
    repository,
  });

  const alertService = new InventoryAlertService({
    repository,
    createId: () => createDatabaseId("inventory_alert"),
  });

  const reconciliationService = new FlatInventoryReconciliationService({
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
      setManualOverride: async (input) =>
        readinessService.setManualOverride({
          flatId: input.flatId,
          overrideStatus: input.overrideStatus,
          reason: input.reason,
        }),
      clearManualOverride: async (flatId) => readinessService.clearManualOverride(flatId),
    },
    alertGateway: {
      syncFlatAlerts: async (flatId) => {
        await alertService.syncFlatAlerts(flatId);
      },
    },
    createId: (prefix) => createDatabaseId(prefix),
  });

  sharedFlatInventoryReconciliationOperationsService = {
    reconcileRecord: async (input) => reconciliationService.reconcileRecord(input),
    setReadinessOverride: async (input) => reconciliationService.setReadinessOverride(input),
    clearReadinessOverride: async (input) => reconciliationService.clearReadinessOverride(input),
  };

  return sharedFlatInventoryReconciliationOperationsService;
}
