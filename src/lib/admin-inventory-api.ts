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

export interface AdminInventoryOverview {
  generatedAt: string;
  flats: Array<{ id: FlatId; name: string }>;
  inventoryCatalog: AdminInventoryItem[];
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
