import { randomUUID } from "node:crypto";

import {
  createFlatInventoryRecord,
  createStockMovementRecord,
  ensureFlatReadinessStatus,
} from "../booking/inventory-domain";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatRecord,
  FlatReadinessStatus,
  InventoryItemRecord,
  StockMovementRecord,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

type ReconciliationIdPrefix = "stock_movement";

export type FlatInventoryReconciliationAction =
  | "adjust_quantity"
  | "mark_missing"
  | "mark_damaged"
  | "mark_replaced"
  | "note_discrepancy"
  | "restocked_now";

export interface FlatInventoryReconciliationRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
  findFlatInventoryById(flatInventoryId: string): Promise<FlatInventoryRecord | null>;
  updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord>;
  createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord>;
}

export interface FlatInventoryReadinessGateway {
  syncFlatReadiness(flatId: FlatId): Promise<void>;
  setManualOverride(input: {
    flatId: FlatId;
    overrideStatus: FlatReadinessStatus;
    reason: string;
  }): Promise<FlatReadinessRecord>;
  clearManualOverride(flatId: FlatId): Promise<FlatReadinessRecord>;
}

export interface FlatInventoryAlertGateway {
  syncFlatAlerts(flatId: FlatId): Promise<void>;
}

interface FlatInventoryReconciliationServiceDependencies {
  repository: FlatInventoryReconciliationRepository;
  readinessGateway: FlatInventoryReadinessGateway;
  alertGateway: FlatInventoryAlertGateway;
  now?: () => Date;
  createId?: (prefix: ReconciliationIdPrefix) => string;
}

export interface ReconcileFlatInventoryRecordInput {
  flatId: FlatId;
  flatInventoryId: string;
  action: FlatInventoryReconciliationAction;
  quantity?: number | null;
  note?: string | null;
}

export interface SetReadinessOverrideInput {
  flatId: FlatId;
  overrideStatus: FlatReadinessStatus;
  reason: string;
}

export interface ClearReadinessOverrideInput {
  flatId: FlatId;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }

  return value;
}

export class FlatInventoryReconciliationService {
  private readonly repository: FlatInventoryReconciliationRepository;
  private readonly readinessGateway: FlatInventoryReadinessGateway;
  private readonly alertGateway: FlatInventoryAlertGateway;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: ReconciliationIdPrefix) => string;

  constructor(dependencies: FlatInventoryReconciliationServiceDependencies) {
    this.repository = dependencies.repository;
    this.readinessGateway = dependencies.readinessGateway;
    this.alertGateway = dependencies.alertGateway;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async reconcileRecord(input: ReconcileFlatInventoryRecordInput): Promise<{
    record: FlatInventoryRecord;
    movement: StockMovementRecord | null;
  }> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const existing = await this.repository.findFlatInventoryById(input.flatInventoryId);
    if (!existing || existing.flatId !== flat.id) {
      throw new Error("Flat inventory record not found.");
    }

    const inventoryItem = await this.repository.findInventoryItemById(existing.inventoryItemId);
    if (!inventoryItem) {
      throw new Error("Inventory item not found.");
    }

    const normalizedNote = normalizeOptionalText(input.note);
    const nowIso = this.nowProvider().toISOString();

    let nextCurrentQuantity = existing.currentQuantity;
    let nextConditionStatus = existing.conditionStatus;
    let nextNotes = normalizedNote ?? existing.notes;
    let movement: StockMovementRecord | null = null;

    if (input.action === "note_discrepancy") {
      nextNotes = normalizeRequiredText(input.note ?? "", "note");
    }

    if (input.action === "adjust_quantity") {
      const target = ensureNonNegativeInteger(input.quantity ?? -1, "quantity");
      if (target !== existing.currentQuantity) {
        movement = this.createMovementRecord({
          inventoryItemId: existing.inventoryItemId,
          flatId: existing.flatId,
          movementType: "adjust",
          quantity: Math.abs(target - existing.currentQuantity),
          reason: "Flat inventory quantity adjusted during reconciliation.",
          notes: normalizedNote,
        });
      }

      nextCurrentQuantity = target;
    }

    if (input.action === "mark_missing") {
      const target = 0;
      if (existing.currentQuantity > 0) {
        movement = this.createMovementRecord({
          inventoryItemId: existing.inventoryItemId,
          flatId: existing.flatId,
          movementType: "adjust",
          quantity: existing.currentQuantity,
          reason: "Item marked missing during reconciliation.",
          notes: normalizedNote,
        });
      }

      nextCurrentQuantity = target;
      nextConditionStatus = "missing";
    }

    if (input.action === "mark_damaged") {
      if (existing.currentQuantity > 0) {
        movement = this.createMovementRecord({
          inventoryItemId: existing.inventoryItemId,
          flatId: existing.flatId,
          movementType: "damage",
          quantity: existing.currentQuantity,
          reason: "Item marked damaged during reconciliation.",
          notes: normalizedNote,
        });
      }

      nextCurrentQuantity = 0;
      nextConditionStatus = "damaged";
    }

    if (input.action === "mark_replaced") {
      const replacementQuantity = existing.currentQuantity <= 0 ? 1 : existing.currentQuantity;
      const delta = replacementQuantity - existing.currentQuantity;

      if (delta > 0) {
        movement = this.createMovementRecord({
          inventoryItemId: existing.inventoryItemId,
          flatId: existing.flatId,
          movementType: "replace",
          quantity: delta,
          reason: "Item marked replaced during reconciliation.",
          notes: normalizedNote,
        });
      }

      nextCurrentQuantity = replacementQuantity;
      nextConditionStatus = "ok";
    }

    if (input.action === "restocked_now") {
      if (inventoryItem.category !== "consumable" && inventoryItem.category !== "maintenance_supply") {
        throw new Error("restocked_now is only available for consumables and maintenance supplies.");
      }

      const target = ensureNonNegativeInteger(
        input.quantity ?? existing.expectedQuantity,
        "quantity"
      );

      if (target < existing.currentQuantity) {
        throw new Error("restocked_now quantity cannot be lower than current quantity.");
      }

      const delta = target - existing.currentQuantity;
      if (delta > 0) {
        movement = this.createMovementRecord({
          inventoryItemId: existing.inventoryItemId,
          flatId: existing.flatId,
          movementType: "add",
          quantity: delta,
          reason: "Item restocked during reconciliation.",
          notes: normalizedNote,
        });
      }

      nextCurrentQuantity = target;
      nextConditionStatus = "ok";
    }

    const updated = createFlatInventoryRecord({
      ...existing,
      currentQuantity: nextCurrentQuantity,
      conditionStatus: nextConditionStatus,
      notes: nextNotes,
      lastCheckedAt: nowIso,
      updatedAt: nowIso,
    });

    const stored = await this.repository.updateFlatInventory(updated);

    let storedMovement: StockMovementRecord | null = null;
    if (movement) {
      storedMovement = await this.repository.createStockMovement(movement);
    }

    await this.readinessGateway.syncFlatReadiness(flat.id);
    await this.alertGateway.syncFlatAlerts(flat.id);

    return {
      record: stored,
      movement: storedMovement,
    };
  }

  async setReadinessOverride(input: SetReadinessOverrideInput): Promise<FlatReadinessRecord> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    return this.readinessGateway.setManualOverride({
      flatId: flat.id,
      overrideStatus: ensureFlatReadinessStatus(input.overrideStatus),
      reason: normalizeRequiredText(input.reason, "reason"),
    });
  }

  async clearReadinessOverride(input: ClearReadinessOverrideInput): Promise<FlatReadinessRecord> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    return this.readinessGateway.clearManualOverride(flat.id);
  }

  private createMovementRecord(input: {
    inventoryItemId: string;
    flatId: FlatId;
    movementType: "add" | "adjust" | "damage" | "replace";
    quantity: number;
    reason: string;
    notes: string | null;
  }): StockMovementRecord {
    return createStockMovementRecord({
      id: this.createId("stock_movement"),
      inventoryItemId: input.inventoryItemId,
      flatId: input.flatId,
      movementType: input.movementType,
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes,
      actorId: null,
      createdAt: this.nowProvider().toISOString(),
    });
  }
}
