import type { FlatId, ISODateString, ReservationStatus } from "../../types/booking";
import type {
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

function isTransferQueueStatus(
  status: ReservationStatus
): status is "pending_transfer_submission" | "awaiting_transfer_verification" {
  return status === "pending_transfer_submission" || status === "awaiting_transfer_verification";
}

function toHoldExpired(holdExpiresAt: string | null, nowMs: number): boolean {
  if (!holdExpiresAt) {
    return false;
  }

  return new Date(holdExpiresAt).getTime() <= nowMs;
}

function buildGuestName(reservation: ReservationRepositoryReservation): string {
  const fullName = `${reservation.guest.firstName} ${reservation.guest.lastName}`.trim();
  return fullName.length > 0 ? fullName : "Guest";
}

export interface StaffOperationsQueryRepository {
  listReservationsByStatuses(statuses: readonly ReservationStatus[]): Promise<ReservationRepositoryReservation[]>;
  findReservationByToken(token: string): Promise<ReservationRepositoryReservation | null>;
  findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null>;
  findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null>;
}

export interface StaffOperationsIdempotencyGateway {
  run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    reservationId?: string | null;
    execute: () => Promise<TResult>;
  }): Promise<TResult>;
}

interface StaffOperationsServiceDependencies {
  queryRepository: StaffOperationsQueryRepository;
  idempotencyGateway: StaffOperationsIdempotencyGateway;
  offlinePaymentService: Pick<OfflinePaymentService, "verifyTransferByStaff" | "confirmPosPaymentByStaff">;
  reservationService: Pick<ReservationService, "transitionReservation">;
  now?: () => Date;
}

interface StaffGuestSnippet {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

export interface StaffTransferQueueItem extends StaffGuestSnippet {
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

export interface StaffPosQueueItem extends StaffGuestSnippet {
  reservationId: string;
  token: string;
  status: "pending_pos_coordination";
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  contactWindow: string | null;
  coordinationStatus: PosCoordinationMetadataRecord["status"] | null;
  requestedAt: string | null;
}

export interface VerifyTransferPaymentInput {
  token: string;
  staffId: string;
  verificationNote?: string;
  idempotencyKey: string;
}

export interface ConfirmPosPaymentInput {
  token: string;
  staffId: string;
  idempotencyKey: string;
}

export interface CancelReservationInput {
  token: string;
  idempotencyKey: string;
}

export interface StaffQueueSnapshot {
  transfer: StaffTransferQueueItem[];
  pos: StaffPosQueueItem[];
}

export class StaffOperationsService {
  private readonly queryRepository: StaffOperationsQueryRepository;
  private readonly idempotencyGateway: StaffOperationsIdempotencyGateway;
  private readonly offlinePaymentService: StaffOperationsServiceDependencies["offlinePaymentService"];
  private readonly reservationService: StaffOperationsServiceDependencies["reservationService"];
  private readonly nowProvider: () => Date;

  constructor(dependencies: StaffOperationsServiceDependencies) {
    this.queryRepository = dependencies.queryRepository;
    this.idempotencyGateway = dependencies.idempotencyGateway;
    this.offlinePaymentService = dependencies.offlinePaymentService;
    this.reservationService = dependencies.reservationService;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async listPendingTransferReservations(): Promise<StaffTransferQueueItem[]> {
    const nowMs = this.nowProvider().getTime();
    const reservations = await this.queryRepository.listReservationsByStatuses(TRANSFER_QUEUE_STATUSES);

    const queue: StaffTransferQueueItem[] = [];

    for (const reservation of reservations) {
      if (!isTransferQueueStatus(reservation.status)) {
        continue;
      }

      const metadata = await this.queryRepository.findLatestTransferMetadata(reservation.id);
      const holdExpiresAt = reservation.transferHoldExpiresAt;

      queue.push({
        reservationId: reservation.id,
        token: reservation.token,
        status: reservation.status,
        flatId: reservation.stay.flatId,
        checkIn: reservation.stay.checkIn,
        checkOut: reservation.stay.checkOut,
        guestName: buildGuestName(reservation),
        guestEmail: reservation.guest.email,
        guestPhone: reservation.guest.phone,
        holdExpiresAt,
        holdExpired: toHoldExpired(holdExpiresAt, nowMs),
        transferReference: metadata?.transferReference ?? null,
        proofReceivedAt: metadata?.proofReceivedAt ?? null,
        verificationStatus: metadata?.verificationStatus ?? null,
      });
    }

    return queue.sort(
      (left, right) =>
        (left.holdExpiresAt ?? "9999-12-31T23:59:59.999Z").localeCompare(
          right.holdExpiresAt ?? "9999-12-31T23:59:59.999Z"
        ) || left.reservationId.localeCompare(right.reservationId)
    );
  }

  async listPendingPosReservations(): Promise<StaffPosQueueItem[]> {
    const reservations = await this.queryRepository.listReservationsByStatuses(POS_QUEUE_STATUSES);

    const queue: StaffPosQueueItem[] = [];

    for (const reservation of reservations) {
      if (reservation.status !== "pending_pos_coordination") {
        continue;
      }

      const metadata = await this.queryRepository.findLatestPosMetadata(reservation.id);

      queue.push({
        reservationId: reservation.id,
        token: reservation.token,
        status: reservation.status,
        flatId: reservation.stay.flatId,
        checkIn: reservation.stay.checkIn,
        checkOut: reservation.stay.checkOut,
        guestName: buildGuestName(reservation),
        guestEmail: reservation.guest.email,
        guestPhone: reservation.guest.phone,
        contactWindow: metadata?.contactWindow ?? null,
        coordinationStatus: metadata?.status ?? null,
        requestedAt: metadata?.requestedAt ?? null,
      });
    }

    return queue.sort(
      (left, right) =>
        (left.requestedAt ?? "9999-12-31T23:59:59.999Z").localeCompare(
          right.requestedAt ?? "9999-12-31T23:59:59.999Z"
        ) || left.reservationId.localeCompare(right.reservationId)
    );
  }

  async listPendingQueues(): Promise<StaffQueueSnapshot> {
    const [transfer, pos] = await Promise.all([
      this.listPendingTransferReservations(),
      this.listPendingPosReservations(),
    ]);

    return {
      transfer,
      pos,
    };
  }

  async verifyTransferPayment(input: VerifyTransferPaymentInput) {
    const reservation = await this.requireReservation(input.token);
    if (reservation.status !== "awaiting_transfer_verification") {
      throw new Error("Transfer verification requires awaiting transfer verification status.");
    }

    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "staff.transfer.verify",
      reservationId: reservation.id,
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

  async confirmPosPayment(input: ConfirmPosPaymentInput) {
    const reservation = await this.requireReservation(input.token);
    if (reservation.status !== "pending_pos_coordination") {
      throw new Error("POS confirmation requires pending POS coordination status.");
    }

    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "staff.pos.confirm",
      reservationId: reservation.id,
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

  async cancelReservation(input: CancelReservationInput): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(input.token);

    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "staff.reservation.cancel",
      reservationId: reservation.id,
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

  private async requireReservation(token: string): Promise<ReservationRepositoryReservation> {
    const reservation = await this.queryRepository.findReservationByToken(token);

    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    return reservation;
  }
}
