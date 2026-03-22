import type {
  FlatInventoryConditionStatus,
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatReadinessStatus,
  InventoryAlertRecord,
  InventoryAlertSeverity,
  InventoryAlertStatus,
  InventoryAlertType,
  InventoryItemCategory,
  InventoryItemCriticality,
  InventoryItemRecord,
  InventoryTemplateRecord,
  MaintenanceIssueRecord,
  MaintenanceIssueStatus,
  ReadinessComponentStatus,
  StockMovementRecord,
  StockMovementType,
  TemplateItemRecord,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

const INVENTORY_ITEM_CATEGORIES: readonly InventoryItemCategory[] = ["asset", "consumable", "maintenance_supply"];
const INVENTORY_ITEM_CRITICALITY: readonly InventoryItemCriticality[] = ["critical", "important", "minor"];
const FLAT_INVENTORY_CONDITION_STATUS: readonly FlatInventoryConditionStatus[] = [
  "ok",
  "missing",
  "damaged",
  "needs_replacement",
];
const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
  "add",
  "deduct",
  "consume",
  "adjust",
  "damage",
  "replace",
  "transfer",
];
const READINESS_COMPONENT_STATUSES: readonly ReadinessComponentStatus[] = ["ready", "attention_required", "blocked"];
const FLAT_READINESS_STATUSES: readonly FlatReadinessStatus[] = ["ready", "needs_attention", "out_of_service"];
const INVENTORY_ALERT_TYPES: readonly InventoryAlertType[] = [
  "low_stock",
  "missing_required_item",
  "damaged_critical_asset",
  "readiness_issue",
  "readiness_impacting_issue",
];
const INVENTORY_ALERT_SEVERITY: readonly InventoryAlertSeverity[] = ["critical", "important", "minor"];
const INVENTORY_ALERT_STATUSES: readonly InventoryAlertStatus[] = ["open", "acknowledged", "resolved"];
const MAINTENANCE_ISSUE_STATUSES: readonly MaintenanceIssueStatus[] = ["open", "in_progress", "resolved", "closed"];
const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];

function ensureNonEmptyString(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function ensureIsoDateTime(value: string, field: string): string {
  const normalized = ensureNonEmptyString(value, field);
  if (Number.isNaN(new Date(normalized).getTime())) {
    throw new Error(`${field} must be a valid ISO date-time.`);
  }

  return normalized;
}

function ensureOptionalString(value: string | null, field: string): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} cannot be empty when provided.`);
  }

  return normalized;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }

  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }

  return value;
}

function ensureFlatId(value: unknown): FlatId {
  if (!FLAT_IDS.includes(value as FlatId)) {
    throw new Error("Invalid flat id.");
  }

  return value as FlatId;
}

export function ensureInventoryItemCategory(value: unknown): InventoryItemCategory {
  if (!INVENTORY_ITEM_CATEGORIES.includes(value as InventoryItemCategory)) {
    throw new Error("Invalid inventory item category.");
  }

  return value as InventoryItemCategory;
}

export function ensureInventoryItemCriticality(value: unknown): InventoryItemCriticality {
  if (!INVENTORY_ITEM_CRITICALITY.includes(value as InventoryItemCriticality)) {
    throw new Error("Invalid inventory item criticality.");
  }

  return value as InventoryItemCriticality;
}

export function ensureFlatInventoryConditionStatus(value: unknown): FlatInventoryConditionStatus {
  if (!FLAT_INVENTORY_CONDITION_STATUS.includes(value as FlatInventoryConditionStatus)) {
    throw new Error("Invalid flat inventory condition status.");
  }

  return value as FlatInventoryConditionStatus;
}

export function ensureStockMovementType(value: unknown): StockMovementType {
  if (!STOCK_MOVEMENT_TYPES.includes(value as StockMovementType)) {
    throw new Error("Invalid stock movement type.");
  }

  return value as StockMovementType;
}

export function ensureReadinessComponentStatus(value: unknown): ReadinessComponentStatus {
  if (!READINESS_COMPONENT_STATUSES.includes(value as ReadinessComponentStatus)) {
    throw new Error("Invalid readiness component status.");
  }

  return value as ReadinessComponentStatus;
}

export function ensureFlatReadinessStatus(value: unknown): FlatReadinessStatus {
  if (!FLAT_READINESS_STATUSES.includes(value as FlatReadinessStatus)) {
    throw new Error("Invalid flat readiness status.");
  }

  return value as FlatReadinessStatus;
}

export function ensureInventoryAlertType(value: unknown): InventoryAlertType {
  if (!INVENTORY_ALERT_TYPES.includes(value as InventoryAlertType)) {
    throw new Error("Invalid inventory alert type.");
  }

  return value as InventoryAlertType;
}

export function ensureInventoryAlertSeverity(value: unknown): InventoryAlertSeverity {
  if (!INVENTORY_ALERT_SEVERITY.includes(value as InventoryAlertSeverity)) {
    throw new Error("Invalid inventory alert severity.");
  }

  return value as InventoryAlertSeverity;
}

export function ensureInventoryAlertStatus(value: unknown): InventoryAlertStatus {
  if (!INVENTORY_ALERT_STATUSES.includes(value as InventoryAlertStatus)) {
    throw new Error("Invalid inventory alert status.");
  }

  return value as InventoryAlertStatus;
}

export function ensureMaintenanceIssueStatus(value: unknown): MaintenanceIssueStatus {
  if (!MAINTENANCE_ISSUE_STATUSES.includes(value as MaintenanceIssueStatus)) {
    throw new Error("Invalid maintenance issue status.");
  }

  return value as MaintenanceIssueStatus;
}

export function createInventoryItemRecord(input: InventoryItemRecord): InventoryItemRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    name: ensureNonEmptyString(input.name, "name"),
    category: ensureInventoryItemCategory(input.category),
    internalCode: ensureOptionalString(input.internalCode, "internalCode"),
    unitOfMeasure: ensureNonEmptyString(input.unitOfMeasure, "unitOfMeasure"),
    reorderThreshold:
      input.reorderThreshold === null ? null : ensureNonNegativeInteger(input.reorderThreshold, "reorderThreshold"),
    parLevel: input.parLevel === null ? null : ensureNonNegativeInteger(input.parLevel, "parLevel"),
    criticality: ensureInventoryItemCriticality(input.criticality),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createInventoryTemplateRecord(input: InventoryTemplateRecord): InventoryTemplateRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    name: ensureNonEmptyString(input.name, "name"),
    description: ensureOptionalString(input.description, "description"),
    flatType: ensureOptionalString(input.flatType, "flatType"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createTemplateItemRecord(input: TemplateItemRecord): TemplateItemRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    templateId: ensureNonEmptyString(input.templateId, "templateId"),
    inventoryItemId: ensureNonEmptyString(input.inventoryItemId, "inventoryItemId"),
    expectedQuantity: ensurePositiveInteger(input.expectedQuantity, "expectedQuantity"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createFlatInventoryRecord(input: FlatInventoryRecord): FlatInventoryRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    flatId: ensureFlatId(input.flatId),
    inventoryItemId: ensureNonEmptyString(input.inventoryItemId, "inventoryItemId"),
    expectedQuantity: ensureNonNegativeInteger(input.expectedQuantity, "expectedQuantity"),
    currentQuantity: ensureNonNegativeInteger(input.currentQuantity, "currentQuantity"),
    conditionStatus: ensureFlatInventoryConditionStatus(input.conditionStatus),
    notes: ensureOptionalString(input.notes, "notes"),
    lastCheckedAt: input.lastCheckedAt === null ? null : ensureIsoDateTime(input.lastCheckedAt, "lastCheckedAt"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createStockMovementRecord(input: StockMovementRecord): StockMovementRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    inventoryItemId: ensureNonEmptyString(input.inventoryItemId, "inventoryItemId"),
    flatId: input.flatId === null ? null : ensureFlatId(input.flatId),
    movementType: ensureStockMovementType(input.movementType),
    quantity: ensurePositiveInteger(input.quantity, "quantity"),
    reason: ensureNonEmptyString(input.reason, "reason"),
    notes: ensureOptionalString(input.notes, "notes"),
    actorId: ensureOptionalString(input.actorId, "actorId"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
  };
}

export function createFlatReadinessRecord(input: FlatReadinessRecord): FlatReadinessRecord {
  return {
    flatId: ensureFlatId(input.flatId),
    cleaningStatus: ensureReadinessComponentStatus(input.cleaningStatus),
    linenStatus: ensureReadinessComponentStatus(input.linenStatus),
    consumablesStatus: ensureReadinessComponentStatus(input.consumablesStatus),
    maintenanceStatus: ensureReadinessComponentStatus(input.maintenanceStatus),
    criticalAssetStatus: ensureReadinessComponentStatus(input.criticalAssetStatus),
    readinessStatus: ensureFlatReadinessStatus(input.readinessStatus),
    overrideStatus: input.overrideStatus === null ? null : ensureFlatReadinessStatus(input.overrideStatus),
    overrideReason: ensureOptionalString(input.overrideReason, "overrideReason"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createInventoryAlertRecord(input: InventoryAlertRecord): InventoryAlertRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    inventoryItemId: ensureOptionalString(input.inventoryItemId, "inventoryItemId"),
    flatId: input.flatId === null ? null : ensureFlatId(input.flatId),
    alertType: ensureInventoryAlertType(input.alertType),
    severity: ensureInventoryAlertSeverity(input.severity),
    status: ensureInventoryAlertStatus(input.status),
    message: ensureNonEmptyString(input.message, "message"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    resolvedAt: input.resolvedAt === null ? null : ensureIsoDateTime(input.resolvedAt, "resolvedAt"),
  };
}

export function createMaintenanceIssueRecord(input: MaintenanceIssueRecord): MaintenanceIssueRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    flatId: ensureFlatId(input.flatId),
    inventoryItemId: ensureOptionalString(input.inventoryItemId, "inventoryItemId"),
    title: ensureNonEmptyString(input.title, "title"),
    notes: ensureOptionalString(input.notes, "notes"),
    severity: ensureInventoryAlertSeverity(input.severity),
    status: ensureMaintenanceIssueStatus(input.status),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
    resolvedAt: input.resolvedAt === null ? null : ensureIsoDateTime(input.resolvedAt, "resolvedAt"),
  };
}


