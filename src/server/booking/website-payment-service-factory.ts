import { getFlutterwaveConfig } from "../../lib/payments/flutterwave-config";
import type { AvailabilityCheckResult } from "./availability-service";
import { getSharedAvailabilityService } from "./availability-service-factory";
import { prismaWebsitePaymentAttemptRepository } from "./prisma-payment-attempt-repository";
import { prismaWebsitePaymentReservationQuery } from "./prisma-reservation-query";
import { HttpFlutterwaveCheckoutClient } from "./flutterwave-client";
import { prismaWebsitePaymentIdempotencyGateway } from "./prisma-idempotency-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import { getSharedReservationService } from "./reservation-service-factory";
import {
  WebsitePaymentService,
  type WebsitePaymentAvailabilityGateway,
} from "./website-payment-service";

class SharedWebsitePaymentAvailabilityGateway implements WebsitePaymentAvailabilityGateway {
  async checkPreCheckoutReservation(
    reservation: ReservationRepositoryReservation,
    paymentMethod: "website"
  ): Promise<AvailabilityCheckResult> {
    void paymentMethod;
    return getSharedAvailabilityService().runPreCheckoutRecheck(reservation.stay, reservation.id);
  }
}

let sharedWebsitePaymentService: WebsitePaymentService | null = null;

export function getSharedWebsitePaymentService(): WebsitePaymentService {
  if (sharedWebsitePaymentService) {
    return sharedWebsitePaymentService;
  }

  const flutterwaveConfig = getFlutterwaveConfig();
  const flutterwaveClient = new HttpFlutterwaveCheckoutClient({
    secretKey: flutterwaveConfig.secretKey,
    apiBaseUrl: flutterwaveConfig.apiBaseUrl,
    redirectUrl: flutterwaveConfig.redirectUrl,
  });

  sharedWebsitePaymentService = new WebsitePaymentService({
    reservationService: getSharedReservationService(),
    reservationQuery: prismaWebsitePaymentReservationQuery,
    availabilityGateway: new SharedWebsitePaymentAvailabilityGateway(),
    paymentAttemptRepository: prismaWebsitePaymentAttemptRepository,
    idempotencyGateway: prismaWebsitePaymentIdempotencyGateway,
    flutterwaveClient,
    redirectUrl: flutterwaveConfig.redirectUrl,
  });

  return sharedWebsitePaymentService;
}
