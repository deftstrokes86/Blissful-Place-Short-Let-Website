import assert from "node:assert/strict";

import {
  OperationsService,
  type OperationsAvailabilityBlockRepository,
  type OperationsIdempotencyGateway,
  type OperationsQueryRepository,
} from "../operations-service";
import type { OfflinePaymentService } from "../offline-payment-service";
import type { ReservationRepositoryReservation } from "../reservation-repository";
import type { ReservationService } from "../reservation-service";
import type { FlatId, ReservationStatus } from "../../../types/booking";
import type {
  AvailabilityBlockRecord,
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../../types/booking-backend";

class InMemoryAvailabilityBlockRepository implements OperationsAvailabilityBlockRepository {
  readonly blocks = new Map<string, AvailabilityBlockRecord>();
  updateCalls = 0;

  async create(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.blocks.set(block.id, cloneBlock(block));
    return cloneBlock(block);
  }

  async update(block: AvailabilityBlockRecord): Promise<AvailabilityBlockRecord> {
    this.updateCalls += 1;
    if (!this.blocks.has(block.id)) {
      throw new Error("Availability block not found.");
    }

    this.blocks.set(block.id, cloneBlock(block));
    return cloneBlock(block);
  }

  async findBySource(
    sourceType: AvailabilityBlockRecord["sourceType"],
    sourceId: string
  ): Promise<AvailabilityBlockRecord | null> {
    for (const block of this.blocks.values()) {
      if (block.sourceType === sourceType && block.sourceId === sourceId) {
        return cloneBlock(block);
      }
    }

    return null;
  }

  async listByFlat(flatId: FlatId): Promise<AvailabilityBlockRecord[]> {
    return Array.from(this.blocks.values())
      .filter((block) => block.flatId === flatId)
      .map(cloneBlock);
  }
}

class InMemoryOperationsQueryRepository implements OperationsQueryRepository {
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

class InMemoryOperationsIdempotencyGateway implements OperationsIdempotencyGateway {
  private readonly records = new Map<string, { payload: string; result: unknown }>();

  async run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    execute: () => Promise<TResult>;
    reservationId?: string | null;
  }): Promise<TResult> {
    void input.reservationId;
    const entryKey = `${input.action}:${input.key}`;
    const payload = JSON.stringify(input.payload);
    const existing = this.records.get(entryKey);
    if (existing) {
      if (existing.payload !== payload) {
        throw new Error(`Idempotency conflict for key '${input.key}' and action '${input.action}'.`);
      }

      return existing.result as TResult;
    }

    const result = await input.execute();
    this.records.set(entryKey, {
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
        id: "res_transfer_verify",
        token: input.token,
        paymentMethod: "transfer",
      }),
      transferMetadata: {
        id: "trf_1",
        reservationId: "res_transfer_verify",
        transferReference: "TRX-001",
        proofNote: "proof",
        proofReceivedAt: "2026-09-01T10:00:00.000Z",
        verificationStatus: "verified" as const,
        verifiedByStaffId: input.staffId,
        verifiedAt: "2026-09-01T10:05:00.000Z",
        verificationNote: input.verificationNote ?? null,
        idempotencyKey: "idem-trf",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:05:00.000Z",
      },
      availability: {
        intent: "pre_confirmation_transfer" as const,
        checkpoint: "pre_transfer_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-09-01T10:04:00.000Z",
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
        id: "res_pos_confirm",
        token: input.token,
        paymentMethod: "pos",
      }),
      posMetadata: {
        id: "pos_1",
        reservationId: "res_pos_confirm",
        contactWindow: "10:00-12:00",
        coordinationNote: null,
        status: "completed" as const,
        requestedAt: "2026-09-01T09:30:00.000Z",
        completedAt: "2026-09-01T10:10:00.000Z",
        completedByStaffId: input.staffId,
        idempotencyKey: "idem-pos",
        createdAt: "2026-09-01T09:30:00.000Z",
        updatedAt: "2026-09-01T10:10:00.000Z",
      },
      availability: {
        intent: "pre_confirmation_pos" as const,
        checkpoint: "pre_pos_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-09-01T10:09:00.000Z",
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
  }) {
    this.transitionCalls += 1;
    return createReservation("cancelled", {
      id: `res_${input.token}`,
      token: input.token,
      paymentMethod: "transfer",
    });
  }
}

function cloneBlock(value: AvailabilityBlockRecord): AvailabilityBlockRecord {
  return {
    ...value,
  };
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

function createOperationsHarness(input?: {
  reservations?: ReservationRepositoryReservation[];
  transferMetadata?: TransferVerificationMetadataRecord[];
  posMetadata?: PosCoordinationMetadataRecord[];
  now?: string;
}) {
  const queryRepository = new InMemoryOperationsQueryRepository(
    input?.reservations ?? [],
    input?.transferMetadata ?? [],
    input?.posMetadata ?? []
  );
  const blockRepository = new InMemoryAvailabilityBlockRepository();
  const idempotencyGateway = new InMemoryOperationsIdempotencyGateway();
  const offlinePaymentService = new StubOfflinePaymentService();
  const reservationService = new StubReservationService();

  const operationsService = new OperationsService({
    queryRepository,
    availabilityBlockRepository: blockRepository,
    idempotencyGateway,
    offlinePaymentService,
    reservationService,
    now: () => new Date(input?.now ?? "2026-10-01T09:30:00.000Z"),
    createId: () => "manual_1",
  });

  return {
    operationsService,
    blockRepository,
    offlinePaymentService,
    reservationService,
  };
}

async function testStaffQueueListsPendingTransferAndPosWork(): Promise<void> {
  const transferReservation = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_1",
    token: "token_transfer_1",
    paymentMethod: "transfer",
    transferHoldExpiresAt: "2026-10-01T10:00:00.000Z",
  });
  const posReservation = createReservation("pending_pos_coordination", {
    id: "res_pos_1",
    token: "token_pos_1",
    paymentMethod: "pos",
  });
  const ignored = createReservation("draft", {
    id: "res_draft_1",
    token: "token_draft_1",
  });

  const transferMetadata: TransferVerificationMetadataRecord[] = [
    {
      id: "trf_meta_1",
      reservationId: "res_transfer_1",
      transferReference: "TRX-ABC",
      proofNote: "proof",
      proofReceivedAt: "2026-10-01T09:10:00.000Z",
      verificationStatus: "pending",
      verifiedByStaffId: null,
      verifiedAt: null,
      verificationNote: null,
      idempotencyKey: "idem-transfer-meta-1",
      createdAt: "2026-10-01T09:10:00.000Z",
      updatedAt: "2026-10-01T09:10:00.000Z",
    },
  ];
  const posMetadata: PosCoordinationMetadataRecord[] = [
    {
      id: "pos_meta_1",
      reservationId: "res_pos_1",
      contactWindow: "10:00-12:00",
      coordinationNote: "Call before arrival",
      status: "requested",
      requestedAt: "2026-10-01T09:00:00.000Z",
      completedAt: null,
      completedByStaffId: null,
      idempotencyKey: "idem-pos-meta-1",
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-01T09:00:00.000Z",
    },
  ];

  const { operationsService } = createOperationsHarness({
    reservations: [transferReservation, posReservation, ignored],
    transferMetadata,
    posMetadata,
    now: "2026-10-01T09:30:00.000Z",
  });

  const queues = await operationsService.listStaffQueues();

  assert.equal(queues.transfer.length, 1);
  assert.equal(queues.transfer[0].reservationId, "res_transfer_1");
  assert.equal(queues.transfer[0].transferReference, "TRX-ABC");
  assert.equal(queues.transfer[0].holdExpired, false);
  assert.equal(queues.pos.length, 1);
  assert.equal(queues.pos[0].reservationId, "res_pos_1");
  assert.equal(queues.pos[0].contactWindow, "10:00-12:00");
}

async function testStaffActionsAreIdempotent(): Promise<void> {
  const { operationsService, offlinePaymentService } = createOperationsHarness();

  const firstTransfer = await operationsService.verifyTransferByStaff({
    token: "token_transfer_action",
    staffId: "staff_1",
    verificationNote: "verified",
    idempotencyKey: "idem-staff-transfer-1",
  });
  const secondTransfer = await operationsService.verifyTransferByStaff({
    token: "token_transfer_action",
    staffId: "staff_1",
    verificationNote: "verified",
    idempotencyKey: "idem-staff-transfer-1",
  });

  assert.equal(offlinePaymentService.verifyCalls, 1);
  assert.equal(firstTransfer.reservation.status, "confirmed");
  assert.equal(secondTransfer.reservation.status, "confirmed");

  const firstPos = await operationsService.confirmPosPaymentByStaff({
    token: "token_pos_action",
    staffId: "staff_2",
    idempotencyKey: "idem-staff-pos-1",
  });
  const secondPos = await operationsService.confirmPosPaymentByStaff({
    token: "token_pos_action",
    staffId: "staff_2",
    idempotencyKey: "idem-staff-pos-1",
  });

  assert.equal(offlinePaymentService.confirmCalls, 1);
  assert.equal(firstPos.reservation.status, "confirmed");
  assert.equal(secondPos.reservation.status, "confirmed");
}

async function testCreateAndReleaseManualAvailabilityBlock(): Promise<void> {
  const { operationsService, blockRepository } = createOperationsHarness();

  const created = await operationsService.createManualAvailabilityBlock({
    flatId: "mayfair",
    startDate: "2026-10-15",
    endDate: "2026-10-20",
    manualBlockType: "maintenance",
    reason: "Planned maintenance",
    notes: "AC service",
    createdBy: "staff_1",
    expiresAt: null,
    idempotencyKey: "idem-manual-create-1",
  });

  assert.equal(created.id, "manual_1");
  assert.equal(created.sourceType, "manual");
  assert.equal(created.sourceId, "manual_1");
  assert.equal(created.status, "active");
  assert.equal(created.manualBlockType, "maintenance");
  assert.equal(created.reason, "Planned maintenance");

  const released = await operationsService.releaseManualAvailabilityBlock({
    sourceId: "manual_1",
    idempotencyKey: "idem-manual-release-1",
  });

  assert.equal(released.status, "released");
  assert.ok(released.releasedAt !== null);

  const releasedAgain = await operationsService.releaseManualAvailabilityBlock({
    sourceId: "manual_1",
    idempotencyKey: "idem-manual-release-1",
  });

  assert.equal(releasedAgain.status, "released");
  assert.equal(blockRepository.updateCalls, 1);
}

async function testManualBlockDateValidationAndListing(): Promise<void> {
  const { operationsService } = createOperationsHarness();

  await assert.rejects(
    async () => {
      await operationsService.createManualAvailabilityBlock({
        flatId: "mayfair",
        startDate: "2026-10-20",
        endDate: "2026-10-19",
        manualBlockType: "maintenance",
        reason: "Invalid window",
        expiresAt: null,
        idempotencyKey: "idem-invalid-manual-window",
      });
    },
    /Invalid availability block window/
  );

  await operationsService.createManualAvailabilityBlock({
    flatId: "mayfair",
    startDate: "2026-10-10",
    endDate: "2026-10-12",
    manualBlockType: "owner_blackout",
    reason: "Owner blackout",
    expiresAt: "2026-10-10T11:00:00.000Z",
    idempotencyKey: "idem-manual-listing-1",
  });

  const active = await operationsService.listManualAvailabilityBlocks({
    flatId: "mayfair",
  });
  assert.equal(active.length, 1);
  assert.equal(active[0].status, "active");
  assert.equal(active[0].blockType, "hard_block");
  assert.equal(active[0].manualBlockType, "owner_blackout");
}

async function testManualBlockRejectsInvalidExpiryTimestamp(): Promise<void> {
  const { operationsService } = createOperationsHarness();

  await assert.rejects(
    async () => {
      await operationsService.createManualAvailabilityBlock({
        flatId: "mayfair",
        startDate: "2026-10-10",
        endDate: "2026-10-12",
        manualBlockType: "admin_block",
        reason: "Operational hold",
        expiresAt: "not-a-date",
        idempotencyKey: "idem-invalid-manual-expiry",
      });
    },
    /Invalid expiresAt timestamp/
  );
}

async function testStaffCancellationUsesStateMachineTransitionAndIdempotency(): Promise<void> {
  const { operationsService, reservationService } = createOperationsHarness();

  const first = await operationsService.cancelReservationByStaff({
    token: "token_cancel_1",
    idempotencyKey: "idem-staff-cancel-1",
  });
  const second = await operationsService.cancelReservationByStaff({
    token: "token_cancel_1",
    idempotencyKey: "idem-staff-cancel-1",
  });

  assert.equal(first.status, "cancelled");
  assert.equal(second.status, "cancelled");
  assert.equal(reservationService.transitionCalls, 1);
}

async function run(): Promise<void> {
  await testStaffQueueListsPendingTransferAndPosWork();
  await testStaffActionsAreIdempotent();
  await testCreateAndReleaseManualAvailabilityBlock();
  await testManualBlockDateValidationAndListing();
  await testManualBlockRejectsInvalidExpiryTimestamp();
  await testStaffCancellationUsesStateMachineTransitionAndIdempotency();

  console.log("operations-service: ok");
}

void run();









