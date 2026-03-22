import { randomUUID } from "node:crypto";

import { parseIsoDate } from "../../lib/booking-pricing";
import type { FlatId, ISODateString } from "../../types/booking";
import type { AvailabilityBlockRecord, FlatReadinessRecord } from "../../types/booking-backend";

const AUTO_BLOCK_SOURCE_PREFIX = "readiness_auto";

export type ReadinessOperationalImpact = "warning_only" | "staff_action_needed" | "block_recommended";
export type ReadinessAutoBlockAction = "none" | "created" | "updated" | "released";

export interface ReadinessOperationsIntegrationRepository {
  findFlatReadiness(flatId: FlatId): Promise<FlatReadinessRecord | null>;
  findBySource(
    sourceType: AvailabilityBlockRecord["sourceType"],
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null>;
  create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
  update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
}

interface ReadinessOperationsIntegrationServiceDependencies {
  repository: ReadinessOperationsIntegrationRepository;
  now?: () => Date;
  createId?: (prefix: "readiness_block") => string;
}

export interface SyncOperationalReadinessInput {
  flatId: FlatId;
  startDate: ISODateString;
  endDate: ISODateString;
  createdBy?: string | null;
}

export interface SyncOperationalReadinessResult {
  flatId: FlatId;
  readinessStatus: FlatReadinessRecord["readinessStatus"];
  impact: ReadinessOperationalImpact;
  actionRequired: boolean;
  shouldRecommendManualBlock: boolean;
  autoBlockAction: ReadinessAutoBlockAction;
  block: AvailabilityBlockRecord | null;
  warnings: string[];
}

function toAutoSourceId(flatId: FlatId): string {
  return `${AUTO_BLOCK_SOURCE_PREFIX}_${flatId}`;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function assertValidWindow(startDate: ISODateString, endDate: ISODateString): void {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end <= start) {
    throw new Error("Invalid operational block window. End date must be after start date.");
  }
}

function isClearlyCritical(readiness: FlatReadinessRecord): boolean {
  return readiness.maintenanceStatus === "blocked" || readiness.criticalAssetStatus === "blocked";
}

function classifyImpact(readiness: FlatReadinessRecord): {
  impact: ReadinessOperationalImpact;
  actionRequired: boolean;
  recommendBlock: boolean;
  warnings: string[];
} {
  if (readiness.readinessStatus === "out_of_service") {
    return {
      impact: "block_recommended",
      actionRequired: true,
      recommendBlock: true,
      warnings: ["Flat is out of service. Booking should be operationally blocked."],
    };
  }

  if (readiness.readinessStatus === "needs_attention") {
    return {
      impact: "staff_action_needed",
      actionRequired: true,
      recommendBlock: false,
      warnings: ["Flat readiness needs attention. Staff review is required before normal operations."],
    };
  }

  return {
    impact: "warning_only",
    actionRequired: false,
    recommendBlock: false,
    warnings: [],
  };
}

function cloneBlock(record: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...record,
  };
}

export class ReadinessOperationsIntegrationService {
  private readonly repository: ReadinessOperationsIntegrationRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: (prefix: "readiness_block") => string;

  constructor(dependencies: ReadinessOperationsIntegrationServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? ((prefix) => `${prefix}_${randomUUID()}`);
  }

  async syncOperationalReadiness(input: SyncOperationalReadinessInput): Promise<SyncOperationalReadinessResult> {
    assertValidWindow(input.startDate, input.endDate);

    const readiness = await this.repository.findFlatReadiness(input.flatId);
    if (!readiness) {
      throw new Error("Flat readiness not found.");
    }

    const summary = classifyImpact(readiness);
    const sourceId = toAutoSourceId(input.flatId);
    const existing = await this.repository.findBySource("manual", sourceId);
    const nowIso = this.nowProvider().toISOString();

    let autoBlockAction: ReadinessAutoBlockAction = "none";
    let block: AvailabilityBlockRecord | null = null;

    const shouldAutoBlock = readiness.readinessStatus === "out_of_service" && isClearlyCritical(readiness);

    if (shouldAutoBlock) {
      const target: AvailabilityBlockRecord = existing
        ? {
            ...existing,
            flatId: input.flatId,
            sourceType: "manual",
            sourceId,
            blockType: "hard_block",
            manualBlockType: "maintenance",
            startDate: input.startDate,
            endDate: input.endDate,
            reason: "Auto operational block from critical readiness state.",
            notes: "Generated from readiness out_of_service (critical).",
            createdBy: normalizeOptionalText(input.createdBy) ?? "readiness_integration",
            status: "active",
            expiresAt: null,
            releasedAt: null,
            updatedAt: nowIso,
          }
        : {
            id: this.createId("readiness_block"),
            flatId: input.flatId,
            sourceType: "manual",
            sourceId,
            blockType: "hard_block",
            manualBlockType: "maintenance",
            startDate: input.startDate,
            endDate: input.endDate,
            reason: "Auto operational block from critical readiness state.",
            notes: "Generated from readiness out_of_service (critical).",
            createdBy: normalizeOptionalText(input.createdBy) ?? "readiness_integration",
            status: "active",
            expiresAt: null,
            releasedAt: null,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

      if (!existing) {
        autoBlockAction = "created";
        block = await this.repository.create(target);
      } else {
        const unchanged =
          existing.status === "active" &&
          existing.startDate === target.startDate &&
          existing.endDate === target.endDate &&
          existing.blockType === target.blockType &&
          existing.manualBlockType === target.manualBlockType &&
          existing.reason === target.reason &&
          existing.notes === target.notes;

        if (unchanged) {
          autoBlockAction = "none";
          block = cloneBlock(existing);
        } else {
          autoBlockAction = "updated";
          block = await this.repository.update(target);
        }
      }
    } else if (existing && existing.status === "active") {
      const released: AvailabilityBlockRecord = {
        ...existing,
        status: "released",
        releasedAt: nowIso,
        updatedAt: nowIso,
      };

      autoBlockAction = "released";
      block = await this.repository.update(released);
    }

    return {
      flatId: input.flatId,
      readinessStatus: readiness.readinessStatus,
      impact: summary.impact,
      actionRequired: summary.actionRequired,
      shouldRecommendManualBlock: summary.recommendBlock,
      autoBlockAction,
      block,
      warnings: summary.warnings,
    };
  }
}
