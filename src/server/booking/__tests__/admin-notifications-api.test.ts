import assert from "node:assert/strict";

import { fetchInternalAdminNotifications } from "../../../lib/admin-notifications-api";

function createApiSuccess<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

function createApiError(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "invalid_request",
        message,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

async function testFetchInternalNotifications(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);

    return createApiSuccess({
      notifications: [
        {
          id: "ntf_1",
          eventType: "reservation_cancelled_staff_alert",
          audience: "staff",
          channel: "internal",
          reservationId: "res_1",
          reservationToken: "token_1",
          status: "sent",
          title: "Reservation cancelled alert",
          summary: "Reservation cancelled.",
          createdAt: "2026-11-01T10:00:00.000Z",
          sentAt: "2026-11-01T10:01:00.000Z",
          errorMessage: null,
        },
      ],
    });
  }) as typeof fetch;

  try {
    const notifications = await fetchInternalAdminNotifications();

    assert.equal(capturedUrl, "/api/operations/notifications/internal");
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].id, "ntf_1");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testApiErrorPropagation(): Promise<void> {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => createApiError("Notifications unavailable.")) as typeof fetch;

  try {
    await assert.rejects(
      async () => {
        await fetchInternalAdminNotifications();
      },
      /Notifications unavailable/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testFetchInternalNotifications();
  await testApiErrorPropagation();

  console.log("admin-notifications-api: ok");
}

void run();
