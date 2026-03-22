import {
  createFlatReadinessRecord,
  ensureFlatReadinessStatus,
  ensureReadinessComponentStatus,
} from "../booking/inventory-domain";
import type {
  FlatInventoryRecord,
  FlatReadinessRecord,
  FlatReadinessStatus,
  FlatRecord,
  InventoryItemRecord,
  MaintenanceIssueRecord,
  ReadinessComponentStatus,
} from "../../types/booking-backend";
import type { FlatId } from "../../types/booking";

export interface FlatInventorySignal {
  inventory: FlatInventoryRecord;
  item: InventoryItemRecord;
}

export interface ReadinessRepository {
  findFlatById(flatId: FlatId): Promise<FlatRecord | null>;
  listFlatInventorySignals(flatId: FlatId): Promise<FlatInventorySignal[]>;
  listMaintenanceIssues(flatId: FlatId): Promise<MaintenanceIssueRecord[]>;
  findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null>;
  upsertFlatReadiness(record: FlatReadinessRecord): Promise<FlatReadinessRecord>;
}

interface ReadinessServiceDependencies {
  repository: ReadinessRepository;
  now?: () => Date;
}

export interface RecomputeReadinessInput {
  flatId: FlatId;
  cleaningStatus: ReadinessComponentStatus;
  linenStatus: ReadinessComponentStatus;
  consumablesStatus?: ReadinessComponentStatus;
  maintenanceStatus?: ReadinessComponentStatus;
  criticalAssetStatus?: ReadinessComponentStatus;
}

export interface SetManualOverrideInput {
  flatId: FlatId;
  overrideStatus: FlatReadinessStatus;
  reason: string;
}

const COMPONENT_STATUS_RANK: Record<ReadinessComponentStatus, number> = {
  ready: 0,
  attention_required: 1,
  blocked: 2,
};

function maxComponentStatus(
  first: ReadinessComponentStatus,
  second: ReadinessComponentStatus
): ReadinessComponentStatus {
  return COMPONENT_STATUS_RANK[first] >= COMPONENT_STATUS_RANK[second] ? first : second;
}

function deriveOverallReadiness(statuses: readonly ReadinessComponentStatus[]): FlatReadinessStatus {
  if (statuses.some((status) => status === "blocked")) {
    return "out_of_service";
  }

  if (statuses.some((status) => status === "attention_required")) {
    return "needs_attention";
  }

  return "ready";
}

function severityToComponentStatus(
  severity: MaintenanceIssueRecord["severity"]
): ReadinessComponentStatus {
  if (severity === "critical") {
    return "blocked";
  }

  if (severity === "important") {
    return "attention_required";
  }

  return "ready";
}

function isActiveMaintenanceIssue(status: MaintenanceIssueRecord["status"]): boolean {
  return status === "open" || status === "in_progress";
}

function normalizeRequiredReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized) {
    throw new Error("Manual override reason is required.");
  }

  return normalized;
}

function hasStoredOverride(record: FlatReadinessRecord | null): boolean {
  if (!record?.overrideStatus) {
    return false;
  }

  return Boolean(record.overrideReason && record.overrideReason.trim().length > 0);
}

function isNonOkCondition(condition: FlatInventoryRecord["conditionStatus"]): boolean {
  return condition === "missing" || condition === "damaged" || condition === "needs_replacement";
}

export class ReadinessService {
  private readonly repository: ReadinessRepository;
  private readonly nowProvider: () => Date;

  constructor(dependencies: ReadinessServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async recomputeReadiness(input: RecomputeReadinessInput): Promise<FlatReadinessRecord> {
    const flat = await this.repository.findFlatById(input.flatId);
    if (!flat) {
      throw new Error("Flat not found.");
    }

    const existing = await this.repository.findFlatReadiness(flat.id);

    const derived = await this.computeDerivedStatuses(flat.id, {
      cleaningStatus: ensureReadinessComponentStatus(input.cleaningStatus),
      linenStatus: ensureReadinessComponentStatus(input.linenStatus),
      consumablesStatus: ensureReadinessComponentStatus(input.consumablesStatus ?? "ready"),
      maintenanceStatus: ensureReadinessComponentStatus(input.maintenanceStatus ?? "ready"),
      criticalAssetStatus: ensureReadinessComponentStatus(input.criticalAssetStatus ?? "ready"),
    });

    const overrideStatus = hasStoredOverride(existing) ? existing?.overrideStatus ?? null : null;
    const overrideReason = hasStoredOverride(existing) ? existing?.overrideReason ?? null : null;

    const record = createFlatReadinessRecord({
      flatId: flat.id,
      cleaningStatus: derived.cleaningStatus,
      linenStatus: derived.linenStatus,
      consumablesStatus: derived.consumablesStatus,
      maintenanceStatus: derived.maintenanceStatus,
      criticalAssetStatus: derived.criticalAssetStatus,
      readinessStatus: overrideStatus ?? derived.computedReadiness,
      overrideStatus,
      overrideReason,
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.upsertFlatReadiness(record);
  }

  async setManualOverride(input: SetManualOverrideInput): Promise<FlatReadinessRecord> {
    const existing = await this.repository.findFlatReadiness(input.flatId);
    if (!existing) {
      throw new Error("Readiness baseline not computed yet.");
    }

    const overrideStatus = ensureFlatReadinessStatus(input.overrideStatus);
    const overrideReason = normalizeRequiredReason(input.reason);

    const updated = createFlatReadinessRecord({
      ...existing,
      readinessStatus: overrideStatus,
      overrideStatus,
      overrideReason,
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.upsertFlatReadiness(updated);
  }

  async clearManualOverride(flatId: FlatId): Promise<FlatReadinessRecord> {
    const existing = await this.repository.findFlatReadiness(flatId);
    if (!existing) {
      throw new Error("Readiness baseline not computed yet.");
    }

    const derived = await this.computeDerivedStatuses(flatId, {
      cleaningStatus: existing.cleaningStatus,
      linenStatus: existing.linenStatus,
      consumablesStatus: existing.consumablesStatus,
      maintenanceStatus: existing.maintenanceStatus,
      criticalAssetStatus: existing.criticalAssetStatus,
    });

    const restored = createFlatReadinessRecord({
      flatId,
      cleaningStatus: derived.cleaningStatus,
      linenStatus: derived.linenStatus,
      consumablesStatus: derived.consumablesStatus,
      maintenanceStatus: derived.maintenanceStatus,
      criticalAssetStatus: derived.criticalAssetStatus,
      readinessStatus: derived.computedReadiness,
      overrideStatus: null,
      overrideReason: null,
      updatedAt: this.nowProvider().toISOString(),
    });

    return this.repository.upsertFlatReadiness(restored);
  }

  async getReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null> {
    return this.repository.findFlatReadiness(flatId);
  }

  private async computeDerivedStatuses(
    flatId: FlatId,
    base: {
      cleaningStatus: ReadinessComponentStatus;
      linenStatus: ReadinessComponentStatus;
      consumablesStatus: ReadinessComponentStatus;
      maintenanceStatus: ReadinessComponentStatus;
      criticalAssetStatus: ReadinessComponentStatus;
    }
  ): Promise<{
    cleaningStatus: ReadinessComponentStatus;
    linenStatus: ReadinessComponentStatus;
    consumablesStatus: ReadinessComponentStatus;
    maintenanceStatus: ReadinessComponentStatus;
    criticalAssetStatus: ReadinessComponentStatus;
    computedReadiness: FlatReadinessStatus;
  }> {
    const inventorySignals = await this.repository.listFlatInventorySignals(flatId);
    const maintenanceIssues = await this.repository.listMaintenanceIssues(flatId);

    let consumablesDerived: ReadinessComponentStatus = "ready";
    let criticalAssetsDerived: ReadinessComponentStatus = "ready";

    for (const signal of inventorySignals) {
      if (signal.item.category === "consumable") {
        if (signal.inventory.expectedQuantity > 0 && signal.inventory.currentQuantity < signal.inventory.expectedQuantity) {
          consumablesDerived = maxComponentStatus(consumablesDerived, "attention_required");
        }

        if (isNonOkCondition(signal.inventory.conditionStatus)) {
          consumablesDerived = maxComponentStatus(consumablesDerived, "attention_required");
        }
      }

      if (signal.item.category === "asset" && signal.item.criticality === "critical") {
        if (signal.inventory.currentQuantity <= 0 || isNonOkCondition(signal.inventory.conditionStatus)) {
          criticalAssetsDerived = maxComponentStatus(criticalAssetsDerived, "blocked");
          continue;
        }

        if (signal.inventory.expectedQuantity > 0 && signal.inventory.currentQuantity < signal.inventory.expectedQuantity) {
          criticalAssetsDerived = maxComponentStatus(criticalAssetsDerived, "attention_required");
        }
      }
    }

    let maintenanceDerived: ReadinessComponentStatus = "ready";
    for (const issue of maintenanceIssues) {
      if (!isActiveMaintenanceIssue(issue.status)) {
        continue;
      }

      maintenanceDerived = maxComponentStatus(maintenanceDerived, severityToComponentStatus(issue.severity));
    }

    const consumablesStatus = maxComponentStatus(base.consumablesStatus, consumablesDerived);
    const maintenanceStatus = maxComponentStatus(base.maintenanceStatus, maintenanceDerived);
    const criticalAssetStatus = maxComponentStatus(base.criticalAssetStatus, criticalAssetsDerived);

    const computedReadiness = deriveOverallReadiness([
      base.cleaningStatus,
      base.linenStatus,
      consumablesStatus,
      maintenanceStatus,
      criticalAssetStatus,
    ]);

    return {
      cleaningStatus: base.cleaningStatus,
      linenStatus: base.linenStatus,
      consumablesStatus,
      maintenanceStatus,
      criticalAssetStatus,
      computedReadiness,
    };
  }
}

