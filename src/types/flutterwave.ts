export type FlutterwaveCurrencyCode = "NGN" | (string & {});

export type FlutterwaveMetadataValue = string | number | boolean;

export interface FlutterwaveCheckoutCustomer {
  email: string;
  name: string;
  phonenumber?: string;
}

export interface FlutterwaveCheckoutCustomizations {
  title?: string;
  description?: string;
  logo?: string;
}

export interface FlutterwaveCreateCheckoutRequest {
  tx_ref: string;
  amount: number;
  currency: FlutterwaveCurrencyCode;
  redirect_url: string;
  customer: FlutterwaveCheckoutCustomer;
  payment_options?: string;
  meta?: Record<string, FlutterwaveMetadataValue>;
  customizations?: FlutterwaveCheckoutCustomizations;
}

export interface FlutterwaveCreateCheckoutResponseData {
  link: string;
}

export interface FlutterwaveVerifyTransactionResponseData {
  id: string | number;
  tx_ref: string;
  status: string;
  amount: number;
  charged_amount?: number;
  currency: string;
}

export interface FlutterwaveApiResponseEnvelope<TData> {
  status: string;
  message: string;
  data: TData;
}

export type FlutterwaveNormalizedPaymentStatus =
  | "successful"
  | "failed"
  | "cancelled"
  | "pending"
  | "unknown";

export interface FlutterwaveCheckoutSession {
  txRef: string;
  checkoutUrl: string;
}

export interface FlutterwaveVerifiedTransaction {
  provider: "flutterwave";
  transactionId: string;
  txRef: string;
  status: string;
  normalizedStatus: FlutterwaveNormalizedPaymentStatus;
  amount: number;
  chargedAmount: number | null;
  currency: string;
}

export interface FlutterwaveVerificationOutcome {
  verified: FlutterwaveVerifiedTransaction;
  raw: FlutterwaveApiResponseEnvelope<FlutterwaveVerifyTransactionResponseData>;
}
