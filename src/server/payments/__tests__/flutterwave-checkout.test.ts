import assert from "node:assert/strict";

import {
  createFlutterwaveHarness,
  createReservation,
} from "./support/flutterwave-harness";

async function testInitiatingCheckoutMovesReservationToPendingOnlinePayment(): Promise<void> {
  const reservation = createReservation("draft", {
    token: "token_checkout_from_draft",
    paymentMethod: "website",
  });

  const { service, reservationService } = createFlutterwaveHarness({ reservations: [reservation] });

  const checkout = await service.initiateCheckout({
    token: "token_checkout_from_draft",
    idempotencyKey: "idem-flw-checkout-1",
  });

  assert.equal(checkout.reservation.status, "pending_online_payment");

  const updated = await reservationService.getReservationByToken("token_checkout_from_draft");
  assert.equal(updated?.status, "pending_online_payment");
}

async function testInitiatingCheckoutFromDraftAssignsWebsiteMethodWhenMissing(): Promise<void> {
  const reservation = createReservation("draft", {
    token: "token_checkout_from_draft_no_method",
  });

  const { service, reservationService } = createFlutterwaveHarness({ reservations: [reservation] });

  const checkout = await service.initiateCheckout({
    token: "token_checkout_from_draft_no_method",
    idempotencyKey: "idem-flw-checkout-1b",
  });

  assert.equal(checkout.reservation.status, "pending_online_payment");
  assert.equal(checkout.reservation.paymentMethod, "website");

  const updated = await reservationService.getReservationByToken("token_checkout_from_draft_no_method");
  assert.equal(updated?.paymentMethod, "website");
}

async function testInitiatingCheckoutCreatesPaymentAttemptRecord(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_attempt",
    paymentMethod: "website",
  });

  const { service, paymentAttemptRepository } = createFlutterwaveHarness({ reservations: [reservation] });

  const checkout = await service.initiateCheckout({
    token: "token_checkout_attempt",
    idempotencyKey: "idem-flw-checkout-2",
  });

  assert.equal(paymentAttemptRepository.attempts.length, 1);
  assert.equal(paymentAttemptRepository.attempts[0].provider, "flutterwave");
  assert.equal(paymentAttemptRepository.attempts[0].outcome, "pending");
  assert.equal(paymentAttemptRepository.attempts[0].providerReference, checkout.checkoutReference);
  assert.equal(paymentAttemptRepository.attempts[0].amount, reservation.pricing.estimatedTotal);
}

async function testCheckoutInitiationFailsCleanlyWhenAvailabilityFails(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_availability_fail",
    paymentMethod: "website",
  });

  const { service, paymentAttemptRepository } = createFlutterwaveHarness({
    reservations: [reservation],
    preCheckoutAvailable: false,
  });

  await assert.rejects(
    async () => {
      await service.initiateCheckout({
        token: "token_checkout_availability_fail",
        idempotencyKey: "idem-flw-checkout-3",
      });
    },
    /pre-checkout availability recheck failed/
  );

  assert.equal(paymentAttemptRepository.attempts.length, 0);
}

async function testDuplicateCheckoutWithSameIdempotencyKeyDoesNotDuplicateAttempts(): Promise<void> {
  const reservation = createReservation("pending_online_payment", {
    token: "token_checkout_idem",
    paymentMethod: "website",
  });

  const { service, paymentAttemptRepository } = createFlutterwaveHarness({ reservations: [reservation] });

  await service.initiateCheckout({
    token: "token_checkout_idem",
    idempotencyKey: "idem-flw-checkout-same",
  });

  await service.initiateCheckout({
    token: "token_checkout_idem",
    idempotencyKey: "idem-flw-checkout-same",
  });

  assert.equal(paymentAttemptRepository.attempts.length, 1);
}

async function run(): Promise<void> {
  await testInitiatingCheckoutMovesReservationToPendingOnlinePayment();
  await testInitiatingCheckoutFromDraftAssignsWebsiteMethodWhenMissing();
  await testInitiatingCheckoutCreatesPaymentAttemptRecord();
  await testCheckoutInitiationFailsCleanlyWhenAvailabilityFails();
  await testDuplicateCheckoutWithSameIdempotencyKeyDoesNotDuplicateAttempts();

  console.log("flutterwave-checkout: ok");
}

void run();
