import {
  getFlutterwaveConfig,
  type FlutterwaveServerConfig,
} from "./flutterwave-config";
import type {
  FlutterwaveApiResponseEnvelope,
  FlutterwaveCheckoutCustomizations,
  FlutterwaveCheckoutSession,
  FlutterwaveCreateCheckoutRequest,
  FlutterwaveCreateCheckoutResponseData,
  FlutterwaveCurrencyCode,
  FlutterwaveMetadataValue,
  FlutterwaveNormalizedPaymentStatus,
  FlutterwaveVerificationOutcome,
  FlutterwaveVerifyTransactionResponseData,
} from "../../types/flutterwave";

interface RecordValue {
  [key: string]: unknown;
}

interface FlutterwaveClientOptions {
  config?: FlutterwaveServerConfig;
  fetchFn?: (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;
}

export interface FlutterwaveCheckoutInput {
  txRef: string;
  amount: number;
  currency: FlutterwaveCurrencyCode;
  redirectUrl?: string;
  customer: {
    email: string;
    name: string;
    phoneNumber?: string;
  };
  paymentOptions?: string;
  meta?: Record<string, FlutterwaveMetadataValue>;
  customizations?: FlutterwaveCheckoutCustomizations;
}

function assertRecord(value: unknown, message: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }

  return value as RecordValue;
}

function readString(source: RecordValue, key: string, message: string): string {
  const value = source[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function readStringOrNumberAsString(source: RecordValue, key: string, message: string): string {
  const value = source[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  throw new Error(message);
}

function readNumber(source: RecordValue, key: string, message: string): number {
  const value = source[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(message);
}

async function readJsonResponse(response: Response): Promise<RecordValue> {
  let body: unknown;

  try {
    body = (await response.json()) as unknown;
  } catch {
    throw new Error("Flutterwave returned an invalid JSON response.");
  }

  return assertRecord(body, "Flutterwave returned an unexpected response shape.");
}

function readErrorMessage(body: RecordValue, fallback: string): string {
  const maybeMessage = body.message;
  return typeof maybeMessage === "string" && maybeMessage.trim().length > 0 ? maybeMessage : fallback;
}

function toCheckoutRequest(
  input: FlutterwaveCheckoutInput,
  fallbackRedirectUrl: string
): FlutterwaveCreateCheckoutRequest {
  return {
    tx_ref: input.txRef,
    amount: input.amount,
    currency: input.currency,
    redirect_url: input.redirectUrl ?? fallbackRedirectUrl,
    customer: {
      email: input.customer.email,
      name: input.customer.name,
      phonenumber: input.customer.phoneNumber,
    },
    payment_options: input.paymentOptions,
    meta: input.meta,
    customizations: input.customizations,
  };
}

function readCheckoutResponse(
  responseBody: RecordValue
): FlutterwaveApiResponseEnvelope<FlutterwaveCreateCheckoutResponseData> {
  const data = assertRecord(responseBody.data, "Flutterwave checkout response is missing data.");
  const link = readString(data, "link", "Flutterwave checkout response is missing payment link.");

  const status = typeof responseBody.status === "string" ? responseBody.status : "unknown";
  const message = typeof responseBody.message === "string" ? responseBody.message : "";

  return {
    status,
    message,
    data: {
      link,
    },
  };
}

function readVerificationResponse(
  responseBody: RecordValue
): FlutterwaveApiResponseEnvelope<FlutterwaveVerifyTransactionResponseData> {
  const data = assertRecord(responseBody.data, "Flutterwave verification response is missing data.");
  const status = typeof responseBody.status === "string" ? responseBody.status : "unknown";
  const message = typeof responseBody.message === "string" ? responseBody.message : "";

  return {
    status,
    message,
    data: {
      id: readStringOrNumberAsString(data, "id", "Flutterwave verification response is missing transaction id."),
      tx_ref: readString(data, "tx_ref", "Flutterwave verification response is missing tx_ref."),
      status: readString(data, "status", "Flutterwave verification response is missing status."),
      amount: readNumber(data, "amount", "Flutterwave verification response is missing amount."),
      charged_amount:
        data.charged_amount === undefined
          ? undefined
          : readNumber(data, "charged_amount", "Flutterwave verification response has invalid charged_amount."),
      currency: readString(data, "currency", "Flutterwave verification response is missing currency."),
    },
  };
}

export function normalizeFlutterwavePaymentStatus(
  status: string
): FlutterwaveNormalizedPaymentStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === "successful" || normalized === "success" || normalized === "succeeded") {
    return "successful";
  }

  if (normalized === "failed" || normalized === "failure" || normalized === "error") {
    return "failed";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }

  if (normalized === "pending") {
    return "pending";
  }

  return "unknown";
}

export class FlutterwaveClient {
  private readonly config: FlutterwaveServerConfig;
  private readonly fetchFn: (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

  constructor(options?: FlutterwaveClientOptions) {
    this.config = options?.config ?? getFlutterwaveConfig();
    this.fetchFn = options?.fetchFn ?? fetch;
  }

  async createCheckout(input: FlutterwaveCheckoutInput): Promise<FlutterwaveCheckoutSession> {
    const requestBody = toCheckoutRequest(input, this.config.redirectUrl);

    const response = await this.fetchFn(`${this.config.apiBaseUrl}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const body = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(readErrorMessage(body, "Flutterwave checkout request failed."));
    }

    const parsed = readCheckoutResponse(body);

    return {
      txRef: input.txRef,
      checkoutUrl: parsed.data.link,
    };
  }

  async verifyTransaction(transactionId: string): Promise<FlutterwaveVerificationOutcome["verified"]> {
    const encodedTransactionId = encodeURIComponent(transactionId);

    const response = await this.fetchFn(
      `${this.config.apiBaseUrl}/transactions/${encodedTransactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
        },
      }
    );

    const body = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(readErrorMessage(body, "Flutterwave verification request failed."));
    }

    const parsed = readVerificationResponse(body);

    return {
      provider: "flutterwave",
      transactionId: String(parsed.data.id),
      txRef: parsed.data.tx_ref,
      status: parsed.data.status,
      normalizedStatus: normalizeFlutterwavePaymentStatus(parsed.data.status),
      amount: parsed.data.amount,
      chargedAmount: parsed.data.charged_amount ?? null,
      currency: parsed.data.currency,
    };
  }
}

