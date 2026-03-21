import assert from "node:assert/strict";

import {
  loginStaffAdmin,
  logoutStaffAdmin,
} from "../../../lib/auth-frontend-api";

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

function createApiError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: "invalid_credentials",
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

async function testSuccessfulLoginFrontendFlow(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      user: {
        id: "user_1",
        email: "staff@example.test",
        role: "staff",
      },
      redirectTo: "/admin/bookings",
    });
  }) as typeof fetch;

  try {
    const result = await loginStaffAdmin({
      email: "staff@example.test",
      password: "Staff-Password-123!",
    });

    assert.equal(capturedUrl, "/api/auth/login");
    assert.equal(capturedInit?.method, "POST");

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.email, "staff@example.test");
    assert.equal(result.redirectTo, "/admin/bookings");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testFailedLoginFrontendFlow(): Promise<void> {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => createApiError(401, "Invalid email or password.")) as typeof fetch;

  try {
    await assert.rejects(
      async () => {
        await loginStaffAdmin({
          email: "staff@example.test",
          password: "Wrong-Password-123!",
        });
      },
      /Invalid email or password\./
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testLogoutFrontendFlow(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;

    return createApiSuccess({
      success: true,
    });
  }) as typeof fetch;

  try {
    await logoutStaffAdmin();

    assert.equal(capturedUrl, "/api/auth/logout");
    assert.equal(capturedInit?.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testSuccessfulLoginFrontendFlow();
  await testFailedLoginFrontendFlow();
  await testLogoutFrontendFlow();

  console.log("auth-frontend-api: ok");
}

void run();
