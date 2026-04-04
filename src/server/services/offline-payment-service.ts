// Legacy file-backed implementation retained for migration/reference only.
// Active runtime routes use the Prisma-backed services under src/server/booking/*.

import { createDatabaseId, withBookingDatabase } from "@/server/db/file-database";
import { executeWithIdempotency } from "@/server/services/idempotency-service";
import { reservationDomainService } from "@/server/services/reservation-domain-service";
import type { BookingToken } from "@/types/booking";
import type {
  PosCoordinationMetadataRecord,
  ReservationRecord,
  TransferVerificationMetadataRecord,
} from "@/types/booking-backend";

function nowIso(): string {
  return new Date().toISOString();
}

interface SubmitTransferProofInput {
  token: BookingToken;
  transferReference: string;
  proofNote: string;
  idempotencyKey: string;
}

interface VerifyTransferInput {
  token: BookingToken;
  staffId: string;
  verificationNote?: string;
  idempotencyKey: string;
}

interface SubmitPosRequestInput {
  token: BookingToken;
  contactWindow: string;
  note?: string;
  idempotencyKey: string;
}

interface ConfirmPosPaymentInput {
  token: BookingToken;
  staffId: string;
  idempotencyKey: string;
}

function toTransferStatus(
  reservationStatus: ReservationRecord["status"]
): TransferVerificationMetadataRecord["verificationStatus"] {
  if (reservationStatus === "awaiting_transfer_verification") {
    return "pending";
  }

  if (reservationStatus === "confirmed") {
    return "verified";
  }

  return "expired";
}

export class OfflinePaymentService {
  async submitTransferProof(input: SubmitTransferProofInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "offline.transfer.submit_proof",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.getReservationByToken(input.token);
        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        if (reservation.status !== "pending_transfer_submission") {
          throw new Error("Transfer proof can only be submitted while reservation is pending transfer submission.");
        }

        const transitioned = await reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "transfer_proof_submitted",
          actor: "guest",
          availabilityPassed: true,
          metadata: {
            transferReference: input.transferReference,
          },
        });

        const createdAt = nowIso();
        const record: TransferVerificationMetadataRecord = {
          id: createDatabaseId("trf"),
          reservationId: reservation.id,
          transferReference: input.transferReference,
          proofNote: input.proofNote,
          proofReceivedAt: createdAt,
          verificationStatus: toTransferStatus(transitioned.status),
          verifiedByStaffId: null,
          verifiedAt: null,
          verificationNote: null,
          idempotencyKey: input.idempotencyKey,
          createdAt,
          updatedAt: createdAt,
        };

        await withBookingDatabase(async (db) => {
          db.transferVerifications.push(record);
        });

        return transitioned;
      },
    });
  }

  async verifyTransfer(input: VerifyTransferInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "offline.transfer.verify",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.getReservationByToken(input.token);
        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        if (reservation.status !== "awaiting_transfer_verification") {
          throw new Error("Transfer can only be verified while awaiting transfer verification.");
        }

        const transitioned = await reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "transfer_verified",
          actor: "staff",
          metadata: {
            verifiedByStaffId: input.staffId,
          },
        });

        await withBookingDatabase(async (db) => {
          const pending = db.transferVerifications
            .filter((item) => item.reservationId === reservation.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

          if (!pending) {
            throw new Error("No transfer proof metadata found for verification.");
          }

          pending.verificationStatus = toTransferStatus(transitioned.status);
          pending.verificationNote = input.verificationNote ?? null;
          pending.updatedAt = nowIso();

          if (transitioned.status === "confirmed") {
            pending.verifiedByStaffId = input.staffId;
            pending.verifiedAt = nowIso();
          }
        });

        return transitioned;
      },
    });
  }

  async submitPosCoordinationRequest(input: SubmitPosRequestInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "offline.pos.submit_request",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.getReservationByToken(input.token);
        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        if (reservation.status !== "pending_pos_coordination") {
          throw new Error("POS coordination request requires pending POS coordination status.");
        }

        await withBookingDatabase(async (db) => {
          const now = nowIso();
          const record: PosCoordinationMetadataRecord = {
            id: createDatabaseId("pos"),
            reservationId: reservation.id,
            contactWindow: input.contactWindow,
            coordinationNote: input.note ?? null,
            status: "requested",
            requestedAt: now,
            completedAt: null,
            completedByStaffId: null,
            idempotencyKey: input.idempotencyKey,
            createdAt: now,
            updatedAt: now,
          };

          db.posCoordinations.push(record);
        });

        return reservation;
      },
    });
  }

  async confirmPosPayment(input: ConfirmPosPaymentInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "offline.pos.confirm_payment",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.getReservationByToken(input.token);
        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        if (reservation.status !== "pending_pos_coordination") {
          throw new Error("POS confirmation requires pending POS coordination status.");
        }

        const transitioned = await reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "pos_payment_completed",
          actor: "staff",
          metadata: {
            completedByStaffId: input.staffId,
          },
        });

        await withBookingDatabase(async (db) => {
          const pending = db.posCoordinations
            .filter((item) => item.reservationId === reservation.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

          if (!pending) {
            throw new Error("No POS coordination request found.");
          }

          pending.status = transitioned.status === "confirmed" ? "completed" : "requested";
          pending.completedAt = transitioned.status === "confirmed" ? nowIso() : null;
          pending.completedByStaffId = transitioned.status === "confirmed" ? input.staffId : null;
          pending.updatedAt = nowIso();
        });

        return transitioned;
      },
    });
  }
}

export const offlinePaymentService = new OfflinePaymentService();


