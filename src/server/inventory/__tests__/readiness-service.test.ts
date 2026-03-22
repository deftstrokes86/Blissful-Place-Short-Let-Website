import assert from "node:assert/strict";

import {
  ReadinessService,
  type ReadinessRepository,
} from "../readiness-service";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatRecord,
  InventoryItemRecord,
  MaintenanceIssueRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

interface FlatInventorySignal {
  inventory: FlatInventoryRecord;
  item: InventoryItemRecord;
}

class InMemoryReadinessRepository implements ReadinessRepository {
  private readonly flats = new Map<FlatId, FlatRecord>();
  private readonly inventorySignalsByFlat = new Map<FlatId, FlatInventorySignal[]>();
  private readonly maintenanceIssuesByFlat = new Map<FlatId, MaintenanceIssueRecord[]>();
  private readonly readinessByFlat = new Map<FlatId, FlatReadinessRecord>();

  constructor(args: {
    flats: FlatRecord[];
    inventorySignalsByFlat: Record<FlatId, FlatInventorySignal[]>;
    maintenanceIssuesByFlat?: Partial<Record<FlatId, MaintenanceIssueRecord[]>>;
    readiness?: FlatReadinessRecord[];
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const [flatId, signals] of Object.entries(args.inventorySignalsByFlat) as [FlatId, FlatInventorySignal[]][]) {
      this.inventorySignalsByFlat.set(
        flatId,
        signals.map((entry) => ({
          inventory: { ...entry.inventory },
          item: { ...entry.item },
        }))
      );
    }

    for (const [flatId, issues] of Object.entries(args.maintenanceIssuesByFlat ?? {}) as [
      FlatId,
      MaintenanceIssueRecord[]
    ][]) {
      this.maintenanceIssuesByFlat.set(
        flatId,
        issues.map((issue) => ({ ...issue }))
      );
    }

    for (const record of args.readiness ?? []) {
      this.readinessByFlat.set(record.flatId, { ...record });
    }
  }

  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    const flat = this.flats.get(flatId);
    return flat ? { ...flat } : null;
  }

  async listFlatInventorySignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    return (this.inventorySignalsByFlat.get(flatId) ?? []).map((entry) => ({
      inventory: { ...entry.inventory },
      item: { ...entry.item },
    }));
  }

  async listMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    return (this.maintenanceIssuesByFlat.get(flatId) ?? []).map((issue) => ({ ...issue }));
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = this.readinessByFlat.get(flatId);
    return found ? { ...found } : null;
  }

  async upsertFlatReadiness(record: FlatReadinessRecord): Promise<FlatReadinessRecord> {
    this.readinessByFlat.set(record.flatId, { ...record });
    return { ...record };
  }
}

function createHarness(args?: {
  criticalAssetCurrentQuantity?: number;
  criticalAssetCondition?: FlatInventoryRecord["conditionStatus"];
  consumableCurrentQuantity?: number;
  consumableExpectedQuantity?: number;
  consumableCriticality?: InventoryItemRecord["criticality"];
  maintenanceIssues?: MaintenanceIssueRecord[];
}) {
  const now = "2026-11-04T09:00:00.000Z";

  const mayfair: FlatRecord = {
    id: "mayfair",
    name: "Mayfair Suite",
    nightlyRate: 250000,
    maxGuests: 6,
    createdAt: now,
    updatedAt: now,
  };

  const criticalTv: InventoryItemRecord = {
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
  };

  const bottledWater: InventoryItemRecord = {
    id: "item_water",
    name: "Bottled Water",
    category: "consumable",
    internalCode: "WTR-01",
    unitOfMeasure: "bottle",
    reorderThreshold: 10,
    parLevel: 20,
    criticality: args?.consumableCriticality ?? "important",
    createdAt: now,
    updatedAt: now,
  };

  const signals: FlatInventorySignal[] = [
    {
      inventory: {
        id: "flat_inv_tv",
        flatId: "mayfair",
        inventoryItemId: "item_tv",
        expectedQuantity: 1,
        currentQuantity: args?.criticalAssetCurrentQuantity ?? 1,
        conditionStatus: args?.criticalAssetCondition ?? "ok",
        notes: null,
        lastCheckedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      item: criticalTv,
    },
    {
      inventory: {
        id: "flat_inv_water",
        flatId: "mayfair",
        inventoryItemId: "item_water",
        expectedQuantity: args?.consumableExpectedQuantity ?? 10,
        currentQuantity: args?.consumableCurrentQuantity ?? 10,
        conditionStatus: "ok",
        notes: null,
        lastCheckedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      item: bottledWater,
    },
  ];

  const repository = new InMemoryReadinessRepository({
    flats: [mayfair],
    inventorySignalsByFlat: {
      mayfair: signals,
      windsor: [],
      kensington: [],
    },
    maintenanceIssuesByFlat: {
      mayfair: args?.maintenanceIssues ?? [],
    },
  });

  const service = new ReadinessService({
    repository,
    now: () => new Date("2026-11-04T10:00:00.000Z"),
  });

  return {
    service,
  };
}

async function testFlatReadyWhenAllComponentsGood(): Promise<void> {
  const { service } = createHarness();

  const record = await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(record.cleaningStatus, "ready");
  assert.equal(record.linenStatus, "ready");
  assert.equal(record.consumablesStatus, "ready");
  assert.equal(record.maintenanceStatus, "ready");
  assert.equal(record.criticalAssetStatus, "ready");
  assert.equal(record.readinessStatus, "ready");
}

async function testMissingCriticalAssetMakesFlatOutOfService(): Promise<void> {
  const { service } = createHarness({
    criticalAssetCurrentQuantity: 0,
    criticalAssetCondition: "missing",
  });

  const record = await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(record.criticalAssetStatus, "blocked");
  assert.equal(record.readinessStatus, "out_of_service");
}

async function testLowConsumablesCausesDegradedNotOutage(): Promise<void> {
  const { service } = createHarness({
    consumableCurrentQuantity: 2,
    consumableExpectedQuantity: 10,
  });

  const record = await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(record.consumablesStatus, "attention_required");
  assert.equal(record.readinessStatus, "needs_attention");
}


async function testCriticalConsumableDoesNotBehaveLikeCriticalAssetBlocker(): Promise<void> {
  const { service } = createHarness({
    consumableCurrentQuantity: 0,
    consumableExpectedQuantity: 8,
    consumableCriticality: "critical",
  });

  const record = await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(record.consumablesStatus, "attention_required");
  assert.equal(record.criticalAssetStatus, "ready");
  assert.equal(record.readinessStatus, "needs_attention");
}
async function testMaintenanceSeverityAffectsReadiness(): Promise<void> {
  const now = "2026-11-04T09:00:00.000Z";

  const criticalIssue: MaintenanceIssueRecord = {
    id: "issue_critical",
    flatId: "mayfair",
    inventoryItemId: "item_tv",
    title: "AC failure",
    notes: "Compressor fault",
    severity: "critical",
    status: "open",
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  const importantIssue: MaintenanceIssueRecord = {
    id: "issue_important",
    flatId: "mayfair",
    inventoryItemId: null,
    title: "Loose faucet",
    notes: "Bathroom sink",
    severity: "important",
    status: "open",
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  const criticalHarness = createHarness({ maintenanceIssues: [criticalIssue] });
  const criticalRecord = await criticalHarness.service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(criticalRecord.maintenanceStatus, "blocked");
  assert.equal(criticalRecord.readinessStatus, "out_of_service");

  const importantHarness = createHarness({ maintenanceIssues: [importantIssue] });
  const importantRecord = await importantHarness.service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  assert.equal(importantRecord.maintenanceStatus, "attention_required");
  assert.equal(importantRecord.readinessStatus, "needs_attention");
}

async function testManualOverrideRequiresReason(): Promise<void> {
  const { service } = createHarness({
    consumableCurrentQuantity: 2,
    consumableExpectedQuantity: 10,
  });

  await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });

  await assert.rejects(
    async () => {
      await service.setManualOverride({
        flatId: "mayfair",
        overrideStatus: "out_of_service",
        reason: "",
      });
    },
    /reason is required/i
  );

  const overridden = await service.setManualOverride({
    flatId: "mayfair",
    overrideStatus: "out_of_service",
    reason: "Awaiting deep sanitation and engineering sign-off.",
  });

  assert.equal(overridden.overrideStatus, "out_of_service");
  assert.equal(overridden.readinessStatus, "out_of_service");
}

async function testComputedReadinessRestoredWhenOverrideRemoved(): Promise<void> {
  const { service } = createHarness();

  const initial = await service.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });
  assert.equal(initial.readinessStatus, "ready");

  const overridden = await service.setManualOverride({
    flatId: "mayfair",
    overrideStatus: "out_of_service",
    reason: "Temporary manual closure",
  });
  assert.equal(overridden.readinessStatus, "out_of_service");

  const restored = await service.clearManualOverride("mayfair");
  assert.equal(restored.overrideStatus, null);
  assert.equal(restored.overrideReason, null);
  assert.equal(restored.readinessStatus, "ready");
}

async function run(): Promise<void> {
  await testFlatReadyWhenAllComponentsGood();
  await testMissingCriticalAssetMakesFlatOutOfService();
  await testLowConsumablesCausesDegradedNotOutage();
  await testCriticalConsumableDoesNotBehaveLikeCriticalAssetBlocker();
  await testMaintenanceSeverityAffectsReadiness();
  await testManualOverrideRequiresReason();
  await testComputedReadinessRestoredWhenOverrideRemoved();

  console.log("readiness-service: ok");
}

void run();




