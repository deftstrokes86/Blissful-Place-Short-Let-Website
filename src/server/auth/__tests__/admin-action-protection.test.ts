import assert from "node:assert/strict";

import { AuthorizationError } from "../require-auth";
import { requireStaffOrAdminRequest } from "../require-role";
import type { AuthenticatedUser } from "../auth-service";

function createRequest(headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/operations/staff/transfers/verify", {
    method: "POST",
    headers,
    body: JSON.stringify({ token: "token_1" }),
  });
}

function createUser(role: "admin" | "staff", isActive: boolean = true): AuthenticatedUser {
  return {
    id: `user_${role}`,
    email: `${role}@example.test`,
    role,
    isActive,
  };
}

async function testProtectedActionRejectsAnonymousAccess(): Promise<void> {
  await assert.rejects(
    async () => {
      await requireStaffOrAdminRequest(createRequest(), {
        resolveUser: async () => createUser("staff"),
      });
    },
    (error: unknown) => {
      if (!(error instanceof AuthorizationError)) {
        return false;
      }

      assert.equal(error.status, 401);
      assert.equal(error.code, "unauthenticated");
      return true;
    }
  );
}

async function testProtectedActionAcceptsAuthenticatedStaff(): Promise<void> {
  const user = await requireStaffOrAdminRequest(
    createRequest({
      authorization: "Bearer valid-session-token",
    }),
    {
      resolveUser: async () => createUser("staff"),
    }
  );

  assert.equal(user.role, "staff");
  assert.equal(user.isActive, true);
}

async function testProtectedActionRejectsForbiddenRole(): Promise<void> {
  await assert.rejects(
    async () => {
      await requireStaffOrAdminRequest(
        createRequest({
          authorization: "Bearer token-forbidden",
        }),
        {
          resolveUser: async () => ({
            id: "user_guest",
            email: "guest@example.test",
            role: "guest" as unknown as "admin" | "staff",
            isActive: true,
          }),
        }
      );
    },
    (error: unknown) => {
      if (!(error instanceof AuthorizationError)) {
        return false;
      }

      assert.equal(error.status, 403);
      assert.equal(error.code, "forbidden");
      return true;
    }
  );
}

async function run(): Promise<void> {
  await testProtectedActionRejectsAnonymousAccess();
  await testProtectedActionAcceptsAuthenticatedStaff();
  await testProtectedActionRejectsForbiddenRole();

  console.log("admin-action-protection: ok");
}

void run();
