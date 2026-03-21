import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { AdminNotificationsList } from "../../../components/admin/notifications/AdminNotificationsList";
import type { AdminNotificationListItem } from "../../../lib/admin-notifications-api";

function createNotification(overrides?: Partial<AdminNotificationListItem>): AdminNotificationListItem {
  return {
    id: "ntf_1",
    eventType: "reservation_cancelled_staff_alert",
    audience: "staff",
    channel: "internal",
    reservationId: "res_1",
    reservationToken: "token_1",
    status: "sent",
    title: "Reservation cancelled alert",
    summary: "Reservation was cancelled by staff.",
    createdAt: "2026-11-01T10:00:00.000Z",
    sentAt: "2026-11-01T10:01:00.000Z",
    errorMessage: null,
    ...overrides,
  };
}

async function testRendersNotificationsList(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminNotificationsList({
      notifications: [createNotification()],
      isLoading: false,
      loadError: null,
    })
  );

  assert.ok(html.includes("Reservation cancelled alert"));
  assert.ok(html.includes("res_1"));
}

async function testStatusRenderingIncludesFailedState(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminNotificationsList({
      notifications: [
        createNotification({
          status: "failed",
          errorMessage: "SMTP timeout",
          sentAt: null,
        }),
      ],
      isLoading: false,
      loadError: null,
    })
  );

  assert.ok(html.includes("Failed"));
  assert.ok(html.includes("SMTP timeout"));
}

async function testEmptyStateRendering(): Promise<void> {
  const html = renderToStaticMarkup(
    AdminNotificationsList({
      notifications: [],
      isLoading: false,
      loadError: null,
    })
  );

  assert.ok(html.includes("No internal notifications yet"));
}

async function run(): Promise<void> {
  await testRendersNotificationsList();
  await testStatusRenderingIncludesFailedState();
  await testEmptyStateRendering();

  console.log("admin-notifications-ui: ok");
}

void run();
