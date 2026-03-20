import assert from "node:assert/strict";

import {
  FlutterwaveClient,
  normalizeFlutterwavePaymentStatus,
} from "../../../lib/payments/flutterwave-client";
import { getFlutterwaveConfig } from "../../../lib/payments/flutterwave-config";

interface MockFetchCall {
  url: string;
  init: RequestInit | undefined;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function withEnv<T>(values: Record<string, string | undefined>, run: () => T): T {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);

    if (value === undefined) {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }

  try {
    return run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function testConfigReadsServerEnvAndBuildsRedirectUrl(): Promise<void> {
  const config = withEnv(
    {
      FLW_SECRET_KEY: "FLWSECK_TEST-123",
      FLW_PUBLIC_KEY: "FLWPUBK_TEST-123",
      FLW_WEBHOOK_SECRET_HASH: "webhook_hash_123",
      SITE_URL: "https://blissfulplace.example/",
      FLW_REDIRECT_URL: undefined,
      FLW_API_BASE_URL: undefined,
    },
    () => getFlutterwaveConfig()
  );

  assert.equal(config.secretKey, "FLWSECK_TEST-123");
  assert.equal(config.publicKey, "FLWPUBK_TEST-123");
  assert.equal(config.webhookSecretHash, "webhook_hash_123");
  assert.equal(config.apiBaseUrl, "https://api.flutterwave.com/v3");
  assert.equal(config.redirectUrl, "https://blissfulplace.example/api/payments/website/callback");
}

async function testCreateCheckoutUsesExpectedPayloadAndReturnsLink(): Promise<void> {
  const calls: MockFetchCall[] = [];

  const client = new FlutterwaveClient({
    config: {
      secretKey: "FLWSECK_TEST-abc",
      publicKey: null,
      webhookSecretHash: null,
      apiBaseUrl: "https://api.flutterwave.com/v3",
      redirectUrl: "https://blissfulplace.example/api/payments/website/callback",
      siteUrl: "https://blissfulplace.example",
    },
    fetchFn: async (input: URL | RequestInfo, init?: RequestInit) => {
      calls.push({
        url: String(input),
        init,
      });

      return createJsonResponse({
        status: "success",
        message: "Hosted Link",
        data: {
          link: "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-abc",
        },
      });
    },
  });

  const checkout = await client.createCheckout({
    txRef: "tx_ref_wrapper_1",
    amount: 500000,
    currency: "NGN",
    customer: {
      email: "guest@example.com",
      name: "Ada Lovelace",
      phoneNumber: "+2340000000000",
    },
    meta: {
      reservation_id: "res_123",
    },
    customizations: {
      title: "Blissful Place Residences",
      description: "Website booking checkout",
    },
  });

  assert.equal(checkout.checkoutUrl, "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-abc");
  assert.equal(checkout.txRef, "tx_ref_wrapper_1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.flutterwave.com/v3/payments");
  assert.equal(calls[0].init?.method, "POST");
}

async function testVerifyTransactionNormalizesStatusAndFields(): Promise<void> {
  const client = new FlutterwaveClient({
    config: {
      secretKey: "FLWSECK_TEST-abc",
      publicKey: null,
      webhookSecretHash: "hash",
      apiBaseUrl: "https://api.flutterwave.com/v3",
      redirectUrl: "https://blissfulplace.example/api/payments/website/callback",
      siteUrl: "https://blissfulplace.example",
    },
    fetchFn: async () =>
      createJsonResponse({
        status: "success",
        message: "Transaction fetched",
        data: {
          id: 774433,
          tx_ref: "tx_ref_verify_1",
          status: "successful",
          amount: 500000,
          charged_amount: 500000,
          currency: "NGN",
        },
      }),
  });

  const verification = await client.verifyTransaction("774433");

  assert.equal(verification.transactionId, "774433");
  assert.equal(verification.txRef, "tx_ref_verify_1");
  assert.equal(verification.normalizedStatus, "successful");
  assert.equal(verification.amount, 500000);
  assert.equal(verification.currency, "NGN");
}

async function testNormalizeStatusFallbacksToUnknown(): Promise<void> {
  assert.equal(normalizeFlutterwavePaymentStatus("successful"), "successful");
  assert.equal(normalizeFlutterwavePaymentStatus("Success"), "successful");
  assert.equal(normalizeFlutterwavePaymentStatus("failed"), "failed");
  assert.equal(normalizeFlutterwavePaymentStatus("cancelled"), "cancelled");
  assert.equal(normalizeFlutterwavePaymentStatus("pending"), "pending");
  assert.equal(normalizeFlutterwavePaymentStatus("in_review"), "unknown");
}

async function run(): Promise<void> {
  await testConfigReadsServerEnvAndBuildsRedirectUrl();
  await testCreateCheckoutUsesExpectedPayloadAndReturnsLink();
  await testVerifyTransactionNormalizesStatusAndFields();
  await testNormalizeStatusFallbacksToUnknown();

  console.log("flutterwave-client-wrapper: ok");
}

void run();
