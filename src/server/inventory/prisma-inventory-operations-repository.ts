import { prisma } from "../db/prisma";
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
import type { InventoryAlertRepository, InventoryAlertSignal } from "./inventory-alert-service";
import type { InventoryItemRepository } from "./inventory-item-service";
import type { InventoryTemplateRepository } from "./inventory-template-service";
import type { MaintenanceIssueRepository } from "./maintenance-issue-service";
import type { FlatInventorySignal, ReadinessRepository } from "./readiness-service";
import type { FlatInventoryReconciliationRepository } from "./flat-inventory-reconciliation-service";
import type { StockMovementRepository } from "./stock-movement-service";
import type { WorkerTaskRepository } from "./worker-task-service";

// --- Mappers ---

function mapFlat(row: {
  id: string;
  name: string;
  nightlyRate: number;
  maxGuests: number;
  createdAt: Date;
  updatedAt: Date;
}): FlatRecord {
  return {
    id: row.id as FlatId,
    name: row.name,
    nightlyRate: row.nightlyRate,
    maxGuests: row.maxGuests,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapItem(row: {
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

function mapFlatInventory(row: {
  id: string;
  flatId: string;
  inventoryItemId: string;
  expectedQuantity: number;
  currentQuantity: number;
  conditionStatus: string;
  notes: string | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): FlatInventoryRecord {
  return {
    id: row.id,
    flatId: row.flatId as FlatId,
    inventoryItemId: row.inventoryItemId,
    expectedQuantity: row.expectedQuantity,
    currentQuantity: row.currentQuantity,
    conditionStatus: row.conditionStatus as FlatInventoryRecord["conditionStatus"],
    notes: row.notes ?? null,
    lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapMovement(row: {
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

function mapIssue(row: {
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

function mapAlert(row: {
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

function mapReadiness(row: {
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

// --- Repository ---

export class PrismaInventoryOperationsRepository
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
  // --- Flat ---

  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    const found = await prisma.flat.findUnique({ where: { id: flatId } });
    return found ? mapFlat(found) : null;
  }

  // --- Inventory Items ---

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    return found ? mapItem(found) : null;
  }

  async listInventoryItems(): Promise<InventoryItemRecord[]> {
    const rows = await prisma.inventoryItem.findMany();
    return rows.map(mapItem);
  }

  async createInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    const created = await prisma.inventoryItem.create({
      data: {
        id: record.id,
        name: record.name,
        category: record.category,
        internalCode: record.internalCode ?? undefined,
        unitOfMeasure: record.unitOfMeasure,
        reorderThreshold: record.reorderThreshold ?? undefined,
        parLevel: record.parLevel ?? undefined,
        criticality: record.criticality,
      },
    });
    return mapItem(created);
  }

  async updateInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    const updated = await prisma.inventoryItem.update({
      where: { id: record.id },
      data: {
        name: record.name,
        category: record.category,
        internalCode: record.internalCode ?? null,
        unitOfMeasure: record.unitOfMeasure,
        reorderThreshold: record.reorderThreshold ?? null,
        parLevel: record.parLevel ?? null,
        criticality: record.criticality,
      },
    });
    return mapItem(updated);
  }

  // --- Central Stock ---

  async getCentralStockQuantity(inventoryItemId: string): Promise<number> {
    const found = await prisma.centralStock.findUnique({ where: { inventoryItemId } });
    return found?.quantity ?? 0;
  }

  async setCentralStockQuantity(inventoryItemId: string, quantity: number): Promise<void> {
    await prisma.centralStock.upsert({
      where: { inventoryItemId },
      update: { quantity },
      create: { inventoryItemId, quantity },
    });
  }

  // --- Templates ---

  async createTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    const created = await prisma.inventoryTemplate.create({
      data: {
        id: template.id,
        name: template.name,
        description: template.description ?? undefined,
        flatType: template.flatType ?? undefined,
      },
    });
    return mapTemplate(created);
  }

  async listTemplates(): Promise<InventoryTemplateRecord[]> {
    const rows = await prisma.inventoryTemplate.findMany();
    return rows.map(mapTemplate);
  }

  async findTemplateById(templateId: string): Promise<InventoryTemplateRecord | null> {
    const found = await prisma.inventoryTemplate.findUnique({ where: { id: templateId } });
    return found ? mapTemplate(found) : null;
  }

  async updateTemplate(template: InventoryTemplateRecord): Promise<InventoryTemplateRecord> {
    const updated = await prisma.inventoryTemplate.update({
      where: { id: template.id },
      data: {
        name: template.name,
        description: template.description ?? null,
        flatType: template.flatType ?? null,
      },
    });
    return mapTemplate(updated);
  }

  async createTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    const created = await prisma.templateItem.create({
      data: {
        id: item.id,
        templateId: item.templateId,
        inventoryItemId: item.inventoryItemId,
        expectedQuantity: item.expectedQuantity,
      },
    });
    return mapTemplateItem(created);
  }

  async findTemplateItemById(templateItemId: string): Promise<TemplateItemRecord | null> {
    const found = await prisma.templateItem.findUnique({ where: { id: templateItemId } });
    return found ? mapTemplateItem(found) : null;
  }

  async findTemplateItemByTemplateAndInventoryItem(
    templateId: string,
    inventoryItemId: string
  ): Promise<TemplateItemRecord | null> {
    const found = await prisma.templateItem.findUnique({
      where: { templateId_inventoryItemId: { templateId, inventoryItemId } },
    });
    return found ? mapTemplateItem(found) : null;
  }

  async listTemplateItems(templateId: string): Promise<TemplateItemRecord[]> {
    const rows = await prisma.templateItem.findMany({ where: { templateId } });
    return rows.map(mapTemplateItem);
  }

  async updateTemplateItem(item: TemplateItemRecord): Promise<TemplateItemRecord> {
    const updated = await prisma.templateItem.update({
      where: { id: item.id },
      data: { expectedQuantity: item.expectedQuantity },
    });
    return mapTemplateItem(updated);
  }

  async removeTemplateItem(templateItemId: string): Promise<void> {
    await prisma.templateItem.delete({ where: { id: templateItemId } });
  }

  // --- Flat Inventory ---

  async findFlatInventoryByFlatAndItem(
    flatId: FlatId,
    inventoryItemId: string
  ): Promise<FlatInventoryRecord | null> {
    const found = await prisma.flatInventory.findUnique({
      where: { flatId_inventoryItemId: { flatId, inventoryItemId } },
    });
    return found ? mapFlatInventory(found) : null;
  }

  async findFlatInventoryById(flatInventoryId: string): Promise<FlatInventoryRecord | null> {
    const found = await prisma.flatInventory.findUnique({ where: { id: flatInventoryId } });
    return found ? mapFlatInventory(found) : null;
  }

  async createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    const created = await prisma.flatInventory.create({
      data: {
        id: record.id,
        flatId: record.flatId,
        inventoryItemId: record.inventoryItemId,
        expectedQuantity: record.expectedQuantity,
        currentQuantity: record.currentQuantity,
        conditionStatus: record.conditionStatus,
        notes: record.notes ?? undefined,
        lastCheckedAt: record.lastCheckedAt ? new Date(record.lastCheckedAt) : undefined,
      },
    });
    return mapFlatInventory(created);
  }

  async updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    const updated = await prisma.flatInventory.update({
      where: { id: record.id },
      data: {
        expectedQuantity: record.expectedQuantity,
        currentQuantity: record.currentQuantity,
        conditionStatus: record.conditionStatus,
        notes: record.notes ?? null,
        lastCheckedAt: record.lastCheckedAt ? new Date(record.lastCheckedAt) : null,
      },
    });
    return mapFlatInventory(updated);
  }

  async listFlatInventory(flatId: FlatId): Promise<FlatInventoryRecord[]> {
    const rows = await prisma.flatInventory.findMany({ where: { flatId } });
    return rows.map(mapFlatInventory);
  }

  // --- Stock Movements ---

  async createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord> {
    const created = await prisma.stockMovement.create({
      data: {
        id: record.id,
        inventoryItemId: record.inventoryItemId,
        flatId: record.flatId ?? undefined,
        movementType: record.movementType,
        quantity: record.quantity,
        reason: record.reason,
        notes: record.notes ?? undefined,
        actorId: record.actorId ?? undefined,
      },
    });
    return mapMovement(created);
  }

  async listStockMovements(filter?: {
    inventoryItemId?: string;
    flatId?: FlatId | null;
  }): Promise<StockMovementRecord[]> {
    const rows = await prisma.stockMovement.findMany({
      where: {
        ...(filter?.inventoryItemId !== undefined && { inventoryItemId: filter.inventoryItemId }),
        ...(filter?.flatId !== undefined && { flatId: filter.flatId ?? null }),
      },
    });
    return rows.map(mapMovement);
  }

  // --- Maintenance Issues ---

  async createIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    const created = await prisma.maintenanceIssue.create({
      data: {
        id: issue.id,
        flatId: issue.flatId,
        inventoryItemId: issue.inventoryItemId ?? undefined,
        title: issue.title,
        notes: issue.notes ?? undefined,
        severity: issue.severity,
        status: issue.status,
        resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt) : undefined,
      },
    });
    return mapIssue(created);
  }

  async findIssueById(issueId: string): Promise<MaintenanceIssueRecord | null> {
    const found = await prisma.maintenanceIssue.findUnique({ where: { id: issueId } });
    return found ? mapIssue(found) : null;
  }

  async updateIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    const updated = await prisma.maintenanceIssue.update({
      where: { id: issue.id },
      data: {
        title: issue.title,
        notes: issue.notes ?? null,
        severity: issue.severity,
        status: issue.status,
        resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt) : null,
      },
    });
    return mapIssue(updated);
  }

  async listIssues(filter?: {
    flatId?: FlatId;
    status?: MaintenanceIssueRecord["status"];
  }): Promise<MaintenanceIssueRecord[]> {
    const rows = await prisma.maintenanceIssue.findMany({
      where: {
        ...(filter?.flatId !== undefined && { flatId: filter.flatId }),
        ...(filter?.status !== undefined && { status: filter.status }),
      },
    });
    return rows.map(mapIssue);
  }

  async listActiveMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    const rows = await prisma.maintenanceIssue.findMany({
      where: { flatId, status: { in: ["open", "in_progress"] } },
    });
    return rows.map(mapIssue);
  }

  async listMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    const rows = await prisma.maintenanceIssue.findMany({ where: { flatId } });
    return rows.map(mapIssue);
  }

  // --- Readiness ---

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = await prisma.flatReadiness.findUnique({ where: { flatId } });
    return found ? mapReadiness(found) : null;
  }

  async findReadinessByFlatId(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    return this.findFlatReadiness(flatId);
  }

  async upsertFlatReadiness(record: FlatReadinessRecord): Promise<FlatReadinessRecord> {
    const upserted = await prisma.flatReadiness.upsert({
      where: { flatId: record.flatId },
      update: {
        cleaningStatus: record.cleaningStatus,
        linenStatus: record.linenStatus,
        consumablesStatus: record.consumablesStatus,
        maintenanceStatus: record.maintenanceStatus,
        criticalAssetStatus: record.criticalAssetStatus,
        readinessStatus: record.readinessStatus,
        overrideStatus: record.overrideStatus ?? null,
        overrideReason: record.overrideReason ?? null,
      },
      create: {
        flatId: record.flatId,
        cleaningStatus: record.cleaningStatus,
        linenStatus: record.linenStatus,
        consumablesStatus: record.consumablesStatus,
        maintenanceStatus: record.maintenanceStatus,
        criticalAssetStatus: record.criticalAssetStatus,
        readinessStatus: record.readinessStatus,
        overrideStatus: record.overrideStatus ?? undefined,
        overrideReason: record.overrideReason ?? undefined,
      },
    });
    return mapReadiness(upserted);
  }

  // --- Inventory Alerts ---

  async listFlatAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    const rows = await prisma.inventoryAlert.findMany({ where: { flatId } });
    return rows.map(mapAlert);
  }

  async findAlertById(alertId: string): Promise<InventoryAlertRecord | null> {
    const found = await prisma.inventoryAlert.findUnique({ where: { id: alertId } });
    return found ? mapAlert(found) : null;
  }

  async listActiveAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    const rows = await prisma.inventoryAlert.findMany({
      where: { flatId, status: { not: "resolved" } },
    });
    return rows.map(mapAlert);
  }

  async createAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    const created = await prisma.inventoryAlert.create({
      data: {
        id: alert.id,
        inventoryItemId: alert.inventoryItemId ?? undefined,
        flatId: alert.flatId ?? undefined,
        alertType: alert.alertType,
        severity: alert.severity,
        status: alert.status,
        message: alert.message,
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
      },
    });
    return mapAlert(created);
  }

  async updateAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    const updated = await prisma.inventoryAlert.update({
      where: { id: alert.id },
      data: {
        status: alert.status,
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : null,
      },
    });
    return mapAlert(updated);
  }

  // --- Inventory Signals (for readiness/alert services) ---

  async listFlatInventorySignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    return this.listSignals(flatId);
  }

  async listInventorySignals(flatId: FlatId): Promise<InventoryAlertSignal[]> {
    return this.listSignals(flatId);
  }

  private async listSignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    const rows = await prisma.flatInventory.findMany({
      where: { flatId },
      include: { inventoryItem: true },
    });

    return rows.map((row) => ({
      inventory: mapFlatInventory(row),
      item: mapItem(row.inventoryItem),
    }));
  }

  // --- Worker Tasks ---

  async listTasks(filter?: {
    flatId?: FlatId;
    status?: WorkerTaskRecord["status"];
  }): Promise<WorkerTaskRecord[]> {
    const rows = await prisma.workerTask.findMany({
      where: {
        ...(filter?.flatId !== undefined && { flatId: filter.flatId }),
        ...(filter?.status !== undefined && { status: filter.status }),
      },
    });
    return rows.map(mapWorkerTask);
  }

  async findTaskById(taskId: string): Promise<WorkerTaskRecord | null> {
    const found = await prisma.workerTask.findUnique({ where: { id: taskId } });
    return found ? mapWorkerTask(found) : null;
  }

  async findTaskBySource(
    sourceType: WorkerTaskRecord["sourceType"],
    sourceId: string
  ): Promise<WorkerTaskRecord | null> {
    const found = await prisma.workerTask.findFirst({
      where: { sourceType, sourceId },
    });
    return found ? mapWorkerTask(found) : null;
  }

  async createTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    const created = await prisma.workerTask.create({
      data: {
        id: task.id,
        flatId: task.flatId,
        title: task.title,
        description: task.description ?? undefined,
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        sourceType: task.sourceType,
        sourceId: task.sourceId,
        assignedTo: task.assignedTo ?? undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      },
    });
    return mapWorkerTask(created);
  }

  async updateTask(task: WorkerTaskRecord): Promise<WorkerTaskRecord> {
    const updated = await prisma.workerTask.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description ?? null,
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo ?? null,
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
      },
    });
    return mapWorkerTask(updated);
  }
}

export const prismaInventoryOperationsRepository = new PrismaInventoryOperationsRepository();
