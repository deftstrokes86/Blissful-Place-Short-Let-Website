import { readBookingDatabase, withBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  InventoryItemRecord,
  MaintenanceIssueRecord,
} from "../../types/booking-backend";
import type { FlatInventorySignal, ReadinessRepository } from "./readiness-service";
import type {
  InventoryAlertRepository,
  InventoryAlertSignal,
} from "./inventory-alert-service";
import type { MaintenanceIssueRepository } from "./maintenance-issue-service";

function cloneFlat(value: FlatRecord): FlatRecord {
  return { ...value };
}

function cloneItem(value: InventoryItemRecord): InventoryItemRecord {
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

function cloneReadiness(value: FlatReadinessRecord): FlatReadinessRecord {
  return { ...value };
}

export class FileInventoryOperationsRepository
  implements ReadinessRepository, InventoryAlertRepository, MaintenanceIssueRepository
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
}

export const fileInventoryOperationsRepository = new FileInventoryOperationsRepository();
