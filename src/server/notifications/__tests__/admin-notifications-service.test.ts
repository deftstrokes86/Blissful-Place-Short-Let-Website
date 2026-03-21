import assert from "node:assert/strict";

import type { ReservationNotificationRecord } from "../../../types/booking-backend";
import {
  AdminNotificationsService,
  type AdminNotificationsQueryRepository,
} from "../admin-notifications-service";

class InMemoryQueryRepository implements AdminNotificationsQueryRepository {
  constructor(private readonly notifications: ReservationNotificationRecord[]) {}

  async listAllNotifications(): Promise<ReservationNotificationRecord[]> {
    return this.notifications.map((notification) => ({ ...notification, payload: { ...notification.payload } }));
  }
}

function createNotification(overrides?: Partial<ReservationNotificationRecord>): ReservationNotificationRecord {
  return {
    id: "ntf_1",
    eventType: "reservation_cancelled_staff_alert",
    templateKey: "reservation_cancelled_staff_alert",
    audience: "staff",
    channel: "internal",
    recipient: "ops:bookings",
    title: "Reservation cancelled alert",
    body: "Reservation has been cancelled.",
    templateRef: "template:reservation_cancelled_staff_alert",
    status: "sent",
    dedupeKey: "dedupe-1",
    payload: {},
    reservationId: "res_1",
    reservationToken: "token_1",
    paymentAttemptId: null,
    errorMessage: null,
    sentAt: "2026-11-01T10:01:00.000Z",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:01:00.000Z",
    ...overrides,
  };
}

async function testListsInternalNotificationsOnlyAndSortsLatestFirst(): Promise<void> {
  const repository = new InMemoryQueryRepository([
    createNotification({
      id: "ntf_old",
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-01T10:00:00.000Z",
    }),
    createNotification({
      id: "ntf_email",
      channel: "email",
      audience: "guest",
      eventType: "reservation_request_received",
      templateKey: "reservation_request_received",
      createdAt: "2026-11-01T10:05:00.000Z",
      updatedAt: "2026-11-01T10:05:00.000Z",
    }),
    createNotification({
      id: "ntf_new",
      createdAt: "2026-11-01T10:10:00.000Z",
      updatedAt: "2026-11-01T10:10:00.000Z",
    }),
  ]);

  const service = new AdminNotificationsService({ repository });
  const notifications = await service.listInternalNotifications({ limit: 10 });

  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].id, "ntf_new");
  assert.equal(notifications[1].id, "ntf_old");
}

async function testFailedNotificationsRetainFailureDetails(): Promise<void> {
  const repository = new InMemoryQueryRepository([
    createNotification({
      id: "ntf_failed",
      status: "failed",
      errorMessage: "SMTP timeout",
      sentAt: null,
    }),
  ]);

  const service = new AdminNotificationsService({ repository });
  const notifications = await service.listInternalNotifications({ limit: 10 });

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].status, "failed");
  assert.equal(notifications[0].errorMessage, "SMTP timeout");
}

async function testEmptyStateReturnsEmptyArray(): Promise<void> {
  const service = new AdminNotificationsService({
    repository: new InMemoryQueryRepository([]),
  });

  const notifications = await service.listInternalNotifications({ limit: 10 });
  assert.deepEqual(notifications, []);
}

async function run(): Promise<void> {
  await testListsInternalNotificationsOnlyAndSortsLatestFirst();
  await testFailedNotificationsRetainFailureDetails();
  await testEmptyStateReturnsEmptyArray();

  console.log("admin-notifications-service: ok");
}

void run();
