import { createDatabaseId, withBookingDatabase } from "@/server/db/file-database";
import { executeWithIdempotency } from "@/server/services/idempotency-service";
import { reservationDomainService } from "@/server/services/reservation-domain-service";
import type { BookingToken, PaymentMethod } from "@/types/booking";
import type { PaymentAttemptRecord, ReservationRecord } from "@/types/booking-backend";

export type WebsitePaymentOutcome = "success" | "failed" | "cancelled";

interface InitiateWebsiteCheckoutInput {
  token: BookingToken;
  idempotencyKey: string;
}

interface HandleWebsiteOutcomeInput {
  token: BookingToken;
  outcome: WebsitePaymentOutcome;
  idempotencyKey: string;
  providerReference?: string;
}

interface RetryWebsitePaymentInput {
  token: BookingToken;
  idempotencyKey: string;
}

interface SwitchWebsitePaymentMethodInput {
  token: BookingToken;
  targetMethod: Exclude<PaymentMethod, "website">;
  idempotencyKey: string;
}

interface WebsiteCheckoutSession {
  reservation: ReservationRecord;
  paymentAttempt: PaymentAttemptRecord;
  checkoutReference: string;
  checkoutUrl: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapOutcomeToAttempt(outcome: WebsitePaymentOutcome): PaymentAttemptRecord["outcome"] {
  if (outcome === "success") {
    return "success";
  }

  if (outcome === "cancelled") {
    return "cancelled";
  }

  return "failed";
}

function mapOutcomeToStatusEvent(outcome: WebsitePaymentOutcome): "online_payment_confirmed" | "online_payment_failed" | "online_payment_cancelled" {
  if (outcome === "success") {
    return "online_payment_confirmed";
  }

  if (outcome === "cancelled") {
    return "online_payment_cancelled";
  }

  return "online_payment_failed";
}

export class WebsitePaymentService {
  async initiateCheckout(input: InitiateWebsiteCheckoutInput): Promise<WebsiteCheckoutSession> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "website.checkout.initiate",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "online_payment_handoff_requested",
          actor: "guest",
        });

        const checkoutReference = createDatabaseId("wchk");
        const createdAt = nowIso();
        const paymentAttempt: PaymentAttemptRecord = {
          id: createDatabaseId("pay"),
          reservationId: reservation.id,
          paymentMethod: "website",
          provider: "prototype_gateway",
          outcome: "pending",
          amount: reservation.pricing.estimatedTotal ?? 0,
          currency: "NGN",
          providerReference: checkoutReference,
          idempotencyKey: input.idempotencyKey,
          createdAt,
          updatedAt: createdAt,
        };

        await withBookingDatabase(async (db) => {
          db.paymentAttempts.push(paymentAttempt);
        });

        return {
          reservation,
          paymentAttempt,
          checkoutReference,
          checkoutUrl: `/book?paymentSession=${checkoutReference}`,
        };
      },
    });
  }

  async handleCheckoutOutcome(input: HandleWebsiteOutcomeInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "website.checkout.outcome",
      payload: input,
      execute: async () => {
        const reservation = await reservationDomainService.getReservationByToken(input.token);
        if (!reservation) {
          throw new Error("Reservation not found.");
        }

        const event = mapOutcomeToStatusEvent(input.outcome);

        if (
          (input.outcome === "success" && reservation.status === "confirmed") ||
          (input.outcome === "failed" && reservation.status === "failed_payment") ||
          (input.outcome === "cancelled" && reservation.status === "cancelled")
        ) {
          await this.updateLatestAttempt(reservation.id, input.outcome, input.providerReference);
          return reservation;
        }

        if (reservation.status !== "pending_online_payment") {
          throw new Error("Website payment outcome requires pending online payment status.");
        }

        await this.updateLatestAttempt(reservation.id, input.outcome, input.providerReference);

        return reservationDomainService.transitionReservationStatus({
          token: input.token,
          event,
          actor: "system",
          metadata: {
            providerReference: input.providerReference ?? null,
            outcome: input.outcome,
          },
        });
      },
    });
  }

  async retryCheckout(input: RetryWebsitePaymentInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "website.checkout.retry",
      payload: input,
      execute: async () => {
        return reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "try_online_payment_again",
          actor: "guest",
        });
      },
    });
  }

  async switchFailedPaymentMethod(input: SwitchWebsitePaymentMethodInput): Promise<ReservationRecord> {
    return executeWithIdempotency({
      key: input.idempotencyKey,
      action: "website.checkout.switch_method",
      payload: input,
      execute: async () => {
        return reservationDomainService.transitionReservationStatus({
          token: input.token,
          event: "switch_payment_method",
          actor: "guest",
          paymentMethod: input.targetMethod,
          branchResetApplied: true,
        });
      },
    });
  }

  private async updateLatestAttempt(
    reservationId: string,
    outcome: WebsitePaymentOutcome,
    providerReference?: string
  ): Promise<void> {
    await withBookingDatabase(async (db) => {
      const latestAttempt = db.paymentAttempts
        .filter((attempt) => attempt.reservationId === reservationId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

      if (!latestAttempt) {
        const createdAt = nowIso();
        const fallbackAttempt: PaymentAttemptRecord = {
          id: createDatabaseId("pay"),
          reservationId,
          paymentMethod: "website",
          provider: "prototype_gateway",
          outcome: mapOutcomeToAttempt(outcome),
          amount: 0,
          currency: "NGN",
          providerReference: providerReference ?? null,
          idempotencyKey: createDatabaseId("auto"),
          createdAt,
          updatedAt: createdAt,
        };

        db.paymentAttempts.push(fallbackAttempt);
        return;
      }

      latestAttempt.outcome = mapOutcomeToAttempt(outcome);
      latestAttempt.providerReference = providerReference ?? latestAttempt.providerReference;
      latestAttempt.updatedAt = nowIso();
    });
  }
}

export const websitePaymentService = new WebsitePaymentService();