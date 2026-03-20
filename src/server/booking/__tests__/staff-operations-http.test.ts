import assert from "node:assert/strict";

import {
  handleCancelReservationRequest,
  handleConfirmPosPaymentRequest,
  handleCreateManualBlockRequest,
  handleListManualBlocksRequest,
  handleListPendingPosReservationsRequest,
  handleListPendingTransferReservationsRequest,
  handleReleaseManualBlockRequest,
  handleVerifyTransferPaymentRequest,
  type ManualBlockOperationsInterface,
  type StaffOperationsInterface,
} from "../staff-operations-http";
import type { FlatId } from "../../../types/booking";
import type {
  AvailabilityBlockRecord,
  ManualAvailabilityBlockType,
  PosCoordinationMetadataRecord,
  TransferVerificationMetadataRecord,
} from "../../../types/booking-backend";
import type { ReservationRepositoryReservation } from "../reservation-repository";

class StubStaffOperationsService implements StaffOperationsInterface {
  listTransferCalls = 0;
  listPosCalls = 0;
  verifyCalls = 0;
  confirmPosCalls = 0;
  cancelCalls = 0;

  lastVerifyInput:
    | {
        token: string;
        staffId: string;
        verificationNote?: string;
        idempotencyKey: string;
      }
    | null = null;

  lastConfirmPosInput:
    | {
        token: string;
        staffId: string;
        idempotencyKey: string;
      }
    | null = null;

  lastCancelInput:
    | {
        token: string;
        idempotencyKey: string;
      }
    | null = null;

  async listPendingTransferReservations() {
    this.listTransferCalls += 1;

    return [
      {
        reservationId: "res_transfer_1",
        token: "token_transfer_1",
        status: "awaiting_transfer_verification" as const,
        flatId: "mayfair" as FlatId,
        checkIn: "2026-10-10",
        checkOut: "2026-10-13",
        guestName: "Ada Lovelace",
        guestEmail: "ada@example.com",
        guestPhone: "+23400000000",
        holdExpiresAt: "2026-10-01T10:00:00.000Z",
        holdExpired: false,
        transferReference: "TRX-1",
        proofReceivedAt: "2026-10-01T09:20:00.000Z",
        verificationStatus: "pending" as const,
      },
    ];
  }

  async listPendingPosReservations() {
    this.listPosCalls += 1;

    return [
      {
        reservationId: "res_pos_1",
        token: "token_pos_1",
        status: "pending_pos_coordination" as const,
        flatId: "kensington" as FlatId,
        checkIn: "2026-11-01",
        checkOut: "2026-11-04",
        guestName: "Grace Hopper",
        guestEmail: "grace@example.com",
        guestPhone: "+23411111111",
        contactWindow: "10:00-12:00",
        coordinationStatus: "requested" as const,
        requestedAt: "2026-10-01T09:00:00.000Z",
      },
    ];
  }

  async verifyTransferPayment(input: {
    token: string;
    staffId: string;
    verificationNote?: string;
    idempotencyKey: string;
  }) {
    this.verifyCalls += 1;
    this.lastVerifyInput = input;

    return {
      reservation: createReservation("token_transfer_1"),
      transferMetadata: createTransferMetadata(),
      availability: {
        intent: "pre_confirmation_transfer" as const,
        checkpoint: "pre_transfer_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-10-01T09:55:00.000Z",
        reasons: ["Availability check passed at pre_transfer_confirmation."],
        conflicts: [],
        inventoryVersion: "inventory-1",
      },
    };
  }

  async confirmPosPayment(input: {
    token: string;
    staffId: string;
    idempotencyKey: string;
  }) {
    this.confirmPosCalls += 1;
    this.lastConfirmPosInput = input;

    return {
      reservation: createReservation("token_pos_1"),
      posMetadata: createPosMetadata(),
      availability: {
        intent: "pre_confirmation_pos" as const,
        checkpoint: "pre_pos_confirmation" as const,
        isAvailable: true,
        checkedAt: "2026-10-01T09:56:00.000Z",
        reasons: ["Availability check passed at pre_pos_confirmation."],
        conflicts: [],
        inventoryVersion: "inventory-2",
      },
    };
  }

  async cancelReservation(input: { token: string; idempotencyKey: string }) {
    this.cancelCalls += 1;
    this.lastCancelInput = input;
    return createReservation(input.token);
  }
}

class StubManualBlockOperationsService implements ManualBlockOperationsInterface {
  listCalls = 0;
  createCalls = 0;
  releaseCalls = 0;

  lastListInput:
    | {
        flatId: FlatId;
        includeReleased?: boolean;
      }
    | null = null;

  lastCreateInput:
    | {
        flatId: FlatId;
        startDate: string;
        endDate: string;
        manualBlockType: ManualAvailabilityBlockType;
        reason: string;
        notes?: string | null;
        createdBy?: string | null;
        expiresAt?: string | null;
        idempotencyKey: string;
      }
    | null = null;

  lastReleaseInput:
    | {
        sourceId: string;
        idempotencyKey: string;
      }
    | null = null;

  async listManualAvailabilityBlocks(input: {
    flatId: FlatId;
    includeReleased?: boolean;
  }): Promise<AvailabilityBlockRecord[]> {
    this.listCalls += 1;
    this.lastListInput = input;

    return [createManualBlockRecord()];
  }

  async createManualAvailabilityBlock(input: {
    flatId: FlatId;
    startDate: string;
    endDate: string;
    manualBlockType: ManualAvailabilityBlockType;
    reason: string;
    notes?: string | null;
    createdBy?: string | null;
    expiresAt?: string | null;
    idempotencyKey: string;
  }): Promise<AvailabilityBlockRecord> {
    this.createCalls += 1;
    this.lastCreateInput = input;

    return createManualBlockRecord({
      flatId: input.flatId,
      startDate: input.startDate,
      endDate: input.endDate,
      manualBlockType: input.manualBlockType,
      reason: input.reason,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  }

  async releaseManualAvailabilityBlock(input: {
    sourceId: string;
    idempotencyKey: string;
  }): Promise<AvailabilityBlockRecord> {
    this.releaseCalls += 1;
    this.lastReleaseInput = input;

    return createManualBlockRecord({
      sourceId: input.sourceId,
      status: "released",
      releasedAt: "2026-10-01T10:01:00.000Z",
      updatedAt: "2026-10-01T10:01:00.000Z",
    });
  }
}

function createReservation(token: string): ReservationRepositoryReservation {
  return {
    id: "res_1",
    token,
    status: "confirmed",
    paymentMethod: "transfer",
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
    transferHoldStartedAt: "2026-10-01T09:00:00.000Z",
    transferHoldExpiresAt: "2026-10-01T10:00:00.000Z",
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: "2026-10-01T09:58:00.000Z",
    cancelledAt: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:58:00.000Z",
  };
}

function createTransferMetadata(): TransferVerificationMetadataRecord {
  return {
    id: "trf_meta_1",
    reservationId: "res_1",
    transferReference: "TRX-1",
    proofNote: "Proof",
    proofReceivedAt: "2026-10-01T09:20:00.000Z",
    verificationStatus: "verified",
    verifiedByStaffId: "staff_1",
    verifiedAt: "2026-10-01T09:58:00.000Z",
    verificationNote: null,
    idempotencyKey: "idem-1",
    createdAt: "2026-10-01T09:20:00.000Z",
    updatedAt: "2026-10-01T09:58:00.000Z",
  };
}

function createPosMetadata(): PosCoordinationMetadataRecord {
  return {
    id: "pos_meta_1",
    reservationId: "res_1",
    contactWindow: "10:00-12:00",
    coordinationNote: null,
    status: "completed",
    requestedAt: "2026-10-01T09:00:00.000Z",
    completedAt: "2026-10-01T09:58:00.000Z",
    completedByStaffId: "staff_2",
    idempotencyKey: "idem-pos-1",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:58:00.000Z",
  };
}

function createManualBlockRecord(overrides?: Partial<AvailabilityBlockRecord>): AvailabilityBlockRecord {
  return {
    id: "manual_1",
    flatId: "mayfair",
    sourceType: "manual",
    sourceId: "manual_1",
    blockType: "hard_block",
    manualBlockType: "maintenance",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    reason: "Maintenance",
    notes: null,
    createdBy: null,
    status: "active",
    expiresAt: null,
    releasedAt: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

async function testListPendingTransferReservationsDelegates(): Promise<void> {
  const staffService = new StubStaffOperationsService();

  const result = await handleListPendingTransferReservationsRequest(staffService);

  assert.equal(staffService.listTransferCalls, 1);
  assert.equal(result.reservations.length, 1);
  assert.equal(result.reservations[0].reservationId, "res_transfer_1");
}

async function testListPendingPosReservationsDelegates(): Promise<void> {
  const staffService = new StubStaffOperationsService();

  const result = await handleListPendingPosReservationsRequest(staffService);

  assert.equal(staffService.listPosCalls, 1);
  assert.equal(result.reservations.length, 1);
  assert.equal(result.reservations[0].reservationId, "res_pos_1");
}

async function testVerifyTransferPaymentValidationAndDelegation(): Promise<void> {
  const staffService = new StubStaffOperationsService();

  await assert.rejects(
    async () => {
      await handleVerifyTransferPaymentRequest(staffService, {
        token: "token_transfer_1",
        staffId: "staff_1",
        verificationNote: null,
        idempotencyKey: null,
      });
    },
    /Idempotency key is required/
  );

  const result = await handleVerifyTransferPaymentRequest(staffService, {
    token: "token_transfer_1",
    staffId: "staff_1",
    verificationNote: "  verified  ",
    idempotencyKey: " idem-verify-1 ",
  });

  assert.equal(staffService.verifyCalls, 1);
  assert.deepEqual(staffService.lastVerifyInput, {
    token: "token_transfer_1",
    staffId: "staff_1",
    verificationNote: "verified",
    idempotencyKey: "idem-verify-1",
  });
  assert.equal(result.reservation.token, "token_transfer_1");
}

async function testConfirmPosPaymentValidationAndDelegation(): Promise<void> {
  const staffService = new StubStaffOperationsService();

  await assert.rejects(
    async () => {
      await handleConfirmPosPaymentRequest(staffService, {
        token: null,
        staffId: "staff_2",
        idempotencyKey: "idem-1",
      });
    },
    /Token and staffId are required/
  );

  const result = await handleConfirmPosPaymentRequest(staffService, {
    token: "token_pos_1",
    staffId: "staff_2",
    idempotencyKey: "idem-pos-1",
  });

  assert.equal(staffService.confirmPosCalls, 1);
  assert.deepEqual(staffService.lastConfirmPosInput, {
    token: "token_pos_1",
    staffId: "staff_2",
    idempotencyKey: "idem-pos-1",
  });
  assert.equal(result.posMetadata.status, "completed");
}

async function testCancelReservationValidationAndDelegation(): Promise<void> {
  const staffService = new StubStaffOperationsService();

  await assert.rejects(
    async () => {
      await handleCancelReservationRequest(staffService, {
        token: "token_1",
        idempotencyKey: null,
      });
    },
    /Idempotency key is required/
  );

  const result = await handleCancelReservationRequest(staffService, {
    token: "token_1",
    idempotencyKey: "idem-cancel-1",
  });

  assert.equal(staffService.cancelCalls, 1);
  assert.deepEqual(staffService.lastCancelInput, {
    token: "token_1",
    idempotencyKey: "idem-cancel-1",
  });
  assert.equal(result.reservation.token, "token_1");
}

async function testManualBlockListValidationAndDelegation(): Promise<void> {
  const manualService = new StubManualBlockOperationsService();

  await assert.rejects(
    async () => {
      await handleListManualBlocksRequest(manualService, {
        flatId: "invalid-flat",
        includeReleased: null,
      });
    },
    /A valid flatId is required/
  );

  const result = await handleListManualBlocksRequest(manualService, {
    flatId: "mayfair",
    includeReleased: "true",
  });

  assert.equal(manualService.listCalls, 1);
  assert.deepEqual(manualService.lastListInput, {
    flatId: "mayfair",
    includeReleased: true,
  });
  assert.equal(result.blocks.length, 1);
}

async function testCreateManualBlockValidationAndDelegation(): Promise<void> {
  const manualService = new StubManualBlockOperationsService();

  await assert.rejects(
    async () => {
      await handleCreateManualBlockRequest(manualService, {
        flatId: "mayfair",
        startDate: "2026-10-20",
        endDate: "2026-10-22",
        manualBlockType: "bad-type",
        reason: "Maintenance",
        notes: null,
        createdBy: null,
        expiresAt: null,
        idempotencyKey: "idem-1",
      });
    },
    /manualBlockType must be one of/
  );

  const result = await handleCreateManualBlockRequest(manualService, {
    flatId: "mayfair",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    manualBlockType: "maintenance",
    reason: "  HVAC maintenance  ",
    notes: "  unit offline  ",
    createdBy: "  staff_ops_1  ",
    expiresAt: null,
    idempotencyKey: " idem-manual-1 ",
  });

  assert.equal(manualService.createCalls, 1);
  assert.deepEqual(manualService.lastCreateInput, {
    flatId: "mayfair",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    manualBlockType: "maintenance",
    reason: "HVAC maintenance",
    notes: "unit offline",
    createdBy: "staff_ops_1",
    expiresAt: null,
    idempotencyKey: "idem-manual-1",
  });
  assert.equal(result.block.sourceType, "manual");
}

async function testReleaseManualBlockValidationAndDelegation(): Promise<void> {
  const manualService = new StubManualBlockOperationsService();

  await assert.rejects(
    async () => {
      await handleReleaseManualBlockRequest(manualService, {
        sourceId: "",
        idempotencyKey: "idem-1",
      });
    },
    /Manual block sourceId is required/
  );

  const result = await handleReleaseManualBlockRequest(manualService, {
    sourceId: "manual_1",
    idempotencyKey: "idem-release-1",
  });

  assert.equal(manualService.releaseCalls, 1);
  assert.deepEqual(manualService.lastReleaseInput, {
    sourceId: "manual_1",
    idempotencyKey: "idem-release-1",
  });
  assert.equal(result.block.status, "released");
}

async function run(): Promise<void> {
  await testListPendingTransferReservationsDelegates();
  await testListPendingPosReservationsDelegates();
  await testVerifyTransferPaymentValidationAndDelegation();
  await testConfirmPosPaymentValidationAndDelegation();
  await testCancelReservationValidationAndDelegation();
  await testManualBlockListValidationAndDelegation();
  await testCreateManualBlockValidationAndDelegation();
  await testReleaseManualBlockValidationAndDelegation();

  console.log("staff-operations-http: ok");
}

void run();



