import { readBookingDatabase } from "../db/file-database";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../types/booking-backend";
import type { ReservationStatus } from "../../types/booking";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { OperationsQueryRepository } from "./operations-service";
import type { StaffOperationsQueryRepository } from "./staff-operations-service";

function cloneReservation(value: ReservationRepositoryReservation): ReservationRepositoryReservation {
  return {
    ...value,
    stay: {
      ...value.stay,
      extraIds: [...value.stay.extraIds],
    },
    guest: {
      ...value.guest,
    },
    pricing: {
      ...value.pricing,
    },
  };
}

function cloneTransferMetadata(
  value: TransferVerificationMetadataRecord
): TransferVerificationMetadataRecord {
  return {
    ...value,
  };
}

function clonePosMetadata(value: PosCoordinationMetadataRecord): PosCoordinationMetadataRecord {
  return {
    ...value,
  };
}

export class FileOperationsQueryRepository implements OperationsQueryRepository, StaffOperationsQueryRepository {
  async listReservationsByStatuses(
    statuses: readonly ReservationStatus[]
  ): Promise<ReservationRepositoryReservation[]> {
    const db = await readBookingDatabase();

    return db.reservations
      .filter((reservation) => statuses.includes(reservation.status))
      .map(cloneReservation);
  }

  async findReservationByToken(token: string): Promise<ReservationRepositoryReservation | null> {
    const db = await readBookingDatabase();
    const found = db.reservations.find((reservation) => reservation.token === token);

    return found ? cloneReservation(found) : null;
  }

  async findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null> {
    const db = await readBookingDatabase();

    const latest = db.transferVerifications
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? cloneTransferMetadata(latest) : null;
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const db = await readBookingDatabase();

    const latest = db.posCoordinations
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? clonePosMetadata(latest) : null;
  }
}

export const fileOperationsQueryRepository = new FileOperationsQueryRepository();
