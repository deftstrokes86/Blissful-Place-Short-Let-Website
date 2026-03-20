import type {
  ReservationStatus,
  FlatId,
} from "@/types/booking";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "@/types/booking-backend";

interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

export interface AdminTransferReservation {
  reservationId: string;
  token: string;
  status: "pending_transfer_submission" | "awaiting_transfer_verification";
  flatId: FlatId;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  holdExpiresAt: string | null;
  holdExpired: boolean;
  transferReference: string | null;
  proofReceivedAt: string | null;
  verificationStatus: TransferVerificationMetadataRecord["verificationStatus"] | null;
}

export interface AdminPosReservation {
  reservationId: string;
  token: string;
  status: "pending_pos_coordination";
  flatId: FlatId;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  contactWindow: string | null;
  coordinationStatus: PosCoordinationMetadataRecord["status"] | null;
  requestedAt: string | null;
}

export interface AdminReservationSnapshot {
  id: string;
  token: string;
  status: ReservationStatus;
  paymentMethod: "website" | "transfer" | "pos" | null;
  stay: {
    flatId: FlatId;
    checkIn: string;
    checkOut: string;
    guests: number;
    extraIds: string[];
  };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  pricing: {
    currency: "NGN";
    nightlyRate: number | null;
    nights: number | null;
    staySubtotal: number | null;
    extrasSubtotal: number;
    estimatedTotal: number | null;
  };
  transferHoldStartedAt: string | null;
  transferHoldExpiresAt: string | null;
  inventoryReopenedAt: string | null;
  lastAvailabilityResult: unknown;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function createFallbackId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return createFallbackId();
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export function createAdminIdempotencyKey(prefix: string): string {
  return `${prefix}-${createClientId()}`;
}

export async function fetchPendingTransferReservations(): Promise<AdminTransferReservation[]> {
  const response = await fetch("/api/operations/staff/transfers/pending", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ reservations: AdminTransferReservation[] }>(response);
  return payload.reservations;
}

export async function fetchPendingPosReservations(): Promise<AdminPosReservation[]> {
  const response = await fetch("/api/operations/staff/pos/pending", {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ reservations: AdminPosReservation[] }>(response);
  return payload.reservations;
}

export async function submitTransferVerification(input: {
  token: string;
  staffId: string;
  verificationNote?: string;
  idempotencyKey: string;
}): Promise<{ reservation: AdminReservationSnapshot; transferMetadata: TransferVerificationMetadataRecord }> {
  const response = await fetch("/api/operations/staff/transfers/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      token: input.token,
      staffId: input.staffId,
      verificationNote: input.verificationNote ?? null,
      idempotencyKey: input.idempotencyKey,
    }),
  });

  return readJsonResponse<{ reservation: AdminReservationSnapshot; transferMetadata: TransferVerificationMetadataRecord }>(
    response
  );
}

export async function submitPosConfirmation(input: {
  token: string;
  staffId: string;
  idempotencyKey: string;
}): Promise<{ reservation: AdminReservationSnapshot; posMetadata: PosCoordinationMetadataRecord }> {
  const response = await fetch("/api/operations/staff/pos/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      token: input.token,
      staffId: input.staffId,
      idempotencyKey: input.idempotencyKey,
    }),
  });

  return readJsonResponse<{ reservation: AdminReservationSnapshot; posMetadata: PosCoordinationMetadataRecord }>(
    response
  );
}

export async function submitReservationCancellation(input: {
  token: string;
  idempotencyKey: string;
}): Promise<{ reservation: AdminReservationSnapshot }> {
  const response = await fetch("/api/operations/staff/reservations/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      token: input.token,
      idempotencyKey: input.idempotencyKey,
    }),
  });

  return readJsonResponse<{ reservation: AdminReservationSnapshot }>(response);
}
