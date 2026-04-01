import { prisma } from "../db/prisma";
import type { PaymentAttemptRecord } from "../../types/booking-backend";
import type { WebsitePaymentAttemptRepository } from "./website-payment-service";

function mapFromPrisma(row: {
  id: string;
  reservationId: string;
  paymentMethod: string;
  provider: string;
  outcome: string;
  amount: number;
  currency: string;
  providerReference: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}): PaymentAttemptRecord {
  return {
    id: row.id,
    reservationId: row.reservationId,
    paymentMethod: "website",
    provider: row.provider as PaymentAttemptRecord["provider"],
    outcome: row.outcome as PaymentAttemptRecord["outcome"],
    amount: row.amount,
    currency: "NGN",
    providerReference: row.providerReference ?? null,
    idempotencyKey: row.idempotencyKey,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaWebsitePaymentAttemptRepository implements WebsitePaymentAttemptRepository {
  async createPendingAttempt(input: {
    reservationId: string;
    amount: number;
    currency: "NGN";
    txRef: string;
    idempotencyKey: string;
  }): Promise<PaymentAttemptRecord> {
    const created = await prisma.paymentAttempt.create({
      data: {
        reservationId: input.reservationId,
        paymentMethod: "website",
        provider: "flutterwave",
        outcome: "pending",
        amount: input.amount,
        currency: input.currency,
        providerReference: input.txRef,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return mapFromPrisma(created);
  }

  async findLatestAttemptByReservationId(reservationId: string): Promise<PaymentAttemptRecord | null> {
    const found = await prisma.paymentAttempt.findFirst({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapFromPrisma(found) : null;
  }

  async findAttemptByTxRef(txRef: string): Promise<PaymentAttemptRecord | null> {
    const found = await prisma.paymentAttempt.findFirst({
      where: { providerReference: txRef },
      orderBy: { createdAt: "desc" },
    });

    return found ? mapFromPrisma(found) : null;
  }

  async updateAttemptOutcome(input: {
    id: string;
    outcome: PaymentAttemptRecord["outcome"];
    providerReference?: string;
  }): Promise<PaymentAttemptRecord> {
    const updated = await prisma.paymentAttempt.update({
      where: { id: input.id },
      data: {
        outcome: input.outcome,
        ...(input.providerReference !== undefined && { providerReference: input.providerReference }),
      },
    });

    return mapFromPrisma(updated);
  }
}

export const prismaWebsitePaymentAttemptRepository = new PrismaWebsitePaymentAttemptRepository();
