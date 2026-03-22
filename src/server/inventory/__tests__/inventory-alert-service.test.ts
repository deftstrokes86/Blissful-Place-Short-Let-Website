import assert from "node:assert/strict";

import {
  InventoryAlertService,
  type InventoryAlertRepository,
  type InventoryAlertSignal,
} from "../inventory-alert-service";
import type {
  FlatReadinessRecord,
  FlatRecord,
  InventoryAlertRecord,
  InventoryItemRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryInventoryAlertRepository implements InventoryAlertRepository {
  private readonly flats = new Map<FlatId, FlatRecord>();
  private readonly signalsByFlat = new Map<FlatId, InventoryAlertSignal[]>();
  private readonly readinessByFlat = new Map<FlatId, FlatReadinessRecord>();
  private readonly alerts = new Map<string, InventoryAlertRecord>();

  constructor(args: {
    flats: FlatRecord[];
    signalsByFlat: Record<FlatId, InventoryAlertSignal[]>;
    readinessByFlat?: Partial<Record<FlatId, FlatReadinessRecord>>;
    alerts?: InventoryAlertRecord[];
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const [flatId, signals] of Object.entries(args.signalsByFlat) as [FlatId, InventoryAlertSignal[]][]) {
      this.signalsByFlat.set(
        flatId,
        signals.map((signal) => ({
          inventory: { ...signal.inventory },
          item: { ...signal.item },
        }))
      );
    }

    for (const [flatId, readiness] of Object.entries(args.readinessByFlat ?? {}) as [FlatId, FlatReadinessRecord][]) {
      this.readinessByFlat.set(flatId, { ...readiness });
    }

    for (const alert of args.alerts ?? []) {
      this.alerts.set(alert.id, { ...alert });
    }
  }

  async findFlatById(flatId: FlatId): Promise<FlatRecord | null> {
    const found = this.flats.get(flatId);
    return found ? { ...found } : null;
  }

  async listInventorySignals(flatId: FlatId): Promise<InventoryAlertSignal[]> {
    return (this.signalsByFlat.get(flatId) ?? []).map((signal) => ({
      inventory: { ...signal.inventory },
      item: { ...signal.item },
    }));
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = this.readinessByFlat.get(flatId);
    return found ? { ...found } : null;
  }

  async listFlatAlerts(flatId: FlatId): Promise<InventoryAlertRecord[]> {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.flatId === flatId)
      .map((alert) => ({ ...alert }));
  }

  async createAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    this.alerts.set(alert.id, { ...alert });
    return { ...alert };
  }

  async updateAlert(alert: InventoryAlertRecord): Promise<InventoryAlertRecord> {
    this.alerts.set(alert.id, { ...alert });
    return { ...alert };
  }
}

function createBaseFlat(now: string): FlatRecord {
  return {
    id: "mayfair",
    name: "Mayfair Suite",
    nightlyRate: 250000,
    maxGuests: 6,
    createdAt: now,
    updatedAt: now,
  };
}

function createBaseReadiness(now: string, readinessStatus: FlatReadinessRecord["readinessStatus"]): FlatReadinessRecord {
  return {
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
    consumablesStatus: readinessStatus === "ready" ? "ready" : "attention_required",
    maintenanceStatus: "ready",
    criticalAssetStatus: "ready",
    readinessStatus,
    overrideStatus: null,
    overrideReason: null,
    updatedAt: now,
  };
}

function createSignal(params: {
  itemId: string;
  category: InventoryItemRecord["category"];
  criticality: InventoryItemRecord["criticality"];
  expected: number;
  current: number;
  condition?: InventoryAlertSignal["inventory"]["conditionStatus"];
}): InventoryAlertSignal {
  const now = "2026-11-05T09:00:00.000Z";
  return {
    item: {
      id: params.itemId,
      name: params.itemId,
      category: params.category,
      internalCode: params.itemId,
      unitOfMeasure: "piece",
      reorderThreshold: 0,
      parLevel: params.expected,
      criticality: params.criticality,
      createdAt: now,
      updatedAt: now,
    },
    inventory: {
      id: `${params.itemId}_inv`,
      flatId: "mayfair",
      inventoryItemId: params.itemId,
      expectedQuantity: params.expected,
      currentQuantity: params.current,
      conditionStatus: params.condition ?? "ok",
      notes: null,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function createHarness(args: {
  signals: InventoryAlertSignal[];
  readinessStatus?: FlatReadinessRecord["readinessStatus"];
  existingAlerts?: InventoryAlertRecord[];
}) {
  const now = "2026-11-05T09:00:00.000Z";
  const repository = new InMemoryInventoryAlertRepository({
    flats: [createBaseFlat(now)],
    signalsByFlat: {
      mayfair: args.signals,
      windsor: [],
      kensington: [],
    },
    readinessByFlat: {
      mayfair: createBaseReadiness(now, args.readinessStatus ?? "ready"),
    },
    alerts: args.existingAlerts,
  });

  let sequence = 0;
  const service = new InventoryAlertService({
    repository,
    now: () => new Date("2026-11-05T10:00:00.000Z"),
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

async function testLowStockAlertGeneration(): Promise<void> {
  const { service } = createHarness({
    signals: [
      createSignal({
        itemId: "item_water",
        category: "consumable",
        criticality: "important",
        expected: 10,
        current: 2,
      }),
    ],
  });

  const result = await service.syncFlatAlerts("mayfair");
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].alertType, "low_stock");
  assert.equal(result.created[0].severity, "important");
}

async function testMissingRequiredItemAlertGeneration(): Promise<void> {
  const { service } = createHarness({
    signals: [
      createSignal({
        itemId: "item_towel",
        category: "consumable",
        criticality: "important",
        expected: 6,
        current: 0,
        condition: "missing",
      }),
    ],
  });

  const result = await service.syncFlatAlerts("mayfair");
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].alertType, "missing_required_item");
}

async function testDamagedCriticalAssetAlertGeneration(): Promise<void> {
  const { service } = createHarness({
    signals: [
      createSignal({
        itemId: "item_tv",
        category: "asset",
        criticality: "critical",
        expected: 1,
        current: 1,
        condition: "damaged",
      }),
    ],
  });

  const result = await service.syncFlatAlerts("mayfair");
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].alertType, "damaged_critical_asset");
  assert.equal(result.created[0].severity, "critical");
}

async function testReadinessIssueAlertGeneration(): Promise<void> {
  const { service } = createHarness({
    signals: [],
    readinessStatus: "needs_attention",
  });

  const result = await service.syncFlatAlerts("mayfair");
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].alertType, "readiness_issue");
}

async function testDuplicateAlertBehaviorIsIdempotent(): Promise<void> {
  const { service } = createHarness({
    signals: [
      createSignal({
        itemId: "item_water",
        category: "consumable",
        criticality: "important",
        expected: 10,
        current: 2,
      }),
    ],
  });

  const first = await service.syncFlatAlerts("mayfair");
  const second = await service.syncFlatAlerts("mayfair");

  assert.equal(first.created.length, 1);
  assert.equal(second.created.length, 0);

  const history = await service.listFlatAlerts("mayfair");
  const lowStockAlerts = history.filter((entry) => entry.alertType === "low_stock" && entry.status !== "resolved");
  assert.equal(lowStockAlerts.length, 1);
}

async function run(): Promise<void> {
  await testLowStockAlertGeneration();
  await testMissingRequiredItemAlertGeneration();
  await testDamagedCriticalAssetAlertGeneration();
  await testReadinessIssueAlertGeneration();
  await testDuplicateAlertBehaviorIsIdempotent();

  console.log("inventory-alert-service: ok");
}

void run();
