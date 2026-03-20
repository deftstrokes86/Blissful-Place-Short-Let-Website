import assert from "node:assert/strict";

import {
  formatHoldExpiry,
  formatReservationStatusLabel,
  isActionDisabled,
  type StaffActionIntent,
} from "../../../components/admin/bookings/admin-bookings-view-model";

async function testStatusLabelFormatting(): Promise<void> {
  assert.equal(formatReservationStatusLabel("pending_transfer_submission"), "Pending Transfer Submission");
  assert.equal(formatReservationStatusLabel("pending_pos_coordination"), "Pending Pos Coordination");
  assert.equal(formatReservationStatusLabel("confirmed"), "Confirmed");
}

async function testHoldExpiryFormatting(): Promise<void> {
  const now = new Date("2026-10-01T09:30:00.000Z");

  const active = formatHoldExpiry("2026-10-01T10:00:00.000Z", now);
  assert.equal(active.tone, "active");
  assert.ok(active.label.includes("Expires"));

  const expired = formatHoldExpiry("2026-10-01T09:00:00.000Z", now);
  assert.equal(expired.tone, "expired");
  assert.ok(expired.label.includes("Expired"));

  const none = formatHoldExpiry(null, now);
  assert.equal(none.tone, "neutral");
  assert.equal(none.label, "No hold expiry set");
}

async function testActionDisabledState(): Promise<void> {
  const verifyAction: StaffActionIntent = "verify_transfer";

  assert.equal(
    isActionDisabled({
      inFlightActionKey: "res_1:verify_transfer",
      action: verifyAction,
      reservationId: "res_1",
      requiresStaffId: true,
      staffId: "staff_1",
    }),
    true
  );

  assert.equal(
    isActionDisabled({
      inFlightActionKey: null,
      action: verifyAction,
      reservationId: "res_1",
      requiresStaffId: true,
      staffId: "",
    }),
    true
  );

  assert.equal(
    isActionDisabled({
      inFlightActionKey: null,
      action: "cancel_reservation",
      reservationId: "res_1",
      requiresStaffId: false,
      staffId: "",
    }),
    false
  );
}

async function run(): Promise<void> {
  await testStatusLabelFormatting();
  await testHoldExpiryFormatting();
  await testActionDisabledState();

  console.log("admin-bookings-view-model: ok");
}

void run();
