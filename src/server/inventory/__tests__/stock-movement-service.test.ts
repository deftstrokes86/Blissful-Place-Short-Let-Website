import assert from "node:assert/strict";

import {
  StockMovementService,
  type StockMovementRepository,
} from "../stock-movement-service";
import type {
  FlatInventoryRecord,
  FlatRecord,
  InventoryItemRecord,
  StockMovementRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryStockMovementRepository implements StockMovementRepository {
  private readonly flats = new Map<FlatId, FlatRecord>();
  private readonly items = new Map<string, InventoryItemRecord>();
  private readonly centralStockByItem = new Map<string, number>();
  private readonly flatInventoryById = new Map<string, FlatInventoryRecord>();
  private readonly movements: StockMovementRecord[] = [];

  constructor(args: {
    flats: FlatRecord[];
    items: InventoryItemRecord[];
    centralStockByItem?: Record<string, number>;
    flatInventory?: FlatInventoryRecord[];
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const item of args.items) {
      this.items.set(item.id, { ...item });
    }

    for (const [itemId, quantity] of Object.entries(args.centralStockByItem ?? {})) {
      this.centralStockByItem.set(itemId, quantity);
    }

    for (const record of args.flatInventory ?? []) {
      this.flatInventoryById.set(record.id, { ...record });
    }
  }

  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    const found = this.flats.get(flatId);
    return found ? { ...found } : null;
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = this.items.get(inventoryItemId);
    return found ? { ...found } : null;
  }

  async getCentralStockQuantity(inventoryItemId: string): Promise<number> {
    return this.centralStockByItem.get(inventoryItemId) ?? 0;
  }

  async setCentralStockQuantity(inventoryItemId: string, quantity: number): Promise<void> {
    this.centralStockByItem.set(inventoryItemId, quantity);
  }

  async findFlatInventoryByFlatAndItem(flatId: FlatId, inventoryItemId: string): Promise<FlatInventoryRecord | null> {
    for (const record of this.flatInventoryById.values()) {
      if (record.flatId === flatId && record.inventoryItemId === inventoryItemId) {
        return { ...record };
      }
    }

    return null;
  }

  async createFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    this.flatInventoryById.set(record.id, { ...record });
    return { ...record };
  }

  async updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    this.flatInventoryById.set(record.id, { ...record });
    return { ...record };
  }

  async createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord> {
    this.movements.push({ ...record });
    return { ...record };
  }

  async listStockMovements(filter?: { inventoryItemId?: string; flatId?: FlatId | null }): Promise<StockMovementRecord[]> {
    return this.movements
      .filter((entry) => {
        if (filter?.inventoryItemId && entry.inventoryItemId !== filter.inventoryItemId) {
          return false;
        }

        if (filter && "flatId" in filter && entry.flatId !== filter.flatId) {
          return false;
        }

        return true;
      })
      .map((entry) => ({ ...entry }));
  }
}

function createHarness() {
  const now = "2026-11-03T09:00:00.000Z";
  const flats: FlatRecord[] = [
    {
      id: "mayfair",
      name: "Mayfair Suite",
      nightlyRate: 250000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "windsor",
      name: "Windsor Residence",
      nightlyRate: 150000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const items: InventoryItemRecord[] = [
    {
      id: "item_water",
      name: "Premium Bottled Water",
      category: "consumable",
      internalCode: "WTR-01",
      unitOfMeasure: "bottle",
      reorderThreshold: 20,
      parLevel: 50,
      criticality: "important",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item_tv",
      name: "Smart TV",
      category: "asset",
      internalCode: "TV-01",
      unitOfMeasure: "piece",
      reorderThreshold: null,
      parLevel: null,
      criticality: "critical",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const flatInventory: FlatInventoryRecord[] = [
    {
      id: "flat_inv_mayfair_water",
      flatId: "mayfair",
      inventoryItemId: "item_water",
      expectedQuantity: 12,
      currentQuantity: 6,
      conditionStatus: "ok",
      notes: "Initial stock",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "flat_inv_mayfair_tv",
      flatId: "mayfair",
      inventoryItemId: "item_tv",
      expectedQuantity: 1,
      currentQuantity: 1,
      conditionStatus: "ok",
      notes: "Installed",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const repository = new InMemoryStockMovementRepository({
    flats,
    items,
    centralStockByItem: {
      item_water: 30,
      item_tv: 2,
    },
    flatInventory,
  });

  let sequence = 0;
  const service = new StockMovementService({
    repository,
    now: () => new Date("2026-11-03T10:00:00.000Z"),
    createId: (prefix) => {
      sequence += 1;
      return `${prefix}_${String(sequence).padStart(3, "0")}`;
    },
  });

  return {
    service,
    repository,
  };
}

async function testAddingStock(): Promise<void> {
  const { service } = createHarness();

  const movement = await service.recordMovement({
    movementType: "add",
    inventoryItemId: "item_water",
    quantity: 10,
    flatId: null,
    reason: "Restock received",
    notes: "Supplier delivery",
    actorId: "staff_ops_1",
  });

  assert.equal(movement.movementType, "add");
  assert.equal(movement.flatId, null);

  const central = await service.getCentralStockQuantity("item_water");
  assert.equal(central, 40);
}

async function testConsumingStock(): Promise<void> {
  const { service } = createHarness();

  await service.recordMovement({
    movementType: "consume",
    inventoryItemId: "item_water",
    quantity: 2,
    flatId: "mayfair",
    reason: "Guest stay consumption",
    notes: null,
    actorId: "staff_ops_2",
  });

  const snapshot = await service.getFlatStockSnapshot("mayfair", "item_water");
  assert.equal(snapshot?.currentQuantity, 4);
}

async function testDamagingStockAssets(): Promise<void> {
  const { service } = createHarness();

  await service.recordMovement({
    movementType: "damage",
    inventoryItemId: "item_tv",
    quantity: 1,
    flatId: "mayfair",
    reason: "Screen cracked",
    notes: "Guest incident report",
    actorId: "staff_ops_2",
  });

  const snapshot = await service.getFlatStockSnapshot("mayfair", "item_tv");
  assert.equal(snapshot?.currentQuantity, 0);
  assert.equal(snapshot?.conditionStatus, "damaged");
}

async function testReplacingAnItem(): Promise<void> {
  const { service } = createHarness();

  await service.recordMovement({
    movementType: "damage",
    inventoryItemId: "item_tv",
    quantity: 1,
    flatId: "mayfair",
    reason: "Screen cracked",
    notes: null,
    actorId: "staff_ops_2",
  });

  await service.recordMovement({
    movementType: "replace",
    inventoryItemId: "item_tv",
    quantity: 1,
    flatId: "mayfair",
    reason: "Replacement TV installed",
    notes: "Warranty replacement",
    actorId: "staff_ops_3",
  });

  const snapshot = await service.getFlatStockSnapshot("mayfair", "item_tv");
  assert.equal(snapshot?.currentQuantity, 1);
  assert.equal(snapshot?.conditionStatus, "ok");
}

async function testAdjustingQuantity(): Promise<void> {
  const { service } = createHarness();

  const movement = await service.recordMovement({
    movementType: "adjust",
    inventoryItemId: "item_water",
    flatId: null,
    adjustToQuantity: 22,
    reason: "Cycle count correction",
    notes: "Post-audit adjustment",
    actorId: "staff_ops_4",
  });

  assert.equal(movement.movementType, "adjust");
  assert.equal(movement.quantity, 8);

  const central = await service.getCentralStockQuantity("item_water");
  assert.equal(central, 22);
}

async function testTransferCentralToFlat(): Promise<void> {
  const { service } = createHarness();

  const movement = await service.transferStock({
    inventoryItemId: "item_water",
    quantity: 5,
    fromFlatId: null,
    toFlatId: "mayfair",
    reason: "Replenish mini-bar",
    notes: null,
    actorId: "staff_ops_2",
  });

  assert.equal(movement.movementType, "transfer");

  const central = await service.getCentralStockQuantity("item_water");
  const flat = await service.getFlatStockSnapshot("mayfair", "item_water");
  assert.equal(central, 25);
  assert.equal(flat?.currentQuantity, 11);
}

async function testPreventInvalidNegativeOutcomes(): Promise<void> {
  const { service } = createHarness();

  await assert.rejects(
    async () => {
      await service.recordMovement({
        movementType: "deduct",
        inventoryItemId: "item_water",
        quantity: 100,
        flatId: null,
        reason: "Erroneous deduction",
        notes: null,
        actorId: "staff_ops_1",
      });
    },
    /insufficient stock/i
  );

  await assert.rejects(
    async () => {
      await service.recordMovement({
        movementType: "consume",
        inventoryItemId: "item_water",
        quantity: 20,
        flatId: "mayfair",
        reason: "Impossible consume",
        notes: null,
        actorId: "staff_ops_1",
      });
    },
    /insufficient stock/i
  );
}

async function testMovementHistoryRetrieval(): Promise<void> {
  const { service } = createHarness();

  await service.recordMovement({
    movementType: "add",
    inventoryItemId: "item_water",
    quantity: 4,
    flatId: null,
    reason: "Restock",
    notes: "Morning shipment",
    actorId: "staff_ops_1",
  });

  await service.recordMovement({
    movementType: "consume",
    inventoryItemId: "item_water",
    quantity: 1,
    flatId: "mayfair",
    reason: "Guest use",
    notes: "Day 1",
    actorId: "staff_ops_2",
  });

  const history = await service.listMovementHistory({
    inventoryItemId: "item_water",
  });

  assert.equal(history.length, 2);
  assert.equal(history[0].inventoryItemId, "item_water");
  assert.ok(history.every((entry) => entry.reason.length > 0));
}

async function run(): Promise<void> {
  await testAddingStock();
  await testConsumingStock();
  await testDamagingStockAssets();
  await testReplacingAnItem();
  await testAdjustingQuantity();
  await testTransferCentralToFlat();
  await testPreventInvalidNegativeOutcomes();
  await testMovementHistoryRetrieval();

  console.log("stock-movement-service: ok");
}

void run();
