import { randomUUID } from "node:crypto";

import { parseIsoDate } from "../../lib/booking-pricing";
import type { FlatId, ISODateString, ReservationStatus } from "../../types/booking";
import type {
  AvailabilityBlockRecord,
  ManualAvailabilityBlockType,
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";
import type { OfflinePaymentService } from "./offline-payment-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { ReservationService } from "./reservation-service";

const TRANSFER_QUEUE_STATUSES: readonly ReservationStatus[] = [
  "pending_transfer_submission",
  "awaiting_transfer_verification",
];

const POS_QUEUE_STATUSES: readonly ReservationStatus[] = ["pending_pos_coordination"];

function nowIso(now: () => Date): string {
  return now().toISOString();
}

function assertValidAvailabilityBlockWindow(startDate: ISODateString, endDate: ISODateString): void {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end || end <= start) {
    throw new Error("Invalid availability block window. End date must be after start date.");
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

function assertValidExpiryTimestamp(expiresAt: string | null | undefined): void {
  if (!expiresAt) {
    return;
  }

  if (Number.isNaN(new Date(expiresAt).getTime())) {
    throw new Error("Invalid expiresAt timestamp.");
  }
}
function cloneAvailabilityBlock(record: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...record,
  };
}

export interface OperationsQueryRepository {
  listReservationsByStatuses(statuses: readonly ReservationStatus[]): Promise<ReservationRepositoryReservation[]>;
  findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null>;
  findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null>;
}

export interface OperationsAvailabilityBlockRepository {
  create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
  update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord>;
  findBySource(
    sourceType: AvailabilityBlockRecord["sourceType"],
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null>;
  listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]>;
}

export interface OperationsIdempotencyGateway {
  run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    reservationId?: string | null;
    execute: () => Promise<TResult>;
  }): Promise<TResult>;
}

interface OperationsServiceDependencies {
  queryRepository: OperationsQueryRepository;
  availabilityBlockRepository: OperationsAvailabilityBlockRepository;
  idempotencyGateway: OperationsIdempotencyGateway;
  offlinePaymentService: Pick<OfflinePaymentService, "verifyTransferByStaff" | "confirmPosPaymentByStaff">;
  reservationService: Pick<ReservationService, "transitionReservation">;
  now?: () => Date;
  createId?: () => string;
}

export interface StaffTransferQueueItem {
  reservationId: string;
  token: string;
  status: "pending_transfer_submission" | "awaiting_transfer_verification";
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  holdExpiresAt: string | null;
  holdExpired: boolean;
  transferReference: string | null;
  proofReceivedAt: string | null;
  verificationStatus: TransferVerificationMetadataRecord["verificationStatus"] | null;
}

export interface StaffPosQueueItem {
  reservationId: string;
  token: string;
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  contactWindow: string | null;
  coordinationStatus: PosCoordinationMetadataRecord["status"] | null;
  requestedAt: string | null;
}

export interface StaffQueueSnapshot {
  transfer: StaffTransferQueueItem[];
  pos: StaffPosQueueItem[];
}

export interface VerifyTransferByStaffInput {
  token: string;
  staffId: string;
  verificationNote?: string;
  idempotencyKey: string;
}

export interface ConfirmPosByStaffInput {
  token: string;
  staffId: string;
  idempotencyKey: string;
}

export interface CancelReservationByStaffInput {
  token: string;
  idempotencyKey: string;
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
  idempotencyKey: string;
}

export interface ReleaseManualAvailabilityBlockInput {
  sourceId: string;
  idempotencyKey: string;
}

export interface ListManualAvailabilityBlocksInput {
  flatId: FlatId;
  includeReleased?: boolean;
}

export class OperationsService {
  private readonly queryRepository: OperationsQueryRepository;
  private readonly availabilityBlockRepository: OperationsAvailabilityBlockRepository;
  private readonly idempotencyGateway: OperationsIdempotencyGateway;
  private readonly offlinePaymentService: Pick<
    OfflinePaymentService,
    "verifyTransferByStaff" | "confirmPosPaymentByStaff"
  >;
  private readonly reservationService: Pick<ReservationService, "transitionReservation">;
  private readonly nowProvider: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: OperationsServiceDependencies) {
    this.queryRepository = dependencies.queryRepository;
    this.availabilityBlockRepository = dependencies.availabilityBlockRepository;
    this.idempotencyGateway = dependencies.idempotencyGateway;
    this.offlinePaymentService = dependencies.offlinePaymentService;
    this.reservationService = dependencies.reservationService;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => `manual_${randomUUID()}`);
  }

  async listStaffQueues(): Promise<StaffQueueSnapshot> {
    const transferReservations = await this.queryRepository.listReservationsByStatuses(TRANSFER_QUEUE_STATUSES);
    const posReservations = await this.queryRepository.listReservationsByStatuses(POS_QUEUE_STATUSES);
    const nowMs = this.nowProvider().getTime();

    const transfer: StaffTransferQueueItem[] = [];
    for (const reservation of transferReservations) {
      if (reservation.status !== "pending_transfer_submission" && reservation.status !== "awaiting_transfer_verification") {
        continue;
      }

      const metadata = await this.queryRepository.findLatestTransferMetadata(reservation.id);
      const holdExpiresAt = reservation.transferHoldExpiresAt;
      const holdExpired = holdExpiresAt ? new Date(holdExpiresAt).getTime() <= nowMs : false;

      transfer.push({
        reservationId: reservation.id,
        token: reservation.token,
        status: reservation.status,
        flatId: reservation.stay.flatId,
        checkIn: reservation.stay.checkIn,
        checkOut: reservation.stay.checkOut,
        holdExpiresAt,
        holdExpired,
        transferReference: metadata?.transferReference ?? null,
        proofReceivedAt: metadata?.proofReceivedAt ?? null,
        verificationStatus: metadata?.verificationStatus ?? null,
      });
    }

    transfer.sort(
      (left, right) =>
        (left.holdExpiresAt ?? "9999-12-31T23:59:59.999Z").localeCompare(
          right.holdExpiresAt ?? "9999-12-31T23:59:59.999Z"
        ) || left.reservationId.localeCompare(right.reservationId)
    );

    const pos: StaffPosQueueItem[] = [];
    for (const reservation of posReservations) {
      const metadata = await this.queryRepository.findLatestPosMetadata(reservation.id);

      pos.push({
        reservationId: reservation.id,
        token: reservation.token,
        flatId: reservation.stay.flatId,
        checkIn: reservation.stay.checkIn,
        checkOut: reservation.stay.checkOut,
        contactWindow: metadata?.contactWindow ?? null,
        coordinationStatus: metadata?.status ?? null,
        requestedAt: metadata?.requestedAt ?? null,
      });
    }

    pos.sort(
      (left, right) =>
        (left.requestedAt ?? "9999-12-31T23:59:59.999Z").localeCompare(
          right.requestedAt ?? "9999-12-31T23:59:59.999Z"
        ) || left.reservationId.localeCompare(right.reservationId)
    );

    return {
      transfer,
      pos,
    };
  }

  async verifyTransferByStaff(input: VerifyTransferByStaffInput) {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "operations.transfer.verify",
      payload: {
        token: input.token,
        staffId: input.staffId,
        verificationNote: input.verificationNote ?? null,
      },
      execute: () =>
        this.offlinePaymentService.verifyTransferByStaff({
          token: input.token,
          staffId: input.staffId,
          verificationNote: input.verificationNote,
        }),
    });
  }

  async confirmPosPaymentByStaff(input: ConfirmPosByStaffInput) {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "operations.pos.confirm",
      payload: {
        token: input.token,
        staffId: input.staffId,
      },
      execute: () =>
        this.offlinePaymentService.confirmPosPaymentByStaff({
          token: input.token,
          staffId: input.staffId,
        }),
    });
  }

  async cancelReservationByStaff(input: CancelReservationByStaffInput): Promise<ReservationRepositoryReservation> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "operations.reservation.cancel",
      payload: {
        token: input.token,
      },
      execute: () =>
        this.reservationService.transitionReservation({
          token: input.token,
          event: "cancel_requested",
          actor: "staff",
        }),
    });
  }

  async createManualAvailabilityBlock(
    input: CreateManualAvailabilityBlockInput
  ): Promise<AvailabilityBlockRecord> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "operations.manual_block.create",
      payload: {
        flatId: input.flatId,
        startDate: input.startDate,
        endDate: input.endDate,
        manualBlockType: input.manualBlockType,
        reason: input.reason,
        notes: input.notes ?? null,
        createdBy: input.createdBy ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      execute: async () => {
        assertValidAvailabilityBlockWindow(input.startDate, input.endDate);
        assertValidExpiryTimestamp(input.expiresAt);

        const now = nowIso(this.nowProvider);
        const manualId = this.createId();

        const created: AvailabilityBlockRecord = {
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
          createdAt: now,
          updatedAt: now,
        };

        return this.availabilityBlockRepository.create(created);
      },
    });
  }

  async releaseManualAvailabilityBlock(
    input: ReleaseManualAvailabilityBlockInput
  ): Promise<AvailabilityBlockRecord> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "operations.manual_block.release",
      payload: {
        sourceId: input.sourceId,
      },
      execute: async () => {
        const existing = await this.availabilityBlockRepository.findBySource("manual", input.sourceId);
        if (!existing) {
          throw new Error("Manual availability block not found.");
        }

        if (existing.status === "released") {
          return cloneAvailabilityBlock(existing);
        }

        const released: AvailabilityBlockRecord = {
          ...existing,
          status: "released",
          releasedAt: nowIso(this.nowProvider),
          updatedAt: nowIso(this.nowProvider),
        };

        return this.availabilityBlockRepository.update(released);
      },
    });
  }

  async listManualAvailabilityBlocks(
    input: ListManualAvailabilityBlocksInput
  ): Promise<AvailabilityBlockRecord[]> {
    const blocks = await this.availabilityBlockRepository.listByFlat(input.flatId);

    return blocks
      .filter((block) => block.sourceType === "manual")
      .filter((block) => (input.includeReleased ? true : block.status === "active"))
      .map(cloneAvailabilityBlock)
      .sort(
        (left, right) =>
          left.startDate.localeCompare(right.startDate) ||
          left.endDate.localeCompare(right.endDate) ||
          left.id.localeCompare(right.id)
      );
  }
}











