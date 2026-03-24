import assert from "node:assert/strict";

import { submitResolveInventoryAlert } from "../../../lib/admin-inventory-api";

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

async function testResolveAlertRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      alert: {
        id: "alert_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitResolveInventoryAlert({
      alertId: "alert_1",
      note: "Resolved after replacement",
      idempotencyKey: "idem-alert-resolve-1",
    });

    assert.equal(capturedUrl, "/api/operations/inventory/alerts/alert_1/resolve");
    assert.equal(capturedInit?.method, "POST");

    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers["x-idempotency-key"], "idem-alert-resolve-1");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.note, "Resolved after replacement");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testResolveAlertRequestShape();

  console.log("admin-inventory-alerts-api: ok");
}

void run();
