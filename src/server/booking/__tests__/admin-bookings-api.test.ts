import assert from "node:assert/strict";

import {
  createAdminIdempotencyKey,
  fetchPendingPosReservations,
  fetchPendingTransferReservations,
  submitPosConfirmation,
  submitReservationCancellation,
  submitTransferVerification,
} from "../../../lib/admin-bookings-api";

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

async function testFetchPendingTransferReservations(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);

    return createApiSuccess({
      reservations: [
        {
          reservationId: "res_transfer_1",
          token: "token_transfer_1",
          status: "awaiting_transfer_verification",
          flatId: "mayfair",
          checkIn: "2026-10-10",
          checkOut: "2026-10-13",
          guestName: "Ada Lovelace",
          guestEmail: "ada@example.com",
          guestPhone: "+23400000000",
          holdExpiresAt: "2026-10-01T10:00:00.000Z",
          holdExpired: false,
          transferReference: "TRX-1",
          proofReceivedAt: "2026-10-01T09:20:00.000Z",
          verificationStatus: "pending",
        },
      ],
    });
  }) as typeof fetch;

  try {
    const result = await fetchPendingTransferReservations();

    assert.equal(capturedUrl, "/api/operations/staff/transfers/pending");
    assert.equal(result.length, 1);
    assert.equal(result[0].reservationId, "res_transfer_1");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitTransferVerificationRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;

    return createApiSuccess({
      reservation: {
        token: "token_transfer_1",
      },
      transferMetadata: {
        id: "trf_meta_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitTransferVerification({
      token: "token_transfer_1",
      staffId: "staff_1",
      verificationNote: "verified",
      idempotencyKey: "idem-transfer-1",
    });

    assert.ok(capturedInit);
    assert.equal(capturedInit?.method, "POST");

    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers["x-idempotency-key"], "idem-transfer-1");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.token, "token_transfer_1");
    assert.equal(body.staffId, "staff_1");
    assert.equal(body.verificationNote, "verified");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitPosConfirmationAndCancel(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });

    if (String(input).includes("/confirm")) {
      return createApiSuccess({
        reservation: {
          token: "token_pos_1",
        },
        posMetadata: {
          id: "pos_meta_1",
        },
      });
    }

    return createApiSuccess({
      reservation: {
        token: "token_cancel_1",
      },
    });
  }) as typeof fetch;

  try {
    await submitPosConfirmation({
      token: "token_pos_1",
      staffId: "staff_2",
      idempotencyKey: "idem-pos-1",
    });

    await submitReservationCancellation({
      token: "token_cancel_1",
      idempotencyKey: "idem-cancel-1",
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, "/api/operations/staff/pos/confirm");
    assert.equal(calls[1].url, "/api/operations/staff/reservations/cancel");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testApiErrorMessagePropagation(): Promise<void> {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => createApiError("Transfer cannot be verified right now.")) as typeof fetch;

  try {
    await assert.rejects(
      async () => {
        await fetchPendingPosReservations();
      },
      /Transfer cannot be verified right now/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testCreateAdminIdempotencyKey(): Promise<void> {
  const key = createAdminIdempotencyKey("staff-action");

  assert.ok(key.startsWith("staff-action-"));
  assert.ok(key.length > "staff-action-".length);
}

async function run(): Promise<void> {
  await testFetchPendingTransferReservations();
  await testSubmitTransferVerificationRequestShape();
  await testSubmitPosConfirmationAndCancel();
  await testApiErrorMessagePropagation();
  await testCreateAdminIdempotencyKey();

  console.log("admin-bookings-api: ok");
}

void run();
