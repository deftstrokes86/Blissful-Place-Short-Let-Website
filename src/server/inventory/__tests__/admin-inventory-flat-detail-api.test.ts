import assert from "node:assert/strict";

import {
  submitClearFlatReadinessOverride,
  submitFlatInventoryReconciliationAction,
  submitSetFlatReadinessOverride,
} from "../../../lib/admin-inventory-api";

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

async function testReconciliationRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      record: {
        id: "flat_inv_1",
      },
      movement: null,
    });
  }) as typeof fetch;

  try {
    await submitFlatInventoryReconciliationAction({
      flatId: "mayfair",
      flatInventoryId: "flat_inv_1",
      action: "mark_missing",
      note: "Missing after checkout",
    });

    assert.equal(capturedUrl, "/api/operations/inventory/flats/mayfair/records/flat_inv_1/reconcile");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.action, "mark_missing");
    assert.equal(body.note, "Missing after checkout");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testReadinessOverrideRequestShapes(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const captured: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      init,
    });

    return createApiSuccess({
      readiness: {
        flatId: "mayfair",
      },
    });
  }) as typeof fetch;

  try {
    await submitSetFlatReadinessOverride({
      flatId: "mayfair",
      overrideStatus: "out_of_service",
      reason: "Manual safety hold",
    });

    await submitClearFlatReadinessOverride({
      flatId: "mayfair",
    });

    assert.equal(captured[0]?.url, "/api/operations/inventory/flats/mayfair/readiness-override");
    assert.equal(captured[0]?.init?.method, "POST");

    const setBody = JSON.parse(String(captured[0]?.init?.body));
    assert.equal(setBody.overrideStatus, "out_of_service");

    assert.equal(captured[1]?.url, "/api/operations/inventory/flats/mayfair/readiness-override");
    assert.equal(captured[1]?.init?.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testReconciliationRequestShape();
  await testReadinessOverrideRequestShapes();

  console.log("admin-inventory-flat-detail-api: ok");
}

void run();
