import assert from "node:assert/strict";

import { DraftService } from "../draft-service";
import { ReservationService, type ReservationInventoryGateway } from "../reservation-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../reservation-repository";
import type {
  DraftUpdateInput,
  ReservationPricingSnapshot,
} from "../../../types/booking-backend";
import type { BookingToken, ExtraId, FlatId } from "../../../types/booking";

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

function createExistingReservation(overrides: Partial<ReservationRepositoryReservation>): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status: "draft",
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

function createDraftServiceHarness(options?: { reservations?: ReservationRepositoryReservation[] }) {
  const repository = new InMemoryReservationRepository({ reservations: options?.reservations });
  const reservationService = new ReservationService({
    repository,
    inventoryGateway: new NoopInventoryGateway(),
    now: () => new Date("2026-07-01T10:00:00.000Z"),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  const draftService = new DraftService({ reservationService });

  return { draftService };
}

async function testCreateNewDraft(): Promise<void> {
  const { draftService } = createDraftServiceHarness();

  const created = await draftService.createDraft({
    stay: {
      flatId: "mayfair",
      checkIn: "2026-08-01",
      checkOut: "2026-08-03",
      guests: 2,
      extraIds: ["airport"],
    },
    guest: {
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      phone: "+2348000000000",
      specialRequests: "",
    },
  });

  assert.equal(created.reservation.status, "draft");
  assert.equal(created.resumeToken, "token_generated");
}

async function testUpdateExistingDraft(): Promise<void> {
  const existing = createExistingReservation({ token: "token_update" });
  const { draftService } = createDraftServiceHarness({ reservations: [existing] });

  const updated = await draftService.saveDraftProgress("token_update", {
    stay: {
      checkOut: "2026-07-13",
      extraIds: ["airport", "pantry"],
    },
  });

  assert.equal(updated.reservation.pricing.nights, 3);
  assert.equal(updated.reservation.pricing.extrasSubtotal, 110000);
}

async function testResumeDraft(): Promise<void> {
  const existing = createExistingReservation({ token: "token_resume" });
  const { draftService } = createDraftServiceHarness({ reservations: [existing] });

  const resumed = await draftService.resumeDraft("token_resume");

  assert.equal(resumed.reservation.token, "token_resume");
  assert.equal(resumed.reservation.status, "draft");
}

async function testPreservesSharedDataOnPartialUpdate(): Promise<void> {
  const existing = createExistingReservation({ token: "token_shared" });
  const { draftService } = createDraftServiceHarness({ reservations: [existing] });

  const updated = await draftService.saveDraftProgress("token_shared", {
    paymentMethod: "transfer",
  });

  assert.equal(updated.reservation.paymentMethod, "transfer");
  assert.equal(updated.reservation.stay.checkIn, existing.stay.checkIn);
  assert.equal(updated.reservation.guest.email, existing.guest.email);
}

async function testRejectsInvalidDraftUpdate(): Promise<void> {
  const existing = createExistingReservation({ token: "token_invalid" });
  const { draftService } = createDraftServiceHarness({ reservations: [existing] });

  await assert.rejects(
    async () => {
      await draftService.saveDraftProgress("token_invalid", {} as DraftUpdateInput);
    },
    /Draft update payload is empty/
  );
}

async function testRejectsSavingNonDraftReservation(): Promise<void> {
  const existing = createExistingReservation({
    token: "token_not_draft",
    status: "confirmed",
  });
  const { draftService } = createDraftServiceHarness({ reservations: [existing] });

  await assert.rejects(
    async () => {
      await draftService.saveDraftProgress("token_not_draft", {
        paymentMethod: "website",
      });
    },
    /Only draft reservations can be updated/
  );
}

async function run(): Promise<void> {
  await testCreateNewDraft();
  await testUpdateExistingDraft();
  await testResumeDraft();
  await testPreservesSharedDataOnPartialUpdate();
  await testRejectsInvalidDraftUpdate();
  await testRejectsSavingNonDraftReservation();

  console.log("draft-service: ok");
}

void run();
