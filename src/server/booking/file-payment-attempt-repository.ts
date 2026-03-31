import { randomUUID } from "node:crypto";

import { readBookingDatabase, withBookingDatabase } from "../db/file-database";
import { nowIso } from "../db/db-utils";
import type { PaymentAttemptRecord } from "../../types/booking-backend";
import type { WebsitePaymentAttemptRepository } from "./website-payment-service";

function cloneAttempt(value: PaymentAttemptRecord): PaymentAttemptRecord {
  return {
    ...value,
  };
}

export class FileWebsitePaymentAttemptRepository implements WebsitePaymentAttemptRepository {
  async createPendingAttempt(input: {
    reservationId: string;
    amount: number;
    currency: "NGN";
    txRef: string;
    idempotencyKey: string;
  }): Promise<PaymentAttemptRecord> {
    return withBookingDatabase(async (db) => {
      const createdAt = nowIso();
      const record: PaymentAttemptRecord = {
        id: `pay_${randomUUID()}`,
        reservationId: input.reservationId,
        paymentMethod: "website",
        provider: "flutterwave",
        outcome: "pending",
        amount: input.amount,
        currency: input.currency,
        providerReference: input.txRef,
        idempotencyKey: input.idempotencyKey,
        createdAt,
        updatedAt: createdAt,
      };

      db.paymentAttempts.push(record);
      return cloneAttempt(record);
    });
  }

  async findLatestAttemptByReservationId(reservationId: string): Promise<PaymentAttemptRecord | null> {
    const db = await readBookingDatabase();
    const found = db.paymentAttempts
      .filter((attempt) => attempt.reservationId === reservationId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return found ? cloneAttempt(found) : null;
  }

  async findAttemptByTxRef(txRef: string): Promise<PaymentAttemptRecord | null> {
    const db = await readBookingDatabase();
    const found = db.paymentAttempts
      .filter((attempt) => attempt.providerReference === txRef)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return found ? cloneAttempt(found) : null;
  }

  async updateAttemptOutcome(input: {
    id: string;
    outcome: PaymentAttemptRecord["outcome"];
    providerReference?: string;
  }): Promise<PaymentAttemptRecord> {
    return withBookingDatabase(async (db) => {
      const index = db.paymentAttempts.findIndex((attempt) => attempt.id === input.id);
      if (index < 0) {
        throw new Error("Payment attempt not found.");
      }

      const updated: PaymentAttemptRecord = {
        ...db.paymentAttempts[index],
        outcome: input.outcome,
        providerReference: input.providerReference ?? db.paymentAttempts[index].providerReference,
        updatedAt: nowIso(),
      };

      db.paymentAttempts[index] = updated;
      return cloneAttempt(updated);
    });
  }
}

export const fileWebsitePaymentAttemptRepository = new FileWebsitePaymentAttemptRepository();

