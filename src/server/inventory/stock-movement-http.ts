import type { FlatId } from "../../types/booking";
import type { StockMovementRecord } from "../../types/booking-backend";
import type { StockMovementService } from "./stock-movement-service";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const MOVEMENT_TYPES: readonly StockMovementRecord["movementType"][] = [
  "add",
  "deduct",
  "consume",
  "adjust",
  "damage",
  "replace",
  "transfer",
];

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  return normalizeRequiredString(value) ?? null;
}

function normalizeFlatId(value: string | null | undefined): FlatId | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return FLAT_IDS.includes(normalized as FlatId) ? (normalized as FlatId) : null;
}

function normalizeMovementType(value: string | null | undefined): StockMovementRecord["movementType"] | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return MOVEMENT_TYPES.includes(normalized as StockMovementRecord["movementType"])
    ? (normalized as StockMovementRecord["movementType"])
    : null;
}

function normalizeOptionalNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export async function handleCreateStockMovementRequest(
  service: Pick<StockMovementService, "recordMovement">,
  input: {
    movementType: string | null;
    inventoryItemId: string | null;
    quantity: number | null;
    adjustToQuantity: number | null;
    flatId: string | null;
    reason: string | null;
    notes: string | null;
    actorId: string | null;
  }
) {
  const movementType = normalizeMovementType(input.movementType);
  const inventoryItemId = normalizeRequiredString(input.inventoryItemId);
  const reason = normalizeRequiredString(input.reason);
  const flatId = normalizeFlatId(input.flatId);

  if (!movementType || movementType === "transfer" || !inventoryItemId || !reason || (input.flatId && !flatId)) {
    throw new Error("movementType, inventoryItemId, flatId (if provided), and reason are required.");
  }

  const quantity = normalizeOptionalNumber(input.quantity);
  const adjustToQuantity = normalizeOptionalNumber(input.adjustToQuantity);

  if (movementType === "adjust") {
    if (adjustToQuantity === null) {
      throw new Error("adjustToQuantity is required for adjust movements.");
    }

    const movement = await service.recordMovement({
      movementType,
      inventoryItemId,
      adjustToQuantity,
      flatId,
      reason,
      notes: normalizeOptionalString(input.notes),
      actorId: normalizeOptionalString(input.actorId),
    });

    return { movement };
  }

  if (quantity === null) {
    throw new Error("quantity is required for movement types other than adjust.");
  }

  const movement = await service.recordMovement({
    movementType,
    inventoryItemId,
    quantity,
    flatId,
    reason,
    notes: normalizeOptionalString(input.notes),
    actorId: normalizeOptionalString(input.actorId),
  });

  return { movement };
}

export async function handleTransferStockRequest(
  service: Pick<StockMovementService, "transferStock">,
  input: {
    inventoryItemId: string | null;
    quantity: number | null;
    fromFlatId: string | null;
    toFlatId: string | null;
    reason: string | null;
    notes: string | null;
    actorId: string | null;
  }
) {
  const inventoryItemId = normalizeRequiredString(input.inventoryItemId);
  const reason = normalizeRequiredString(input.reason);
  const quantity = normalizeOptionalNumber(input.quantity);
  const fromFlatId = normalizeFlatId(input.fromFlatId);
  const toFlatId = normalizeFlatId(input.toFlatId);

  if (
    !inventoryItemId ||
    !reason ||
    quantity === null ||
    (input.fromFlatId && !fromFlatId) ||
    (input.toFlatId && !toFlatId)
  ) {
    throw new Error("inventoryItemId, quantity, reason, and valid from/to flat ids are required.");
  }

  const movement = await service.transferStock({
    inventoryItemId,
    quantity,
    fromFlatId,
    toFlatId,
    reason,
    notes: normalizeOptionalString(input.notes),
    actorId: normalizeOptionalString(input.actorId),
  });

  return { movement };
}
