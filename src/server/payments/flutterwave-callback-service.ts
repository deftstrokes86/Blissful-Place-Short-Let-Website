import type { WebsitePaymentService } from "../booking/website-payment-service";
import type { ReservationStatus } from "../../types/booking";
import type { PaymentAttemptRecord } from "../../types/booking-backend";

export interface FlutterwaveCallbackParams {
  txRef: string;
  transactionId: string | null;
  status: string | null;
}

export interface FlutterwaveCallbackResult {
  txRef: string;
  transactionId: string | null;
  providerStatus: string | null;
  verificationState: "pending" | "completed";
  verified: boolean;
  reservationStatus: ReservationStatus | null;
  paymentOutcome: PaymentAttemptRecord["outcome"] | null;
  message: string;
}

interface FlutterwaveCallbackServiceDependencies {
  websitePaymentService: Pick<WebsitePaymentService, "handleCallback">;
}

export function parseFlutterwaveCallbackParams(url: URL): FlutterwaveCallbackParams {
  const txRef =
    url.searchParams.get("tx_ref") ??
    url.searchParams.get("txRef") ??
    "";

  const transactionId =
    url.searchParams.get("transaction_id") ??
    url.searchParams.get("transactionId");

  const status = url.searchParams.get("status");

  const normalizedTxRef = txRef.trim();
  if (normalizedTxRef.length === 0) {
    throw new Error("tx_ref is required.");
  }

  return {
    txRef: normalizedTxRef,
    transactionId: transactionId && transactionId.trim().length > 0 ? transactionId.trim() : null,
    status: status && status.trim().length > 0 ? status.trim() : null,
  };
}

function normalizeProviderStatus(status: string | null): string | null {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function requiresImmediateVerification(params: FlutterwaveCallbackParams): boolean {
  return params.transactionId !== null;
}

export class FlutterwaveCallbackService {
  private readonly websitePaymentService: FlutterwaveCallbackServiceDependencies["websitePaymentService"];

  constructor(dependencies: FlutterwaveCallbackServiceDependencies) {
    this.websitePaymentService = dependencies.websitePaymentService;
  }

  async handleRedirectReturn(params: FlutterwaveCallbackParams): Promise<FlutterwaveCallbackResult> {
    const providerStatus = normalizeProviderStatus(params.status);

    if (!requiresImmediateVerification(params)) {
      return {
        txRef: params.txRef,
        transactionId: null,
        providerStatus,
        verificationState: "pending",
        verified: false,
        reservationStatus: null,
        paymentOutcome: null,
        message: "Payment return received. Verification pending.",
      };
    }

    const processed = await this.websitePaymentService.handleCallback({
      txRef: params.txRef,
      transactionId: params.transactionId,
      status: params.status,
    });

    return {
      txRef: params.txRef,
      transactionId: params.transactionId,
      providerStatus,
      verificationState: "completed",
      verified: processed.verified,
      reservationStatus: processed.reservation.status,
      paymentOutcome: processed.paymentAttempt.outcome,
      message: processed.verified
        ? "Payment was verified successfully."
        : "Payment verification completed but did not pass.",
    };
  }
}
