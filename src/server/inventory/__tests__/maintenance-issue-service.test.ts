import assert from "node:assert/strict";

import {
  MaintenanceIssueService,
  type MaintenanceIssueRepository,
  type MaintenanceReadinessGateway,
} from "../maintenance-issue-service";
import { ReadinessService, type FlatInventorySignal, type ReadinessRepository } from "../readiness-service";
import type {
  FlatReadinessRecord,
  FlatRecord,
  InventoryItemRecord,
  MaintenanceIssueRecord,
} from "../../../types/booking-backend";
import type { FlatId } from "../../../types/booking";

class InMemoryMaintenanceRepository implements MaintenanceIssueRepository, ReadinessRepository {
  private readonly flats = new Map<FlatId, FlatRecord>();
  private readonly items = new Map<string, InventoryItemRecord>();
  private readonly issues = new Map<string, MaintenanceIssueRecord>();
  private readonly signalsByFlat = new Map<FlatId, FlatInventorySignal[]>();
  private readonly readinessByFlat = new Map<FlatId, FlatReadinessRecord>();

  constructor(args: {
    flats: FlatRecord[];
    items: InventoryItemRecord[];
    signalsByFlat: Record<FlatId, FlatInventorySignal[]>;
  }) {
    for (const flat of args.flats) {
      this.flats.set(flat.id, { ...flat });
    }

    for (const item of args.items) {
      this.items.set(item.id, { ...item });
    }

    for (const [flatId, signals] of Object.entries(args.signalsByFlat) as [FlatId, FlatInventorySignal[]][]) {
      this.signalsByFlat.set(
        flatId,
        signals.map((entry) => ({
          inventory: { ...entry.inventory },
          item: { ...entry.item },
        }))
      );
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

  async createIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    this.issues.set(issue.id, { ...issue });
    return { ...issue };
  }

  async findIssueById(issueId: string): Promise<MaintenanceIssueRecord | null> {
    const found = this.issues.get(issueId);
    return found ? { ...found } : null;
  }

  async updateIssue(issue: MaintenanceIssueRecord): Promise<MaintenanceIssueRecord> {
    this.issues.set(issue.id, { ...issue });
    return { ...issue };
  }

  async listIssues(filter?: { flatId?: FlatId; status?: MaintenanceIssueRecord["status"] }): Promise<MaintenanceIssueRecord[]> {
    return Array.from(this.issues.values())
      .filter((issue) => {
        if (filter?.flatId && issue.flatId !== filter.flatId) {
          return false;
        }

        if (filter?.status && issue.status !== filter.status) {
          return false;
        }

        return true;
      })
      .map((issue) => ({ ...issue }));
  }

  async listFlatInventorySignals(flatId: FlatId): Promise<FlatInventorySignal[]> {
    return (this.signalsByFlat.get(flatId) ?? []).map((entry) => ({
      inventory: { ...entry.inventory },
      item: { ...entry.item },
    }));
  }

  async listMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]> {
    return Array.from(this.issues.values())
      .filter((issue) => issue.flatId === flatId)
      .map((issue) => ({ ...issue }));
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

function createHarness() {
  const now = "2026-11-06T09:00:00.000Z";

  const flat: FlatRecord = {
    id: "mayfair",
    name: "Mayfair Suite",
    nightlyRate: 250000,
    maxGuests: 6,
    createdAt: now,
    updatedAt: now,
  };

  const itemTv: InventoryItemRecord = {
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

  const signals: FlatInventorySignal[] = [
    {
      inventory: {
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
      item: itemTv,
    },
  ];

  const repository = new InMemoryMaintenanceRepository({
    flats: [flat],
    items: [itemTv],
    signalsByFlat: {
      mayfair: signals,
      windsor: [],
      kensington: [],
    },
  });

  const readinessService = new ReadinessService({
    repository,
    now: () => new Date("2026-11-06T10:00:00.000Z"),
  });

  const readinessGateway: MaintenanceReadinessGateway = {
    syncFlatReadiness: async (flatId: FlatId) => {
      const current = await readinessService.getReadiness(flatId);
      await readinessService.recomputeReadiness({
        flatId,
        cleaningStatus: current?.cleaningStatus ?? "ready",
        linenStatus: current?.linenStatus ?? "ready",
      });
    },
  };

  let sequence = 0;
  const service = new MaintenanceIssueService({
    repository,
    now: () => new Date("2026-11-06T10:00:00.000Z"),
    createId: (prefix) => {
      sequence += 1;
      return `${prefix}_${String(sequence).padStart(3, "0")}`;
    },
    readinessGateway,
  });

  return {
    service,
    readinessService,
  };
}

async function testCreateMaintenanceIssue(): Promise<void> {
  const { service } = createHarness();

  const created = await service.createIssue({
    flatId: "mayfair",
    inventoryItemId: "item_tv",
    title: "TV intermittently blank screen",
    notes: "Observed during post-checkout inspection",
    severity: "important",
  });

  assert.equal(created.status, "open");
  assert.equal(created.severity, "important");
  assert.equal(created.inventoryItemId, "item_tv");
}

async function testUpdateMaintenanceIssueStatus(): Promise<void> {
  const { service } = createHarness();

  const created = await service.createIssue({
    flatId: "mayfair",
    inventoryItemId: null,
    title: "Bathroom leak",
    notes: null,
    severity: "important",
  });

  const updated = await service.updateIssueStatus({
    issueId: created.id,
    status: "in_progress",
    notes: "Technician assigned",
  });

  assert.equal(updated.status, "in_progress");
  assert.equal(updated.notes, "Technician assigned");
}

async function testResolveMaintenanceIssue(): Promise<void> {
  const { service } = createHarness();

  const created = await service.createIssue({
    flatId: "mayfair",
    inventoryItemId: null,
    title: "Water heater issue",
    notes: null,
    severity: "critical",
  });

  const resolved = await service.resolveIssue({
    issueId: created.id,
    resolutionNote: "Element replaced and tested",
  });

  assert.equal(resolved.status, "resolved");
  assert.ok(resolved.resolvedAt);
  assert.equal(resolved.notes, "Element replaced and tested");
}

async function testReadinessChangesWithActiveAndResolvedIssue(): Promise<void> {
  const { service, readinessService } = createHarness();

  const baseline = await readinessService.recomputeReadiness({
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
  });
  assert.equal(baseline.readinessStatus, "ready");

  const created = await service.createIssue({
    flatId: "mayfair",
    inventoryItemId: "item_tv",
    title: "Critical AC outage",
    notes: "Primary cooling failed",
    severity: "critical",
  });

  const duringIssue = await readinessService.getReadiness("mayfair");
  assert.equal(duringIssue?.maintenanceStatus, "blocked");
  assert.equal(duringIssue?.readinessStatus, "out_of_service");

  await service.resolveIssue({
    issueId: created.id,
    resolutionNote: "Cooling restored",
  });

  const afterResolution = await readinessService.getReadiness("mayfair");
  assert.equal(afterResolution?.maintenanceStatus, "ready");
  assert.equal(afterResolution?.readinessStatus, "ready");
}

async function run(): Promise<void> {
  await testCreateMaintenanceIssue();
  await testUpdateMaintenanceIssueStatus();
  await testResolveMaintenanceIssue();
  await testReadinessChangesWithActiveAndResolvedIssue();

  console.log("maintenance-issue-service: ok");
}

void run();
