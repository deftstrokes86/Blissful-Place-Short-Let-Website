import {
  FlutterwaveClient,
  type FlutterwaveCheckoutInput,
} from "../../lib/payments/flutterwave-client";
import {
  getFlutterwaveConfig,
  type FlutterwaveServerConfig,
} from "../../lib/payments/flutterwave-config";

interface FlutterwaveCreateCheckoutPayload {
  txRef: string;
  amount: number;
  currency: "NGN";
  redirectUrl: string;
  customer: {
    email: string;
    name: string;
    phone: string;
  };
  meta: Record<string, string>;
}

interface FlutterwaveCreateCheckoutResult {
  paymentLink: string;
}

interface FlutterwaveVerifyTransactionResult {
  status: string;
  txRef: string;
  amount: number;
  currency: string;
  transactionId: string;
}

export interface FlutterwaveCheckoutClient {
  createCheckout(payload: FlutterwaveCreateCheckoutPayload): Promise<FlutterwaveCreateCheckoutResult>;
  verifyTransaction(transactionId: string): Promise<FlutterwaveVerifyTransactionResult>;
}

interface HttpFlutterwaveCheckoutClientOptions {
  secretKey?: string;
  apiBaseUrl?: string;
  redirectUrl?: string;
}

function mergeConfig(
  base: FlutterwaveServerConfig,
  overrides?: HttpFlutterwaveCheckoutClientOptions
): FlutterwaveServerConfig {
  if (!overrides) {
    return base;
  }

  const secretKey = overrides.secretKey?.trim();
  const apiBaseUrl = overrides.apiBaseUrl?.trim();
  const redirectUrl = overrides.redirectUrl?.trim();

  return {
    ...base,
    secretKey: secretKey && secretKey.length > 0 ? secretKey : base.secretKey,
    apiBaseUrl: apiBaseUrl && apiBaseUrl.length > 0 ? apiBaseUrl : base.apiBaseUrl,
    redirectUrl: redirectUrl && redirectUrl.length > 0 ? redirectUrl : base.redirectUrl,
  };
}

function mapCheckoutInput(payload: FlutterwaveCreateCheckoutPayload): FlutterwaveCheckoutInput {
  return {
    txRef: payload.txRef,
    amount: payload.amount,
    currency: payload.currency,
    redirectUrl: payload.redirectUrl,
    customer: {
      email: payload.customer.email,
      name: payload.customer.name,
      phoneNumber: payload.customer.phone,
    },
    meta: payload.meta,
  };
}

export class HttpFlutterwaveCheckoutClient implements FlutterwaveCheckoutClient {
  private readonly client: FlutterwaveClient;

  constructor(options?: HttpFlutterwaveCheckoutClientOptions) {
    this.client = new FlutterwaveClient({
      config: mergeConfig(getFlutterwaveConfig(), options),
    });
  }

  async createCheckout(payload: FlutterwaveCreateCheckoutPayload): Promise<FlutterwaveCreateCheckoutResult> {
    const checkout = await this.client.createCheckout(mapCheckoutInput(payload));

    return {
      paymentLink: checkout.checkoutUrl,
    };
  }

  async verifyTransaction(transactionId: string): Promise<FlutterwaveVerifyTransactionResult> {
    const verification = await this.client.verifyTransaction(transactionId);

    return {
      status: verification.status,
      txRef: verification.txRef,
      amount: verification.amount,
      currency: verification.currency,
      transactionId: verification.transactionId,
    };
  }
}
