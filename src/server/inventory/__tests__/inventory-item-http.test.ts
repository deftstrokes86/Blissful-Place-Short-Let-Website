import assert from "node:assert/strict";

import {
  handleCreateInventoryItemRequest,
  handleUpdateInventoryItemRequest,
} from "../inventory-item-http";
import type { InventoryItemService } from "../inventory-item-service";
import type { InventoryItemRecord } from "../../../types/booking-backend";

class StubInventoryItemService implements Pick<InventoryItemService, "createItem" | "updateItem"> {
  async createItem(input: {
    name: string;
    category: "asset" | "consumable" | "maintenance_supply";
    unitOfMeasure: string;
    internalCode?: string | null;
    reorderThreshold?: number | null;
    parLevel?: number | null;
    criticality: "critical" | "important" | "minor";
  }): Promise<InventoryItemRecord> {
    return {
      id: "item_created",
      name: input.name,
      category: input.category,
      internalCode: input.internalCode ?? null,
      unitOfMeasure: input.unitOfMeasure,
      reorderThreshold: input.reorderThreshold ?? null,
      parLevel: input.parLevel ?? null,
      criticality: input.criticality,
      createdAt: "2026-11-26T08:00:00.000Z",
      updatedAt: "2026-11-26T08:00:00.000Z",
    };
  }

  async updateItem(input: {
    itemId: string;
    name?: string | null;
    category?: "asset" | "consumable" | "maintenance_supply" | null;
    unitOfMeasure?: string | null;
    internalCode?: string | null;
    reorderThreshold?: number | null;
    parLevel?: number | null;
    criticality?: "critical" | "important" | "minor" | null;
  }): Promise<InventoryItemRecord> {
    return {
      id: input.itemId,
      name: input.name ?? "Updated Name",
      category: input.category ?? "asset",
      internalCode: input.internalCode ?? null,
      unitOfMeasure: input.unitOfMeasure ?? "piece",
      reorderThreshold: input.reorderThreshold ?? null,
      parLevel: input.parLevel ?? null,
      criticality: input.criticality ?? "important",
      createdAt: "2026-11-26T08:00:00.000Z",
      updatedAt: "2026-11-26T09:00:00.000Z",
    };
  }
}

async function testCreateValidationAndShape(): Promise<void> {
  const service = new StubInventoryItemService();

  await assert.rejects(
    async () => {
      await handleCreateInventoryItemRequest(service as unknown as InventoryItemService, {
        name: null,
        category: "asset",
        unitOfMeasure: "piece",
        internalCode: null,
        reorderThreshold: 1,
        parLevel: 1,
        criticality: "important",
      });
    },
    /required/i
  );

  const result = await handleCreateInventoryItemRequest(service as unknown as InventoryItemService, {
    name: "Smart TV",
    category: "asset",
    unitOfMeasure: "piece",
    internalCode: "TV-01",
    reorderThreshold: null,
    parLevel: 1,
    criticality: "critical",
  });

  assert.equal(result.item.name, "Smart TV");
  assert.equal(result.item.id, "item_created");
}

async function testUpdateValidationAndShape(): Promise<void> {
  const service = new StubInventoryItemService();

  await assert.rejects(
    async () => {
      await handleUpdateInventoryItemRequest(service as unknown as InventoryItemService, {
        itemId: "",
        name: "Any",
        category: null,
        unitOfMeasure: null,
        internalCode: null,
        reorderThreshold: null,
        parLevel: null,
        criticality: null,
      });
    },
    /required/i
  );

  const result = await handleUpdateInventoryItemRequest(service as unknown as InventoryItemService, {
    itemId: "item_1",
    name: "Smart TV XL",
    category: "asset",
    unitOfMeasure: "piece",
    internalCode: "TV-99",
    reorderThreshold: null,
    parLevel: 2,
    criticality: "critical",
  });

  assert.equal(result.item.id, "item_1");
  assert.equal(result.item.name, "Smart TV XL");
}

async function run(): Promise<void> {
  await testCreateValidationAndShape();
  await testUpdateValidationAndShape();

  console.log("inventory-item-http: ok");
}

void run();
