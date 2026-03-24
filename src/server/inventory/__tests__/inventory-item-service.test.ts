import assert from "node:assert/strict";

import { InventoryItemService, type InventoryItemRepository } from "../inventory-item-service";
import type { InventoryItemRecord } from "../../../types/booking-backend";

class InMemoryInventoryItemRepository implements InventoryItemRepository {
  private readonly items: InventoryItemRecord[];

  constructor(initial: InventoryItemRecord[] = []) {
    this.items = [...initial];
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = this.items.find((item) => item.id === inventoryItemId);
    return found ? { ...found } : null;
  }

  async listInventoryItems(): Promise<InventoryItemRecord[]> {
    return this.items.map((item) => ({ ...item }));
  }

  async createInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    this.items.push({ ...record });
    return { ...record };
  }

  async updateInventoryItem(record: InventoryItemRecord): Promise<InventoryItemRecord> {
    const index = this.items.findIndex((item) => item.id === record.id);
    if (index < 0) {
      throw new Error("Inventory item not found.");
    }

    this.items[index] = { ...record };
    return { ...record };
  }
}

function createService(repository: InventoryItemRepository): InventoryItemService {
  return new InventoryItemService({
    repository,
    now: () => new Date("2026-03-24T08:00:00.000Z"),
    createId: () => "inventory_item_new",
  });
}

async function testCreateItemEnforcesUniqueInternalCode(): Promise<void> {
  const repository = new InMemoryInventoryItemRepository([
    {
      id: "item_existing",
      name: "Water Bottle",
      category: "consumable",
      internalCode: "WTR-1",
      unitOfMeasure: "bottle",
      reorderThreshold: 10,
      parLevel: 30,
      criticality: "important",
      createdAt: "2026-03-20T08:00:00.000Z",
      updatedAt: "2026-03-20T08:00:00.000Z",
    },
  ]);

  const service = createService(repository);

  await assert.rejects(
    async () => {
      await service.createItem({
        name: "Water Bottle Extra",
        category: "consumable",
        unitOfMeasure: "bottle",
        internalCode: "wtr-1",
        reorderThreshold: 5,
        parLevel: 20,
        criticality: "important",
      });
    },
    /unique/i
  );
}

async function testCreateAndUpdateItem(): Promise<void> {
  const repository = new InMemoryInventoryItemRepository();
  const service = createService(repository);

  const created = await service.createItem({
    name: "Smart TV",
    category: "asset",
    unitOfMeasure: "piece",
    internalCode: "TV-1",
    reorderThreshold: null,
    parLevel: 1,
    criticality: "critical",
  });

  assert.equal(created.id, "inventory_item_new");
  assert.equal(created.name, "Smart TV");

  const updated = await service.updateItem({
    itemId: created.id,
    name: "Smart TV 65",
    category: "asset",
    unitOfMeasure: "piece",
    internalCode: "TV-2",
    reorderThreshold: null,
    parLevel: 2,
    criticality: "critical",
  });

  assert.equal(updated.name, "Smart TV 65");
  assert.equal(updated.internalCode, "TV-2");
  assert.equal(updated.parLevel, 2);
}

async function run(): Promise<void> {
  await testCreateItemEnforcesUniqueInternalCode();
  await testCreateAndUpdateItem();

  console.log("inventory-item-service: ok");
}

void run();
