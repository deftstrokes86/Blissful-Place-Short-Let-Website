import { readBookingDatabase, withBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  InventoryItemRecord,
  InventoryTemplateRecord,
  MaintenanceIssueRecord,
  StockMovementRecord,
  TemplateItemRecord,
  WorkerTaskRecord,
} from "../../types/booking-backend";
import type { FlatInventoryRepository } from "./flat-inventory-service";
import type {
  InventoryAlertRepository,
  InventoryAlertSignal,
} from "./inventory-alert-service";
import type { InventoryItemRepository } from "./inventory-item-service";
import type { InventoryTemplateRepository } from "./inventory-template-service";
import type { MaintenanceIssueRepository } from "./maintenance-issue-service";
import type { FlatInventorySignal, ReadinessRepository } from "./readiness-service";
import type { FlatInventoryReconciliationRepository } from "./flat-inventory-reconciliation-service";
import type { StockMovementRepository } from "./stock-movement-service";
import type { WorkerTaskRepository } from "./worker-task-service";

interface InventoryOperationsDatabaseState {
  centralStockByItem?: Record<string, number>;
}

function cloneFlat(value: FlatRecord): FlatRecord {
  return { ...value };
}

function cloneItem(value: InventoryItemRecord): InventoryItemRecord {
  return { ...value };
}

function cloneTemplate(value: InventoryTemplateRecord): InventoryTemplateRecord {
  return { ...value };
}

function cloneTemplateItem(value: TemplateItemRecord): TemplateItemRecord {
  return { ...value };
}

function cloneInventory(value: FlatInventoryRecord): FlatInventoryRecord {
  return { ...value };
}

function cloneIssue(value: MaintenanceIssueRecord): MaintenanceIssueRecord {
  return { ...value };
}

function cloneAlert(value: InventoryAlertRecord): InventoryAlertRecord {
  return { ...value };
}

function cloneMovement(value: StockMovementRecord): StockMovementRecord {
  return { ...value };
}

function cloneReadiness(value: FlatReadinessRecord): FlatReadinessRecord {
  return { ...value };
}

function cloneWorkerTask(value: WorkerTaskRecord): WorkerTaskRecord {
  return { ...value };
}

function getCentralStockMap(state: InventoryOperationsDatabaseState): Record<string, number> {
  if (!state.centralStockByItem) {
    state.centralStockByItem = {};
  }

  return state.centralStockByItem;
}

export class FileInventoryOperationsRepository
  implements
    ReadinessRepository,
    InventoryAlertRepository,
    MaintenanceIssueRepository,
    WorkerTaskRepository,
    InventoryTemplateRepository,
    InventoryItemRepository,
    StockMovementRepository,
    FlatInventoryRepository,
    FlatInventoryReconciliationRepository
{
  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    const db = await readBookingDatabase();
    const found = db.flats.find((flat) => flat.id === flatId);
    return found ? cloneFlat(found) : null;
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const db = await readBookingDatabase();
    const found = db.inventoryItems.find((item) => item.id === inventoryItemId);
    return found ? cloneItem(found) : null;
  }

  async listInventoryItems(): Promise<InventoryItemRecord[]> {
    const db = await readBookingDatabase();
    return db.inventoryItems.map(cloneItem);
  }

  async createInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    return withBookingDatabase(async (db) => {
      db.inventoryItems.push(cloneItem(record));
      return cloneItem(record);
    });
  }

  async updateInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.inventoryItems.findIndex((entry) => entry.id === record.id);
      if (index < 0) {
        throw new Error("Inventory item not found.");
      }

      db.inventoryItems[index] = cloneItem(record);
      return cloneItem(record);
    });
  }

  async getCentralStockQuantity(inventoryItemId: string): Promise<number> {
    const db = (await readBookingDatabase()) as InventoryOperationsDatabaseState;
    const stockByItem = getCentralStockMap(db);
    return stockByItem[inventoryItemId] ?? 0;
  }

  async setCentralStockQuantity(inventoryItemId: string, quantity: number): Promise<void> {
    await withBookingDatabase(async (db) => {
      const state = db as InventoryOperationsDatabaseState;
      const stockByItem = getCentralStockMap(state);
      stockByItem[inventoryItemId] = quantity;
    });
  }

  async createTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    return withBookingDatabase(async (db) => {
      db.inventoryTemplates.push(cloneTemplate(template));
      return cloneTemplate(template);
    });
  }

  async listTemplates(): Promise<InventoryTemplateRecord[]> {
    const db = await readBookingDatabase();
    return db.inventoryTemplates.map(cloneTemplate);
  }

  async findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null> {
    const db = await readBookingDatabase();
    const found = db.inventoryTemplates.find((template) => template.id === templateId);
    return found ? cloneTemplate(found) : null;
  }

  async updateTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.inventoryTemplates.findIndex((entry) => entry.id === template.id);
      if (index < 0) {
        throw new Error("Inventory template not found.");
      }

      db.inventoryTemplates[index] = cloneTemplate(template);
      return cloneTemplate(template);
    });
  }

  async createTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    return withBookingDatabase(async (db) => {
      db.templateItems.push(cloneTemplateItem(item));
      return cloneTemplateItem(item);
    });
  }

  async findTemplateItemById(templateItemId: string): Promise<TemplateItemRecord | null> {
    const db = await readBookingDatabase();
    const found = db.templateItems.find((item) => item.id === templateItemId);
    return found ? cloneTemplateItem(found) : null;
  }

  async findTemplateItemByTemplateAndInventoryItem(
    templateId: string,
    inventoryItemId: string
  ): Promise<TemplateItemRecord | null> {
    const db = await readBookingDatabase();
    const found = db.templateItems.find(
      (item) => item.templateId === templateId && item.inventoryItemId === inventoryItemId
    );

    return found ? cloneTemplateItem(found) : null;
  }

  async listTemplateItems(templateId: string): Promise<TemplateItemRecord[]> {
    const db = await readBookingDatabase();
    return db.templateItems.filter((item) => item.templateId === templateId).map(cloneTemplateItem);
  }

  async updateTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.templateItems.findIndex((entry) => entry.id === item.id);
      if (index < 0) {
        throw new Error("Template item not found.");
      }

      db.templateItems[index] = cloneTemplateItem(item);
      return cloneTemplateItem(item);
    });
  }

  async removeTemplateItem(templateItemId: string): Promise<void> {
    await withBookingDatabase(async (db) => {
      const index = db.templateItems.findIndex((entry) => entry.id === templateItemId);
      if (index >= 0) {
        db.templateItems.splice(index, 1);
      }
    });
  }

  async findFlatInventoryByFlatAndItem(flatId: FlatId, inventoryItemId: string): Promise<FlatInventoryRecord | null> {
    const db = await readBookingDatabase();
    const found = db.flatInventory.find(
      (record) => record.flatId === flatId && record.inventoryItemId === inventoryItemId
    );
    return found ? cloneInventory(found) : null;
  }

  async findFlatInventoryById(flatInventoryId: string): Promise<FlatInventoryRecord | null> {
    const db = await readBookingDatabase();
    const found = db.flatInventory.find((record) => record.id === flatInventoryId);
    return found ? cloneInventory(found) : null;
  }

  async createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    return withBookingDatabase(async (db) => {
      db.flatInventory.push(cloneInventory(record));
      return cloneInventory(record);
    });
  }

  async updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.flatInventory.findIndex((entry) => entry.id === record.id);
      if (index < 0) {
        throw new Error("Flat inventory record not found.");
      }

      db.flatInventory[index] = cloneInventory(record);
      return cloneInventory(record);
    });
  }

  async listFlatInventory(flatId: FlatId): Promise<FlatInventoryRecord[]> {
    const db = await readBookingDatabase();
    return db.flatInventory.filter((record) => record.flatId === flatId).map(cloneInventory);
  }

  async createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord> {
    return withBookingDatabase(async (db) => {
      db.stockMovements.push(cloneMovement(record));
      return cloneMovement(record);
    });
  }

  async listStockMovements(filter?: {
    inventoryItemId?: string;
    flatId?: FlatId | null;
  }): Promise<StockMovementRecord[]> {
    const db = await readBookingDatabase();

    return db.stockMovements
      .filter((movement) => {
        if (filter?.inventoryItemId && movement.inventoryItemId !== filter.inventoryItemId) {
          return false;
        }

        if (filter?.flatId !== undefined && movement.flatId !== filter.flatId) {
          return false;
        }

        return true;
      })
      .map(cloneMovement);
  }

  async createIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    return withBookingDatabase(async (db) => {
      db.maintenanceIssues.push(cloneIssue(issue));
      return cloneIssue(issue);
    });
  }

  async findIssueById(issueId: string): Promise<MaintenanceIssueRecord | null> {
    const db = await readBookingDatabase();
    const found = db.maintenanceIssues.find((issue) => issue.id === issueId);
    return found ? cloneIssue(found) : null;
  }

  async updateIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.maintenanceIssues.findIndex((entry) => entry.id === issue.id);
      if (index < 0) {
        throw new Error("Maintenance issue not found.");
      }

      db.maintenanceIssues[index] = cloneIssue(issue);
      return cloneIssue(issue);
    });
  }

  async listIssues(filter?: {
    flatId?: FlatId;
    status?: MaintenanceIssueRecord["status"];
  }): Promise<MaintenanceIssueRecord[]> {
    const db = await readBookingDatabase();

    return db.maintenanceIssues
      .filter((issue) => {
        if (filter?.flatId && issue.flatId !== filter.flatId) {
          return false;
        }

        if (filter?.status && issue.status !== filter.status) {
          return false;
        }

        return true;
      })
      .map(cloneIssue);
  }

  async listFlatInventorySignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    return this.listSignals(flatId);
  }

  async listInventorySignals(flatId: FlatId): Promise<InventoryAlertSignal[]> {
    return this.listSignals(flatId);
  }

  private async listSignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    const db = await readBookingDatabase();
    const itemById = new Map<string, InventoryItemRecord>(
      db.inventoryItems.map((item) => [item.id, cloneItem(item)])
    );

    const signals: FlatInventorySignal[] = [];

    for (const inventory of db.flatInventory) {
      if (inventory.flatId !== flatId) {
        continue;
      }

      const item = itemById.get(inventory.inventoryItemId);
      if (!item) {
        continue;
      }

      signals.push({
        inventory: cloneInventory(inventory),
        item,
      });
    }

    return signals;
  }

  async listMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    const db = await readBookingDatabase();
    return db.maintenanceIssues.filter((issue) => issue.flatId === flatId).map(cloneIssue);
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const db = await readBookingDatabase();
    const found = db.flatReadiness.find((entry) => entry.flatId === flatId);
    return found ? cloneReadiness(found) : null;
  }

  async findReadinessByFlatId(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    return this.findFlatReadiness(flatId);
  }

  async upsertFlatReadiness(record: FlatReadinessRecord): Promise<FlatReadinessRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.flatReadiness.findIndex((entry) => entry.flatId === record.flatId);
      if (index < 0) {
        db.flatReadiness.push(cloneReadiness(record));
      } else {
        db.flatReadiness[index] = cloneReadiness(record);
      }

      return cloneReadiness(record);
    });
  }

  async listFlatAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    const db = await readBookingDatabase();
    return db.inventoryAlerts.filter((alert) => alert.flatId === flatId).map(cloneAlert);
  }

  async findAlertById(alertId: string): Promise<InventoryAlertRecord | null> {
    const db = await readBookingDatabase();
    const found = db.inventoryAlerts.find((alert) => alert.id === alertId);
    return found ? cloneAlert(found) : null;
  }

  async listActiveAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    const db = await readBookingDatabase();
    return db.inventoryAlerts
      .filter((alert) => alert.flatId === flatId && alert.status !== "resolved")
      .map(cloneAlert);
  }

  async createAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    return withBookingDatabase(async (db) => {
      db.inventoryAlerts.push(cloneAlert(alert));
      return cloneAlert(alert);
    });
  }

  async updateAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.inventoryAlerts.findIndex((entry) => entry.id === alert.id);
      if (index < 0) {
        throw new Error("Inventory alert not found.");
      }

      db.inventoryAlerts[index] = cloneAlert(alert);
      return cloneAlert(alert);
    });
  }

  async listActiveMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    const db = await readBookingDatabase();
    return db.maintenanceIssues
      .filter((issue) => issue.flatId === flatId && (issue.status === "open" || issue.status === "in_progress"))
      .map(cloneIssue);
  }

  async listTasks(filter?: {
    flatId?: FlatId;
    status?: WorkerTaskRecord["status"];
  }): Promise<WorkerTaskRecord[]> {
    const db = await readBookingDatabase();

    return db.workerTasks
      .filter((task) => {
        if (filter?.flatId && task.flatId !== filter.flatId) {
          return false;
        }

        if (filter?.status && task.status !== filter.status) {
          return false;
        }

        return true;
      })
      .map(cloneWorkerTask);
  }

  async findTaskById(taskId: string): Promise<WorkerTaskRecord | null> {
    const db = await readBookingDatabase();
    const found = db.workerTasks.find((task) => task.id === taskId);
    return found ? cloneWorkerTask(found) : null;
  }

  async findTaskBySource(
    sourceType: WorkerTaskRecord["sourceType"],
    sourceId: string
  ): Promise<WorkerTaskRecord | null> {
    const db = await readBookingDatabase();
    const found = db.workerTasks.find((task) => task.sourceType === sourceType && task.sourceId === sourceId);
    return found ? cloneWorkerTask(found) : null;
  }

  async createTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    return withBookingDatabase(async (db) => {
      db.workerTasks.push(cloneWorkerTask(task));
      return cloneWorkerTask(task);
    });
  }

  async updateTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.workerTasks.findIndex((entry) => entry.id === task.id);
      if (index < 0) {
        throw new Error("Worker task not found.");
      }

      db.workerTasks[index] = cloneWorkerTask(task);
      return cloneWorkerTask(task);
    });
  }
}

export const fileInventoryOperationsRepository = new FileInventoryOperationsRepository();
