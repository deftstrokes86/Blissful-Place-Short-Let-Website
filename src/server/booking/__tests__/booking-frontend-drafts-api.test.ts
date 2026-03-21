import assert from "node:assert/strict";

import {
  createBookingDraft,
  loadBookingDraft,
  saveBookingDraftProgress,
} from "../../../lib/booking-frontend-api";

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

async function testCreateBookingDraftRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      resumeToken: "token_1",
      reservation: {
        token: "token_1",
        status: "draft",
        paymentMethod: null,
        stay: {
          flatId: "mayfair",
          checkIn: "2026-10-10",
          checkOut: "2026-10-12",
          guests: 2,
          extraIds: [],
        },
        guest: {
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          phone: "+23400000000",
          specialRequests: "",
        },
        progressContext: {
          currentStep: 1,
          activeBranch: null,
        },
        transferHoldExpiresAt: null,
        lastTouchedAt: "2026-10-01T10:00:00.000Z",
      },
    });
  }) as typeof fetch;

  try {
    await createBookingDraft({
      stay: {
        flatId: "mayfair",
        checkIn: "2026-10-10",
        checkOut: "2026-10-12",
        guests: 2,
        extraIds: [],
      },
    });

    assert.equal(capturedUrl, "/api/reservations/drafts");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.stay.flatId, "mayfair");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testLoadBookingDraftRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);

    return createApiSuccess({
      resumeToken: "token_2",
      reservation: {
        token: "token_2",
        status: "draft",
        paymentMethod: "transfer",
        stay: {
          flatId: "kensington",
          checkIn: "2026-11-01",
          checkOut: "2026-11-04",
          guests: 2,
          extraIds: ["airport"],
        },
        guest: {
          firstName: "Grace",
          lastName: "Hopper",
          email: "grace@example.com",
          phone: "+23411111111",
          specialRequests: "Late arrival",
        },
        progressContext: {
          currentStep: 4,
          activeBranch: "transfer",
        },
        transferHoldExpiresAt: "2026-11-01T10:00:00.000Z",
        lastTouchedAt: "2026-11-01T09:30:00.000Z",
      },
    });
  }) as typeof fetch;

  try {
    await loadBookingDraft("token_2");
    assert.equal(capturedUrl, "/api/reservations/drafts/token_2");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSaveBookingDraftRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      resumeToken: "token_3",
      reservation: {
        token: "token_3",
        status: "draft",
        paymentMethod: "website",
        stay: {
          flatId: "mayfair",
          checkIn: "2026-12-10",
          checkOut: "2026-12-14",
          guests: 2,
          extraIds: [],
        },
        guest: {
          firstName: "Alan",
          lastName: "Turing",
          email: "alan@example.com",
          phone: "+23422222222",
          specialRequests: "",
        },
        progressContext: {
          currentStep: 2,
          activeBranch: "website",
        },
        transferHoldExpiresAt: null,
        lastTouchedAt: "2026-12-01T10:00:00.000Z",
      },
    });
  }) as typeof fetch;

  try {
    await saveBookingDraftProgress("token_3", {
      paymentMethod: "website",
    });

    assert.equal(capturedUrl, "/api/reservations/drafts/token_3");
    assert.equal(capturedInit?.method, "PATCH");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.paymentMethod, "website");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testCreateBookingDraftRequestShape();
  await testLoadBookingDraftRequestShape();
  await testSaveBookingDraftRequestShape();

  console.log("booking-frontend-drafts-api: ok");
}

void run();
