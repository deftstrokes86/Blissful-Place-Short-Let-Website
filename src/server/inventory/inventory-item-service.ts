import { randomUUID } from "node:crypto";

import { createInventoryItemRecord } from "../booking/inventory-domain";
import type { InventoryItemRecord } from "../../types/booking-backend";

type InventoryItemIdPrefix = "inventory_item";

interface InventoryItemServiceDependencies {
  repository: InventoryItemRepository;
  now?: () => Date;
  createId?: (prefix: InventoryItemIdPrefix) => string;
}

export interface InventoryItemRepository {
  findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null>;
  listInventoryItems(): Promise<InventoryItemRecord[]>;
  createInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord>;
  updateInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord>;
}

export interface CreateInventoryItemInput {
  name: string;
  category: InventoryItemRecord["category"];
  unitOfMeasure: string;
  internalCode?: string | null;
  reorderThreshold?: number | null;
  parLevel?: number | null;
  criticality: InventoryItemRecord["criticality"];
}

export interface UpdateInventoryItemInput {
  itemId: string;
  name?: string | null;
  category?: InventoryItemRecord["category"] | null;
  unitOfMeasure?: string | null;
  internalCode?: string | null;
  reorderThreshold?: number | null;
  parLevel?: number | null;
  criticality?: InventoryItemRecord["criticality"] | null;
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalNonNegativeInteger(value: number | null | undefined, field: string): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }

  return value;
}

export class InventoryItemService {
  private readonly repository: InventoryItemRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: InventoryItemIdPrefix) => string;

  constructor(dependencies: InventoryItemServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async createItem(input: CreateInventoryItemInput): Promise<InventoryItemRecord> {
    const nowIso = this.nowProvider().toISOString();

    const normalizedInternalCode = normalizeOptionalString(input.internalCode);
    await this.ensureInternalCodeAvailable(normalizedInternalCode, null);

    const record = createInventoryItemRecord({
      id: this.createId("inventory_item"),
      name: normalizeRequiredString(input.name, "name"),
      category: input.category,
      internalCode: normalizedInternalCode,
      unitOfMeasure: normalizeRequiredString(input.unitOfMeasure, "unitOfMeasure"),
      reorderThreshold: normalizeOptionalNonNegativeInteger(input.reorderThreshold, "reorderThreshold"),
      parLevel: normalizeOptionalNonNegativeInteger(input.parLevel, "parLevel"),
      criticality: input.criticality,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return this.repository.createInventoryItem(record);
  }

  async updateItem(input: UpdateInventoryItemInput): Promise<InventoryItemRecord> {
    const item = await this.repository.findInventoryItemById(normalizeRequiredString(input.itemId, "itemId"));
    if (!item) {
      throw new Error("Inventory item not found.");
    }

    const nextInternalCode =
      input.internalCode === undefined ? item.internalCode : normalizeOptionalString(input.internalCode);
    await this.ensureInternalCodeAvailable(nextInternalCode, item.id);

    const updated = createInventoryItemRecord({
      ...item,
      name: input.name === undefined || input.name === null ? item.name : normalizeRequiredString(input.name, "name"),
      category: input.category ?? item.category,
      unitOfMeasure:
        input.unitOfMeasure === undefined || input.unitOfMeasure === null
          ? item.unitOfMeasure
          : normalizeRequiredString(input.unitOfMeasure, "unitOfMeasure"),
      internalCode: nextInternalCode,
      reorderThreshold:
        input.reorderThreshold === undefined
          ? item.reorderThreshold
          : normalizeOptionalNonNegativeInteger(input.reorderThreshold, "reorderThreshold"),
      parLevel:
        input.parLevel === undefined
          ? item.parLevel
          : normalizeOptionalNonNegativeInteger(input.parLevel, "parLevel"),
      criticality: input.criticality ?? item.criticality,
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.updateInventoryItem(updated);
  }

  private async ensureInternalCodeAvailable(code: string | null, currentItemId: string | null): Promise<void> {
    if (!code) {
      return;
    }

    const items = await this.repository.listInventoryItems();
    const duplicate = items.find(
      (item) => item.internalCode?.toLowerCase() === code.toLowerCase() && item.id !== currentItemId
    );

    if (duplicate) {
      throw new Error("internalCode must be unique.");
    }
  }
}
