import type {
  BookingToken,
  ExtraId,
  FlatId,
  PaymentMethod,
  ReservationStatus,
} from "../../../../types/booking";
import type {
  PaymentAttemptRecord,
  ReservationPricingSnapshot,
} from "../../../../types/booking-backend";
import type { AvailabilityCheckResult } from "../../../../server/booking/availability-service";
import type {
  ReservationRepository,
  ReservationRepositoryFlat,
  ReservationRepositoryReservation,
} from "../../../../server/booking/reservation-repository";
import {
  ReservationService,
  type ReservationInventoryGateway,
} from "../../../../server/booking/reservation-service";
import {
  WebsitePaymentService,
  type FlutterwaveCheckoutClient,
  type WebsitePaymentAttemptRepository,
  type WebsitePaymentAvailabilityGateway,
  type WebsitePaymentIdempotencyGateway,
} from "../../../../server/booking/website-payment-service";

export class InMemoryReservationRepository implements ReservationRepository {
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

  async findById(reservationId: string): Promise<ReservationRepositoryReservation | null> {
    const found = Array.from(this.reservationsByToken.values()).find((reservation) => reservation.id === reservationId);
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

export class NoopInventoryGateway implements ReservationInventoryGateway {
  async syncAvailabilityBlock(reservation: ReservationRepositoryReservation): Promise<void> {
    void reservation;
  }

  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
  }
}

export class SpyAvailabilityGateway implements WebsitePaymentAvailabilityGateway {
  preCheckoutAvailable = true;
  readonly calls: string[] = [];

  async checkPreCheckoutReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: PaymentMethod
  ): Promise<AvailabilityCheckResult> {
    this.calls.push(`${reservation.token}:${paymentMethod}`);

    return {
      intent: "pre_checkout",
      checkpoint: "pre_online_payment_handoff",
      isAvailable: this.preCheckoutAvailable,
      checkedAt: "2026-07-01T10:00:00.000Z",
      reasons: this.preCheckoutAvailable ? ["ok"] : ["blocked"],
      conflicts: this.preCheckoutAvailable
        ? []
        : [{ code: "sold_out", field: "stay", message: "Unavailable" }],
      inventoryVersion: "inventory-fixed",
    };
  }
}

export class InMemoryPaymentAttemptRepository implements WebsitePaymentAttemptRepository {
  private sequence = 1;
  readonly attempts: PaymentAttemptRecord[] = [];

  async createPendingAttempt(input: {
    reservationId: string;
    amount: number;
    currency: "NGN";
    txRef: string;
    idempotencyKey: string;
  }): Promise<PaymentAttemptRecord> {
    const record: PaymentAttemptRecord = {
      id: `pay_${this.sequence++}`,
      reservationId: input.reservationId,
      paymentMethod: "website",
      provider: "flutterwave",
      outcome: "pending",
      amount: input.amount,
      currency: input.currency,
      providerReference: input.txRef,
      idempotencyKey: input.idempotencyKey,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T10:00:00.000Z",
    };

    this.attempts.push(record);
    return { ...record };
  }

  async findLatestAttemptByReservationId(reservationId: string): Promise<PaymentAttemptRecord | null> {
    const found = this.attempts
      .filter((attempt) => attempt.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return found ? { ...found } : null;
  }

  async findAttemptByTxRef(txRef: string): Promise<PaymentAttemptRecord | null> {
    const found = this.attempts
      .filter((attempt) => attempt.providerReference === txRef)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return found ? { ...found } : null;
  }

  async updateAttemptOutcome(input: {
    id: string;
    outcome: PaymentAttemptRecord["outcome"];
    providerReference?: string;
  }): Promise<PaymentAttemptRecord> {
    const index = this.attempts.findIndex((attempt) => attempt.id === input.id);
    if (index < 0) {
      throw new Error("Payment attempt not found.");
    }

    const updated: PaymentAttemptRecord = {
      ...this.attempts[index],
      outcome: input.outcome,
      providerReference: input.providerReference ?? this.attempts[index].providerReference,
      updatedAt: "2026-07-01T10:00:00.000Z",
    };

    this.attempts[index] = updated;
    return { ...updated };
  }
}

export class InMemoryIdempotencyGateway implements WebsitePaymentIdempotencyGateway {
  private readonly cache = new Map<string, { payloadHash: string; result: unknown }>();

  async run<TPayload, TResult>(input: {
    key: string;
    action: string;
    payload: TPayload;
    execute: () => Promise<TResult>;
  }): Promise<TResult> {
    const cacheKey = `${input.action}:${input.key}`;
    const payloadHash = JSON.stringify(input.payload);
    const found = this.cache.get(cacheKey);

    if (found) {
      if (found.payloadHash !== payloadHash) {
        throw new Error("Idempotency conflict");
      }

      return found.result as TResult;
    }

    const result = await input.execute();
    this.cache.set(cacheKey, { payloadHash, result });
    return result;
  }
}

export class SpyFlutterwaveClient implements FlutterwaveCheckoutClient {
  createCheckoutCalls = 0;
  verifyCalls = 0;

  createCheckoutResponse = {
    paymentLink: "https://checkout.flutterwave.test/pay/abc",
  };

  verifyResponse: {
    status: string;
    txRef: string;
    amount: number;
    currency: string;
    transactionId: string;
  } = {
    status: "successful",
    txRef: "tx_ref_1",
    amount: 500000,
    currency: "NGN",
    transactionId: "12345",
  };

  async createCheckout(payload: {
    txRef: string;
    amount: number;
    currency: "NGN";
    redirectUrl: string;
    customer: {
      email: string;
      name: string;
      phone: string;
    };
    meta: Record<string, string>;
  }): Promise<{ paymentLink: string }> {
    this.createCheckoutCalls += 1;
    void payload;
    return this.createCheckoutResponse;
  }

  async verifyTransaction(transactionId: string): Promise<{
    status: string;
    txRef: string;
    amount: number;
    currency: string;
    transactionId: string;
  }> {
    this.verifyCalls += 1;
    void transactionId;
    return { ...this.verifyResponse };
  }
}

export function createEmptyPricing(total: number): ReservationPricingSnapshot {
  return {
    currency: "NGN",
    nightlyRate: 250000,
    nights: 2,
    staySubtotal: 500000,
    extrasSubtotal: 0,
    estimatedTotal: total,
  };
}

export function createReservation(
  status: ReservationStatus,
  overrides?: Partial<ReservationRepositoryReservation>
): ReservationRepositoryReservation {
  return {
    id: "res_existing",
    token: "token_existing",
    status,
    paymentMethod: status === "draft" ? null : "website",
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
    pricing: createEmptyPricing(500000),
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

export function cloneReservation(value: ReservationRepositoryReservation): ReservationRepositoryReservation {
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

export function createFlutterwaveHarness(options?: {
  reservations?: ReservationRepositoryReservation[];
  preCheckoutAvailable?: boolean;
  txRef?: string;
}) {
  const repository = new InMemoryReservationRepository({ reservations: options?.reservations });
  const reservationService = new ReservationService({
    repository,
    inventoryGateway: new NoopInventoryGateway(),
    now: () => new Date("2026-07-01T10:00:00.000Z"),
    createId: () => "res_generated",
    createToken: () => "token_generated",
  });

  const availabilityGateway = new SpyAvailabilityGateway();
  if (options?.preCheckoutAvailable === false) {
    availabilityGateway.preCheckoutAvailable = false;
  }

  const paymentAttemptRepository = new InMemoryPaymentAttemptRepository();
  const idempotencyGateway = new InMemoryIdempotencyGateway();
  const flutterwaveClient = new SpyFlutterwaveClient();

  const service = new WebsitePaymentService({
    reservationService,
    reservationQuery: {
      findById: async (reservationId: string) => repository.findById(reservationId),
    },
    availabilityGateway,
    paymentAttemptRepository,
    idempotencyGateway,
    flutterwaveClient,
    redirectUrl: "https://example.com/api/payments/website/callback",
    createTxRef: () => options?.txRef ?? "tx_ref_1",
  });

  return {
    service,
    reservationService,
    availabilityGateway,
    paymentAttemptRepository,
    idempotencyGateway,
    flutterwaveClient,
    repository,
  };
}


