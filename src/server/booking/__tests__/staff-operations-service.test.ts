import assert from "node:assert/strict";

import {
  StaffOperationsService,
  type StaffOperationsIdempotencyGateway,
  type StaffOperationsQueryRepository,
} from "../staff-operations-service";
import type { OfflinePaymentService } from "../offline-payment-service";
import type { ReservationRepositoryReservation } from "../reservation-repository";
import type { ReservationService } from "../reservation-service";
import type { ReservationStatus } from "../../../types/booking";
import type {
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../../types/booking-backend";

class InMemoryStaffOperationsQueryRepository implements StaffOperationsQueryRepository {
  constructor(
    private readonly reservations: ReservationRepositoryReservation[],
    private readonly transferMetadata: TransferVerificationMetadataRecord[] = [],
    private readonly posMetadata: PosCoordinationMetadataRecord[] = []
  ) {}

  async listReservationsByStatuses(
    statuses: readonly ReservationStatus[]
  ): Promise<ReservationRepositoryReservation[]> {
    return this.reservations
      .filter((reservation) => statuses.includes(reservation.status))
      .map(cloneReservation);
  }

  async findReservationByToken(token: string): Promise<ReservationRepositoryReservation | null> {
    const found = this.reservations.find((reservation) => reservation.token === token);
    return found ? cloneReservation(found) : null;
  }

  async findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null> {
    const latest = this.transferMetadata
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? { ...latest } : null;
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const latest = this.posMetadata
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? { ...latest } : null;
  }
}

class InMemoryStaffOperationsIdempotencyGateway implements StaffOperationsIdempotencyGateway {
  private readonly records = new Map<string, { payload: string; result: unknown }>();

  async run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    execute: () => Promise<TResult>;
    reservationId?: string | null;
  }): Promise<TResult> {
    void input.reservationId;

    const mapKey = `${input.action}:${input.key}`;
    const payload = JSON.stringify(input.payload);
    const existing = this.records.get(mapKey);

    if (existing) {
      if (existing.payload !== payload) {
        throw new Error(`Idempotency conflict for key '${input.key}' and action '${input.action}'.`);
      }

      return existing.result as TResult;
    }

    const result = await input.execute();

    this.records.set(mapKey, {
      payload,
      result,
    });

    return result;
  }
}

class StubOfflinePaymentService
  implements Pick<OfflinePaymentService, "verifyTransferByStaff" | "confirmPosPaymentByStaff">
{
  verifyCalls = 0;
  confirmCalls = 0;

  async verifyTransferByStaff(input: {
    token: string;
    staffId: string;
    verificationNote?: string;
  }) {
    this.verifyCalls += 1;

    return {
      reservation: createReservation("confirmed", {
        id: "res_verified",
        token: input.token,
        paymentMethod: "transfer",
        confirmedAt: "2026-10-01T09:45:00.000Z",
      }),
      transferMetadata: {
        id: "trf_meta_1",
        reservationId: "res_verified",
        transferReference: "TRX-STAFF-1",
        proofNote: "Proof uploaded",
        proofReceivedAt: "2026-10-01T09:30:00.000Z",
        verificationStatus: "verified" as const,
        verifiedByStaffId: input.staffId,
        verifiedAt: "2026-10-01T09:45:00.000Z",
        verificationNote: input.verificationNote ?? null,
        idempotencyKey: "idem-trf-verify",
        createdAt: "2026-10-01T09:30:00.000Z",
        updatedAt: "2026-10-01T09:45:00.000Z",
      },
      availability: {
        intent: "pre_confirmation_transfer" as const,
        checkpoint: "pre_transfer_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-10-01T09:44:00.000Z",
        reasons: ["Availability check passed at pre_transfer_confirmation."],
        conflicts: [],
        inventoryVersion: "inventory-1",
      },
    };
  }

  async confirmPosPaymentByStaff(input: { token: string; staffId: string }) {
    this.confirmCalls += 1;

    return {
      reservation: createReservation("confirmed", {
        id: "res_pos_confirmed",
        token: input.token,
        paymentMethod: "pos",
        confirmedAt: "2026-10-01T10:05:00.000Z",
      }),
      posMetadata: {
        id: "pos_meta_1",
        reservationId: "res_pos_confirmed",
        contactWindow: "11:00-13:00",
        coordinationNote: null,
        status: "completed" as const,
        requestedAt: "2026-10-01T09:20:00.000Z",
        completedAt: "2026-10-01T10:05:00.000Z",
        completedByStaffId: input.staffId,
        idempotencyKey: "idem-pos-confirm",
        createdAt: "2026-10-01T09:20:00.000Z",
        updatedAt: "2026-10-01T10:05:00.000Z",
      },
      availability: {
        intent: "pre_confirmation_pos" as const,
        checkpoint: "pre_pos_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-10-01T10:04:00.000Z",
        reasons: ["Availability check passed at pre_pos_confirmation."],
        conflicts: [],
        inventoryVersion: "inventory-2",
      },
    };
  }
}

class StubReservationService implements Pick<ReservationService, "transitionReservation"> {
  transitionCalls = 0;

  async transitionReservation(input: {
    token: string;
    event: "cancel_requested";
    actor: "staff";
  }): Promise<ReservationRepositoryReservation> {
    this.transitionCalls += 1;

    return createReservation("cancelled", {
      id: `res_${input.token}`,
      token: input.token,
      cancelledAt: "2026-10-01T10:20:00.000Z",
      paymentMethod: "transfer",
    });
  }
}

function createReservation(
  status: ReservationStatus,
  overrides?: Partial<ReservationRepositoryReservation>
): ReservationRepositoryReservation {
  return {
    id: "res_1",
    token: "token_1",
    status,
    paymentMethod: null,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
      guests: 2,
      extraIds: [],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "",
    },
    pricing: {
      currency: "NGN",
      nightlyRate: 250000,
      nights: 3,
      staySubtotal: 750000,
      extrasSubtotal: 0,
      estimatedTotal: 750000,
    },
    progressContext: {
      currentStep: 0,
      activeBranch: null,
    },
    transferHoldStartedAt: "2026-10-01T09:00:00.000Z",
    transferHoldExpiresAt: "2026-10-01T10:00:00.000Z",
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    lastTouchedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

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
    progressContext: {
      ...value.progressContext,
    },
  };
}

function createHarness(input?: {
  reservations?: ReservationRepositoryReservation[];
  transferMetadata?: TransferVerificationMetadataRecord[];
  posMetadata?: PosCoordinationMetadataRecord[];
  now?: string;
}) {
  const queryRepository = new InMemoryStaffOperationsQueryRepository(
    input?.reservations ?? [],
    input?.transferMetadata ?? [],
    input?.posMetadata ?? []
  );
  const idempotencyGateway = new InMemoryStaffOperationsIdempotencyGateway();
  const offlinePaymentService = new StubOfflinePaymentService();
  const reservationService = new StubReservationService();

  const staffOperationsService = new StaffOperationsService({
    queryRepository,
    idempotencyGateway,
    offlinePaymentService,
    reservationService,
    now: () => new Date(input?.now ?? "2026-10-01T09:30:00.000Z"),
  });

  return {
    staffOperationsService,
    queryRepository,
    offlinePaymentService,
    reservationService,
  };
}

async function testListPendingTransferReservations(): Promise<void> {
  const transferPending = createReservation("pending_transfer_submission", {
    id: "res_transfer_pending",
    token: "token_transfer_pending",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-10-01T09:45:00.000Z",
  });

  const transferAwaiting = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_awaiting",
    token: "token_transfer_awaiting",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-10-01T10:15:00.000Z",
  });

  const nonTransfer = createReservation("pending_pos_coordination", {
    id: "res_pos",
    token: "token_pos",
    paymentMethod: "pos",
  });

  const transferMetadata: TransferVerificationMetadataRecord[] = [
    {
      id: "trf_meta_1",
      reservationId: "res_transfer_pending",
      transferReference: "TRF-001",
      proofNote: "Uploaded receipt",
      proofReceivedAt: "2026-10-01T09:10:00.000Z",
      verificationStatus: "pending",
      verifiedByStaffId: null,
      verifiedAt: null,
      verificationNote: null,
      idempotencyKey: "idem-trf-meta-1",
      createdAt: "2026-10-01T09:10:00.000Z",
      updatedAt: "2026-10-01T09:10:00.000Z",
    },
  ];

  const { staffOperationsService } = createHarness({
    reservations: [nonTransfer, transferAwaiting, transferPending],
    transferMetadata,
    now: "2026-10-01T09:30:00.000Z",
  });

  const queue = await staffOperationsService.listPendingTransferReservations();

  assert.equal(queue.length, 2);
  assert.equal(queue[0].reservationId, "res_transfer_pending");
  assert.equal(queue[0].holdExpiresAt, "2026-10-01T09:45:00.000Z");
  assert.equal(queue[0].holdExpired, false);
  assert.equal(queue[0].transferReference, "TRF-001");
  assert.equal(queue[0].guestName, "Ada Lovelace");
  assert.equal(queue[0].guestEmail, "ada@example.com");
  assert.equal(queue[0].guestPhone, "+23400000000");
  assert.equal(queue[1].reservationId, "res_transfer_awaiting");
  assert.equal(queue[1].holdExpiresAt, "2026-10-01T10:15:00.000Z");
}

async function testListPendingPosReservations(): Promise<void> {
  const posPending = createReservation("pending_pos_coordination", {
    id: "res_pos_pending",
    token: "token_pos_pending",
    paymentMethod: "pos",
  });

  const ignored = createReservation("pending_transfer_submission", {
    id: "res_transfer",
    token: "token_transfer",
    paymentMethod: "transfer",
  });

  const posMetadata: PosCoordinationMetadataRecord[] = [
    {
      id: "pos_meta_1",
      reservationId: "res_pos_pending",
      contactWindow: "11:00-13:00",
      coordinationNote: "Call guest on arrival",
      status: "requested",
      requestedAt: "2026-10-01T09:00:00.000Z",
      completedAt: null,
      completedByStaffId: null,
      idempotencyKey: "idem-pos-meta-1",
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-01T09:00:00.000Z",
    },
  ];

  const { staffOperationsService } = createHarness({
    reservations: [ignored, posPending],
    posMetadata,
  });

  const queue = await staffOperationsService.listPendingPosReservations();

  assert.equal(queue.length, 1);
  assert.equal(queue[0].reservationId, "res_pos_pending");
  assert.equal(queue[0].contactWindow, "11:00-13:00");
  assert.equal(queue[0].coordinationStatus, "requested");
  assert.equal(queue[0].guestName, "Ada Lovelace");
  assert.equal(queue[0].guestEmail, "ada@example.com");
  assert.equal(queue[0].guestPhone, "+23400000000");
}

async function testVerifyTransferFromValidState(): Promise<void> {
  const awaitingTransfer = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_1",
    token: "token_transfer_1",
    paymentMethod: "transfer",
  });

  const { staffOperationsService, offlinePaymentService } = createHarness({
    reservations: [awaitingTransfer],
  });

  const result = await staffOperationsService.verifyTransferPayment({
    token: "token_transfer_1",
    staffId: "staff_ops_1",
    verificationNote: "Verified against bank statement.",
    idempotencyKey: "idem-transfer-verify-1",
  });

  assert.equal(offlinePaymentService.verifyCalls, 1);
  assert.equal(result.reservation.status, "confirmed");
  assert.equal(result.transferMetadata.verificationStatus, "verified");
}

async function testRejectTransferVerificationFromInvalidState(): Promise<void> {
  const pendingTransfer = createReservation("pending_transfer_submission", {
    id: "res_transfer_pending",
    token: "token_transfer_pending",
    paymentMethod: "transfer",
  });

  const { staffOperationsService, offlinePaymentService } = createHarness({
    reservations: [pendingTransfer],
  });

  await assert.rejects(
    async () => {
      await staffOperationsService.verifyTransferPayment({
        token: "token_transfer_pending",
        staffId: "staff_ops_2",
        idempotencyKey: "idem-transfer-verify-invalid",
      });
    },
    /requires awaiting transfer verification status/
  );

  assert.equal(offlinePaymentService.verifyCalls, 0);
}

async function testConfirmPosFromValidState(): Promise<void> {
  const pendingPos = createReservation("pending_pos_coordination", {
    id: "res_pos_1",
    token: "token_pos_1",
    paymentMethod: "pos",
  });

  const { staffOperationsService, offlinePaymentService } = createHarness({
    reservations: [pendingPos],
  });

  const result = await staffOperationsService.confirmPosPayment({
    token: "token_pos_1",
    staffId: "staff_pos_1",
    idempotencyKey: "idem-pos-confirm-1",
  });

  assert.equal(offlinePaymentService.confirmCalls, 1);
  assert.equal(result.reservation.status, "confirmed");
  assert.equal(result.posMetadata.status, "completed");
}

async function testRejectPosConfirmationFromInvalidState(): Promise<void> {
  const awaitingTransfer = createReservation("awaiting_transfer_verification", {
    id: "res_other",
    token: "token_other",
    paymentMethod: "transfer",
  });

  const { staffOperationsService, offlinePaymentService } = createHarness({
    reservations: [awaitingTransfer],
  });

  await assert.rejects(
    async () => {
      await staffOperationsService.confirmPosPayment({
        token: "token_other",
        staffId: "staff_pos_2",
        idempotencyKey: "idem-pos-confirm-invalid",
      });
    },
    /requires pending POS coordination status/
  );

  assert.equal(offlinePaymentService.confirmCalls, 0);
}

async function testCancelValidReservation(): Promise<void> {
  const pendingTransfer = createReservation("pending_transfer_submission", {
    id: "res_cancel_1",
    token: "token_cancel_1",
    paymentMethod: "transfer",
  });

  const { staffOperationsService, reservationService } = createHarness({
    reservations: [pendingTransfer],
  });

  const cancelled = await staffOperationsService.cancelReservation({
    token: "token_cancel_1",
    idempotencyKey: "idem-cancel-1",
  });

  assert.equal(reservationService.transitionCalls, 1);
  assert.equal(cancelled.status, "cancelled");
  assert.ok(cancelled.cancelledAt !== null);
}

async function testTransferQueueExposesHoldExpiryTimestamps(): Promise<void> {
  const transferPending = createReservation("pending_transfer_submission", {
    id: "res_transfer_expired",
    token: "token_transfer_expired",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-10-01T09:00:00.000Z",
  });

  const { staffOperationsService } = createHarness({
    reservations: [transferPending],
    now: "2026-10-01T09:30:00.000Z",
  });

  const queue = await staffOperationsService.listPendingTransferReservations();

  assert.equal(queue.length, 1);
  assert.equal(queue[0].holdExpiresAt, "2026-10-01T09:00:00.000Z");
  assert.equal(queue[0].holdExpired, true);
}

async function run(): Promise<void> {
  await testListPendingTransferReservations();
  await testListPendingPosReservations();
  await testVerifyTransferFromValidState();
  await testRejectTransferVerificationFromInvalidState();
  await testConfirmPosFromValidState();
  await testRejectPosConfirmationFromInvalidState();
  await testCancelValidReservation();
  await testTransferQueueExposesHoldExpiryTimestamps();

  console.log("staff-operations-service: ok");
}

void run();





