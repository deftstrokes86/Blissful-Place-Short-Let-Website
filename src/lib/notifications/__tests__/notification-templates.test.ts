import assert from "node:assert/strict";

import {
  BOOKING_NOTIFICATION_EVENT_MAP,
  NOTIFICATION_EVENT_DEFINITIONS,
  type NotificationTemplateEventKey,
} from "../notification-events";
import { renderNotificationTemplate } from "../notification-templates";

function render(event: NotificationTemplateEventKey) {
  return renderNotificationTemplate({
    event,
    channel: "email",
    context: {
      reservationToken: "token_123",
      guestName: "Ada Lovelace",
      flatLabel: "Mayfair Suite",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
      holdExpiresAt: "2026-09-01T13:00:00.000Z",
    },
  });
}

async function testCorrectSubjectAndBodyGeneration(): Promise<void> {
  const request = render("reservation_request_received");
  assert.equal(request.subject, "Reservation request received");
  assert.ok(request.body.includes("received"));

  const confirmed = render("booking_confirmed");
  assert.equal(confirmed.subject, "Booking confirmed");
  assert.ok(confirmed.body.includes("confirmed"));

  const staffAlert = renderNotificationTemplate({
    event: "pending_transfer_created",
    channel: "internal",
    context: {
      reservationToken: "token_123",
      flatLabel: "Mayfair Suite",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    },
  });

  assert.equal(staffAlert.subject, "New pending transfer reservation");
  assert.ok(staffAlert.body.includes("staff"));
}

async function testGuestVsStaffAudienceDifferences(): Promise<void> {
  assert.equal(NOTIFICATION_EVENT_DEFINITIONS.booking_confirmed.audience, "guest");
  assert.equal(NOTIFICATION_EVENT_DEFINITIONS.pending_transfer_created.audience, "staff");

  const guestTemplate = render("reservation_cancelled");
  const staffTemplate = renderNotificationTemplate({
    event: "reservation_cancelled_staff_alert",
    channel: "internal",
    context: {
      reservationToken: "token_123",
      flatLabel: "Mayfair Suite",
      checkIn: "2026-09-10",
      checkOut: "2026-09-12",
    },
  });

  assert.ok(guestTemplate.body.includes("your reservation"));
  assert.ok(staffTemplate.body.includes("Staff alert"));
}

async function testBookingConfirmedLanguageIsTruthful(): Promise<void> {
  const confirmed = render("booking_confirmed");

  assert.ok(confirmed.subject.toLowerCase().includes("confirmed"));
  assert.ok(!confirmed.body.toLowerCase().includes("pending"));
  assert.ok(!confirmed.body.toLowerCase().includes("request submitted"));
}

async function testTransferPendingUsesPendingLanguage(): Promise<void> {
  const pending = render("transfer_pending_confirmation");

  assert.ok(pending.subject.toLowerCase().includes("pending"));
  assert.ok(pending.body.toLowerCase().includes("pending"));
  assert.ok(!pending.body.toLowerCase().includes("confirmed"));
}

async function testPosSubmittedUsesRequestCoordinationLanguage(): Promise<void> {
  const posSubmitted = render("pos_request_submitted");

  assert.ok(posSubmitted.subject.toLowerCase().includes("request"));
  assert.ok(
    posSubmitted.body.toLowerCase().includes("coordination") ||
      posSubmitted.body.toLowerCase().includes("request")
  );
  assert.ok(!posSubmitted.body.toLowerCase().includes("confirmed"));
}

async function testEventMapIncludesApprovedTriggers(): Promise<void> {
  assert.deepEqual(BOOKING_NOTIFICATION_EVENT_MAP.pending_transfer_submission, ["transfer_pending_confirmation"]);
  assert.deepEqual(BOOKING_NOTIFICATION_EVENT_MAP.awaiting_transfer_verification, ["transfer_proof_submitted"]);
  assert.deepEqual(BOOKING_NOTIFICATION_EVENT_MAP.pending_pos_coordination, ["pos_request_submitted"]);
  assert.deepEqual(BOOKING_NOTIFICATION_EVENT_MAP.confirmed_guest, ["booking_confirmed"]);
  assert.deepEqual(BOOKING_NOTIFICATION_EVENT_MAP.confirmed_staff, ["reservation_confirmed_staff_alert"]);
}

async function testDeterministicOutput(): Promise<void> {
  const first = render("reservation_request_received");
  const second = render("reservation_request_received");

  assert.deepEqual(first, second);
}

async function run(): Promise<void> {
  await testCorrectSubjectAndBodyGeneration();
  await testGuestVsStaffAudienceDifferences();
  await testBookingConfirmedLanguageIsTruthful();
  await testTransferPendingUsesPendingLanguage();
  await testPosSubmittedUsesRequestCoordinationLanguage();
  await testEventMapIncludesApprovedTriggers();
  await testDeterministicOutput();

  console.log("notification-templates: ok");
}

void run();
