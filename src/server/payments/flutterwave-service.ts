import type { FlutterwaveCheckoutClient } from "../booking/flutterwave-client";
import type { ReservationRepositoryReservation } from "../booking/reservation-repository";

export interface WebsiteCheckoutHandoffInput {
  reservation: ReservationRepositoryReservation;
  paymentAttemptId: string;
  txRef: string;
  amount: number;
  currency: "NGN";
  redirectUrl: string;
}

export interface WebsiteCheckoutHandoffResult {
  checkoutUrl: string;
  checkoutReference: string;
}

function buildCustomerName(reservation: ReservationRepositoryReservation): string {
  const firstName = reservation.guest.firstName.trim();
  const lastName = reservation.guest.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName.length > 0 ? fullName : "Blissful Place Guest";
}

export class FlutterwaveService {
  private readonly checkoutClient: FlutterwaveCheckoutClient;

  constructor(input: { checkoutClient: FlutterwaveCheckoutClient }) {
    this.checkoutClient = input.checkoutClient;
  }

  async createWebsiteCheckoutHandoff(input: WebsiteCheckoutHandoffInput): Promise<WebsiteCheckoutHandoffResult> {
    const checkout = await this.checkoutClient.createCheckout({
      txRef: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirectUrl: input.redirectUrl,
      customer: {
        email: input.reservation.guest.email,
        name: buildCustomerName(input.reservation),
        phone: input.reservation.guest.phone,
      },
      meta: {
        reservation_id: input.reservation.id,
        reservation_token: input.reservation.token,
        payment_attempt_id: input.paymentAttemptId,
      },
    });

    return {
      checkoutUrl: checkout.paymentLink,
      checkoutReference: input.txRef,
    };
  }
}
