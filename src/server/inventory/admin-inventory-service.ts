import { prisma } from "../db/prisma";
import type { FlatId } from "../../types/booking";
import type {
  FlatReadinessRecord,
  InventoryAlertRecord,
  InventoryItemRecord,
  InventoryTemplateRecord,
  MaintenanceIssueRecord,
  StockMovementRecord,
  TemplateItemRecord,
  WorkerTaskRecord,
} from "../../types/booking-backend";
import { InventoryAlertService } from "./inventory-alert-service";
import { MaintenanceIssueService } from "./maintenance-issue-service";

interface AdminInventoryServiceDependencies {
  maintenanceIssueService: Pick<
    MaintenanceIssueService,
    "createIssue" | "resolveIssue" | "updateIssueStatus"
  >;
  inventoryAlertService: Pick<InventoryAlertService, "syncFlatAlerts" | "resolveAlert">;
}

export interface AdminInventoryOverview {
  generatedAt: string;
  flats: Array<{ id: FlatId; name: string }>;
  inventoryCatalog: InventoryItemRecord[];
  centralStock?: Array<{
    inventoryItemId: string;
    itemName: string;
    unitOfMeasure: string;
    quantity: number;
  }>;
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
  workerTasks: WorkerTaskRecord[];
}

function mapInventoryItem(row: {
  id: string;
  name: string;
  category: string;
  internalCode: string | null;
  unitOfMeasure: string;
  reorderThreshold: number | null;
  parLevel: number | null;
  criticality: string;
  createdAt: Date;
  updatedAt: Date;
}): InventoryItemRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category as InventoryItemRecord["category"],
    internalCode: row.internalCode ?? null,
    unitOfMeasure: row.unitOfMeasure,
    reorderThreshold: row.reorderThreshold ?? null,
    parLevel: row.parLevel ?? null,
    criticality: row.criticality as InventoryItemRecord["criticality"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapTemplate(row: {
  id: string;
  name: string;
  description: string | null;
  flatType: string | null;
  createdAt: Date;
  updatedAt: Date;
}): InventoryTemplateRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    flatType: row.flatType ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapTemplateItem(row: {
  id: string;
  templateId: string;
  inventoryItemId: string;
  expectedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}): TemplateItemRecord {
  return {
    id: row.id,
    templateId: row.templateId,
    inventoryItemId: row.inventoryItemId,
    expectedQuantity: row.expectedQuantity,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapStockMovement(row: {
  id: string;
  inventoryItemId: string;
  flatId: string | null;
  movementType: string;
  quantity: number;
  reason: string;
  notes: string | null;
  actorId: string | null;
  createdAt: Date;
}): StockMovementRecord {
  return {
    id: row.id,
    inventoryItemId: row.inventoryItemId,
    flatId: (row.flatId ?? null) as FlatId | null,
    movementType: row.movementType as StockMovementRecord["movementType"],
    quantity: row.quantity,
    reason: row.reason,
    notes: row.notes ?? null,
    actorId: row.actorId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapInventoryAlert(row: {
  id: string;
  inventoryItemId: string | null;
  flatId: string | null;
  alertType: string;
  severity: string;
  status: string;
  message: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): InventoryAlertRecord {
  return {
    id: row.id,
    inventoryItemId: row.inventoryItemId ?? null,
    flatId: (row.flatId ?? null) as FlatId | null,
    alertType: row.alertType as InventoryAlertRecord["alertType"],
    severity: row.severity as InventoryAlertRecord["severity"],
    status: row.status as InventoryAlertRecord["status"],
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

function mapMaintenanceIssue(row: {
  id: string;
  flatId: string;
  inventoryItemId: string | null;
  title: string;
  notes: string | null;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}): MaintenanceIssueRecord {
  return {
    id: row.id,
    flatId: row.flatId as FlatId,
    inventoryItemId: row.inventoryItemId ?? null,
    title: row.title,
    notes: row.notes ?? null,
    severity: row.severity as MaintenanceIssueRecord["severity"],
    status: row.status as MaintenanceIssueRecord["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

function mapWorkerTask(row: {
  id: string;
  flatId: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: string;
  status: string;
  sourceType: string;
  sourceId: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): WorkerTaskRecord {
  return {
    id: row.id,
    flatId: row.flatId as FlatId,
    title: row.title,
    description: row.description ?? null,
    taskType: row.taskType as WorkerTaskRecord["taskType"],
    priority: row.priority as WorkerTaskRecord["priority"],
    status: row.status as WorkerTaskRecord["status"],
    sourceType: row.sourceType as WorkerTaskRecord["sourceType"],
    sourceId: row.sourceId,
    assignedTo: row.assignedTo ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

function mapFlatReadiness(row: {
  flatId: string;
  cleaningStatus: string;
  linenStatus: string;
  consumablesStatus: string;
  maintenanceStatus: string;
  criticalAssetStatus: string;
  readinessStatus: string;
  overrideStatus: string | null;
  overrideReason: string | null;
  updatedAt: Date;
}): FlatReadinessRecord {
  return {
    flatId: row.flatId as FlatId,
    cleaningStatus: row.cleaningStatus as FlatReadinessRecord["cleaningStatus"],
    linenStatus: row.linenStatus as FlatReadinessRecord["linenStatus"],
    consumablesStatus: row.consumablesStatus as FlatReadinessRecord["consumablesStatus"],
    maintenanceStatus: row.maintenanceStatus as FlatReadinessRecord["maintenanceStatus"],
    criticalAssetStatus: row.criticalAssetStatus as FlatReadinessRecord["criticalAssetStatus"],
    readinessStatus: row.readinessStatus as FlatReadinessRecord["readinessStatus"],
    overrideStatus: (row.overrideStatus ?? null) as FlatReadinessRecord["overrideStatus"],
    overrideReason: row.overrideReason ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
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

    const [
      flatRows,
      inventoryItemRows,
      inventoryTemplateRows,
      templateItemRows,
      centralStockRows,
      flatInventoryRows,
      stockMovementRows,
      activeAlertRows,
      maintenanceIssueRows,
      workerTaskRows,
      flatReadinessRows,
    ] = await Promise.all([
      prisma.flat.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.inventoryItem.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.inventoryTemplate.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.templateItem.findMany(),
      prisma.centralStock.findMany(),
      prisma.flatInventory.findMany(),
      prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.inventoryAlert.findMany({
        where: { status: { not: "resolved" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.maintenanceIssue.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.workerTask.findMany({
        orderBy: { updatedAt: "desc" },
      }),
      prisma.flatReadiness.findMany(),
    ]);

    const flats = flatRows.map((flat) => ({ id: flat.id as FlatId, name: flat.name }));
    const flatById = new Map<FlatId, { id: FlatId; name: string }>(flats.map((flat) => [flat.id, flat]));

    const inventoryCatalog = inventoryItemRows.map(mapInventoryItem);
    const itemById = new Map<string, InventoryItemRecord>(inventoryCatalog.map((item) => [item.id, item]));
    const templateItems = templateItemRows.map(mapTemplateItem);
    const activeAlerts = activeAlertRows.map(mapInventoryAlert);
    const maintenanceIssues = maintenanceIssueRows.map(mapMaintenanceIssue);
    const workerTasks = workerTaskRows.map(mapWorkerTask);
    const readinessByFlatId = new Map<FlatId, FlatReadinessRecord>(
      flatReadinessRows.map((row) => {
        const readiness = mapFlatReadiness(row);
        return [readiness.flatId, readiness] as const;
      })
    );
    const centralStockQuantityByItemId = new Map<string, number>(
      centralStockRows.map((row) => [row.inventoryItemId, row.quantity])
    );

    const templates = inventoryTemplateRows.map((templateRow) => {
      const template = mapTemplate(templateRow);

      return {
        ...template,
        items: templateItems
          .filter((item) => item.templateId === template.id)
          .map((item) => ({
            ...item,
            itemName: itemById.get(item.inventoryItemId)?.name ?? null,
          }))
          .sort((left, right) => left.inventoryItemId.localeCompare(right.inventoryItemId)),
      };
    });

    const centralStock = inventoryCatalog.map((item) => ({
      inventoryItemId: item.id,
      itemName: item.name,
      unitOfMeasure: item.unitOfMeasure,
      quantity: centralStockQuantityByItemId.get(item.id) ?? 0,
    }));

    const flatInventory = flats.map((flat) => ({
      flatId: flat.id,
      flatName: flat.name,
      records: flatInventoryRows
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
            notes: record.notes ?? null,
            lastCheckedAt: record.lastCheckedAt ? record.lastCheckedAt.toISOString() : null,
          };
        })
        .sort((left, right) => left.itemName.localeCompare(right.itemName)),
    }));

    const stockMovements = stockMovementRows.map((movement) => {
      const mapped = mapStockMovement(movement);
      return {
        ...mapped,
        itemName: itemById.get(mapped.inventoryItemId)?.name ?? mapped.inventoryItemId,
        contextLabel: mapped.flatId ? flatById.get(mapped.flatId)?.name ?? mapped.flatId : "Central Stock",
      };
    });

    const readiness = flats.map((flat) => ({
      flatId: flat.id,
      flatName: flat.name,
      readiness: readinessByFlatId.get(flat.id) ?? null,
      activeAlerts: activeAlerts.filter((alert) => alert.flatId === flat.id),
      activeIssues: maintenanceIssues.filter(
        (issue) => issue.flatId === flat.id && (issue.status === "open" || issue.status === "in_progress")
      ),
    }));

    return {
      generatedAt: new Date().toISOString(),
      flats,
      inventoryCatalog,
      centralStock,
      templates,
      flatInventory,
      stockMovements,
      readiness,
      activeAlerts,
      maintenanceIssues,
      workerTasks,
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

  async resolveInventoryAlert(input: {
    alertId: string;
    note?: string | null;
  }) {
    const alert = await this.inventoryAlertService.resolveAlert({
      alertId: input.alertId,
      note: input.note,
    });

    if (alert.flatId) {
      await this.inventoryAlertService.syncFlatAlerts(alert.flatId);
    }

    return alert;
  }

  private async syncAlertsForAllFlats(): Promise<void> {
    const flatRows = await prisma.flat.findMany({
      select: { id: true },
    });

    await Promise.all(flatRows.map((flat) => this.inventoryAlertService.syncFlatAlerts(flat.id as FlatId)));
  }
}
