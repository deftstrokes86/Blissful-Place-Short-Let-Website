import type { FlatId } from "@/types/booking";

interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

export interface AdminInventoryItem {
  id: string;
  name: string;
  category: "asset" | "consumable" | "maintenance_supply";
  internalCode?: string | null;
  unitOfMeasure: string;
  reorderThreshold: number | null;
  parLevel: number | null;
  criticality: "critical" | "important" | "minor";
}

export interface AdminInventoryTemplate {
  id: string;
  name: string;
  description: string | null;
  flatType: string | null;
  items: Array<{
    id: string;
    inventoryItemId: string;
    expectedQuantity: number;
    itemName: string | null;
  }>;
}

export interface AdminFlatInventoryEntry {
  id: string;
  inventoryItemId: string;
  itemName: string;
  category: "asset" | "consumable" | "maintenance_supply";
  criticality: "critical" | "important" | "minor";
  unitOfMeasure: string;
  expectedQuantity: number;
  currentQuantity: number;
  conditionStatus: "ok" | "missing" | "damaged" | "needs_replacement";
  notes: string | null;
  lastCheckedAt: string | null;
}

export interface AdminStockMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  flatId: FlatId | null;
  contextLabel: string;
  movementType: "add" | "deduct" | "consume" | "adjust" | "damage" | "replace" | "transfer";
  quantity: number;
  reason: string;
  notes: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface AdminReadinessRecord {
  flatId: FlatId;
  cleaningStatus: "ready" | "attention_required" | "blocked";
  linenStatus: "ready" | "attention_required" | "blocked";
  consumablesStatus: "ready" | "attention_required" | "blocked";
  maintenanceStatus: "ready" | "attention_required" | "blocked";
  criticalAssetStatus: "ready" | "attention_required" | "blocked";
  readinessStatus: "ready" | "needs_attention" | "out_of_service";
  overrideStatus: "ready" | "needs_attention" | "out_of_service" | null;
  overrideReason: string | null;
  updatedAt: string;
}

export interface AdminInventoryAlert {
  id: string;
  inventoryItemId: string | null;
  flatId: FlatId | null;
  alertType: "low_stock" | "missing_required_item" | "damaged_critical_asset" | "readiness_issue" | "readiness_impacting_issue";
  severity: "critical" | "important" | "minor";
  status: "open" | "acknowledged" | "resolved";
  message: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminMaintenanceIssue {
  id: string;
  flatId: FlatId;
  inventoryItemId: string | null;
  title: string;
  notes: string | null;
  severity: "critical" | "important" | "minor";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface AdminWorkerTask {
  id: string;
  flatId: FlatId;
  title: string;
  description: string | null;
  taskType: "restock" | "maintenance" | "readiness" | "inspection";
  priority: "critical" | "important" | "minor";
  status: "pending" | "in_progress" | "completed" | "blocked" | "escalated" | "open" | "cancelled";
  sourceType: "alert" | "maintenance_issue" | "readiness" | "manual";
  sourceId: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AdminInventoryOverview {
  generatedAt: string;
  flats: Array<{ id: FlatId; name: string }>;
  inventoryCatalog: AdminInventoryItem[];
  centralStock?: Array<{
    inventoryItemId: string;
    itemName: string;
    unitOfMeasure: string;
    quantity: number;
  }>;
  templates: AdminInventoryTemplate[];
  flatInventory: Array<{
    flatId: FlatId;
    flatName: string;
    records: AdminFlatInventoryEntry[];
  }>;
  stockMovements: AdminStockMovement[];
  readiness: Array<{
    flatId: FlatId;
    flatName: string;
    readiness: AdminReadinessRecord | null;
    activeAlerts: AdminInventoryAlert[];
    activeIssues: AdminMaintenanceIssue[];
  }>;
  activeAlerts: AdminInventoryAlert[];
  maintenanceIssues: AdminMaintenanceIssue[];
  workerTasks: AdminWorkerTask[];
}

function createFallbackId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return createFallbackId();
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export function createAdminInventoryIdempotencyKey(prefix: string): string {
  return `${prefix}-${createClientId()}`;
}

export async function fetchAdminInventoryOverview(): Promise<AdminInventoryOverview> {
  const response = await fetch("/api/operations/inventory/overview", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ overview: AdminInventoryOverview }>(response);
  return payload.overview;
}
export async function submitCreateInventoryItem(input: {
  name: string;
  category: AdminInventoryItem["category"];
  unitOfMeasure: string;
  internalCode?: string | null;
  reorderThreshold: number | null;
  parLevel: number | null;
  criticality: AdminInventoryItem["criticality"];
}): Promise<AdminInventoryItem> {
  const response = await fetch("/api/operations/inventory/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      unitOfMeasure: input.unitOfMeasure,
      internalCode: input.internalCode,
      reorderThreshold: input.reorderThreshold,
      parLevel: input.parLevel,
      criticality: input.criticality,
    }),
  });

  const payload = await readJsonResponse<{ item: AdminInventoryItem }>(response);
  return payload.item;
}

export async function submitUpdateInventoryItem(input: {
  itemId: string;
  name: string;
  category: AdminInventoryItem["category"];
  unitOfMeasure: string;
  internalCode?: string | null;
  reorderThreshold: number | null;
  parLevel: number | null;
  criticality: AdminInventoryItem["criticality"];
}): Promise<AdminInventoryItem> {
  const response = await fetch(`/api/operations/inventory/items/${encodeURIComponent(input.itemId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      unitOfMeasure: input.unitOfMeasure,
      internalCode: input.internalCode,
      reorderThreshold: input.reorderThreshold,
      parLevel: input.parLevel,
      criticality: input.criticality,
    }),
  });

  const payload = await readJsonResponse<{ item: AdminInventoryItem }>(response);
  return payload.item;
}

export async function submitCreateStockMovement(input: {
  movementType: AdminStockMovement["movementType"];
  inventoryItemId: string;
  quantity: number | null;
  adjustToQuantity: number | null;
  flatId: FlatId | null;
  reason: string;
  notes: string | null;
  actorId: string | null;
}): Promise<AdminStockMovement> {
  const response = await fetch("/api/operations/inventory/movements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "movement",
      movementType: input.movementType,
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      adjustToQuantity: input.adjustToQuantity,
      flatId: input.flatId,
      reason: input.reason,
      notes: input.notes,
      actorId: input.actorId,
    }),
  });

  const payload = await readJsonResponse<{ movement: AdminStockMovement }>(response);
  return payload.movement;
}

export async function submitTransferStock(input: {
  inventoryItemId: string;
  quantity: number;
  fromFlatId: FlatId | null;
  toFlatId: FlatId | null;
  reason: string;
  notes: string | null;
  actorId: string | null;
}): Promise<AdminStockMovement> {
  const response = await fetch("/api/operations/inventory/movements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "transfer",
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      fromFlatId: input.fromFlatId,
      toFlatId: input.toFlatId,
      reason: input.reason,
      notes: input.notes,
      actorId: input.actorId,
    }),
  });

  const payload = await readJsonResponse<{ movement: AdminStockMovement }>(response);
  return payload.movement;
}

export async function submitCreateMaintenanceIssue(input: {
  flatId: FlatId;
  inventoryItemId: string | null;
  title: string;
  notes: string | null;
  severity: "critical" | "important" | "minor";
  idempotencyKey: string;
}): Promise<AdminMaintenanceIssue> {
  const response = await fetch("/api/operations/inventory/issues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      flatId: input.flatId,
      inventoryItemId: input.inventoryItemId,
      title: input.title,
      notes: input.notes,
      severity: input.severity,
    }),
  });

  const payload = await readJsonResponse<{ issue: AdminMaintenanceIssue }>(response);
  return payload.issue;
}

export async function submitUpdateMaintenanceIssueStatus(input: {
  issueId: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  notes: string | null;
  idempotencyKey: string;
}): Promise<AdminMaintenanceIssue> {
  const response = await fetch(`/api/operations/inventory/issues/${encodeURIComponent(input.issueId)}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      status: input.status,
      notes: input.notes,
    }),
  });

  const payload = await readJsonResponse<{ issue: AdminMaintenanceIssue }>(response);
  return payload.issue;
}

export async function fetchInventoryWorkerTasks(input?: {
  flatId?: FlatId;
  status?: AdminWorkerTask["status"];
  sync?: boolean;
  openOnly?: boolean;
}): Promise<AdminWorkerTask[]> {
  const params = new URLSearchParams();
  if (input?.flatId) {
    params.set("flatId", input.flatId);
  }

  if (input?.status) {
    params.set("status", input.status);
  }

  if (input?.sync) {
    params.set("sync", "true");
  }

  if (input?.openOnly) {
    params.set("openOnly", "true");
  }

  const query = params.toString();
  const suffix = query.length > 0 ? `?${query}` : "";
  const response = await fetch(`/api/operations/inventory/tasks${suffix}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ tasks: AdminWorkerTask[] }>(response);
  return payload.tasks;
}

export async function submitCreateInventoryWorkerTask(input: {
  flatId: FlatId;
  title: string;
  description: string | null;
  taskType: AdminWorkerTask["taskType"];
  priority: AdminWorkerTask["priority"];
  assignedTo: string | null;
  idempotencyKey: string;
}): Promise<AdminWorkerTask> {
  const response = await fetch("/api/operations/inventory/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      flatId: input.flatId,
      title: input.title,
      description: input.description,
      taskType: input.taskType,
      priority: input.priority,
      assignedTo: input.assignedTo,
    }),
  });

  const payload = await readJsonResponse<{ task: AdminWorkerTask }>(response);
  return payload.task;
}

export async function submitUpdateInventoryWorkerTaskStatus(input: {
  taskId: string;
  status: AdminWorkerTask["status"];
  assignedTo: string | null;
  idempotencyKey: string;
}): Promise<AdminWorkerTask> {
  const response = await fetch(`/api/operations/inventory/tasks/${encodeURIComponent(input.taskId)}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      status: input.status,
      assignedTo: input.assignedTo,
    }),
  });

  const payload = await readJsonResponse<{ task: AdminWorkerTask }>(response);
  return payload.task;
}

export type AdminFlatInventoryReconciliationAction =
  | "adjust_quantity"
  | "mark_missing"
  | "mark_damaged"
  | "mark_replaced"
  | "note_discrepancy"
  | "restocked_now";

export async function submitFlatInventoryReconciliationAction(input: {
  flatId: FlatId;
  flatInventoryId: string;
  action: AdminFlatInventoryReconciliationAction;
  quantity?: number;
  note?: string | null;
}): Promise<{
  record: AdminFlatInventoryEntry;
  movement: AdminStockMovement | null;
}> {
  const response = await fetch(
    `/api/operations/inventory/flats/${encodeURIComponent(input.flatId)}/records/${encodeURIComponent(input.flatInventoryId)}/reconcile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: input.action,
        quantity: input.quantity,
        note: input.note ?? null,
      }),
    }
  );

  return readJsonResponse<{
    record: AdminFlatInventoryEntry;
    movement: AdminStockMovement | null;
  }>(response);
}

export async function submitUpdateFlatChecklistReadiness(input: {
  flatId: FlatId;
  cleaningCompleted: boolean;
  linenCompleted: boolean;
  consumablesCompleted: boolean;
}): Promise<AdminReadinessRecord> {
  const response = await fetch(`/api/operations/inventory/flats/${encodeURIComponent(input.flatId)}/readiness`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cleaningCompleted: input.cleaningCompleted,
      linenCompleted: input.linenCompleted,
      consumablesCompleted: input.consumablesCompleted,
    }),
  });

  const payload = await readJsonResponse<{ readiness: AdminReadinessRecord }>(response);
  return payload.readiness;
}
export async function submitSetFlatReadinessOverride(input: {
  flatId: FlatId;
  overrideStatus: "ready" | "needs_attention" | "out_of_service";
  reason: string;
}): Promise<AdminReadinessRecord> {
  const response = await fetch(`/api/operations/inventory/flats/${encodeURIComponent(input.flatId)}/readiness-override`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      overrideStatus: input.overrideStatus,
      reason: input.reason,
    }),
  });

  const payload = await readJsonResponse<{ readiness: AdminReadinessRecord }>(response);
  return payload.readiness;
}

export async function submitClearFlatReadinessOverride(input: {
  flatId: FlatId;
}): Promise<AdminReadinessRecord> {
  const response = await fetch(`/api/operations/inventory/flats/${encodeURIComponent(input.flatId)}/readiness-override`, {
    method: "DELETE",
  });

  const payload = await readJsonResponse<{ readiness: AdminReadinessRecord }>(response);
  return payload.readiness;
}

export async function submitResolveInventoryAlert(input: {
  alertId: string;
  note: string | null;
  idempotencyKey: string;
}): Promise<AdminInventoryAlert> {
  const response = await fetch(`/api/operations/inventory/alerts/${encodeURIComponent(input.alertId)}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      note: input.note,
    }),
  });

  const payload = await readJsonResponse<{ alert: AdminInventoryAlert }>(response);
  return payload.alert;
}






