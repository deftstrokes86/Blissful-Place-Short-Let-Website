import { randomUUID } from "node:crypto";

import { parseIsoDate } from "../../lib/booking-pricing";
import type { FlatId, ISODateString, ReservationStatus } from "../../types/booking";
import type {
  AvailabilityBlockRecord,
  AvailabilityBlockSourceType,
  ManualAvailabilityBlockType,
} from "../../types/booking-backend";

export const AVAILABILITY_BLOCK_TIMEZONE = "Africa/Lagos";

const BLOCKING_TRANSFER_STATUSES: readonly ReservationStatus[] = [
  "pending_transfer_submission",
  "awaiting_transfer_verification",
];

interface BlockPlan {
  blockType: AvailabilityBlockRecord["blockType"];
  expiresAt: string | null;
}

export interface AvailabilityBlockingReservation {
  id: string;
  status: ReservationStatus;
  stay: {
    flatId: FlatId;
    checkIn: ISODateString;
    checkOut: ISODateString;
  };
  transferHoldExpiresAt: string | null;
}

export interface AvailabilityOverlapInput {
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
}

export interface CreateManualAvailabilityBlockInput {
  flatId: FlatId;
  startDate: ISODateString;
  endDate: ISODateString;
  manualBlockType: ManualAvailabilityBlockType;
  reason: string;
  notes?: string | null;
  createdBy?: string | null;
  expiresAt?: string | null;
}

export interface AvailabilityBlockRepository {
  create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
  update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
  findBySource(sourceType: AvailabilityBlockSourceType, sourceId: string): Promise<AvailabilityBlockRecord | null>;
  listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]>;
}

interface AvailabilityBlockServiceDependencies {
  repository: AvailabilityBlockRepository;
  now?: () => Date;
  createId?: () => string;
}

function toIsoDate(value: string): string {
  return value.slice(0, 10);
}

function assertValidWindow(checkIn: ISODateString, checkOut: ISODateString): void {
  const start = parseIsoDate(checkIn);
  const end = parseIsoDate(checkOut);
  if (!start || !end || end <= start) {
    throw new Error("Invalid reservation date window. Check-out must be after check-in.");
  }
}

function assertValidExpiryTimestamp(expiresAt: string | null | undefined): void {
  if (!expiresAt) {
    return;
  }

  if (Number.isNaN(new Date(expiresAt).getTime())) {
    throw new Error("Invalid expiresAt timestamp.");
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeManualReason(reason: string): string {
  const normalized = normalizeOptionalText(reason);
  if (!normalized) {
    throw new Error("Manual block reason is required.");
  }

  return normalized;
}

function dateRangesOverlap(
  firstStartIso: string,
  firstEndIso: string,
  secondStartIso: string,
  secondEndIso: string
): boolean {
  const firstStart = parseIsoDate(toIsoDate(firstStartIso) as ISODateString);
  const firstEnd = parseIsoDate(toIsoDate(firstEndIso) as ISODateString);
  const secondStart = parseIsoDate(toIsoDate(secondStartIso) as ISODateString);
  const secondEnd = parseIsoDate(toIsoDate(secondEndIso) as ISODateString);

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) {
    return false;
  }

  // Check-in inclusive, check-out exclusive.
  return firstStart < secondEnd && secondStart < firstEnd;
}

function shouldRelease(status: ReservationStatus): boolean {
  return (
    status === "draft" ||
    status === "pending_online_payment" ||
    status === "pending_pos_coordination" ||
    status === "expired" ||
    status === "cancelled" ||
    status === "failed_payment"
  );
}

function planForStatus(status: ReservationStatus, transferHoldExpiresAt: string | null): BlockPlan | null {
  if (status === "confirmed") {
    return {
      blockType: "hard_block",
      expiresAt: null,
    };
  }

  if (BLOCKING_TRANSFER_STATUSES.includes(status)) {
    if (!transferHoldExpiresAt) {
      throw new Error("Transfer hold expiry is required for transfer availability blocks.");
    }

    return {
      blockType: "soft_hold",
      expiresAt: transferHoldExpiresAt,
    };
  }

  return null;
}

function isActive(block: AvailabilityBlockRecord, nowMs: number): boolean {
  if (block.status !== "active") {
    return false;
  }

  if (!block.expiresAt) {
    return true;
  }

  return new Date(block.expiresAt).getTime() > nowMs;
}

function matchesActiveProjection(
  existing: AvailabilityBlockRecord,
  reservation: AvailabilityBlockingReservation,
  plan: BlockPlan
): boolean {
  return (
    existing.status === "active" &&
    existing.flatId === reservation.stay.flatId &&
    existing.sourceType === "reservation" &&
    existing.sourceId === reservation.id &&
    existing.blockType === plan.blockType &&
    existing.manualBlockType === null &&
    existing.startDate === reservation.stay.checkIn &&
    existing.endDate === reservation.stay.checkOut &&
    existing.reason === null &&
    existing.notes === null &&
    existing.createdBy === null &&
    existing.expiresAt === plan.expiresAt &&
    existing.releasedAt === null
  );
}

export class AvailabilityBlockService {
  private readonly repository: AvailabilityBlockRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: AvailabilityBlockServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => `block_${randomUUID()}`);
  }

  async syncReservationBlock(reservation: AvailabilityBlockingReservation): Promise<AvailabilityBlockRecord | null> {
    const nowIso = this.nowProvider().toISOString();
    const existing = await this.repository.findBySource("reservation", reservation.id);
    const plan = planForStatus(reservation.status, reservation.transferHoldExpiresAt);

    if (plan === null || shouldRelease(reservation.status)) {
      if (!existing || existing.status === "released") {
        return null;
      }

      const released: AvailabilityBlockRecord = {
        ...existing,
        status: "released",
        releasedAt: nowIso,
        updatedAt: nowIso,
      };

      await this.repository.update(released);
      return null;
    }

    assertValidWindow(reservation.stay.checkIn, reservation.stay.checkOut);

    if (existing && matchesActiveProjection(existing, reservation, plan)) {
      return existing;
    }

    const nextBlock: AvailabilityBlockRecord = existing
      ? {
          ...existing,
          flatId: reservation.stay.flatId,
          blockType: plan.blockType,
          manualBlockType: null,
          startDate: reservation.stay.checkIn,
          endDate: reservation.stay.checkOut,
          reason: null,
          notes: null,
          createdBy: null,
          status: "active",
          expiresAt: plan.expiresAt,
          releasedAt: null,
          updatedAt: nowIso,
        }
      : {
          id: this.createId(),
          flatId: reservation.stay.flatId,
          sourceType: "reservation",
          sourceId: reservation.id,
          blockType: plan.blockType,
          manualBlockType: null,
          startDate: reservation.stay.checkIn,
          endDate: reservation.stay.checkOut,
          reason: null,
          notes: null,
          createdBy: null,
          status: "active",
          expiresAt: plan.expiresAt,
          releasedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

    if (existing) {
      return this.repository.update(nextBlock);
    }

    return this.repository.create(nextBlock);
  }

  async createManualBlock(input: CreateManualAvailabilityBlockInput): Promise<AvailabilityBlockRecord> {
    assertValidWindow(input.startDate, input.endDate);
    assertValidExpiryTimestamp(input.expiresAt);

    const nowIso = this.nowProvider().toISOString();
    const manualId = this.createId();

    const block: AvailabilityBlockRecord = {
      id: manualId,
      flatId: input.flatId,
      sourceType: "manual",
      sourceId: manualId,
      blockType: "hard_block",
      manualBlockType: input.manualBlockType,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: normalizeManualReason(input.reason),
      notes: normalizeOptionalText(input.notes),
      createdBy: normalizeOptionalText(input.createdBy),
      status: "active",
      expiresAt: input.expiresAt ?? null,
      releasedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return this.repository.create(block);
  }

  async releaseManualBlock(sourceId: string): Promise<AvailabilityBlockRecord> {
    const existing = await this.repository.findBySource("manual", sourceId);
    if (!existing) {
      throw new Error("Manual availability block not found.");
    }

    if (existing.status === "released") {
      return existing;
    }

    const nowIso = this.nowProvider().toISOString();
    const released: AvailabilityBlockRecord = {
      ...existing,
      status: "released",
      releasedAt: nowIso,
      updatedAt: nowIso,
    };

    return this.repository.update(released);
  }

  async findOverlappingActiveBlocks(input: AvailabilityOverlapInput): Promise<AvailabilityBlockRecord[]> {
    assertValidWindow(input.checkIn, input.checkOut);

    const nowMs = this.nowProvider().getTime();
    const blocks = await this.repository.listByFlat(input.flatId);

    return blocks.filter((block) => {
      if (!isActive(block, nowMs)) {
        return false;
      }

      return dateRangesOverlap(block.startDate, block.endDate, input.checkIn, input.checkOut);
    });
  }
}
