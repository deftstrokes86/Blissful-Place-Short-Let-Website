import assert from "node:assert/strict";

import {
  createFlutterwaveHarness,
  createReservation,
} from "./support/flutterwave-harness";
import {
  FlutterwaveWebhookService,
  parseFlutterwaveWebhookPayload,
  pickFlutterwaveWebhookSignature,
} from "../flutterwave-webhook-service";

async function testSignaturePickerSupportsFlutterwaveHeaders(): Promise<void> {
  const v3Headers = new Headers({
    "verif-hash": "signature_v3",
  });

  const v4Headers = new Headers({
    "flutterwave-signature": "signature_v4",
  });

  assert.equal(pickFlutterwaveWebhookSignature(v3Headers), "signature_v3");
  assert.equal(pickFlutterwaveWebhookSignature(v4Headers), "signature_v4");
}

async function testPayloadParserRejectsInvalidJson(): Promise<void> {
  assert.throws(
    () => parseFlutterwaveWebhookPayload("not-json"),
    /Webhook body must be valid JSON/
  );
}

async function testWebhookDoesNotConfirmWithoutServerSideVerification(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_webhook_verify_required",
    token: "token_webhook_verify_required",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_webhook_verify_required",
  });

  await service.initiateCheckout({
    token: "token_webhook_verify_required",
    idempotencyKey: "idem-flw-webhook-1",
  });

  flutterwaveClient.verifyResponse = {
    status: "failed",
    txRef: "tx_ref_webhook_verify_required",
    amount: 500000,
    currency: "NGN",
    transactionId: "12345",
  };

  const payload = {
    event: "charge.completed",
    data: {
      id: 12345,
      tx_ref: "tx_ref_webhook_verify_required",
      status: "successful",
    },
  };

  const webhookService = new FlutterwaveWebhookService({
    websitePaymentService: service,
    secretHash: "topsecret",
  });

  const result = await webhookService.handleWebhookNotification({
    rawBody: JSON.stringify(payload),
    payload,
    signature: "topsecret",
  });

  assert.equal(flutterwaveClient.verifyCalls, 1);
  assert.equal(result.verified, false);
  assert.equal(result.reservationStatus, "failed_payment");

  const updated = await reservationService.getReservationByToken("token_webhook_verify_required");
  assert.equal(updated?.status, "failed_payment");
}

async function testRepeatedWebhookDeliveryDoesNotDuplicateSideEffects(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_webhook_repeat",
    token: "token_webhook_repeat",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient, paymentAttemptRepository } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_webhook_repeat",
  });

  await service.initiateCheckout({
    token: "token_webhook_repeat",
    idempotencyKey: "idem-flw-webhook-2",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_webhook_repeat",
    amount: 500000,
    currency: "NGN",
    transactionId: "777",
  };

  const payload = {
    event: "charge.completed",
    data: {
      id: 777,
      tx_ref: "tx_ref_webhook_repeat",
      status: "successful",
    },
  };

  const webhookService = new FlutterwaveWebhookService({
    websitePaymentService: service,
    secretHash: "topsecret",
  });

  await webhookService.handleWebhookNotification({
    rawBody: JSON.stringify(payload),
    payload,
    signature: "topsecret",
  });

  await webhookService.handleWebhookNotification({
    rawBody: JSON.stringify(payload),
    payload,
    signature: "topsecret",
  });

  const updated = await reservationService.getReservationByToken("token_webhook_repeat");
  assert.equal(updated?.status, "confirmed");
  assert.equal(flutterwaveClient.verifyCalls, 1);
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "success");
}

async function testWebhookServiceRejectsMissingSignature(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_webhook_missing_sig",
    token: "token_webhook_missing_sig",
    paymentMethod: "website",
  });

  const { service } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_webhook_missing_sig",
  });

  const payload = {
    event: "charge.completed",
    data: {
      id: 101,
      tx_ref: "tx_ref_webhook_missing_sig",
      status: "successful",
    },
  };

  const webhookService = new FlutterwaveWebhookService({
    websitePaymentService: service,
    secretHash: "topsecret",
  });

  await assert.rejects(
    async () => {
      await webhookService.handleWebhookNotification({
        rawBody: JSON.stringify(payload),
        payload,
        signature: null,
      });
    },
    /signature is required/
  );
}

async function run(): Promise<void> {
  await testSignaturePickerSupportsFlutterwaveHeaders();
  await testPayloadParserRejectsInvalidJson();
  await testWebhookDoesNotConfirmWithoutServerSideVerification();
  await testRepeatedWebhookDeliveryDoesNotDuplicateSideEffects();
  await testWebhookServiceRejectsMissingSignature();

  console.log("flutterwave-webhook: ok");
}

void run();
