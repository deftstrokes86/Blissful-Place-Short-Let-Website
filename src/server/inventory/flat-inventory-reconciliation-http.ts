import type { FlatId } from "../../types/booking";
import type { FlatInventoryReconciliationAction } from "./flat-inventory-reconciliation-service";
import type { FlatInventoryRecord, FlatReadinessRecord, StockMovementRecord } from "../../types/booking-backend";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const RECONCILIATION_ACTIONS: readonly FlatInventoryReconciliationAction[] = [
  "adjust_quantity",
  "mark_missing",
  "mark_damaged",
  "mark_replaced",
  "note_discrepancy",
  "restocked_now",
];
const READINESS_STATUSES: readonly FlatReadinessRecord["readinessStatus"][] = [
  "ready",
  "needs_attention",
  "out_of_service",
];

function normalizeRequiredString(value: string | null | undefined, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeFlatId(value: string | null | undefined): FlatId {
  const normalized = normalizeRequiredString(value, "flatId");
  if (!FLAT_IDS.includes(normalized as FlatId)) {
    throw new Error("A valid flatId is required.");
  }

  return normalized as FlatId;
}

function normalizeOptionalNonNegativeInteger(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error("quantity must be a non-negative integer.");
  }

  return value;
}

function normalizeAction(value: string | null | undefined): FlatInventoryReconciliationAction {
  const normalized = normalizeRequiredString(value, "action");

  if (!RECONCILIATION_ACTIONS.includes(normalized as FlatInventoryReconciliationAction)) {
    throw new Error("A valid reconciliation action is required.");
  }

  return normalized as FlatInventoryReconciliationAction;
}

function normalizeReadinessStatus(value: string | null | undefined): FlatReadinessRecord["readinessStatus"] {
  const normalized = normalizeRequiredString(value, "overrideStatus");
  if (!READINESS_STATUSES.includes(normalized as FlatReadinessRecord["readinessStatus"])) {
    throw new Error("A valid overrideStatus is required.");
  }

  return normalized as FlatReadinessRecord["readinessStatus"];
}

export interface FlatInventoryReconciliationOperationsService {
  reconcileRecord(input: {
    flatId: FlatId;
    flatInventoryId: string;
    action: FlatInventoryReconciliationAction;
    quantity?: number | null;
    note?: string | null;
  }): Promise<{
    record: FlatInventoryRecord;
    movement: StockMovementRecord | null;
  }>;
  setReadinessOverride(input: {
    flatId: FlatId;
    overrideStatus: FlatReadinessRecord["readinessStatus"];
    reason: string;
  }): Promise<FlatReadinessRecord>;
  clearReadinessOverride(input: {
    flatId: FlatId;
  }): Promise<FlatReadinessRecord>;
}

export async function handleReconcileFlatInventoryRecordRequest(
  service: FlatInventoryReconciliationOperationsService,
  input: {
    flatId: string | null;
    flatInventoryId: string | null;
    action: string | null;
    quantity?: number | null;
    note?: string | null;
  }
) {
  const result = await service.reconcileRecord({
    flatId: normalizeFlatId(input.flatId),
    flatInventoryId: normalizeRequiredString(input.flatInventoryId, "flatInventoryId"),
    action: normalizeAction(input.action),
    quantity: normalizeOptionalNonNegativeInteger(input.quantity),
    note: normalizeOptionalString(input.note),
  });

  return result;
}

export async function handleSetFlatReadinessOverrideRequest(
  service: FlatInventoryReconciliationOperationsService,
  input: {
    flatId: string | null;
    overrideStatus: string | null;
    reason: string | null;
  }
) {
  const readiness = await service.setReadinessOverride({
    flatId: normalizeFlatId(input.flatId),
    overrideStatus: normalizeReadinessStatus(input.overrideStatus),
    reason: normalizeRequiredString(input.reason, "reason"),
  });

  return { readiness };
}

export async function handleClearFlatReadinessOverrideRequest(
  service: FlatInventoryReconciliationOperationsService,
  input: {
    flatId: string | null;
  }
) {
  const readiness = await service.clearReadinessOverride({
    flatId: normalizeFlatId(input.flatId),
  });

  return { readiness };
}
