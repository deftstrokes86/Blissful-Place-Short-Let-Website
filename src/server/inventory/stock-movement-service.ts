import { randomUUID } from "node:crypto";

import { createFlatInventoryRecord, createStockMovementRecord } from "../booking/inventory-domain";
import type {
  FlatInventoryRecord,
  FlatRecord,
  InventoryItemRecord,
  StockMovementRecord,
  StockMovementType,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

type StockMovementIdPrefix = "stock_movement" | "flat_inventory";

type StockLocation = FlatId | null;

export interface StockMovementRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
  getCentralStockQuantity(inventoryItemId: string): Promise<number>;
  setCentralStockQuantity(inventoryItemId: string, quantity: number): Promise<void>;
  findFlatInventoryByFlatAndItem(flatId: FlatId, inventoryItemId: string): Promise<FlatInventoryRecord | null>;
  createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord>;
  updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord>;
  createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord>;
  listStockMovements(filter?: { inventoryItemId?: string; flatId?: FlatId | null }): Promise<StockMovementRecord[]>;
}

interface StockMovementServiceDependencies {
  repository: StockMovementRepository;
  now?: () => Date;
  createId?: (prefix: StockMovementIdPrefix) => string;
}

interface MovementBaseInput {
  inventoryItemId: string;
  reason: string;
  notes?: string | null;
  actorId?: string | null;
}

interface QuantityMovementInput extends MovementBaseInput {
  movementType: "add" | "deduct" | "consume" | "damage" | "replace";
  quantity: number;
  flatId: FlatId | null;
}

interface AdjustMovementInput extends MovementBaseInput {
  movementType: "adjust";
  flatId: FlatId | null;
  adjustToQuantity: number;
}

export type RecordStockMovementInput = QuantityMovementInput | AdjustMovementInput;

export interface TransferStockInput extends MovementBaseInput {
  inventoryItemId: string;
  quantity: number;
  fromFlatId: FlatId | null;
  toFlatId: FlatId | null;
}

function ensurePositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }

  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }

  return value;
}

function ensureReason(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("reason is required.");
  }

  return normalized;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isDecrementingMovement(type: StockMovementType): boolean {
  return type === "deduct" || type === "consume" || type === "damage";
}

export class StockMovementService {
  private readonly repository: StockMovementRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: StockMovementIdPrefix) => string;

  constructor(dependencies: StockMovementServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async recordMovement(input: RecordStockMovementInput): Promise<StockMovementRecord> {
    const item = await this.getRequiredInventoryItem(input.inventoryItemId);
    const reason = ensureReason(input.reason);
    const notes = normalizeOptionalText(input.notes);
    const actorId = normalizeOptionalText(input.actorId);

    if (input.movementType === "adjust") {
      return this.applyAdjustMovement({
        item,
        location: input.flatId,
        adjustToQuantity: input.adjustToQuantity,
        reason,
        notes,
        actorId,
      });
    }

    const quantity = ensurePositiveInteger(input.quantity, "quantity");
    const current = await this.getLocationQuantity(input.flatId, item.id);

    let next = current;
    if (isDecrementingMovement(input.movementType)) {
      if (current < quantity) {
        throw new Error("Insufficient stock for movement.");
      }

      next = current - quantity;
    } else {
      next = current + quantity;
    }

    await this.setLocationQuantity({
      location: input.flatId,
      item,
      quantity: next,
      movementType: input.movementType,
    });

    return this.createMovementRecord({
      movementType: input.movementType,
      inventoryItemId: item.id,
      flatId: input.flatId,
      quantity,
      reason,
      notes,
      actorId,
    });
  }

  async transferStock(input: TransferStockInput): Promise<StockMovementRecord> {
    const item = await this.getRequiredInventoryItem(input.inventoryItemId);
    const quantity = ensurePositiveInteger(input.quantity, "quantity");
    const reason = ensureReason(input.reason);
    const notes = normalizeOptionalText(input.notes);
    const actorId = normalizeOptionalText(input.actorId);

    if (input.fromFlatId === input.toFlatId) {
      throw new Error("Transfer requires different source and destination locations.");
    }

    const sourceQuantity = await this.getLocationQuantity(input.fromFlatId, item.id);
    if (sourceQuantity < quantity) {
      throw new Error("Insufficient stock for transfer.");
    }

    const destinationQuantity = await this.getLocationQuantity(input.toFlatId, item.id);

    // Deduct from source first.
    await this.setLocationQuantity({
      location: input.fromFlatId,
      item,
      quantity: sourceQuantity - quantity,
      movementType: "transfer",
    });

    // Add to destination. If this write fails after the source has already been
    // decremented, execute a compensation step to restore the source quantity so
    // stock is not silently lost (saga compensation pattern).
    try {
      await this.setLocationQuantity({
        location: input.toFlatId,
        item,
        quantity: destinationQuantity + quantity,
        movementType: "transfer",
      });
    } catch (destinationError) {
      try {
        await this.setLocationQuantity({
          location: input.fromFlatId,
          item,
          quantity: sourceQuantity, // restore original
          movementType: "transfer",
        });
      } catch {
        // Compensation also failed — this is a data-integrity problem that
        // requires manual reconciliation. Re-throw with full context.
        throw new Error(
          `Transfer failed at destination and source compensation also failed. ` +
          `Item '${item.id}' at '${input.fromFlatId ?? "central"}' may have an incorrect quantity. ` +
          `Manual reconciliation required. Original error: ${destinationError instanceof Error ? destinationError.message : String(destinationError)}`
        );
      }
      throw new Error(
        `Transfer failed: destination could not be updated and source quantity has been restored. ` +
        `${destinationError instanceof Error ? destinationError.message : String(destinationError)}`
      );
    }

    return this.createMovementRecord({
      movementType: "transfer",
      inventoryItemId: item.id,
      flatId: input.toFlatId ?? input.fromFlatId,
      quantity,
      reason,
      notes,
      actorId,
    });
  }

  async getCentralStockQuantity(inventoryItemId: string): Promise<number> {
    await this.getRequiredInventoryItem(inventoryItemId);
    return this.repository.getCentralStockQuantity(inventoryItemId);
  }

  async getFlatStockSnapshot(flatId: FlatId, inventoryItemId: string): Promise<FlatInventoryRecord | null> {
    await this.getRequiredInventoryItem(inventoryItemId);
    await this.getRequiredFlat(flatId);
    return this.repository.findFlatInventoryByFlatAndItem(flatId, inventoryItemId);
  }

  async listMovementHistory(filter?: { inventoryItemId?: string; flatId?: FlatId | null }): Promise<StockMovementRecord[]> {
    const records = await this.repository.listStockMovements(filter);
    return [...records].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  private async applyAdjustMovement(args: {
    item: InventoryItemRecord;
    location: StockLocation;
    adjustToQuantity: number;
    reason: string;
    notes: string | null;
    actorId: string | null;
  }): Promise<StockMovementRecord> {
    const adjustToQuantity = ensureNonNegativeInteger(args.adjustToQuantity, "adjustToQuantity");
    const current = await this.getLocationQuantity(args.location, args.item.id);

    if (adjustToQuantity === current) {
      throw new Error("Adjustment must change quantity.");
    }

    await this.setLocationQuantity({
      location: args.location,
      item: args.item,
      quantity: adjustToQuantity,
      movementType: "adjust",
    });

    return this.createMovementRecord({
      movementType: "adjust",
      inventoryItemId: args.item.id,
      flatId: args.location,
      quantity: Math.abs(adjustToQuantity - current),
      reason: args.reason,
      notes: args.notes,
      actorId: args.actorId,
    });
  }

  private async getRequiredFlat(flatId: FlatId): Promise<FlatRecord> {
    const flat = await this.repository.findFlatById(flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    return flat;
  }

  private async getRequiredInventoryItem(inventoryItemId: string): Promise<InventoryItemRecord> {
    const item = await this.repository.findInventoryItemById(inventoryItemId);
    if (!item) {
      throw new Error("Inventory item not found.");
    }

    return item;
  }

  private async getLocationQuantity(location: StockLocation, inventoryItemId: string): Promise<number> {
    if (location === null) {
      return this.repository.getCentralStockQuantity(inventoryItemId);
    }

    await this.getRequiredFlat(location);
    const stock = await this.repository.findFlatInventoryByFlatAndItem(location, inventoryItemId);
    return stock?.currentQuantity ?? 0;
  }

  private async setLocationQuantity(args: {
    location: StockLocation;
    item: InventoryItemRecord;
    quantity: number;
    movementType: StockMovementType;
  }): Promise<void> {
    const quantity = ensureNonNegativeInteger(args.quantity, "quantity");

    if (args.location === null) {
      await this.repository.setCentralStockQuantity(args.item.id, quantity);
      return;
    }

    const flat = await this.getRequiredFlat(args.location);
    const existing = await this.repository.findFlatInventoryByFlatAndItem(flat.id, args.item.id);
    const nowIso = this.nowProvider().toISOString();

    const nextCondition =
      args.item.category === "asset" && args.movementType === "damage"
        ? "damaged"
        : args.item.category === "asset" && args.movementType === "replace"
          ? "ok"
          : existing?.conditionStatus ?? "ok";

    if (!existing) {
      const created = createFlatInventoryRecord({
        id: this.createId("flat_inventory"),
        flatId: flat.id,
        inventoryItemId: args.item.id,
        expectedQuantity: 0,
        currentQuantity: quantity,
        conditionStatus: nextCondition,
        notes: null,
        lastCheckedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await this.repository.createFlatInventory(created);
      return;
    }

    const updated = createFlatInventoryRecord({
      ...existing,
      currentQuantity: quantity,
      conditionStatus: nextCondition,
      lastCheckedAt: nowIso,
      updatedAt: nowIso,
    });

    await this.repository.updateFlatInventory(updated);
  }

  private async createMovementRecord(args: {
    movementType: StockMovementType;
    inventoryItemId: string;
    flatId: FlatId | null;
    quantity: number;
    reason: string;
    notes: string | null;
    actorId: string | null;
  }): Promise<StockMovementRecord> {
    const nowIso = this.nowProvider().toISOString();
    const record = createStockMovementRecord({
      id: this.createId("stock_movement"),
      inventoryItemId: args.inventoryItemId,
      flatId: args.flatId,
      movementType: args.movementType,
      quantity: ensurePositiveInteger(args.quantity, "quantity"),
      reason: args.reason,
      notes: args.notes,
      actorId: args.actorId,
      createdAt: nowIso,
    });

    return this.repository.createStockMovement(record);
  }
}
