import assert from "node:assert/strict";

import { FlatInventoryReconciliationService } from "../flat-inventory-reconciliation-service";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  InventoryItemRecord,
  StockMovementRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryFlatReconciliationRepository {
  private readonly items = new Map<string, InventoryItemRecord>();
  private readonly records = new Map<string, FlatInventoryRecord>();
  private readonly movements: StockMovementRecord[] = [];

  constructor(args: { items: InventoryItemRecord[]; records: FlatInventoryRecord[] }) {
    for (const item of args.items) {
      this.items.set(item.id, { ...item });
    }

    for (const record of args.records) {
      this.records.set(record.id, { ...record });
    }
  }

  async findFlatById(flatId: FlatId) {
    if (flatId === "mayfair" || flatId === "windsor" || flatId === "kensington") {
      return {
        id: flatId,
        name: flatId,
        nightlyRate: 100,
        maxGuests: 2,
        createdAt: "2026-11-20T09:00:00.000Z",
        updatedAt: "2026-11-20T09:00:00.000Z",
      };
    }

    return null;
  }

  async findInventoryItemById(inventoryItemId: string): Promise<InventoryItemRecord | null> {
    const found = this.items.get(inventoryItemId);
    return found ? { ...found } : null;
  }

  async findFlatInventoryById(flatInventoryId: string): Promise<FlatInventoryRecord | null> {
    const found = this.records.get(flatInventoryId);
    return found ? { ...found } : null;
  }

  async updateFlatInventory(record: FlatInventoryRecord): Promise<FlatInventoryRecord> {
    this.records.set(record.id, { ...record });
    return { ...record };
  }

  async createStockMovement(record: StockMovementRecord): Promise<StockMovementRecord> {
    this.movements.push({ ...record });
    return { ...record };
  }

  getRecord(flatInventoryId: string): FlatInventoryRecord | null {
    const found = this.records.get(flatInventoryId);
    return found ? { ...found } : null;
  }

  listMovements(): StockMovementRecord[] {
    return this.movements.map((entry) => ({ ...entry }));
  }
}

function createHarness() {
  const now = "2026-11-20T09:00:00.000Z";

  const items: InventoryItemRecord[] = [
    {
      id: "item_water",
      name: "Bottled Water",
      category: "consumable",
      internalCode: null,
      unitOfMeasure: "bottle",
      reorderThreshold: 10,
      parLevel: 20,
      criticality: "important",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "item_tv",
      name: "Smart TV",
      category: "asset",
      internalCode: null,
      unitOfMeasure: "piece",
      reorderThreshold: null,
      parLevel: null,
      criticality: "critical",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const records: FlatInventoryRecord[] = [
    {
      id: "flat_inv_water",
      flatId: "mayfair",
      inventoryItemId: "item_water",
      expectedQuantity: 12,
      currentQuantity: 4,
      conditionStatus: "ok",
      notes: "Previous count",
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "flat_inv_tv",
      flatId: "mayfair",
      inventoryItemId: "item_tv",
      expectedQuantity: 1,
      currentQuantity: 1,
      conditionStatus: "ok",
      notes: null,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const repository = new InMemoryFlatReconciliationRepository({ items, records });
  const syncedReadiness: FlatId[] = [];
  const syncedAlerts: FlatId[] = [];
  const readinessOverrideWrites: FlatReadinessRecord[] = [];

  let sequence = 0;
  const service = new FlatInventoryReconciliationService({
    repository,
    readinessGateway: {
      syncFlatReadiness: async (flatId) => {
        syncedReadiness.push(flatId);
      },
      setManualOverride: async (input) => {
        const record: FlatReadinessRecord = {
          flatId: input.flatId,
          cleaningStatus: "ready",
          linenStatus: "ready",
          consumablesStatus: "attention_required",
          maintenanceStatus: "ready",
          criticalAssetStatus: "ready",
          readinessStatus: input.overrideStatus,
          overrideStatus: input.overrideStatus,
          overrideReason: input.reason,
          updatedAt: "2026-11-21T09:00:00.000Z",
        };

        readinessOverrideWrites.push(record);
        return record;
      },
      clearManualOverride: async (flatId) => {
        const record: FlatReadinessRecord = {
          flatId,
          cleaningStatus: "ready",
          linenStatus: "ready",
          consumablesStatus: "attention_required",
          maintenanceStatus: "ready",
          criticalAssetStatus: "ready",
          readinessStatus: "needs_attention",
          overrideStatus: null,
          overrideReason: null,
          updatedAt: "2026-11-21T09:30:00.000Z",
        };

        readinessOverrideWrites.push(record);
        return record;
      },
    },
    alertGateway: {
      syncFlatAlerts: async (flatId) => {
        syncedAlerts.push(flatId);
      },
    },
    now: () => new Date("2026-11-21T08:00:00.000Z"),
    createId: (prefix) => {
      sequence += 1;
      return `${prefix}_${String(sequence).padStart(3, "0")}`;
    },
  });

  return {
    service,
    repository,
    syncedReadiness,
    syncedAlerts,
    readinessOverrideWrites,
  };
}

async function testAdjustQuantityCreatesMovementAndSyncsReadiness(): Promise<void> {
  const { service, repository, syncedReadiness, syncedAlerts } = createHarness();

  const result = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_water",
    action: "adjust_quantity",
    quantity: 7,
    note: "Cycle count corrected",
  });

  assert.equal(result.record.currentQuantity, 7);
  assert.equal(result.record.notes, "Cycle count corrected");
  assert.equal(result.movement?.movementType, "adjust");
  assert.equal(result.movement?.quantity, 3);

  const record = repository.getRecord("flat_inv_water");
  assert.equal(record?.currentQuantity, 7);
  assert.equal(syncedReadiness.length, 1);
  assert.equal(syncedAlerts.length, 1);
}

async function testMarkMissingAndDamagedFlows(): Promise<void> {
  const { service, repository } = createHarness();

  const missing = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_water",
    action: "mark_missing",
    note: "Shelf empty during inspection",
  });

  assert.equal(missing.record.conditionStatus, "missing");
  assert.equal(missing.record.currentQuantity, 0);
  assert.equal(missing.movement?.movementType, "adjust");

  const damaged = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_tv",
    action: "mark_damaged",
    note: "Screen cracked",
  });

  assert.equal(damaged.record.conditionStatus, "damaged");
  assert.equal(damaged.record.currentQuantity, 0);
  assert.equal(damaged.movement?.movementType, "damage");

  const stored = repository.getRecord("flat_inv_tv");
  assert.equal(stored?.conditionStatus, "damaged");
}

async function testMarkReplacedAndRestockedNow(): Promise<void> {
  const { service } = createHarness();

  await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_tv",
    action: "mark_damaged",
    note: "Damaged during stay",
  });

  const replaced = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_tv",
    action: "mark_replaced",
    note: "Replacement installed",
  });

  assert.equal(replaced.record.conditionStatus, "ok");
  assert.equal(replaced.record.currentQuantity, 1);
  assert.equal(replaced.movement?.movementType, "replace");

  const restocked = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_water",
    action: "restocked_now",
    note: "Mini-bar replenished",
  });

  assert.equal(restocked.record.currentQuantity, 12);
  assert.equal(restocked.record.conditionStatus, "ok");
  assert.equal(restocked.movement?.movementType, "add");
}

async function testDiscrepancyNoteAndReadinessOverrides(): Promise<void> {
  const { service, repository, readinessOverrideWrites } = createHarness();

  const noted = await service.reconcileRecord({
    flatId: "mayfair",
    flatInventoryId: "flat_inv_water",
    action: "note_discrepancy",
    note: "Count blocked by locked cabinet",
  });

  assert.equal(noted.record.notes, "Count blocked by locked cabinet");
  assert.equal(noted.movement, null);
  assert.equal(repository.listMovements().length, 0);

  const overridden = await service.setReadinessOverride({
    flatId: "mayfair",
    overrideStatus: "out_of_service",
    reason: "Manual safety hold",
  });

  assert.equal(overridden.overrideStatus, "out_of_service");

  const restored = await service.clearReadinessOverride({
    flatId: "mayfair",
  });

  assert.equal(restored.overrideStatus, null);
  assert.equal(readinessOverrideWrites.length, 2);
}

async function run(): Promise<void> {
  await testAdjustQuantityCreatesMovementAndSyncsReadiness();
  await testMarkMissingAndDamagedFlows();
  await testMarkReplacedAndRestockedNow();
  await testDiscrepancyNoteAndReadinessOverrides();

  console.log("flat-inventory-reconciliation-service: ok");
}

void run();
