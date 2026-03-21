import assert from "node:assert/strict";

import {
  ResumableDraftService,
  type ResumableDraftStore,
} from "../resumable-draft-service";
import type { BookingToken, PaymentMethod, ReservationStatus } from "../../../types/booking";
import type {
  DraftCreateInput,
  DraftUpdateInput,
  ReservationPricingSnapshot,
} from "../../../types/booking-backend";
import type { DraftSnapshot } from "../draft-service";
import type { ReservationRepositoryReservation } from "../reservation-repository";

class InMemoryDraftStore implements ResumableDraftStore {
  private readonly reservations = new Map<BookingToken, ReservationRepositoryReservation>();
  private sequence = 1;

  constructor(initialReservations?: ReservationRepositoryReservation[]) {
    for (const reservation of initialReservations ?? []) {
      this.reservations.set(reservation.token, cloneReservation(reservation));
    }
  }

  async createDraft(input: DraftCreateInput): Promise<DraftSnapshot> {
    const token = `token_${this.sequence++}`;
    const nowIso = "2026-07-01T10:00:00.000Z";

    const reservation: ReservationRepositoryReservation = {
      id: `res_${this.sequence}`,
      token,
      status: "draft",
      paymentMethod: input.paymentMethod ?? null,
      stay: {
        flatId: "mayfair",
        checkIn: "2026-08-01",
        checkOut: "2026-08-03",
        guests: 2,
        extraIds: [],
      },
      guest: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialRequests: "",
      },
      pricing: createPricing(),
      progressContext: {
        currentStep: 0,
        activeBranch: input.paymentMethod ?? null,
      },
      transferHoldStartedAt: null,
      transferHoldExpiresAt: null,
      inventoryReopenedAt: null,
      lastAvailabilityResult: null,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastTouchedAt: nowIso,
    };

    applyDraftPatch(reservation, input);
    this.reservations.set(token, cloneReservation(reservation));

    return {
      resumeToken: token,
      reservation: cloneReservation(reservation),
    };
  }

  async saveDraftProgress(token: BookingToken, input: DraftUpdateInput): Promise<DraftSnapshot> {
    const existing = this.reservations.get(token);
    if (!existing) {
      throw new Error("Draft reservation not found.");
    }

    const updated = cloneReservation(existing);
    applyDraftPatch(updated, input);
    updated.updatedAt = "2026-07-01T10:05:00.000Z";
    updated.lastTouchedAt = "2026-07-01T10:05:00.000Z";

    this.reservations.set(token, cloneReservation(updated));

    return {
      resumeToken: token,
      reservation: cloneReservation(updated),
    };
  }

  async resumeDraft(token: BookingToken): Promise<DraftSnapshot> {
    const reservation = this.reservations.get(token);
    if (!reservation) {
      throw new Error("Draft reservation not found.");
    }

    return {
      resumeToken: token,
      reservation: cloneReservation(reservation),
    };
  }
}

function createPricing(): ReservationPricingSnapshot {
  return {
    currency: "NGN",
    nightlyRate: null,
    nights: null,
    staySubtotal: null,
    extrasSubtotal: 0,
    estimatedTotal: null,
  };
}

function createReservation(overrides?: Partial<ReservationRepositoryReservation>): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status: "draft",
    paymentMethod: null,
    stay: {
      flatId: "mayfair",
      checkIn: "2026-08-01",
      checkOut: "2026-08-03",
      guests: 2,
      extraIds: ["airport"],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "Quiet floor",
    },
    pricing: createPricing(),
    progressContext: {
      currentStep: 2,
      activeBranch: null,
    },
    transferHoldStartedAt: null,
    transferHoldExpiresAt: null,
    inventoryReopenedAt: null,
    lastAvailabilityResult: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    lastTouchedAt: "2026-07-01T10:00:00.000Z",
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

function applyDraftPatch(reservation: ReservationRepositoryReservation, input: DraftCreateInput | DraftUpdateInput): void {
  if (input.stay) {
    reservation.stay = {
      ...reservation.stay,
      ...input.stay,
      extraIds: input.stay.extraIds ? [...input.stay.extraIds] : reservation.stay.extraIds,
    };
  }

  if (input.guest) {
    reservation.guest = {
      ...reservation.guest,
      ...input.guest,
    };
  }

  if (Object.prototype.hasOwnProperty.call(input, "paymentMethod")) {
    reservation.paymentMethod = input.paymentMethod ?? null;
    reservation.progressContext.activeBranch = reservation.paymentMethod;
  }

  if (input.progressContext) {
    reservation.progressContext = {
      currentStep:
        input.progressContext.currentStep === undefined
          ? reservation.progressContext.currentStep
          : input.progressContext.currentStep,
      activeBranch:
        input.progressContext.activeBranch === undefined
          ? reservation.progressContext.activeBranch
          : input.progressContext.activeBranch,
    };
  }
}

function createService(initialReservations?: ReservationRepositoryReservation[]): ResumableDraftService {
  return new ResumableDraftService({
    draftStore: new InMemoryDraftStore(initialReservations),
  });
}

async function testCreateAndUpdateResumableDraft(): Promise<void> {
  const service = createService();

  const created = await service.createResumableDraft({
    stay: {
      flatId: "mayfair",
      checkIn: "2026-08-10",
      checkOut: "2026-08-13",
      guests: 2,
      extraIds: ["airport"],
    },
    guest: {
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      phone: "+23411111111",
      specialRequests: "",
    },
    paymentMethod: "transfer",
    progressContext: {
      currentStep: 2,
      activeBranch: "transfer",
    },
  });

  assert.equal(created.branchContext.resolvedPaymentMethod, "transfer");
  assert.equal(created.availabilityRevalidationNeeds.createBranchRequest, true);

  const updated = await service.updateResumableDraft(created.resumeToken, {
    guest: {
      specialRequests: "Need airport pickup",
    },
    progressContext: {
      currentStep: 3,
      activeBranch: "transfer",
    },
  });

  assert.equal(updated.reservation.guest.specialRequests, "Need airport pickup");
  assert.equal(updated.branchContext.savedProgressStep, 3);
}

async function testLoadAndReconstructCorrectBranch(): Promise<void> {
  const existing = createReservation({
    token: "token_branch",
    paymentMethod: "website",
    progressContext: {
      currentStep: 4,
      activeBranch: "website",
    },
  });

  const service = createService([existing]);
  const loaded = await service.loadResumableDraft("token_branch");

  assert.equal(loaded.branchContext.resolvedPaymentMethod, "website");
  assert.equal(loaded.branchContext.stepLabels[3], "Review & Checkout");
  assert.equal(loaded.branchContext.resumeStepIndex, 2);
}

async function testPreservesSharedBookingAndGuestData(): Promise<void> {
  const existing = createReservation({ token: "token_shared" });
  const service = createService([existing]);

  const loaded = await service.loadResumableDraft("token_shared");

  assert.equal(loaded.reservation.stay.flatId, "mayfair");
  assert.equal(loaded.reservation.stay.checkIn, "2026-08-01");
  assert.equal(loaded.reservation.guest.firstName, "Ada");
  assert.equal(loaded.reservation.guest.email, "ada@example.com");
}

async function testPreservesSelectedPaymentMethod(): Promise<void> {
  const existing = createReservation({
    token: "token_method",
    paymentMethod: "pos",
    progressContext: {
      currentStep: 2,
      activeBranch: "pos",
    },
  });

  const service = createService([existing]);
  const loaded = await service.loadResumableDraft("token_method");

  assert.equal(loaded.reservation.paymentMethod, "pos");
  assert.equal(loaded.branchContext.resolvedPaymentMethod, "pos");
  assert.equal(loaded.branchContext.stepLabels[4], "POS Coordination");
}

async function testIdentifiesAvailabilityRecheckNeedByState(): Promise<void> {
  const service = createService();

  const statuses: Array<{ status: ReservationStatus; paymentMethod: PaymentMethod | null }> = [
    { status: "draft", paymentMethod: "website" },
    { status: "pending_online_payment", paymentMethod: "website" },
    { status: "awaiting_transfer_verification", paymentMethod: "transfer" },
    { status: "pending_pos_coordination", paymentMethod: "pos" },
  ];

  const needs = statuses.map((item) =>
    service.deriveAvailabilityRevalidationNeeds(
      createReservation({ status: item.status, paymentMethod: item.paymentMethod })
    )
  );

  assert.equal(needs[0].createBranchRequest, true);
  assert.equal(needs[1].onlinePaymentHandoff, true);
  assert.equal(needs[2].transferConfirmation, true);
  assert.equal(needs[3].posConfirmation, true);
}

async function testResetsBranchTransientStateWhenPaymentMethodChangesAfterResume(): Promise<void> {
  const existing = createReservation({
    token: "token_switch",
    paymentMethod: "transfer",
    progressContext: {
      currentStep: 4,
      activeBranch: "transfer",
    },
    stay: {
      flatId: "kensington",
      checkIn: "2026-09-01",
      checkOut: "2026-09-04",
      guests: 3,
      extraIds: ["airport", "pantry"],
    },
  });

  const service = createService([existing]);

  const switched = await service.changePaymentMethodAfterResume({
    token: "token_switch",
    nextPaymentMethod: "website",
  });

  assert.equal(switched.branchReset.applied, true);
  assert.equal(switched.branchReset.clearedTransientState.length, 4);
  assert.equal(switched.snapshot.reservation.paymentMethod, "website");
  assert.equal(switched.snapshot.reservation.progressContext.currentStep, 2);
  assert.equal(switched.snapshot.reservation.progressContext.activeBranch, "website");
  assert.equal(switched.snapshot.reservation.stay.flatId, "kensington");
  assert.equal(switched.snapshot.reservation.guest.email, "ada@example.com");
}

async function run(): Promise<void> {
  await testCreateAndUpdateResumableDraft();
  await testLoadAndReconstructCorrectBranch();
  await testPreservesSharedBookingAndGuestData();
  await testPreservesSelectedPaymentMethod();
  await testIdentifiesAvailabilityRecheckNeedByState();
  await testResetsBranchTransientStateWhenPaymentMethodChangesAfterResume();

  console.log("resumable-draft-service: ok");
}

void run();
