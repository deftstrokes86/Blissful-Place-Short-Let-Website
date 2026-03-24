import assert from "node:assert/strict";

import {
  handleCreateStockMovementRequest,
  handleTransferStockRequest,
} from "../stock-movement-http";
import type { StockMovementService } from "../stock-movement-service";
import type { StockMovementRecord } from "../../../types/booking-backend";

class StubStockMovementService implements Pick<StockMovementService, "recordMovement" | "transferStock"> {
  async recordMovement(input: {
    movementType: "add" | "deduct" | "consume" | "adjust" | "damage" | "replace";
    inventoryItemId: string;
    quantity?: number;
    adjustToQuantity?: number;
    flatId: "windsor" | "kensington" | "mayfair" | null;
    reason: string;
    notes?: string | null;
    actorId?: string | null;
  }): Promise<StockMovementRecord> {
    return {
      id: "movement_1",
      inventoryItemId: input.inventoryItemId,
      flatId: input.flatId,
      movementType: input.movementType,
      quantity: input.movementType === "adjust" ? Math.abs((input.adjustToQuantity ?? 0) - 5) : (input.quantity ?? 1),
      reason: input.reason,
      notes: input.notes ?? null,
      actorId: input.actorId ?? null,
      createdAt: "2026-11-26T08:00:00.000Z",
    };
  }

  async transferStock(input: {
    inventoryItemId: string;
    quantity: number;
    fromFlatId: "windsor" | "kensington" | "mayfair" | null;
    toFlatId: "windsor" | "kensington" | "mayfair" | null;
    reason: string;
    notes?: string | null;
    actorId?: string | null;
  }): Promise<StockMovementRecord> {
    return {
      id: "movement_transfer_1",
      inventoryItemId: input.inventoryItemId,
      flatId: input.toFlatId,
      movementType: "transfer",
      quantity: input.quantity,
      reason: input.reason,
      notes: input.notes ?? null,
      actorId: input.actorId ?? null,
      createdAt: "2026-11-26T08:00:00.000Z",
    };
  }
}

async function testCreateMovementValidationAndShape(): Promise<void> {
  const service = new StubStockMovementService();

  await assert.rejects(
    async () => {
      await handleCreateStockMovementRequest(service as unknown as StockMovementService, {
        movementType: "add",
        inventoryItemId: null,
        quantity: 2,
        adjustToQuantity: null,
        flatId: null,
        reason: "Restock",
        notes: null,
        actorId: null,
      });
    },
    /required/i
  );

  const result = await handleCreateStockMovementRequest(service as unknown as StockMovementService, {
    movementType: "add",
    inventoryItemId: "item_water",
    quantity: 2,
    adjustToQuantity: null,
    flatId: "mayfair",
    reason: "Restock",
    notes: "Morning top-up",
    actorId: "staff_ops_1",
  });

  assert.equal(result.movement.id, "movement_1");
  assert.equal(result.movement.movementType, "add");
}

async function testTransferValidationAndShape(): Promise<void> {
  const service = new StubStockMovementService();

  await assert.rejects(
    async () => {
      await handleTransferStockRequest(service as unknown as StockMovementService, {
        inventoryItemId: "item_water",
        quantity: null,
        fromFlatId: null,
        toFlatId: "mayfair",
        reason: "Transfer",
        notes: null,
        actorId: null,
      });
    },
    /required/i
  );

  const result = await handleTransferStockRequest(service as unknown as StockMovementService, {
    inventoryItemId: "item_water",
    quantity: 5,
    fromFlatId: null,
    toFlatId: "mayfair",
    reason: "Restock flat",
    notes: null,
    actorId: "staff_ops_2",
  });

  assert.equal(result.movement.id, "movement_transfer_1");
  assert.equal(result.movement.movementType, "transfer");
}

async function run(): Promise<void> {
  await testCreateMovementValidationAndShape();
  await testTransferValidationAndShape();

  console.log("stock-movement-http: ok");
}

void run();
