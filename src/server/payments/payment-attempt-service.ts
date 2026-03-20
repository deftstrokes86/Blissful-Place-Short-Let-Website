import { randomUUID } from "node:crypto";

import type { ReservationRepositoryReservation } from "../booking/reservation-repository";
import type { PaymentAttemptRecord } from "../../types/booking-backend";

export interface PaymentAttemptRepository {
  createPendingAttempt(input: {
    reservationId: string;
    amount: number;
    currency: "NGN";
    txRef: string;
    idempotencyKey: string;
  }): Promise<PaymentAttemptRecord>;
}

export interface CreateWebsiteAttemptInput {
  reservation: ReservationRepositoryReservation;
  amount: number;
  currency: "NGN";
  idempotencyKey: string;
}

export interface WebsitePendingAttempt {
  txRef: string;
  paymentAttempt: PaymentAttemptRecord;
}

export type WebsiteTxRefFactory = (reservation: ReservationRepositoryReservation) => string;

export function createWebsiteTxRef(reservation: ReservationRepositoryReservation): string {
  return `bp_${reservation.id}_${randomUUID()}`;
}

function normalizeTxRef(value: string): string {
  return value.trim();
}

export class PaymentAttemptService {
  private readonly repository: PaymentAttemptRepository;
  private readonly createTxRef: WebsiteTxRefFactory;

  constructor(input: {
    repository: PaymentAttemptRepository;
    createTxRef?: WebsiteTxRefFactory;
  }) {
    this.repository = input.repository;
    this.createTxRef = input.createTxRef ?? createWebsiteTxRef;
  }

  async createWebsitePendingAttempt(input: CreateWebsiteAttemptInput): Promise<WebsitePendingAttempt> {
    const txRef = normalizeTxRef(this.createTxRef(input.reservation));

    if (txRef.length === 0) {
      throw new Error("Generated payment tx_ref cannot be empty.");
    }

    const paymentAttempt = await this.repository.createPendingAttempt({
      reservationId: input.reservation.id,
      amount: input.amount,
      currency: input.currency,
      txRef,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      txRef,
      paymentAttempt,
    };
  }
}
