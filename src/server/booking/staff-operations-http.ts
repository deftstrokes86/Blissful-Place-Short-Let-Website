import type { FlatId } from "../../types/booking";
import type { ManualAvailabilityBlockType } from "../../types/booking-backend";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { StaffOperationsService } from "./staff-operations-service";
import type { OperationsService } from "./operations-service";

const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const MANUAL_BLOCK_TYPES: readonly ManualAvailabilityBlockType[] = [
  "maintenance",
  "owner_blackout",
  "admin_block",
];

function normalizeRequiredString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const normalized = normalizeRequiredString(value);
  return normalized ?? null;
}

function normalizeIncludeReleased(value: string | null): boolean {
  return value === "true";
}

function normalizeFlatId(value: string | null): FlatId | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return FLAT_IDS.includes(normalized as FlatId) ? (normalized as FlatId) : null;
}

function normalizeManualBlockType(value: string | null): ManualAvailabilityBlockType | null {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return null;
  }

  return MANUAL_BLOCK_TYPES.includes(normalized as ManualAvailabilityBlockType)
    ? (normalized as ManualAvailabilityBlockType)
    : null;
}

function requireIdempotencyKey(value: string | null): string {
  const key = normalizeRequiredString(value);
  if (!key) {
    throw new Error("Idempotency key is required.");
  }

  return key;
}

function requireTokenAndStaffId(input: {
  token: string | null;
  staffId: string | null;
}): { token: string; staffId: string } {
  const token = normalizeRequiredString(input.token);
  const staffId = normalizeRequiredString(input.staffId);

  if (!token || !staffId) {
    throw new Error("Token and staffId are required.");
  }

  return {
    token,
    staffId,
  };
}

function requireToken(value: string | null): string {
  const token = normalizeRequiredString(value);

  if (!token) {
    throw new Error("Token is required.");
  }

  return token;
}

function requireManualSourceId(value: string | null): string {
  const sourceId = normalizeRequiredString(value);

  if (!sourceId) {
    throw new Error("Manual block sourceId is required.");
  }

  return sourceId;
}

export type StaffOperationsInterface = Pick<
  StaffOperationsService,
  | "listPendingTransferReservations"
  | "listPendingPosReservations"
  | "verifyTransferPayment"
  | "confirmPosPayment"
  | "cancelReservation"
>;

export type ManualBlockOperationsInterface = Pick<
  OperationsService,
  "listManualAvailabilityBlocks" | "createManualAvailabilityBlock" | "releaseManualAvailabilityBlock"
>;

export async function handleListPendingTransferReservationsRequest(service: StaffOperationsInterface) {
  const reservations = await service.listPendingTransferReservations();
  return { reservations };
}

export async function handleListPendingPosReservationsRequest(service: StaffOperationsInterface) {
  const reservations = await service.listPendingPosReservations();
  return { reservations };
}

export async function handleVerifyTransferPaymentRequest(
  service: StaffOperationsInterface,
  input: {
    token: string | null;
    staffId: string | null;
    verificationNote: string | null;
    idempotencyKey: string | null;
  }
) {
  const actor = requireTokenAndStaffId({
    token: input.token,
    staffId: input.staffId,
  });

  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);

  const result = await service.verifyTransferPayment({
    token: actor.token,
    staffId: actor.staffId,
    verificationNote: normalizeOptionalString(input.verificationNote) ?? undefined,
    idempotencyKey,
  });

  return {
    reservation: result.reservation,
    transferMetadata: result.transferMetadata,
  };
}

export async function handleConfirmPosPaymentRequest(
  service: StaffOperationsInterface,
  input: {
    token: string | null;
    staffId: string | null;
    idempotencyKey: string | null;
  }
) {
  const actor = requireTokenAndStaffId({
    token: input.token,
    staffId: input.staffId,
  });

  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);

  const result = await service.confirmPosPayment({
    token: actor.token,
    staffId: actor.staffId,
    idempotencyKey,
  });

  return {
    reservation: result.reservation,
    posMetadata: result.posMetadata,
  };
}

export async function handleCancelReservationRequest(
  service: StaffOperationsInterface,
  input: {
    token: string | null;
    idempotencyKey: string | null;
  }
): Promise<{ reservation: ReservationRepositoryReservation }> {
  const token = requireToken(input.token);
  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);

  const reservation = await service.cancelReservation({
    token,
    idempotencyKey,
  });

  return {
    reservation,
  };
}

export async function handleListManualBlocksRequest(
  service: ManualBlockOperationsInterface,
  input: {
    flatId: string | null;
    includeReleased: string | null;
  }
) {
  const flatId = normalizeFlatId(input.flatId);
  if (!flatId) {
    throw new Error("A valid flatId is required.");
  }

  const blocks = await service.listManualAvailabilityBlocks({
    flatId,
    includeReleased: normalizeIncludeReleased(input.includeReleased),
  });

  return { blocks };
}

export async function handleCreateManualBlockRequest(
  service: ManualBlockOperationsInterface,
  input: {
    flatId: string | null;
    startDate: string | null;
    endDate: string | null;
    manualBlockType: string | null;
    reason: string | null;
    notes: string | null;
    createdBy: string | null;
    expiresAt: string | null;
    idempotencyKey: string | null;
  }
) {
  const flatId = normalizeFlatId(input.flatId);
  const startDate = normalizeRequiredString(input.startDate);
  const endDate = normalizeRequiredString(input.endDate);
  const manualBlockType = normalizeManualBlockType(input.manualBlockType);
  const reason = normalizeRequiredString(input.reason);
  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);

  if (!flatId || !startDate || !endDate || !reason) {
    throw new Error("flatId, startDate, endDate, manualBlockType, and reason are required.");
  }

  if (!manualBlockType) {
    throw new Error("manualBlockType must be one of: maintenance, owner_blackout, admin_block.");
  }

  const block = await service.createManualAvailabilityBlock({
    flatId,
    startDate,
    endDate,
    manualBlockType,
    reason,
    notes: normalizeOptionalString(input.notes),
    createdBy: normalizeOptionalString(input.createdBy),
    expiresAt: normalizeOptionalString(input.expiresAt),
    idempotencyKey,
  });

  return { block };
}

export async function handleReleaseManualBlockRequest(
  service: ManualBlockOperationsInterface,
  input: {
    sourceId: string | null;
    idempotencyKey: string | null;
  }
) {
  const sourceId = requireManualSourceId(input.sourceId);
  const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);

  const block = await service.releaseManualAvailabilityBlock({
    sourceId,
    idempotencyKey,
  });

  return { block };
}
