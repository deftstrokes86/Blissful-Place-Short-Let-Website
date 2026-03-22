import assert from "node:assert/strict";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateMaintenanceIssue,
  submitUpdateMaintenanceIssueStatus,
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

async function testFetchAdminInventoryOverview(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);

    return createApiSuccess({
      overview: {
        generatedAt: "2026-11-10T10:00:00.000Z",
        flats: [{ id: "mayfair", name: "Mayfair Suite" }],
        inventoryCatalog: [],
        templates: [],
        flatInventory: [],
        stockMovements: [],
        readiness: [],
        activeAlerts: [],
        maintenanceIssues: [],
      },
    });
  }) as typeof fetch;

  try {
    const overview = await fetchAdminInventoryOverview();

    assert.equal(capturedUrl, "/api/operations/inventory/overview");
    assert.equal(overview.flats.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitCreateMaintenanceIssueRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;

    return createApiSuccess({
      issue: {
        id: "issue_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitCreateMaintenanceIssue({
      flatId: "mayfair",
      inventoryItemId: "item_tv",
      title: "TV not powering on",
      notes: "Reported after checkout",
      severity: "important",
      idempotencyKey: "idem-create-issue-1",
    });

    assert.equal(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers["x-idempotency-key"], "idem-create-issue-1");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.flatId, "mayfair");
    assert.equal(body.title, "TV not powering on");
    assert.equal(body.severity, "important");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitUpdateIssueStatusRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      issue: {
        id: "issue_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitUpdateMaintenanceIssueStatus({
      issueId: "issue_1",
      status: "resolved",
      notes: "Fixed and tested",
      idempotencyKey: "idem-update-issue-1",
    });

    assert.equal(capturedUrl, "/api/operations/inventory/issues/issue_1/status");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.status, "resolved");
    assert.equal(body.notes, "Fixed and tested");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testApiErrorPropagation(): Promise<void> {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => createApiError("Issue update failed.")) as typeof fetch;

  try {
    await assert.rejects(
      async () => {
        await fetchAdminInventoryOverview();
      },
      /Issue update failed/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testIdempotencyKeyCreation(): Promise<void> {
  const key = createAdminInventoryIdempotencyKey("inventory-action");
  assert.ok(key.startsWith("inventory-action-"));
}

async function run(): Promise<void> {
  await testFetchAdminInventoryOverview();
  await testSubmitCreateMaintenanceIssueRequestShape();
  await testSubmitUpdateIssueStatusRequestShape();
  await testApiErrorPropagation();
  await testIdempotencyKeyCreation();

  console.log("admin-inventory-api: ok");
}

void run();
