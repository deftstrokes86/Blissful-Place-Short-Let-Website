import type { ReservationStatus } from "../../types/booking";
import type { PaymentAttemptRecord } from "../../types/booking-backend";
import type { WebsitePaymentService } from "../booking/website-payment-service";

interface HeaderValueSource {
  get(name: string): string | null;
}

interface FlutterwaveWebhookServiceDependencies {
  websitePaymentService: Pick<WebsitePaymentService, "handleWebhook">;
  secretHash: string;
}

export interface HandleWebhookNotificationInput {
  rawBody: string;
  payload: unknown;
  signature: string | null;
}

export interface HandleWebhookRequestInput {
  rawBody: string;
  headers: HeaderValueSource;
}

export interface FlutterwaveWebhookNotificationResult {
  received: true;
  verified: boolean;
  reservationStatus: ReservationStatus;
  paymentOutcome: PaymentAttemptRecord["outcome"];
}

function normalize(value: string): string {
  return value.trim();
}

export function pickFlutterwaveWebhookSignature(headers: HeaderValueSource): string | null {
  const v3Signature = headers.get("verif-hash");
  if (v3Signature && normalize(v3Signature).length > 0) {
    return normalize(v3Signature);
  }

  const v4Signature = headers.get("flutterwave-signature");
  if (v4Signature && normalize(v4Signature).length > 0) {
    return normalize(v4Signature);
  }

  return null;
}

export function parseFlutterwaveWebhookPayload(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch (error) {
    // Include the original parse error so operators can diagnose malformed payloads.
    throw new Error(
      `Webhook body must be valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export class FlutterwaveWebhookService {
  private readonly websitePaymentService: FlutterwaveWebhookServiceDependencies["websitePaymentService"];
  private readonly secretHash: string;

  constructor(dependencies: FlutterwaveWebhookServiceDependencies) {
    const normalizedSecretHash = normalize(dependencies.secretHash);
    if (normalizedSecretHash.length === 0) {
      throw new Error("FLW_WEBHOOK_SECRET_HASH is required for Flutterwave webhook handling.");
    }

    this.websitePaymentService = dependencies.websitePaymentService;
    this.secretHash = normalizedSecretHash;
  }

  async handleWebhookRequest(input: HandleWebhookRequestInput): Promise<FlutterwaveWebhookNotificationResult> {
    const signature = pickFlutterwaveWebhookSignature(input.headers);
    const payload = parseFlutterwaveWebhookPayload(input.rawBody);

    return this.handleWebhookNotification({
      rawBody: input.rawBody,
      payload,
      signature,
    });
  }

  async handleWebhookNotification(
    input: HandleWebhookNotificationInput
  ): Promise<FlutterwaveWebhookNotificationResult> {
    if (!input.signature || normalize(input.signature).length === 0) {
      throw new Error("Flutterwave webhook signature is required.");
    }

    const result = await this.websitePaymentService.handleWebhook({
      rawBody: input.rawBody,
      signature: normalize(input.signature),
      secretHash: this.secretHash,
      payload: input.payload,
    });

    return {
      received: true,
      verified: result.verified,
      reservationStatus: result.reservation.status,
      paymentOutcome: result.paymentAttempt.outcome,
    };
  }
}
