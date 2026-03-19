import assert from "node:assert/strict";

import {
  OfflinePaymentService,
  type OfflinePaymentMetadataRepository,
  type OfflinePaymentAvailabilityGateway,
} from "../offline-payment-service";
import { ReservationService, type ReservationInventoryGateway } from "../reservation-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../reservation-repository";
import type {
  AvailabilityCheckResult,
} from "../availability-service";
import type {
  BookingToken,
  ExtraId,
  FlatId,
  PaymentMethod,
  ReservationStatus,
} from "../../../types/booking";
import type {
  PosCoordinationMetadataRecord,
  ReservationPricingSnapshot,
  TransferVerificationMetadataRecord,
} from "../../../types/booking-backend";

class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservationsByToken = new Map<BookingToken, ReservationRepositoryReservation>();
  private readonly flatsById = new Map<FlatId, ReservationRepositoryFlat>();
  private readonly extras: { id: ExtraId; flatFee: number }[];

  constructor(options?: { reservations?: ReservationRepositoryReservation[] }) {
    const defaults: ReservationRepositoryFlat[] = [
      { id: "windsor", nightlyRate: 150000 },
      { id: "kensington", nightlyRate: 180000 },
      { id: "mayfair", nightlyRate: 250000 },
    ];

    for (const flat of defaults) {
      this.flatsById.set(flat.id, flat);
    }

    this.extras = [
      { id: "airport", flatFee: 65000 },
      { id: "pantry", flatFee: 45000 },
      { id: "celebration", flatFee: 75000 },
    ];

    for (const reservation of options?.reservations ?? []) {
      this.reservationsByToken.set(reservation.token, cloneReservation(reservation));
    }
  }

  async create(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    const clone = cloneReservation(reservation);
    this.reservationsByToken.set(clone.token, clone);
    return cloneReservation(clone);
  }

  async update(reservation: ReservationRepositoryReservation): Promise<ReservationRepositoryReservation> {
    if (!this.reservationsByToken.has(reservation.token)) {
      throw new Error("Reservation not found.");
    }

    const clone = cloneReservation(reservation);
    this.reservationsByToken.set(clone.token, clone);
    return cloneReservation(clone);
  }

  async findByToken(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    const found = this.reservationsByToken.get(token);
    return found ? cloneReservation(found) : null;
  }

  async listTransferHoldExpiringBefore(beforeIso: string): Promise<ReservationRepositoryReservation[]> {
    const before = new Date(beforeIso).getTime();

    return Array.from(this.reservationsByToken.values())
      .filter((reservation) => {
        if (
          reservation.status !== "pending_transfer_submission" &&
          reservation.status !== "awaiting_transfer_verification"
        ) {
          return false;
        }

        if (!reservation.transferHoldExpiresAt) {
          return false;
        }

        return new Date(reservation.transferHoldExpiresAt).getTime() < before;
      })
      .map(cloneReservation);
  }

  async findFlatById(flatId: FlatId): Promise<ReservationRepositoryFlat | null> {
    return this.flatsById.get(flatId) ?? null;
  }

  async listExtras(): Promise<readonly { id: ExtraId; flatFee: number }[]> {
    return [...this.extras];
  }
}

class NoopInventoryGateway implements ReservationInventoryGateway {
  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
  }
}

class SpyAvailabilityGateway implements OfflinePaymentAvailabilityGateway {
  readonly preHoldCalls: { token: string; method: PaymentMethod }[] = [];
  readonly preConfirmationCalls: { token: string; method: "transfer" | "pos" }[] = [];

  preHoldAvailable = true;
  preConfirmationTransferAvailable = true;
  preConfirmationPosAvailable = true;

  async checkPreHoldReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: PaymentMethod
  ): Promise<AvailabilityCheckResult> {
    this.preHoldCalls.push({ token: reservation.token, method: paymentMethod });
    return makeAvailabilityResult(
      "pre_hold",
      "pre_hold_request",
      this.preHoldAvailable,
      this.preHoldAvailable ? [] : ["Pre-hold availability failed."]
    );
  }

  async checkPreConfirmationReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: "transfer" | "pos"
  ): Promise<AvailabilityCheckResult> {
    this.preConfirmationCalls.push({ token: reservation.token, method: paymentMethod });

    const available = paymentMethod === "transfer"
      ? this.preConfirmationTransferAvailable
      : this.preConfirmationPosAvailable;

    return makeAvailabilityResult(
      paymentMethod === "transfer" ? "pre_confirmation_transfer" : "pre_confirmation_pos",
      paymentMethod === "transfer" ? "pre_transfer_confirmation" : "pre_pos_confirmation",
      available,
      available ? [] : ["Pre-confirmation availability failed."]
    );
  }
}

class InMemoryOfflineMetadataRepository implements OfflinePaymentMetadataRepository {
  private transferSequence = 1;
  private posSequence = 1;

  readonly transferRecords: TransferVerificationMetadataRecord[] = [];
  readonly posRecords: PosCoordinationMetadataRecord[] = [];

  async createTransferMetadata(
    input: Omit<TransferVerificationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TransferVerificationMetadataRecord> {
    const now = "2026-07-01T10:00:00.000Z";
    const record: TransferVerificationMetadataRecord = {
      id: `trf_${this.transferSequence++}`,
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.transferRecords.push(record);
    return { ...record };
  }

  async findLatestTransferMetadata(reservationId: string): Promise<TransferVerificationMetadataRecord | null> {
    const latest = this.transferRecords
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? { ...latest } : null;
  }

  async updateTransferMetadata(
    id: string,
    patch: Partial<TransferVerificationMetadataRecord>
  ): Promise<TransferVerificationMetadataRecord> {
    const index = this.transferRecords.findIndex((record) => record.id === id);
    if (index < 0) {
      throw new Error("Transfer metadata not found.");
    }

    const updated = {
      ...this.transferRecords[index],
      ...patch,
      updatedAt: "2026-07-01T10:00:00.000Z",
    };

    this.transferRecords[index] = updated;
    return { ...updated };
  }

  async createPosMetadata(
    input: Omit<PosCoordinationMetadataRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<PosCoordinationMetadataRecord> {
    const now = "2026-07-01T10:00:00.000Z";
    const record: PosCoordinationMetadataRecord = {
      id: `pos_${this.posSequence++}`,
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.posRecords.push(record);
    return { ...record };
  }

  async findLatestPosMetadata(reservationId: string): Promise<PosCoordinationMetadataRecord | null> {
    const latest = this.posRecords
      .filter((record) => record.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return latest ? { ...latest } : null;
  }

  async updatePosMetadata(id: string, patch: Partial<PosCoordinationMetadataRecord>): Promise<PosCoordinationMetadataRecord> {
    const index = this.posRecords.findIndex((record) => record.id === id);
    if (index < 0) {
      throw new Error("POS metadata not found.");
    }

    const updated = {
      ...this.posRecords[index],
      ...patch,
      updatedAt: "2026-07-01T10:00:00.000Z",
    };

    this.posRecords[index] = updated;
    return { ...updated };
  }
}

function makeAvailabilityResult(
  intent: AvailabilityCheckResult["intent"],
  checkpoint: AvailabilityCheckResult["checkpoint"],
  isAvailable: boolean,
  reasons: string[]
): AvailabilityCheckResult {
  return {
    intent,
    checkpoint,
    isAvailable,
    checkedAt: "2026-07-01T10:00:00.000Z",
    reasons,
    conflicts: isAvailable
      ? []
      : [{ code: "sold_out", field: "stay", message: "Unavailable for requested dates." }],
    inventoryVersion: "inventory-fixed",
  };
}

function createEmptyPricing(): ReservationPricingSnapshot {
  return {
    currency: "NGN",
    nightlyRate: null,
    nights: null,
    staySubtotal: null,
    extrasSubtotal: 0,
    estimatedTotal: null,
  };
}

function createReservation(
  status: ReservationStatus,
  overrides?: Partial<ReservationRepositoryReservation>
): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status,
    paymentMethod: null,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-07-10",
      checkOut: "2026-07-12",
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
    pricing: createEmptyPricing(),
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
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
  };
}

function createHarness(options?: { reservations?: ReservationRepositoryReservation[]; now?: string }) {
  const repository = new InMemoryReservationRepository({ reservations: options?.reservations });
  const reservationService = new ReservationService({
    repository,
    inventoryGateway: new NoopInventoryGateway(),
    now: () => new Date(options?.now ?? "2026-07-01T10:00:00.000Z"),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  const metadataRepository = new InMemoryOfflineMetadataRepository();
  const availabilityGateway = new SpyAvailabilityGateway();

  const offlineService = new OfflinePaymentService({
    reservationService,
    metadataRepository,
    availabilityGateway,
    now: () => new Date(options?.now ?? "2026-07-01T10:00:00.000Z"),
  });

  return {
    offlineService,
    metadataRepository,
    availabilityGateway,
  };
}

async function testCreatesPendingTransferSubmission(): Promise<void> {
  const draftReservation = createReservation("draft", {
    token: "token_transfer_start",
  });
  const { offlineService, availabilityGateway } = createHarness({ reservations: [draftReservation] });

  const result = await offlineService.createTransferSubmission({
    token: "token_transfer_start",
    actor: "guest",
  });

  assert.equal(result.reservation.status, "pending_transfer_submission");
  assert.equal(result.reservation.paymentMethod, "transfer");
  assert.ok(result.reservation.transferHoldExpiresAt !== null);
  assert.equal(availabilityGateway.preHoldCalls.length, 1);
  assert.equal(availabilityGateway.preHoldCalls[0].method, "transfer");
}

async function testStoresTransferProofAndMovesAwaitingVerification(): Promise<void> {
  const reservation = createReservation("pending_transfer_submission", {
    token: "token_transfer_proof",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T11:00:00.000Z",
  });
  const { offlineService, metadataRepository } = createHarness({ reservations: [reservation] });

  const result = await offlineService.submitTransferProof({
    token: "token_transfer_proof",
    transferReference: "TRX-001",
    proofNote: "Uploaded transfer screenshot",
    actor: "guest",
  });

  assert.equal(result.reservation.status, "awaiting_transfer_verification");
  assert.equal(result.transferMetadata.verificationStatus, "pending");
  assert.equal(metadataRepository.transferRecords.length, 1);
}

async function testConfirmsVerifiedTransferCorrectly(): Promise<void> {
  const reservation = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_confirm",
    token: "token_transfer_confirm",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T11:00:00.000Z",
  });

  const { offlineService, metadataRepository, availabilityGateway } = createHarness({ reservations: [reservation] });

  await metadataRepository.createTransferMetadata({
    reservationId: "res_transfer_confirm",
    transferReference: "TRX-101",
    proofNote: "proof",
    proofReceivedAt: "2026-07-01T10:20:00.000Z",
    verificationStatus: "pending",
    verifiedByStaffId: null,
    verifiedAt: null,
    verificationNote: null,
    idempotencyKey: "idem-1",
  });

  const result = await offlineService.verifyTransferByStaff({
    token: "token_transfer_confirm",
    staffId: "staff_1",
    verificationNote: "Matched bank statement",
  });

  assert.equal(result.reservation.status, "confirmed");
  assert.equal(result.transferMetadata.verificationStatus, "verified");
  assert.equal(result.transferMetadata.verifiedByStaffId, "staff_1");
  assert.equal(availabilityGateway.preConfirmationCalls.length, 1);
  assert.equal(availabilityGateway.preConfirmationCalls[0].method, "transfer");
}

async function testCreatesPendingPosCoordination(): Promise<void> {
  const reservation = createReservation("draft", {
    token: "token_pos_start",
  });

  const { offlineService, metadataRepository, availabilityGateway } = createHarness({ reservations: [reservation] });

  const result = await offlineService.createPosCoordinationRequest({
    token: "token_pos_start",
    actor: "guest",
    contactWindow: "15:00-17:00",
    note: "Please call before arrival",
  });

  assert.equal(result.reservation.status, "pending_pos_coordination");
  assert.equal(result.reservation.paymentMethod, "pos");
  assert.equal(result.posMetadata.status, "requested");
  assert.equal(metadataRepository.posRecords.length, 1);
  assert.equal(availabilityGateway.preHoldCalls[0].method, "pos");
}

async function testConfirmsPosPaymentCorrectly(): Promise<void> {
  const reservation = createReservation("pending_pos_coordination", {
    id: "res_pos_confirm",
    token: "token_pos_confirm",
    paymentMethod: "pos",
  });

  const { offlineService, metadataRepository, availabilityGateway } = createHarness({ reservations: [reservation] });

  await metadataRepository.createPosMetadata({
    reservationId: "res_pos_confirm",
    contactWindow: "09:00-11:00",
    coordinationNote: null,
    status: "requested",
    requestedAt: "2026-07-01T10:10:00.000Z",
    completedAt: null,
    completedByStaffId: null,
    idempotencyKey: "idem-pos-1",
  });

  const result = await offlineService.confirmPosPaymentByStaff({
    token: "token_pos_confirm",
    staffId: "staff_pos_1",
  });

  assert.equal(result.reservation.status, "confirmed");
  assert.equal(result.posMetadata.status, "completed");
  assert.equal(result.posMetadata.completedByStaffId, "staff_pos_1");
  assert.equal(availabilityGateway.preConfirmationCalls.length, 1);
  assert.equal(availabilityGateway.preConfirmationCalls[0].method, "pos");
}

async function testRejectsInvalidStatusTransitions(): Promise<void> {
  const draftReservation = createReservation("draft", {
    token: "token_invalid_flow",
  });

  const { offlineService } = createHarness({ reservations: [draftReservation] });

  await assert.rejects(
    async () => {
      await offlineService.submitTransferProof({
        token: "token_invalid_flow",
        transferReference: "TRX-X",
        proofNote: "proof",
        actor: "guest",
      });
    },
    /pending transfer submission/
  );

  await assert.rejects(
    async () => {
      await offlineService.confirmPosPaymentByStaff({
        token: "token_invalid_flow",
        staffId: "staff_x",
      });
    },
    /pending POS coordination/
  );
}

async function testHandlesExpiryRestrictionsForTransfer(): Promise<void> {
  const expiredTransfer = createReservation("pending_transfer_submission", {
    id: "res_transfer_expired",
    token: "token_transfer_expired",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T08:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T09:00:00.000Z",
  });

  const { offlineService } = createHarness({
    reservations: [expiredTransfer],
    now: "2026-07-01T10:00:00.000Z",
  });

  const proofResult = await offlineService.submitTransferProof({
    token: "token_transfer_expired",
    transferReference: "TRX-EXP",
    proofNote: "late proof",
    actor: "guest",
  });

  assert.equal(proofResult.reservation.status, "cancelled");
  assert.equal(proofResult.transferMetadata.verificationStatus, "expired");
}

async function testRejectsWhenAvailabilityRecheckFails(): Promise<void> {
  const transferReservation = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_availability",
    token: "token_transfer_availability",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T10:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T11:00:00.000Z",
  });

  const { offlineService, metadataRepository, availabilityGateway } = createHarness({ reservations: [transferReservation] });

  await metadataRepository.createTransferMetadata({
    reservationId: "res_transfer_availability",
    transferReference: "TRX-AVAIL",
    proofNote: "proof",
    proofReceivedAt: "2026-07-01T10:05:00.000Z",
    verificationStatus: "pending",
    verifiedByStaffId: null,
    verifiedAt: null,
    verificationNote: null,
    idempotencyKey: "idem-ava",
  });

  availabilityGateway.preConfirmationTransferAvailable = false;

  await assert.rejects(
    async () => {
      await offlineService.verifyTransferByStaff({
        token: "token_transfer_availability",
        staffId: "staff_ava",
      });
    },
    /pre-confirmation availability recheck failed/
  );
}

async function testBlocksTransferSubmissionWhenPreHoldAvailabilityFails(): Promise<void> {
  const draftReservation = createReservation("draft", {
    token: "token_transfer_prehold_fail",
  });

  const { offlineService, availabilityGateway } = createHarness({ reservations: [draftReservation] });
  availabilityGateway.preHoldAvailable = false;

  await assert.rejects(
    async () => {
      await offlineService.createTransferSubmission({
        token: "token_transfer_prehold_fail",
        actor: "guest",
      });
    },
    /pre-hold availability recheck failed/
  );
}

async function testBlocksPosRequestWhenPreHoldAvailabilityFails(): Promise<void> {
  const draftReservation = createReservation("draft", {
    token: "token_pos_prehold_fail",
  });

  const { offlineService, availabilityGateway } = createHarness({ reservations: [draftReservation] });
  availabilityGateway.preHoldAvailable = false;

  await assert.rejects(
    async () => {
      await offlineService.createPosCoordinationRequest({
        token: "token_pos_prehold_fail",
        actor: "guest",
        contactWindow: "12:00-14:00",
      });
    },
    /pre-hold availability recheck failed/
  );
}

async function testTransferVerificationAfterHoldExpiryCancelsReservation(): Promise<void> {
  const reservation = createReservation("awaiting_transfer_verification", {
    id: "res_transfer_verify_expired",
    token: "token_transfer_verify_expired",
    paymentMethod: "transfer",
    transferHoldStartedAt: "2026-07-01T08:00:00.000Z",
    transferHoldExpiresAt: "2026-07-01T09:00:00.000Z",
  });

  const { offlineService, metadataRepository } = createHarness({
    reservations: [reservation],
    now: "2026-07-01T10:00:00.000Z",
  });

  await metadataRepository.createTransferMetadata({
    reservationId: "res_transfer_verify_expired",
    transferReference: "TRX-VERIFY-EXP",
    proofNote: "proof",
    proofReceivedAt: "2026-07-01T08:10:00.000Z",
    verificationStatus: "pending",
    verifiedByStaffId: null,
    verifiedAt: null,
    verificationNote: null,
    idempotencyKey: "idem-verify-exp",
  });

  const result = await offlineService.verifyTransferByStaff({
    token: "token_transfer_verify_expired",
    staffId: "staff_verify_exp",
  });

  assert.equal(result.reservation.status, "cancelled");
  assert.equal(result.transferMetadata.verificationStatus, "expired");
}

async function testRejectsPosConfirmationWhenAvailabilityRecheckFails(): Promise<void> {
  const reservation = createReservation("pending_pos_coordination", {
    id: "res_pos_availability",
    token: "token_pos_availability",
    paymentMethod: "pos",
  });

  const { offlineService, metadataRepository, availabilityGateway } = createHarness({ reservations: [reservation] });

  await metadataRepository.createPosMetadata({
    reservationId: "res_pos_availability",
    contactWindow: "10:00-12:00",
    coordinationNote: null,
    status: "requested",
    requestedAt: "2026-07-01T10:10:00.000Z",
    completedAt: null,
    completedByStaffId: null,
    idempotencyKey: "idem-pos-avail",
  });

  availabilityGateway.preConfirmationPosAvailable = false;

  await assert.rejects(
    async () => {
      await offlineService.confirmPosPaymentByStaff({
        token: "token_pos_availability",
        staffId: "staff_pos_avail",
      });
    },
    /pre-confirmation availability recheck failed/
  );
}
async function run(): Promise<void> {
  await testCreatesPendingTransferSubmission();
  await testStoresTransferProofAndMovesAwaitingVerification();
  await testConfirmsVerifiedTransferCorrectly();
  await testCreatesPendingPosCoordination();
  await testConfirmsPosPaymentCorrectly();
  await testRejectsInvalidStatusTransitions();
  await testHandlesExpiryRestrictionsForTransfer();
  await testRejectsWhenAvailabilityRecheckFails();
  await testBlocksTransferSubmissionWhenPreHoldAvailabilityFails();
  await testBlocksPosRequestWhenPreHoldAvailabilityFails();
  await testTransferVerificationAfterHoldExpiryCancelsReservation();
  await testRejectsPosConfirmationWhenAvailabilityRecheckFails();

  console.log("offline-payment-service: ok");
}

void run();

