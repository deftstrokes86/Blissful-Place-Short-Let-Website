import { readBookingDatabase } from "../db/file-database";
import type { FlatId } from "../../types/booking";
import type {
  FlatReadinessRecord,
  InventoryAlertRecord,
  InventoryItemRecord,
  InventoryTemplateRecord,
  MaintenanceIssueRecord,
  StockMovementRecord,
  TemplateItemRecord,
} from "../../types/booking-backend";
import { InventoryAlertService } from "./inventory-alert-service";
import { MaintenanceIssueService } from "./maintenance-issue-service";

interface AdminInventoryServiceDependencies {
  maintenanceIssueService: Pick<
    MaintenanceIssueService,
    "createIssue" | "resolveIssue" | "updateIssueStatus"
  >;
  inventoryAlertService: Pick<InventoryAlertService, "syncFlatAlerts">;
}

export interface AdminInventoryOverview {
  generatedAt: string;
  flats: Array<{ id: FlatId; name: string }>;
  inventoryCatalog: InventoryItemRecord[];
  templates: Array<
    InventoryTemplateRecord & {
      items: Array<TemplateItemRecord & { itemName: string | null }>;
    }
  >;
  flatInventory: Array<{
    flatId: FlatId;
    flatName: string;
    records: Array<{
      id: string;
      inventoryItemId: string;
      itemName: string;
      category: InventoryItemRecord["category"];
      criticality: InventoryItemRecord["criticality"];
      unitOfMeasure: string;
      expectedQuantity: number;
      currentQuantity: number;
      conditionStatus: string;
      notes: string | null;
      lastCheckedAt: string | null;
    }>;
  }>;
  stockMovements: Array<
    StockMovementRecord & {
      itemName: string;
      contextLabel: string;
    }
  >;
  readiness: Array<{
    flatId: FlatId;
    flatName: string;
    readiness: FlatReadinessRecord | null;
    activeAlerts: InventoryAlertRecord[];
    activeIssues: MaintenanceIssueRecord[];
  }>;
  activeAlerts: InventoryAlertRecord[];
  maintenanceIssues: MaintenanceIssueRecord[];
}

export class AdminInventoryService {
  private readonly maintenanceIssueService: AdminInventoryServiceDependencies["maintenanceIssueService"];
  private readonly inventoryAlertService: AdminInventoryServiceDependencies["inventoryAlertService"];

  constructor(dependencies: AdminInventoryServiceDependencies) {
    this.maintenanceIssueService = dependencies.maintenanceIssueService;
    this.inventoryAlertService = dependencies.inventoryAlertService;
  }

  async getOverview(): Promise<AdminInventoryOverview> {
    await this.syncAlertsForAllFlats();
    const db = await readBookingDatabase();

    const itemById = new Map<string, InventoryItemRecord>(db.inventoryItems.map((item) => [item.id, { ...item }]));
    const flatById = new Map<FlatId, { id: FlatId; name: string }>(
      db.flats.map((flat) => [flat.id, { id: flat.id, name: flat.name }])
    );

    const templates = db.inventoryTemplates
      .map((template) => ({
        ...template,
        items: db.templateItems
          .filter((item) => item.templateId === template.id)
          .map((item) => ({
            ...item,
            itemName: itemById.get(item.inventoryItemId)?.name ?? null,
          }))
          .sort((left, right) => left.inventoryItemId.localeCompare(right.inventoryItemId)),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const flatInventory = db.flats
      .map((flat) => ({
        flatId: flat.id,
        flatName: flat.name,
        records: db.flatInventory
          .filter((record) => record.flatId === flat.id)
          .map((record) => {
            const item = itemById.get(record.inventoryItemId);
            return {
              id: record.id,
              inventoryItemId: record.inventoryItemId,
              itemName: item?.name ?? record.inventoryItemId,
              category: item?.category ?? "asset",
              criticality: item?.criticality ?? "minor",
              unitOfMeasure: item?.unitOfMeasure ?? "unit",
              expectedQuantity: record.expectedQuantity,
              currentQuantity: record.currentQuantity,
              conditionStatus: record.conditionStatus,
              notes: record.notes,
              lastCheckedAt: record.lastCheckedAt,
            };
          })
          .sort((left, right) => left.itemName.localeCompare(right.itemName)),
      }))
      .sort((left, right) => left.flatName.localeCompare(right.flatName));

    const stockMovements = [...db.stockMovements]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 40)
      .map((movement) => ({
        ...movement,
        itemName: itemById.get(movement.inventoryItemId)?.name ?? movement.inventoryItemId,
        contextLabel: movement.flatId ? flatById.get(movement.flatId)?.name ?? movement.flatId : "Central Stock",
      }));

    const activeAlerts = db.inventoryAlerts
      .filter((alert) => alert.status !== "resolved")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const maintenanceIssues = [...db.maintenanceIssues].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const readiness = db.flats
      .map((flat) => ({
        flatId: flat.id,
        flatName: flat.name,
        readiness: db.flatReadiness.find((entry) => entry.flatId === flat.id) ?? null,
        activeAlerts: activeAlerts.filter((alert) => alert.flatId === flat.id),
        activeIssues: maintenanceIssues.filter(
          (issue) => issue.flatId === flat.id && (issue.status === "open" || issue.status === "in_progress")
        ),
      }))
      .sort((left, right) => left.flatName.localeCompare(right.flatName));

    return {
      generatedAt: new Date().toISOString(),
      flats: db.flats.map((flat) => ({ id: flat.id, name: flat.name })),
      inventoryCatalog: [...db.inventoryItems].sort((left, right) => left.name.localeCompare(right.name)),
      templates,
      flatInventory,
      stockMovements,
      readiness,
      activeAlerts,
      maintenanceIssues,
    };
  }

  async createMaintenanceIssue(input: {
    flatId: FlatId;
    inventoryItemId: string | null;
    title: string;
    notes: string | null;
    severity: "critical" | "important" | "minor";
  }): Promise<MaintenanceIssueRecord> {
    const created = await this.maintenanceIssueService.createIssue(input);
    await this.inventoryAlertService.syncFlatAlerts(created.flatId);
    return created;
  }

  async updateMaintenanceIssueStatus(input: {
    issueId: string;
    status: MaintenanceIssueRecord["status"];
    notes?: string | null;
  }): Promise<MaintenanceIssueRecord> {
    const updated =
      input.status === "resolved"
        ? await this.maintenanceIssueService.resolveIssue({
            issueId: input.issueId,
            resolutionNote: input.notes?.trim() || "Resolved by staff.",
          })
        : await this.maintenanceIssueService.updateIssueStatus({
            issueId: input.issueId,
            status: input.status,
            notes: input.notes,
          });

    await this.inventoryAlertService.syncFlatAlerts(updated.flatId);
    return updated;
  }

  private async syncAlertsForAllFlats(): Promise<void> {
    const db = await readBookingDatabase();
    for (const flat of db.flats) {
      await this.inventoryAlertService.syncFlatAlerts(flat.id);
    }
  }
}
