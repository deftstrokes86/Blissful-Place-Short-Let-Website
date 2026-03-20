import { createHmac, timingSafeEqual } from "node:crypto";

import type { FlutterwaveCheckoutClient } from "./flutterwave-client";
import type { WebsitePaymentIdempotencyGateway } from "./idempotency-service";
import type { AvailabilityCheckResult } from "./availability-service";
import type { WebsitePaymentReservationQuery } from "./file-reservation-query";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { ReservationService } from "./reservation-service";
import type { PaymentMethod, BookingToken } from "../../types/booking";
import type { PaymentAttemptRecord } from "../../types/booking-backend";
import {
  PaymentAttemptService,
  type WebsiteTxRefFactory,
} from "../payments/payment-attempt-service";
import { FlutterwaveService } from "../payments/flutterwave-service";

export type { FlutterwaveCheckoutClient, WebsitePaymentIdempotencyGateway };

export interface WebsitePaymentAvailabilityGateway {
  checkPreCheckoutReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: PaymentMethod
  ): Promise<AvailabilityCheckResult>;
}

export interface WebsitePaymentAttemptRepository {
  createPendingAttempt(input: {
    reservationId: string;
    amount: number;
    currency: "NGN";
    txRef: string;
    idempotencyKey: string;
  }): Promise<PaymentAttemptRecord>;
  findLatestAttemptByReservationId(reservationId: string): Promise<PaymentAttemptRecord | null>;
  findAttemptByTxRef(txRef: string): Promise<PaymentAttemptRecord | null>;
  updateAttemptOutcome(input: {
    id: string;
    outcome: PaymentAttemptRecord["outcome"];
    providerReference?: string;
  }): Promise<PaymentAttemptRecord>;
}

interface WebsitePaymentServiceDependencies {
  reservationService: Pick<ReservationService, "getReservationByToken" | "transitionReservation">;
  reservationQuery: WebsitePaymentReservationQuery;
  availabilityGateway: WebsitePaymentAvailabilityGateway;
  paymentAttemptRepository: WebsitePaymentAttemptRepository;
  idempotencyGateway: WebsitePaymentIdempotencyGateway;
  flutterwaveClient: FlutterwaveCheckoutClient;
  redirectUrl: string;
  createTxRef?: WebsiteTxRefFactory;
}

export interface InitiateWebsiteCheckoutInput {
  token: BookingToken;
  idempotencyKey: string;
}

export interface RetryWebsiteCheckoutInput {
  token: BookingToken;
  idempotencyKey: string;
}

export interface SwitchFailedPaymentMethodInput {
  token: BookingToken;
  targetMethod: Exclude<PaymentMethod, "website">;
  idempotencyKey: string;
}

export interface WebsiteCheckoutSession {
  reservation: ReservationRepositoryReservation;
  paymentAttempt: PaymentAttemptRecord;
  checkoutReference: string;
  checkoutUrl: string;
}

export interface HandleWebsiteCallbackInput {
  txRef: string;
  transactionId: string | null;
  status: string | null;
}

export interface HandleWebsiteWebhookInput {
  rawBody: string;
  signature: string | null;
  secretHash: string;
  payload: unknown;
}

export interface WebsitePaymentProcessingResult {
  reservation: ReservationRepositoryReservation;
  paymentAttempt: PaymentAttemptRecord;
  verified: boolean;
}

interface ParsedWebhookPayload {
  txRef: string;
  transactionId: string | null;
  status: string | null;
}

const SUCCESS_STATUSES = new Set(["successful", "success", "succeeded"]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled"]);

function normalizeStatus(status: string | null): string {
  return (status ?? "").trim().toLowerCase();
}

function normalizeTxRef(value: string): string {
  return value.trim();
}

function secureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidFlutterwaveSignature(rawBody: string, signature: string, secretHash: string): boolean {
  const normalizedSignature = signature.trim();
  const normalizedSecret = secretHash.trim();

  if (normalizedSignature.length === 0 || normalizedSecret.length === 0) {
    return false;
  }

  if (secureEquals(normalizedSignature, normalizedSecret)) {
    return true;
  }

  const digestHex = createHmac("sha256", normalizedSecret).update(rawBody).digest("hex");
  if (secureEquals(normalizedSignature, digestHex)) {
    return true;
  }

  const digestBase64 = createHmac("sha256", normalizedSecret).update(rawBody).digest("base64");
  return secureEquals(normalizedSignature, digestBase64);
}

function parseWebhookPayload(payload: unknown): ParsedWebhookPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid Flutterwave webhook payload.");
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid Flutterwave webhook payload.");
  }

  const dataRecord = data as Record<string, unknown>;
  const txRef = dataRecord.tx_ref;

  if (typeof txRef !== "string" || txRef.trim().length === 0) {
    throw new Error("Flutterwave webhook payload is missing tx_ref.");
  }

  const transactionIdRaw = dataRecord.id;
  const statusRaw = dataRecord.status;

  return {
    txRef: txRef.trim(),
    transactionId: transactionIdRaw === undefined || transactionIdRaw === null ? null : String(transactionIdRaw),
    status: typeof statusRaw === "string" ? statusRaw : null,
  };
}

export class WebsitePaymentService {
  private readonly reservationService: WebsitePaymentServiceDependencies["reservationService"];
  private readonly reservationQuery: WebsitePaymentServiceDependencies["reservationQuery"];
  private readonly availabilityGateway: WebsitePaymentServiceDependencies["availabilityGateway"];
  private readonly paymentAttemptRepository: WebsitePaymentServiceDependencies["paymentAttemptRepository"];
  private readonly idempotencyGateway: WebsitePaymentServiceDependencies["idempotencyGateway"];
  private readonly flutterwaveClient: WebsitePaymentServiceDependencies["flutterwaveClient"];
  private readonly redirectUrl: string;
  private readonly paymentAttemptService: PaymentAttemptService;
  private readonly flutterwaveService: FlutterwaveService;

  constructor(dependencies: WebsitePaymentServiceDependencies) {
    this.reservationService = dependencies.reservationService;
    this.reservationQuery = dependencies.reservationQuery;
    this.availabilityGateway = dependencies.availabilityGateway;
    this.paymentAttemptRepository = dependencies.paymentAttemptRepository;
    this.idempotencyGateway = dependencies.idempotencyGateway;
    this.flutterwaveClient = dependencies.flutterwaveClient;
    this.redirectUrl = dependencies.redirectUrl;
    this.paymentAttemptService = new PaymentAttemptService({
      repository: dependencies.paymentAttemptRepository,
      createTxRef: dependencies.createTxRef,
    });
    this.flutterwaveService = new FlutterwaveService({
      checkoutClient: dependencies.flutterwaveClient,
    });
  }

  async initiateCheckout(input: InitiateWebsiteCheckoutInput): Promise<WebsiteCheckoutSession> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "website.checkout.initiate",
      payload: {
        token: input.token,
      },
      execute: async () => this.startCheckout(input.token, input.idempotencyKey),
    });
  }

  async retryCheckout(input: RetryWebsiteCheckoutInput): Promise<WebsiteCheckoutSession> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "website.checkout.retry",
      payload: {
        token: input.token,
      },
      execute: async () => {
        const reservation = await this.requireReservationByToken(input.token);
        if (reservation.status !== "failed_payment" || reservation.paymentMethod !== "website") {
          throw new Error("Retry checkout requires failed website payment status.");
        }

        return this.startCheckout(input.token, input.idempotencyKey);
      },
    });
  }

  async switchFailedPaymentMethod(input: SwitchFailedPaymentMethodInput): Promise<ReservationRepositoryReservation> {
    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "website.checkout.switch_method",
      payload: {
        token: input.token,
        targetMethod: input.targetMethod,
      },
      execute: async () => {
        const reservation = await this.requireReservationByToken(input.token);

        if (reservation.status !== "failed_payment" || reservation.paymentMethod !== "website") {
          throw new Error("Switch payment method requires failed website payment status.");
        }

        const availability = await this.availabilityGateway.checkPreCheckoutReservation(
          reservation,
          input.targetMethod
        );

        if (!availability.isAvailable) {
          throw new Error("payment method switch availability recheck failed.");
        }

        return this.reservationService.transitionReservation({
          token: reservation.token,
          event: "switch_payment_method",
          actor: "guest",
          paymentMethod: input.targetMethod,
          branchResetApplied: true,
          availabilityPassed: true,
        });
      },
    });
  }

  async handleCallback(input: HandleWebsiteCallbackInput): Promise<WebsitePaymentProcessingResult> {
    const txRef = normalizeTxRef(input.txRef);
    const status = normalizeStatus(input.status);

    if (SUCCESS_STATUSES.has(status) && !input.transactionId) {
      throw new Error("Flutterwave callback transaction_id is required for successful payments.");
    }

    return this.processPaymentResult({
      txRef,
      transactionId: input.transactionId,
      status,
    });
  }

  async handleWebhook(input: HandleWebsiteWebhookInput): Promise<WebsitePaymentProcessingResult> {
    if (!input.signature || !isValidFlutterwaveSignature(input.rawBody, input.signature, input.secretHash)) {
      throw new Error("Invalid Flutterwave webhook signature.");
    }

    const parsed = parseWebhookPayload(input.payload);

    return this.processPaymentResult({
      txRef: parsed.txRef,
      transactionId: parsed.transactionId,
      status: normalizeStatus(parsed.status),
    });
  }

  private async startCheckout(token: BookingToken, idempotencyKey: string): Promise<WebsiteCheckoutSession> {
    const reservation = await this.requireReservationByToken(token);

    const availability = await this.availabilityGateway.checkPreCheckoutReservation(reservation, "website");
    if (!availability.isAvailable) {
      throw new Error("pre-checkout availability recheck failed.");
    }

    const transitioned = await this.ensureReservationReadyForCheckout(reservation);

    const expectedAmount = transitioned.pricing.estimatedTotal;
    if (expectedAmount === null || expectedAmount <= 0) {
      throw new Error("Reservation has no payable website checkout amount.");
    }

    const attempt = await this.paymentAttemptService.createWebsitePendingAttempt({
      reservation: transitioned,
      amount: expectedAmount,
      currency: "NGN",
      idempotencyKey,
    });

    const checkout = await this.flutterwaveService.createWebsiteCheckoutHandoff({
      reservation: transitioned,
      paymentAttemptId: attempt.paymentAttempt.id,
      txRef: attempt.txRef,
      amount: expectedAmount,
      currency: "NGN",
      redirectUrl: this.redirectUrl,
    });

    return {
      reservation: transitioned,
      paymentAttempt: attempt.paymentAttempt,
      checkoutReference: checkout.checkoutReference,
      checkoutUrl: checkout.checkoutUrl,
    };
  }

  private async ensureReservationReadyForCheckout(
    reservation: ReservationRepositoryReservation
  ): Promise<ReservationRepositoryReservation> {
    if (reservation.status === "pending_online_payment") {
      if (reservation.paymentMethod !== "website") {
        throw new Error("Website checkout requires website payment method.");
      }

      return this.reservationService.transitionReservation({
        token: reservation.token,
        event: "online_payment_handoff_requested",
        actor: "guest",
        availabilityPassed: true,
      });
    }

    if (reservation.status === "draft") {
      if (reservation.paymentMethod && reservation.paymentMethod !== "website") {
        throw new Error("Website checkout requires website payment method.");
      }

      const pendingOnlinePayment = await this.reservationService.transitionReservation({
        token: reservation.token,
        event: "branch_request_created",
        actor: "guest",
        paymentMethod: "website",
        availabilityPassed: true,
      });

      return this.reservationService.transitionReservation({
        token: pendingOnlinePayment.token,
        event: "online_payment_handoff_requested",
        actor: "guest",
        availabilityPassed: true,
      });
    }

    if (reservation.status === "failed_payment") {
      if (reservation.paymentMethod !== "website") {
        throw new Error("Website checkout retry requires website payment method.");
      }

      const retried = await this.reservationService.transitionReservation({
        token: reservation.token,
        event: "try_online_payment_again",
        actor: "guest",
        availabilityPassed: true,
      });

      return this.reservationService.transitionReservation({
        token: retried.token,
        event: "online_payment_handoff_requested",
        actor: "guest",
        availabilityPassed: true,
      });
    }

    throw new Error("Website checkout requires pending online payment status.");
  }

  private async processPaymentResult(input: {
    txRef: string;
    transactionId: string | null;
    status: string;
  }): Promise<WebsitePaymentProcessingResult> {
    const paymentAttempt = await this.paymentAttemptRepository.findAttemptByTxRef(input.txRef);
    if (!paymentAttempt) {
      throw new Error("Payment attempt was not found for this Flutterwave reference.");
    }

    const reservation = await this.reservationQuery.findById(paymentAttempt.reservationId);
    if (!reservation) {
      throw new Error("Reservation not found for this payment attempt.");
    }

    if (reservation.status === "confirmed" && paymentAttempt.outcome === "success") {
      return {
        reservation,
        paymentAttempt,
        verified: true,
      };
    }

    if (reservation.status === "cancelled" && paymentAttempt.outcome === "cancelled") {
      return {
        reservation,
        paymentAttempt,
        verified: false,
      };
    }

    if (!input.transactionId) {
      if (CANCELLED_STATUSES.has(input.status)) {
        const cancelled = await this.ensureCancelledPayment(reservation, paymentAttempt);
        return {
          reservation: cancelled.reservation,
          paymentAttempt: cancelled.paymentAttempt,
          verified: false,
        };
      }

      const failed = await this.ensureFailedPayment(reservation, paymentAttempt);
      return {
        reservation: failed.reservation,
        paymentAttempt: failed.paymentAttempt,
        verified: false,
      };
    }

    const verification = await this.flutterwaveClient.verifyTransaction(input.transactionId);
    const verificationStatus = normalizeStatus(verification.status);

    const verifiedSuccess =
      SUCCESS_STATUSES.has(verificationStatus) &&
      normalizeTxRef(verification.txRef) === input.txRef &&
      verification.currency === paymentAttempt.currency &&
      verification.amount === paymentAttempt.amount;

    if (verifiedSuccess) {
      const confirmed = await this.ensureConfirmedPayment(
        reservation,
        paymentAttempt
      );

      return {
        reservation: confirmed.reservation,
        paymentAttempt: confirmed.paymentAttempt,
        verified: true,
      };
    }

    if (CANCELLED_STATUSES.has(verificationStatus)) {
      const cancelled = await this.ensureCancelledPayment(reservation, paymentAttempt);
      return {
        reservation: cancelled.reservation,
        paymentAttempt: cancelled.paymentAttempt,
        verified: false,
      };
    }

    const failed = await this.ensureFailedPayment(reservation, paymentAttempt);
    return {
      reservation: failed.reservation,
      paymentAttempt: failed.paymentAttempt,
      verified: false,
    };
  }

  private async ensureConfirmedPayment(
    reservation: ReservationRepositoryReservation,
    paymentAttempt: PaymentAttemptRecord
  ): Promise<{ reservation: ReservationRepositoryReservation; paymentAttempt: PaymentAttemptRecord }> {
    if (reservation.status === "confirmed") {
      const updatedAttempt = paymentAttempt.outcome === "success"
        ? paymentAttempt
        : await this.paymentAttemptRepository.updateAttemptOutcome({
            id: paymentAttempt.id,
            outcome: "success",
          });

      return {
        reservation,
        paymentAttempt: updatedAttempt,
      };
    }

    if (reservation.status !== "pending_online_payment") {
      throw new Error("Reservation is not eligible for website payment confirmation.");
    }

    const transitioned = await this.reservationService.transitionReservation({
      token: reservation.token,
      event: "online_payment_confirmed",
      actor: "system",
    });

    const updatedAttempt = await this.paymentAttemptRepository.updateAttemptOutcome({
      id: paymentAttempt.id,
      outcome: "success",
    });

    return {
      reservation: transitioned,
      paymentAttempt: updatedAttempt,
    };
  }

  private async ensureCancelledPayment(
    reservation: ReservationRepositoryReservation,
    paymentAttempt: PaymentAttemptRecord
  ): Promise<{ reservation: ReservationRepositoryReservation; paymentAttempt: PaymentAttemptRecord }> {
    if (reservation.status === "confirmed") {
      return {
        reservation,
        paymentAttempt,
      };
    }

    const transitioned = reservation.status === "pending_online_payment"
      ? await this.reservationService.transitionReservation({
          token: reservation.token,
          event: "online_payment_cancelled",
          actor: "system",
        })
      : reservation;

    const updatedAttempt = paymentAttempt.outcome === "cancelled"
      ? paymentAttempt
      : await this.paymentAttemptRepository.updateAttemptOutcome({
          id: paymentAttempt.id,
          outcome: "cancelled",
        });

    return {
      reservation: transitioned,
      paymentAttempt: updatedAttempt,
    };
  }

  private async ensureFailedPayment(
    reservation: ReservationRepositoryReservation,
    paymentAttempt: PaymentAttemptRecord
  ): Promise<{ reservation: ReservationRepositoryReservation; paymentAttempt: PaymentAttemptRecord }> {
    if (reservation.status === "confirmed") {
      return {
        reservation,
        paymentAttempt,
      };
    }

    const transitioned = reservation.status === "pending_online_payment"
      ? await this.reservationService.transitionReservation({
          token: reservation.token,
          event: "online_payment_failed",
          actor: "system",
        })
      : reservation;

    const updatedAttempt = paymentAttempt.outcome === "failed"
      ? paymentAttempt
      : await this.paymentAttemptRepository.updateAttemptOutcome({
          id: paymentAttempt.id,
          outcome: "failed",
        });

    return {
      reservation: transitioned,
      paymentAttempt: updatedAttempt,
    };
  }

  private async requireReservationByToken(token: BookingToken): Promise<ReservationRepositoryReservation> {
    const reservation = await this.reservationService.getReservationByToken(token);
    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    return reservation;
  }
}
