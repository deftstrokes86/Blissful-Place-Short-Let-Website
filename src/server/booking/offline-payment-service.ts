import { randomUUID } from "node:crypto";

import type { AvailabilityCheckResult } from "./availability-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import { ReservationTransitionError, type ReservationService } from "./reservation-service";
import type {
  BookingActor,
  BookingToken,
  PaymentMethod,
} from "../../types/booking";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";

export interface OfflinePaymentMetadataRepository {
  createTransferMetadata(
    input: Omit<TransferVerificationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TransferVerificationMetadataRecord>;
  findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null>;
  updateTransferMetadata(
    id: string,
    patch: Partial<TransferVerificationMetadataRecord>
  ): Promise<TransferVerificationMetadataRecord>;

  createPosMetadata(
    input: Omit<PosCoordinationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<PosCoordinationMetadataRecord>;
  findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null>;
  updatePosMetadata(
    id: string,
    patch: Partial<PosCoordinationMetadataRecord>
  ): Promise<PosCoordinationMetadataRecord>;
}

export interface OfflinePaymentAvailabilityGateway {
  checkPreHoldReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: PaymentMethod
  ): Promise<AvailabilityCheckResult>;

  checkPreConfirmationReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: "transfer" | "pos"
  ): Promise<AvailabilityCheckResult>;
}

interface OfflinePaymentServiceDependencies {
  reservationService: Pick<
    ReservationService,
    "getReservationByToken" | "transitionReservation"
  >;
  metadataRepository: OfflinePaymentMetadataRepository;
  availabilityGateway: OfflinePaymentAvailabilityGateway;
  now?: () => Date;
}

export interface CreateTransferSubmissionInput {
  token: BookingToken;
  actor: BookingActor;
}

export interface SubmitTransferProofInput {
  token: BookingToken;
  transferReference: string;
  proofNote: string;
  actor: BookingActor;
  idempotencyKey?: string;
}

export interface VerifyTransferByStaffInput {
  token: BookingToken;
  staffId: string;
  verificationNote?: string;
}

export interface CreatePosCoordinationRequestInput {
  token: BookingToken;
  actor: BookingActor;
  contactWindow: string;
  note?: string;
  idempotencyKey?: string;
}

export interface ConfirmPosPaymentByStaffInput {
  token: BookingToken;
  staffId: string;
}

export interface TransferSubmissionResult {
  reservation: ReservationRepositoryReservation;
  availability: AvailabilityCheckResult;
}

export interface TransferProofResult {
  reservation: ReservationRepositoryReservation;
  transferMetadata: TransferVerificationMetadataRecord;
}

export interface TransferVerificationResult {
  reservation: ReservationRepositoryReservation;
  transferMetadata: TransferVerificationMetadataRecord;
  availability: AvailabilityCheckResult;
}

export interface PosCoordinationResult {
  reservation: ReservationRepositoryReservation;
  posMetadata: PosCoordinationMetadataRecord;
  availability: AvailabilityCheckResult;
}

export interface PosCompletionResult {
  reservation: ReservationRepositoryReservation;
  posMetadata: PosCoordinationMetadataRecord;
  availability: AvailabilityCheckResult;
}

function toIso(date: Date): string {
  return date.toISOString();
}

function ensureAvailable(result: AvailabilityCheckResult, stage: "pre-hold" | "pre-confirmation"): void {
  if (!result.isAvailable) {
    throw new Error(`${stage} availability recheck failed.`);
  }
}

function resolveTransferMetadataStatus(
  reservationStatus: ReservationRepositoryReservation["status"]
): TransferVerificationMetadataRecord["verificationStatus"] {
  if (reservationStatus === "awaiting_transfer_verification") {
    return "pending";
  }

  if (reservationStatus === "confirmed") {
    return "verified";
  }

  if (reservationStatus === "cancelled" || reservationStatus === "expired") {
    return "expired";
  }

  return "pending";
}

function createIdempotencyKey(provided?: string): string {
  return provided ?? `offline_${randomUUID()}`;
}

export class OfflinePaymentService {
  private readonly reservationService: OfflinePaymentServiceDependencies["reservationService"];
  private readonly metadataRepository: OfflinePaymentServiceDependencies["metadataRepository"];
  private readonly availabilityGateway: OfflinePaymentServiceDependencies["availabilityGateway"];
  private readonly nowProvider: () => Date;

  constructor(dependencies: OfflinePaymentServiceDependencies) {
    this.reservationService = dependencies.reservationService;
    this.metadataRepository = dependencies.metadataRepository;
    this.availabilityGateway = dependencies.availabilityGateway;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async createTransferSubmission(input: CreateTransferSubmissionInput): Promise<TransferSubmissionResult> {
    const reservation = await this.requireReservation(input.token);
    const availability = await this.availabilityGateway.checkPreHoldReservation(reservation, "transfer");

    ensureAvailable(availability, "pre-hold");

    const transitioned = await this.reservationService.transitionReservation({
      token: input.token,
      event: "branch_request_created",
      actor: input.actor,
      paymentMethod: "transfer",
      availabilityPassed: true,
    });

    return {
      reservation: transitioned,
      availability,
    };
  }

  async submitTransferProof(input: SubmitTransferProofInput): Promise<TransferProofResult> {
    const reservation = await this.requireReservation(input.token);
    if (reservation.status !== "pending_transfer_submission") {
      throw new Error("Transfer proof requires pending transfer submission status.");
    }

    const transitioned = await this.reservationService.transitionReservation({
      token: input.token,
      event: "transfer_proof_submitted",
      actor: input.actor,
      availabilityPassed: true,
    });

    const nowIso = toIso(this.nowProvider());
    const metadata = await this.metadataRepository.createTransferMetadata({
      reservationId: transitioned.id,
      transferReference: input.transferReference,
      proofNote: input.proofNote,
      proofReceivedAt: nowIso,
      verificationStatus: resolveTransferMetadataStatus(transitioned.status),
      verifiedByStaffId: null,
      verifiedAt: null,
      verificationNote: null,
      idempotencyKey: createIdempotencyKey(input.idempotencyKey),
    });

    return {
      reservation: transitioned,
      transferMetadata: metadata,
    };
  }

  async verifyTransferByStaff(input: VerifyTransferByStaffInput): Promise<TransferVerificationResult> {
    const reservation = await this.requireReservation(input.token);
    if (reservation.status !== "awaiting_transfer_verification") {
      throw new Error("Transfer verification requires awaiting transfer verification status.");
    }

    const latestMetadata = await this.metadataRepository.findLatestTransferMetadata(reservation.id);
    if (!latestMetadata) {
      throw new Error("Transfer proof metadata was not found for verification.");
    }

    const availability = await this.availabilityGateway.checkPreConfirmationReservation(reservation, "transfer");
    ensureAvailable(availability, "pre-confirmation");

    const transitioned = await this.reservationService.transitionReservation({
      token: input.token,
      event: "transfer_verified",
      actor: "staff",
      availabilityPassed: true,
    });

    const nowIso = toIso(this.nowProvider());
    const verificationStatus = resolveTransferMetadataStatus(transitioned.status);

    const updatedMetadata = await this.metadataRepository.updateTransferMetadata(latestMetadata.id, {
      verificationStatus,
      verificationNote: input.verificationNote ?? latestMetadata.verificationNote,
      verifiedByStaffId: verificationStatus === "verified" ? input.staffId : latestMetadata.verifiedByStaffId,
      verifiedAt: verificationStatus === "verified" ? nowIso : latestMetadata.verifiedAt,
    });

    return {
      reservation: transitioned,
      transferMetadata: updatedMetadata,
      availability,
    };
  }

  async createPosCoordinationRequest(input: CreatePosCoordinationRequestInput): Promise<PosCoordinationResult> {
    const reservation = await this.requireReservation(input.token);
    const availability = await this.availabilityGateway.checkPreHoldReservation(reservation, "pos");

    ensureAvailable(availability, "pre-hold");

    const transitioned = await this.reservationService.transitionReservation({
      token: input.token,
      event: "branch_request_created",
      actor: input.actor,
      paymentMethod: "pos",
      availabilityPassed: true,
    });

    const nowIso = toIso(this.nowProvider());
    const posMetadata = await this.metadataRepository.createPosMetadata({
      reservationId: transitioned.id,
      contactWindow: input.contactWindow,
      coordinationNote: input.note ?? null,
      status: "requested",
      requestedAt: nowIso,
      completedAt: null,
      completedByStaffId: null,
      idempotencyKey: createIdempotencyKey(input.idempotencyKey),
    });

    return {
      reservation: transitioned,
      posMetadata,
      availability,
    };
  }

  async confirmPosPaymentByStaff(input: ConfirmPosPaymentByStaffInput): Promise<PosCompletionResult> {
    const reservation = await this.requireReservation(input.token);
    if (reservation.status !== "pending_pos_coordination") {
      throw new Error("POS completion requires pending POS coordination status.");
    }

    const latestPosMetadata = await this.metadataRepository.findLatestPosMetadata(reservation.id);
    if (!latestPosMetadata) {
      throw new Error("POS coordination metadata was not found for completion.");
    }

    const availability = await this.availabilityGateway.checkPreConfirmationReservation(reservation, "pos");
    ensureAvailable(availability, "pre-confirmation");

    const transitioned = await this.reservationService.transitionReservation({
      token: input.token,
      event: "pos_payment_completed",
      actor: "staff",
      availabilityPassed: true,
    });

    if (transitioned.status !== "confirmed") {
      throw new ReservationTransitionError("POS payment completion did not produce a confirmed reservation.");
    }

    const nowIso = toIso(this.nowProvider());
    const updatedPosMetadata = await this.metadataRepository.updatePosMetadata(latestPosMetadata.id, {
      status: "completed",
      completedByStaffId: input.staffId,
      completedAt: nowIso,
    });

    return {
      reservation: transitioned,
      posMetadata: updatedPosMetadata,
      availability,
    };
  }

  private async requireReservation(token: BookingToken): Promise<ReservationRepositoryReservation> {
    const reservation = await this.reservationService.getReservationByToken(token);
    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    return reservation;
  }
}
