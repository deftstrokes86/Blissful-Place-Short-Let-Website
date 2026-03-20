import assert from "node:assert/strict";

import {
  createFlutterwaveHarness,
  createReservation,
} from "./support/flutterwave-harness";
import { FlutterwaveCallbackService } from "../flutterwave-callback-service";

async function testVerifiedSuccessfulPaymentMovesReservationToConfirmed(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_verify_success",
    token: "token_verify_success",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_verify_success",
  });

  await service.initiateCheckout({
    token: "token_verify_success",
    idempotencyKey: "idem-flw-verify-1",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_verify_success",
    amount: 500000,
    currency: "NGN",
    transactionId: "1001",
  };

  await service.handleCallback({
    txRef: "tx_ref_verify_success",
    transactionId: "1001",
    status: "successful",
  });

  const updated = await reservationService.getReservationByToken("token_verify_success");
  assert.equal(updated?.status, "confirmed");
}

async function testVerifiedFailedPaymentMovesReservationToFailedPayment(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_verify_failed",
    token: "token_verify_failed",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_verify_failed",
  });

  await service.initiateCheckout({
    token: "token_verify_failed",
    idempotencyKey: "idem-flw-verify-2",
  });

  flutterwaveClient.verifyResponse = {
    status: "failed",
    txRef: "tx_ref_verify_failed",
    amount: 500000,
    currency: "NGN",
    transactionId: "1002",
  };

  await service.handleCallback({
    txRef: "tx_ref_verify_failed",
    transactionId: "1002",
    status: "failed",
  });

  const updated = await reservationService.getReservationByToken("token_verify_failed");
  assert.equal(updated?.status, "failed_payment");
}

async function testCancelledPaymentMovesReservationToCancelled(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_verify_cancelled",
    token: "token_verify_cancelled",
    paymentMethod: "website",
  });

  const { service, reservationService } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_verify_cancelled",
  });

  await service.initiateCheckout({
    token: "token_verify_cancelled",
    idempotencyKey: "idem-flw-verify-3",
  });

  await service.handleCallback({
    txRef: "tx_ref_verify_cancelled",
    transactionId: null,
    status: "cancelled",
  });

  const updated = await reservationService.getReservationByToken("token_verify_cancelled");
  assert.equal(updated?.status, "cancelled");
}

async function testMismatchedVerificationDataDoesNotConfirmBooking(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_verify_mismatch",
    token: "token_verify_mismatch",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_verify_mismatch",
  });

  await service.initiateCheckout({
    token: "token_verify_mismatch",
    idempotencyKey: "idem-flw-verify-4",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_other",
    amount: 500000,
    currency: "NGN",
    transactionId: "1003",
  };

  await service.handleCallback({
    txRef: "tx_ref_verify_mismatch",
    transactionId: "1003",
    status: "successful",
  });

  let updated = await reservationService.getReservationByToken("token_verify_mismatch");
  assert.equal(updated?.status, "failed_payment");

  const reservationAmountMismatch = createReservation("pending_online_payment", {
    id: "res_verify_amount_mismatch",
    token: "token_verify_amount_mismatch",
    paymentMethod: "website",
  });

  const second = createFlutterwaveHarness({
    reservations: [reservationAmountMismatch],
    txRef: "tx_ref_verify_amount_mismatch",
  });

  await second.service.initiateCheckout({
    token: "token_verify_amount_mismatch",
    idempotencyKey: "idem-flw-verify-5",
  });

  second.flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_verify_amount_mismatch",
    amount: 499999,
    currency: "NGN",
    transactionId: "1004",
  };

  await second.service.handleCallback({
    txRef: "tx_ref_verify_amount_mismatch",
    transactionId: "1004",
    status: "successful",
  });

  updated = await second.reservationService.getReservationByToken("token_verify_amount_mismatch");
  assert.equal(updated?.status, "failed_payment");

  const reservationCurrencyMismatch = createReservation("pending_online_payment", {
    id: "res_verify_currency_mismatch",
    token: "token_verify_currency_mismatch",
    paymentMethod: "website",
  });

  const third = createFlutterwaveHarness({
    reservations: [reservationCurrencyMismatch],
    txRef: "tx_ref_verify_currency_mismatch",
  });

  await third.service.initiateCheckout({
    token: "token_verify_currency_mismatch",
    idempotencyKey: "idem-flw-verify-6",
  });

  third.flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_verify_currency_mismatch",
    amount: 500000,
    currency: "USD",
    transactionId: "1005",
  };

  await third.service.handleCallback({
    txRef: "tx_ref_verify_currency_mismatch",
    transactionId: "1005",
    status: "successful",
  });

  updated = await third.reservationService.getReservationByToken("token_verify_currency_mismatch");
  assert.equal(updated?.status, "failed_payment");
}

async function testRedirectReturnWithoutTransactionIdStaysPendingVerification(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_redirect_pending",
    token: "token_redirect_pending",
    paymentMethod: "website",
  });

  const { service, reservationService, paymentAttemptRepository } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_redirect_pending",
  });

  await service.initiateCheckout({
    token: "token_redirect_pending",
    idempotencyKey: "idem-flw-verify-7",
  });

  const callbackService = new FlutterwaveCallbackService({ websitePaymentService: service });
  const result = await callbackService.handleRedirectReturn({
    txRef: "tx_ref_redirect_pending",
    transactionId: null,
    status: "successful",
  });

  assert.equal(result.verificationState, "pending");
  assert.equal(result.verified, false);
  assert.equal(result.reservationStatus, null);
  assert.equal(result.paymentOutcome, null);

  const updated = await reservationService.getReservationByToken("token_redirect_pending");
  assert.equal(updated?.status, "pending_online_payment");
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "pending");
}

async function testRedirectReturnWithTransactionIdUsesVerificationLogic(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    id: "res_redirect_verified",
    token: "token_redirect_verified",
    paymentMethod: "website",
  });

  const { service, reservationService, flutterwaveClient } = createFlutterwaveHarness({
    reservations: [reservation],
    txRef: "tx_ref_redirect_verified",
  });

  await service.initiateCheckout({
    token: "token_redirect_verified",
    idempotencyKey: "idem-flw-verify-8",
  });

  flutterwaveClient.verifyResponse = {
    status: "successful",
    txRef: "tx_ref_redirect_verified",
    amount: 500000,
    currency: "NGN",
    transactionId: "1006",
  };

  const callbackService = new FlutterwaveCallbackService({ websitePaymentService: service });
  const result = await callbackService.handleRedirectReturn({
    txRef: "tx_ref_redirect_verified",
    transactionId: "1006",
    status: "successful",
  });

  assert.equal(result.verificationState, "completed");
  assert.equal(result.verified, true);
  assert.equal(result.reservationStatus, "confirmed");
  assert.equal(result.paymentOutcome, "success");

  const updated = await reservationService.getReservationByToken("token_redirect_verified");
  assert.equal(updated?.status, "confirmed");
}

async function run(): Promise<void> {
  await testVerifiedSuccessfulPaymentMovesReservationToConfirmed();
  await testVerifiedFailedPaymentMovesReservationToFailedPayment();
  await testCancelledPaymentMovesReservationToCancelled();
  await testMismatchedVerificationDataDoesNotConfirmBooking();
  await testRedirectReturnWithoutTransactionIdStaysPendingVerification();
  await testRedirectReturnWithTransactionIdUsesVerificationLogic();

  console.log("flutterwave-verification: ok");
}

void run();
