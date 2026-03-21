import assert from "node:assert/strict";

import {
  AuthorizationError,
  getSessionTokenFromRequest,
  requireAuthenticatedRequest,
  requireAuthenticatedUser,
  type SessionUserResolver,
} from "../require-auth";
import { requireRole, requireRoleForRequest } from "../require-role";
import type { AuthenticatedUser } from "../auth-service";

function createUser(role: "admin" | "staff", overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: `user_${role}`,
    email: `${role}@example.test`,
    role,
    isActive: true,
    ...overrides,
  };
}

function createRequest(headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/operations/staff/queue", {
    headers,
  });
}

function testSessionTokenParsingAcrossSupportedHeadersAndCookies(): void {
  const fromBearer = getSessionTokenFromRequest(
    createRequest({
      authorization: "Bearer bearer-token-1",
    })
  );
  assert.equal(fromBearer, "bearer-token-1");

  const fromSessionHeader = getSessionTokenFromRequest(
    createRequest({
      "x-session-token": "header-token-1",
    })
  );
  assert.equal(fromSessionHeader, "header-token-1");

  const fromCookie = getSessionTokenFromRequest(
    createRequest({
      cookie: "other=value; blissful_admin_session=cookie-token-1; another=ok",
    })
  );
  assert.equal(fromCookie, "cookie-token-1");
}

function testSessionTokenResolutionPrefersBearerThenExplicitHeaderThenCookie(): void {
  const token = getSessionTokenFromRequest(
    createRequest({
      authorization: "Bearer preferred-bearer-token",
      "x-session-token": "fallback-header-token",
      cookie: "blissful_admin_session=fallback-cookie-token",
    })
  );

  assert.equal(token, "preferred-bearer-token");
}

async function testAnonymousUserRejected(): Promise<void> {
  const resolver: SessionUserResolver = async () => createUser("staff");

  await assert.rejects(
    async () => {
      await requireAuthenticatedRequest(createRequest(), { resolveUser: resolver });
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

  assert.throws(
    () => requireAuthenticatedUser(null),
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

async function testAuthenticatedUserAccepted(): Promise<void> {
  let seenToken: string | null = null;
  const resolver: SessionUserResolver = async (sessionToken) => {
    seenToken = sessionToken;
    return createUser("staff");
  };

  const result = await requireAuthenticatedRequest(
    createRequest({
      authorization: "Bearer session-token-1",
    }),
    { resolveUser: resolver }
  );

  assert.equal(seenToken, "session-token-1");
  assert.equal(result.user.role, "staff");
  assert.equal(result.sessionToken, "session-token-1");
}

async function testWrongRoleRejectedWhereRoleChecksApply(): Promise<void> {
  const resolver: SessionUserResolver = async () => createUser("staff");

  await assert.rejects(
    async () => {
      await requireRoleForRequest(createRequest({ authorization: "Bearer token-role-check" }), {
        resolveUser: resolver,
        allowedRoles: ["admin"],
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

  assert.throws(
    () => {
      requireRole(createUser("staff"), ["admin"]);
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

async function testActiveUserWithAllowedRoleAccepted(): Promise<void> {
  const resolver: SessionUserResolver = async () => createUser("staff", { isActive: true });

  const result = await requireRoleForRequest(createRequest({ authorization: "Bearer token-ok" }), {
    resolveUser: resolver,
    allowedRoles: ["admin", "staff"],
  });

  assert.equal(result.role, "staff");
}

async function run(): Promise<void> {
  testSessionTokenParsingAcrossSupportedHeadersAndCookies();
  testSessionTokenResolutionPrefersBearerThenExplicitHeaderThenCookie();
  await testAnonymousUserRejected();
  await testAuthenticatedUserAccepted();
  await testWrongRoleRejectedWhereRoleChecksApply();
  await testActiveUserWithAllowedRoleAccepted();

  console.log("require-auth: ok");
}

void run();
