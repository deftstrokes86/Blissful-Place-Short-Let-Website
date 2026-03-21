import assert from "node:assert/strict";

import {
  pickNextAdminPathParam,
  resolveAuthenticatedSecureAreaRedirect,
} from "../admin-secure-area";

function testPickNextAdminPathParam(): void {
  assert.equal(pickNextAdminPathParam(undefined), null);
  assert.equal(pickNextAdminPathParam("/admin/notifications"), "/admin/notifications");
  assert.equal(
    pickNextAdminPathParam(["/admin/availability", "/admin/bookings"]),
    "/admin/availability"
  );
}

function testAuthenticatedSecureAreaRedirectDefaultsToAdminBookings(): void {
  assert.equal(resolveAuthenticatedSecureAreaRedirect(null), "/admin/bookings");
  assert.equal(resolveAuthenticatedSecureAreaRedirect(undefined), "/admin/bookings");
}

function testAuthenticatedSecureAreaRedirectUsesSafeRequestedAdminDestination(): void {
  assert.equal(resolveAuthenticatedSecureAreaRedirect("/admin/notifications"), "/admin/notifications");
  assert.equal(resolveAuthenticatedSecureAreaRedirect("/book"), "/admin/bookings");
  assert.equal(resolveAuthenticatedSecureAreaRedirect("https://evil.example"), "/admin/bookings");
}

function run(): void {
  testPickNextAdminPathParam();
  testAuthenticatedSecureAreaRedirectDefaultsToAdminBookings();
  testAuthenticatedSecureAreaRedirectUsesSafeRequestedAdminDestination();

  console.log("admin-secure-area: ok");
}

run();
