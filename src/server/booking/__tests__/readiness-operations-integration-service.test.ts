import assert from "node:assert/strict";

import { CalendarAvailabilityService } from "../calendar-availability-service";
import {
  ReadinessOperationsIntegrationService,
  type ReadinessOperationsIntegrationRepository,
} from "../readiness-operations-integration-service";
import type { FlatId } from "../../../types/booking";
import type { AvailabilityBlockRecord, FlatReadinessRecord } from "../../../types/booking-backend";

class InMemoryReadinessOperationsRepository implements ReadinessOperationsIntegrationRepository {
  private readonly readiness = new Map<FlatId, FlatReadinessRecord>();
  private readonly blocks = new Map<string, AvailabilityBlockRecord>();

  constructor(args: { readiness: FlatReadinessRecord[]; blocks?: AvailabilityBlockRecord[] }) {
    for (const entry of args.readiness) {
      this.readiness.set(entry.flatId, { ...entry });
    }

    for (const block of args.blocks ?? []) {
      this.blocks.set(block.id, { ...block });
    }
  }

  async findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    const found = this.readiness.get(flatId);
    return found ? { ...found } : null;
  }

  async findBySource(
    sourceType: AvailabilityBlockRecord["sourceType"],
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null> {
    for (const block of this.blocks.values()) {
      if (block.sourceType === sourceType && block.sourceId === sourceId) {
        return { ...block };
      }
    }

    return null;
  }

  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.blocks.set(block.id, { ...block });
    return { ...block };
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.blocks.set(block.id, { ...block });
    return { ...block };
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    return Array.from(this.blocks.values())
      .filter((block) => block.flatId === flatId)
      .map((block) => ({ ...block }));
  }

  setReadiness(record: FlatReadinessRecord): void {
    this.readiness.set(record.flatId, { ...record });
  }
}

function createReadiness(overrides?: Partial<FlatReadinessRecord>): FlatReadinessRecord {
  return {
    flatId: "mayfair",
    cleaningStatus: "ready",
    linenStatus: "ready",
    consumablesStatus: "ready",
    maintenanceStatus: "ready",
    criticalAssetStatus: "ready",
    readinessStatus: "ready",
    overrideStatus: null,
    overrideReason: null,
    updatedAt: "2026-11-10T09:00:00.000Z",
    ...overrides,
  };
}

function createHarness(args?: { readiness?: FlatReadinessRecord; blocks?: AvailabilityBlockRecord[] }) {
  const repository = new InMemoryReadinessOperationsRepository({
    readiness: [args?.readiness ?? createReadiness()],
    blocks: args?.blocks ?? [],
  });

  const service = new ReadinessOperationsIntegrationService({
    repository,
    now: () => new Date("2026-11-10T10:00:00.000Z"),
    createId: (prefix: "readiness_block") => `${prefix}_001`,
  });

  const calendar = new CalendarAvailabilityService({
    repository,
    now: () => new Date("2026-11-10T10:00:00.000Z"),
  });

  return {
    repository,
    service,
    calendar,
  };
}

async function testCriticalReadinessCanAutoCreateOperationalBlock(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness({
      maintenanceStatus: "blocked",
      readinessStatus: "out_of_service",
    }),
  });

  const result = await service.syncOperationalReadiness({
    flatId: "mayfair",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
    createdBy: "ops_system",
  });

  assert.equal(result.actionRequired, true);
  assert.equal(result.shouldRecommendManualBlock, true);
  assert.equal(result.autoBlockAction, "created");
  assert.ok(result.block);
  assert.equal(result.block?.status, "active");
  assert.equal(result.block?.sourceType, "manual");
}

async function testNeedsAttentionDoesNotIncorrectlyBlock(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness({
      consumablesStatus: "attention_required",
      readinessStatus: "needs_attention",
    }),
  });

  const result = await service.syncOperationalReadiness({
    flatId: "mayfair",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
  });

  assert.equal(result.actionRequired, true);
  assert.equal(result.shouldRecommendManualBlock, false);
  assert.equal(result.autoBlockAction, "none");
  assert.equal(result.block, null);
}

async function testOutOfServiceRecommendationWithoutAutoBlockForNonCriticalTrigger(): Promise<void> {
  const { service } = createHarness({
    readiness: createReadiness({
      readinessStatus: "out_of_service",
      maintenanceStatus: "ready",
      criticalAssetStatus: "ready",
      overrideStatus: "out_of_service",
      overrideReason: "Ops manager override pending inspection",
    }),
  });

  const result = await service.syncOperationalReadiness({
    flatId: "mayfair",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
  });

  assert.equal(result.actionRequired, true);
  assert.equal(result.shouldRecommendManualBlock, true);
  assert.equal(result.autoBlockAction, "none");
}

async function testResolvingCriticalIssueReleasesAutoBlockAndRestoresAvailability(): Promise<void> {
  const { service, repository, calendar } = createHarness({
    readiness: createReadiness({
      criticalAssetStatus: "blocked",
      readinessStatus: "out_of_service",
    }),
  });

  await service.syncOperationalReadiness({
    flatId: "mayfair",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
  });

  const blocked = await calendar.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-11-21",
    checkOut: "2026-11-23",
  });
  assert.equal(blocked.isAvailable, false);

  repository.setReadiness(
    createReadiness({
      readinessStatus: "ready",
      criticalAssetStatus: "ready",
    })
  );

  const result = await service.syncOperationalReadiness({
    flatId: "mayfair",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
  });

  assert.equal(result.autoBlockAction, "released");

  const restored = await calendar.checkProposedStayAvailability({
    flatId: "mayfair",
    checkIn: "2026-11-21",
    checkOut: "2026-11-23",
  });
  assert.equal(restored.isAvailable, true);
}

async function run(): Promise<void> {
  await testCriticalReadinessCanAutoCreateOperationalBlock();
  await testNeedsAttentionDoesNotIncorrectlyBlock();
  await testOutOfServiceRecommendationWithoutAutoBlockForNonCriticalTrigger();
  await testResolvingCriticalIssueReleasesAutoBlockAndRestoresAvailability();

  console.log("readiness-operations-integration-service: ok");
}

void run();
