import assert from "node:assert/strict";

import { AuthorizationError } from "../require-auth";
import { requireAdminSessionUser } from "../admin-page-guard";
import type { AuthenticatedUser } from "../auth-service";

function createUser(role: "admin" | "staff", isActive: boolean = true): AuthenticatedUser {
  return {
    id: `user_${role}`,
    email: `${role}@example.test`,
    role,
    isActive,
  };
}

async function testAnonymousPageAccessRejected(): Promise<void> {
  await assert.rejects(
    async () => {
      await requireAdminSessionUser({
        sessionToken: null,
        resolveUser: async () => createUser("admin"),
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

async function testAuthenticatedPageAccessAccepted(): Promise<void> {
  const user = await requireAdminSessionUser({
    sessionToken: "session-token-admin-page",
    resolveUser: async () => createUser("staff"),
  });

  assert.equal(user.role, "staff");
  assert.equal(user.isActive, true);
}

async function testForbiddenRoleRejected(): Promise<void> {
  await assert.rejects(
    async () => {
      await requireAdminSessionUser({
        sessionToken: "session-token-guest-role",
        resolveUser: async () => ({
          id: "user_guest",
          email: "guest@example.test",
          role: "guest" as unknown as "admin" | "staff",
          isActive: true,
        }),
      });
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
  await testAnonymousPageAccessRejected();
  await testAuthenticatedPageAccessAccepted();
  await testForbiddenRoleRejected();

  console.log("admin-page-guard: ok");
}

void run();
