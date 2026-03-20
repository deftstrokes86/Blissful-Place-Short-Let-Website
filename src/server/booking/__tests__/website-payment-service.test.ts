import assert from "node:assert/strict";

import {
  WebsitePaymentService,
  type WebsitePaymentAttemptRepository,
  type WebsitePaymentAvailabilityGateway,
  type WebsitePaymentIdempotencyGateway,
  type FlutterwaveCheckoutClient,
} from "../website-payment-service";
import {
  ReservationService,
  type ReservationInventoryGateway,
} from "../reservation-service";
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
  PaymentAttemptRecord,
  ReservationPricingSnapshot,
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

class NoopInventoryGateway implements ReservationInventoryGateway {
  async reopenAvailability(reservationId: string, reason: "cancelled" | "expired"): Promise<void> {
    void reservationId;
    void reason;
  }
}

class SpyAvailabilityGateway implements WebsitePaymentAvailabilityGateway {
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

class InMemoryPaymentAttemptRepository implements WebsitePaymentAttemptRepository {
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
    const found = this.attempts.find((attempt) => attempt.providerReference === txRef);
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

class InMemoryIdempotencyGateway implements WebsitePaymentIdempotencyGateway {
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

class SpyFlutterwaveClient implements FlutterwaveCheckoutClient {
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

function createEmptyPricing(total: number): ReservationPricingSnapshot {
  return {
    currency: "NGN",
    nightlyRate: 250000,
    nights: 2,
    staySubtotal: 500000,
    extrasSubtotal: 0,
    estimatedTotal: total,
  };
}

function createReservation(status: ReservationStatus, overrides?: Partial<ReservationRepositoryReservation>): ReservationRepositoryReservation {
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

function createHarness(options?: {
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
    flutterwaveClient,
  };
}

async function testInitiatesFlutterwaveCheckout(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_ok",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, paymentAttemptRepository, flutterwaveClient } = createHarness({ reservations: [reservation] });

  const result = await service.initiateCheckout({
    token: "token_checkout_ok",
    idempotencyKey: "idem-checkout-1",
  });

  assert.equal(result.checkoutReference, "tx_ref_1");
  assert.equal(result.checkoutUrl, "https://checkout.flutterwave.test/pay/abc");
  assert.equal(result.reservation.status, "pending_online_payment");
  assert.equal(paymentAttemptRepository.attempts.length, 1);
  assert.equal(paymentAttemptRepository.attempts[0].provider, "flutterwave");
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "pending");
  assert.equal(flutterwaveClient.createCheckoutCalls, 1);
}

async function testBlocksCheckoutWhenPreCheckoutAvailabilityFails(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_blocked",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, paymentAttemptRepository } = createHarness({
    reservations: [reservation],
    preCheckoutAvailable: false,
  });

  await assert.rejects(
    async () => {
      await service.initiateCheckout({
        token: "token_checkout_blocked",
        idempotencyKey: "idem-checkout-2",
      });
    },
    /pre-checkout availability recheck failed/
  );

  assert.equal(paymentAttemptRepository.attempts.length, 0);
}

async function testConfirmsReservationOnlyAfterVerifiedSuccess(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_confirm_1",
    token: "token_confirm_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService, paymentAttemptRepository, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_confirm_1",
  });

  await service.initiateCheckout({
    token: "token_confirm_1",
    idempotencyKey: "idem-checkout-3",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_confirm_1",
    amount: 500000,
    currency: "NGN",
    transactionId: "12345",
  };

  await service.handleCallback({
    txRef: "tx_ref_confirm_1",
    transactionId: "12345",
    status: "successful",
  });

  const updated = await reservationService.getReservationByToken("token_confirm_1");
  assert.equal(updated?.status, "confirmed");
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "success");
}

async function testDoesNotConfirmWhenVerificationDataMismatches(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_fail_1",
    token: "token_fail_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_fail_1",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_other",
    amount: 500000,
    currency: "NGN",
    transactionId: "12345",
  };

  await service.initiateCheckout({
    token: "token_fail_1",
    idempotencyKey: "idem-checkout-4",
  });

  await service.handleCallback({
    txRef: "tx_ref_fail_1",
    transactionId: "12345",
    status: "successful",
  });

  const updated = await reservationService.getReservationByToken("token_fail_1");
  assert.equal(updated?.status, "failed_payment");
}

async function testRequiresTransactionIdForSuccessfulCallback(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_callback_1",
    token: "token_callback_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_callback_1",
  });

  await service.initiateCheckout({
    token: "token_callback_1",
    idempotencyKey: "idem-checkout-5",
  });

  await assert.rejects(
    async () => {
      await service.handleCallback({
        txRef: "tx_ref_callback_1",
        transactionId: null,
        status: "successful",
      });
    },
    /transaction_id is required/
  );
}

async function testRejectsWebhookWhenSignatureIsInvalid(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_webhook_1",
    token: "token_webhook_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_webhook_1",
  });

  await service.initiateCheckout({
    token: "token_webhook_1",
    idempotencyKey: "idem-checkout-6",
  });

  const payload = {
    event: "charge.completed",
    data: {
      id: 12345,
      tx_ref: "tx_ref_webhook_1",
      status: "successful",
    },
  };

  await assert.rejects(
    async () => {
      await service.handleWebhook({
        rawBody: JSON.stringify(payload),
        signature: "bad-signature",
        secretHash: "topsecret",
        payload,
      });
    },
    /Invalid Flutterwave webhook signature/
  );
}

async function testIsSafeToProcessDuplicateWebhookEvents(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_webhook_2",
    token: "token_webhook_2",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_webhook_2",
  });

  await service.initiateCheckout({
    token: "token_webhook_2",
    idempotencyKey: "idem-checkout-7",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_webhook_2",
    amount: 500000,
    currency: "NGN",
    transactionId: "12345",
  };

  const payload = {
    event: "charge.completed",
    data: {
      id: 12345,
      tx_ref: "tx_ref_webhook_2",
      status: "successful",
    },
  };

  await service.handleWebhook({
    rawBody: JSON.stringify(payload),
    signature: "topsecret",
    secretHash: "topsecret",
    payload,
  });

  await service.handleWebhook({
    rawBody: JSON.stringify(payload),
    signature: "topsecret",
    secretHash: "topsecret",
    payload,
  });

  const updated = await reservationService.getReservationByToken("token_webhook_2");
  assert.equal(updated?.status, "confirmed");
}

async function testCheckoutInitiationIsIdempotent(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_idem",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, paymentAttemptRepository, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_idem_1",
  });

  const first = await service.initiateCheckout({
    token: "token_checkout_idem",
    idempotencyKey: "idem-checkout-same",
  });

  const second = await service.initiateCheckout({
    token: "token_checkout_idem",
    idempotencyKey: "idem-checkout-same",
  });

  assert.equal(first.checkoutReference, second.checkoutReference);
  assert.equal(paymentAttemptRepository.attempts.length, 1);
  assert.equal(flutterwaveClient.createCheckoutCalls, 1);
}

async function testHandlesCancelledPaymentWithoutConfirmation(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_cancel_1",
    token: "token_cancel_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService, paymentAttemptRepository } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_cancel_1",
  });

  await service.initiateCheckout({
    token: "token_cancel_1",
    idempotencyKey: "idem-cancel-1",
  });

  await service.handleCallback({
    txRef: "tx_ref_cancel_1",
    transactionId: null,
    status: "cancelled",
  });

  const updated = await reservationService.getReservationByToken("token_cancel_1");
  assert.equal(updated?.status, "cancelled");
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "cancelled");
}

async function testRetryCheckoutReinitiatesAfterFailedPayment(): Promise<void> {
  const reservation = createReservation("failed_payment", {
    id: "res_retry_1",
    token: "token_retry_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService, paymentAttemptRepository, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_retry_1",
  });

  const checkout = await service.retryCheckout({
    token: "token_retry_1",
    idempotencyKey: "idem-retry-1",
  });

  assert.equal(checkout.reservation.status, "pending_online_payment");
  assert.equal(checkout.checkoutReference, "tx_ref_retry_1");
  assert.equal(paymentAttemptRepository.attempts.length, 1);
  assert.equal(flutterwaveClient.createCheckoutCalls, 1);

  const updated = await reservationService.getReservationByToken("token_retry_1");
  assert.equal(updated?.status, "pending_online_payment");
}

async function testRetryCheckoutIsIdempotentForSameKey(): Promise<void> {
  const reservation = createReservation("failed_payment", {
    id: "res_retry_idem_1",
    token: "token_retry_idem_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, paymentAttemptRepository, flutterwaveClient } = createHarness({
    reservations: [reservation],
    txRef: "tx_ref_retry_idem_1",
  });

  const first = await service.retryCheckout({
    token: "token_retry_idem_1",
    idempotencyKey: "idem-retry-same",
  });

  const second = await service.retryCheckout({
    token: "token_retry_idem_1",
    idempotencyKey: "idem-retry-same",
  });

  assert.equal(first.checkoutReference, second.checkoutReference);
  assert.equal(paymentAttemptRepository.attempts.length, 1);
  assert.equal(flutterwaveClient.createCheckoutCalls, 1);
}

async function testSwitchFailedPaymentMethodMovesToTransferBranch(): Promise<void> {
  const reservation = createReservation("failed_payment", {
    id: "res_switch_transfer_1",
    token: "token_switch_transfer_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service, reservationService } = createHarness({
    reservations: [reservation],
  });

  const switched = await service.switchFailedPaymentMethod({
    token: "token_switch_transfer_1",
    targetMethod: "transfer",
    idempotencyKey: "idem-switch-transfer-1",
  });

  assert.equal(switched.status, "pending_transfer_submission");
  assert.equal(switched.paymentMethod, "transfer");
  assert.notEqual(switched.transferHoldExpiresAt, null);

  const updated = await reservationService.getReservationByToken("token_switch_transfer_1");
  assert.equal(updated?.status, "pending_transfer_submission");
  assert.equal(updated?.paymentMethod, "transfer");
}

async function testSwitchFailedPaymentMethodHonorsAvailabilityGate(): Promise<void> {
  const reservation = createReservation("failed_payment", {
    id: "res_switch_blocked_1",
    token: "token_switch_blocked_1",
    paymentMethod: "website",
    pricing: createEmptyPricing(500000),
  });

  const { service } = createHarness({
    reservations: [reservation],
    preCheckoutAvailable: false,
  });

  await assert.rejects(
    async () => {
      await service.switchFailedPaymentMethod({
        token: "token_switch_blocked_1",
        targetMethod: "pos",
        idempotencyKey: "idem-switch-blocked-1",
      });
    },
    /availability recheck failed/
  );
}
async function run(): Promise<void> {
  await testInitiatesFlutterwaveCheckout();
  await testBlocksCheckoutWhenPreCheckoutAvailabilityFails();
  await testConfirmsReservationOnlyAfterVerifiedSuccess();
  await testDoesNotConfirmWhenVerificationDataMismatches();
  await testRequiresTransactionIdForSuccessfulCallback();
  await testRejectsWebhookWhenSignatureIsInvalid();
  await testIsSafeToProcessDuplicateWebhookEvents();
  await testCheckoutInitiationIsIdempotent();
  await testHandlesCancelledPaymentWithoutConfirmation();
  await testRetryCheckoutReinitiatesAfterFailedPayment();
  await testRetryCheckoutIsIdempotentForSameKey();
  await testSwitchFailedPaymentMethodMovesToTransferBranch();
  await testSwitchFailedPaymentMethodHonorsAvailabilityGate();

  console.log("website-payment-service: ok");
}

void run();




