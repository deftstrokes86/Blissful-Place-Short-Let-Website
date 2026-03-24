import type { InventoryItemRecord } from "../../types/booking-backend";
import type { InventoryItemService } from "./inventory-item-service";

const ITEM_CATEGORIES: readonly InventoryItemRecord["category"][] = ["asset", "consumable", "maintenance_supply"];
const ITEM_CRITICALITY: readonly InventoryItemRecord["criticality"][] = ["critical", "important", "minor"];

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = normalizeRequiredString(value);
  return normalized ?? null;
}

function normalizeCategory(value: string | null | undefined): InventoryItemRecord["category"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return ITEM_CATEGORIES.includes(normalized as InventoryItemRecord["category"])
    ? (normalized as InventoryItemRecord["category"])
    : null;
}

function normalizeCriticality(value: string | null | undefined): InventoryItemRecord["criticality"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return ITEM_CRITICALITY.includes(normalized as InventoryItemRecord["criticality"])
    ? (normalized as InventoryItemRecord["criticality"])
    : null;
}

function normalizeOptionalNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export async function handleCreateInventoryItemRequest(
  service: Pick<InventoryItemService, "createItem">,
  input: {
    name: string | null;
    category: string | null;
    unitOfMeasure: string | null;
    internalCode: string | null;
    reorderThreshold: number | null;
    parLevel: number | null;
    criticality: string | null;
  }
) {
  const name = normalizeRequiredString(input.name);
  const category = normalizeCategory(input.category);
  const unitOfMeasure = normalizeRequiredString(input.unitOfMeasure);
  const criticality = normalizeCriticality(input.criticality);

  if (!name || !category || !unitOfMeasure || !criticality) {
    throw new Error("name, category, unitOfMeasure, and criticality are required.");
  }

  const item = await service.createItem({
    name,
    category,
    unitOfMeasure,
    internalCode: normalizeOptionalString(input.internalCode),
    reorderThreshold: normalizeOptionalNumber(input.reorderThreshold),
    parLevel: normalizeOptionalNumber(input.parLevel),
    criticality,
  });

  return { item };
}

export async function handleUpdateInventoryItemRequest(
  service: Pick<InventoryItemService, "updateItem">,
  input: {
    itemId: string | null;
    name: string | null;
    category: string | null;
    unitOfMeasure: string | null;
    internalCode: string | null;
    reorderThreshold: number | null;
    parLevel: number | null;
    criticality: string | null;
  }
) {
  const itemId = normalizeRequiredString(input.itemId);
  if (!itemId) {
    throw new Error("itemId is required.");
  }

  const category = input.category === null ? null : normalizeCategory(input.category);
  const criticality = input.criticality === null ? null : normalizeCriticality(input.criticality);

  const item = await service.updateItem({
    itemId,
    name: input.name,
    category,
    unitOfMeasure: input.unitOfMeasure,
    internalCode: input.internalCode,
    reorderThreshold: normalizeOptionalNumber(input.reorderThreshold),
    parLevel: normalizeOptionalNumber(input.parLevel),
    criticality,
  });

  return { item };
}
