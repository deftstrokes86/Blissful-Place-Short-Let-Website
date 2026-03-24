import assert from "node:assert/strict";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  submitCreateInventoryItem,
  submitCreateMaintenanceIssue,
  submitCreateStockMovement,
  submitUpdateFlatChecklistReadiness,
  submitTransferStock,
  submitUpdateInventoryItem,
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
        workerTasks: [],
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

async function testSubmitCreateInventoryItemRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      item: {
        id: "item_tv",
      },
    });
  }) as typeof fetch;

  try {
    await submitCreateInventoryItem({
      name: "Smart TV",
      category: "asset",
      unitOfMeasure: "piece",
      internalCode: "TV-100",
      reorderThreshold: null,
      parLevel: 1,
      criticality: "critical",
    });

    assert.equal(capturedUrl, "/api/operations/inventory/items");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.name, "Smart TV");
    assert.equal(body.category, "asset");
    assert.equal(body.criticality, "critical");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitUpdateInventoryItemRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      item: {
        id: "item_tv",
      },
    });
  }) as typeof fetch;

  try {
    await submitUpdateInventoryItem({
      itemId: "item_tv",
      name: "Smart TV 65",
      category: "asset",
      unitOfMeasure: "piece",
      internalCode: "TV-101",
      reorderThreshold: 1,
      parLevel: 2,
      criticality: "important",
    });

    assert.equal(capturedUrl, "/api/operations/inventory/items/item_tv");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.name, "Smart TV 65");
    assert.equal(body.parLevel, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitCreateMovementAndTransferRequestShapes(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const captured: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      init,
    });

    return createApiSuccess({
      movement: {
        id: "movement_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitCreateStockMovement({
      movementType: "add",
      inventoryItemId: "item_water",
      quantity: 8,
      adjustToQuantity: null,
      flatId: "mayfair",
      reason: "Restock",
      notes: "Morning run",
      actorId: "staff_1",
    });

    await submitTransferStock({
      inventoryItemId: "item_water",
      quantity: 3,
      fromFlatId: null,
      toFlatId: "mayfair",
      reason: "Top up flat",
      notes: "Transfer from central",
      actorId: "staff_2",
    });

    assert.equal(captured[0]?.url, "/api/operations/inventory/movements");
    assert.equal(captured[0]?.init?.method, "POST");
    const movementBody = JSON.parse(String(captured[0]?.init?.body));
    assert.equal(movementBody.action, "movement");
    assert.equal(movementBody.movementType, "add");

    assert.equal(captured[1]?.url, "/api/operations/inventory/movements");
    assert.equal(captured[1]?.init?.method, "POST");
    const transferBody = JSON.parse(String(captured[1]?.init?.body));
    assert.equal(transferBody.action, "transfer");
    assert.equal(transferBody.toFlatId, "mayfair");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitUpdateFlatChecklistReadinessRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      readiness: {
        flatId: "mayfair",
        cleaningStatus: "ready",
        linenStatus: "ready",
        consumablesStatus: "attention_required",
        maintenanceStatus: "ready",
        criticalAssetStatus: "ready",
        readinessStatus: "needs_attention",
        overrideStatus: null,
        overrideReason: null,
        updatedAt: "2026-11-21T09:00:00.000Z",
      },
    });
  }) as typeof fetch;

  try {
    await submitUpdateFlatChecklistReadiness({
      flatId: "mayfair",
      cleaningCompleted: true,
      linenCompleted: false,
      consumablesCompleted: true,
    });

    assert.equal(capturedUrl, "/api/operations/inventory/flats/mayfair/readiness");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.cleaningCompleted, true);
    assert.equal(body.linenCompleted, false);
    assert.equal(body.consumablesCompleted, true);
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
  await testSubmitCreateInventoryItemRequestShape();
  await testSubmitUpdateInventoryItemRequestShape();
  await testSubmitCreateMovementAndTransferRequestShapes();
  await testSubmitUpdateFlatChecklistReadinessRequestShape();
  await testApiErrorPropagation();
  await testIdempotencyKeyCreation();

  console.log("admin-inventory-api: ok");
}

void run();
