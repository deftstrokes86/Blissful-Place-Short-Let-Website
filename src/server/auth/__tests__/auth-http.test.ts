import assert from "node:assert/strict";

import { AuthService } from "../auth-service";
import {
  AuthHttpError,
  handleGetCurrentSessionUserRequest,
  handleLoginRequest,
  handleLogoutRequest,
  resolvePostLoginRedirect,
} from "../auth-http";
import type { AuthRepository } from "../auth-repository";
import type { AuthSessionRecord, AuthUserRecord } from "../../../types/auth";

class InMemoryAuthRepository implements AuthRepository {
  private readonly usersById = new Map<string, AuthUserRecord>();
  private readonly usersByEmail = new Map<string, AuthUserRecord>();
  private readonly sessionsByToken = new Map<string, AuthSessionRecord>();
  private userSequence = 0;
  private sessionSequence = 0;

  async createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord> {
    if (this.usersByEmail.has(input.email)) {
      throw new Error("User email already exists.");
    }

    this.userSequence += 1;
    const now = "2026-11-01T09:00:00.000Z";
    const created: AuthUserRecord = {
      ...input,
      id: `user_${this.userSequence}`,
      createdAt: now,
      updatedAt: now,
    };

    this.usersById.set(created.id, created);
    this.usersByEmail.set(created.email, created);

    return { ...created };
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    return this.usersById.get(id) ?? null;
  }

  async createSession(input: Omit<AuthSessionRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthSessionRecord> {
    this.sessionSequence += 1;
    const now = "2026-11-01T09:05:00.000Z";

    const created: AuthSessionRecord = {
      ...input,
      id: `session_${this.sessionSequence}`,
      createdAt: now,
      updatedAt: now,
    };

    this.sessionsByToken.set(created.sessionToken, created);
    return { ...created };
  }

  async findSessionByToken(sessionToken: string): Promise<AuthSessionRecord | null> {
    return this.sessionsByToken.get(sessionToken) ?? null;
  }

  async deleteSessionByToken(sessionToken: string): Promise<void> {
    this.sessionsByToken.delete(sessionToken);
  }
}

function createService(repository: AuthRepository): AuthService {
  return new AuthService({
    repository,
    now: () => new Date("2026-11-01T09:00:00.000Z"),
    createSessionToken: () => "login-session-token",
  });
}

async function testSuccessfulLoginFlow(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = createService(repository);

  await service.createInternalUser({
    email: "staff@example.test",
    password: "Staff-Password-123!",
    role: "staff",
  });

  const result = await handleLoginRequest(service, {
    email: "staff@example.test",
    password: "Staff-Password-123!",
  });

  assert.equal(result.user.email, "staff@example.test");
  assert.equal(result.redirectTo, "/admin/bookings");
  assert.equal(result.sessionToken, "login-session-token");
}

async function testSuccessfulLoginFlowUsesSafeNextDestinationWhenProvided(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = createService(repository);

  await service.createInternalUser({
    email: "staff@example.test",
    password: "Staff-Password-123!",
    role: "staff",
  });

  const result = await handleLoginRequest(service, {
    email: "staff@example.test",
    password: "Staff-Password-123!",
    next: "/admin/notifications",
  });

  assert.equal(result.redirectTo, "/admin/notifications");
}

async function testFailedLoginFlow(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = createService(repository);

  await service.createInternalUser({
    email: "staff@example.test",
    password: "Correct-Password-123!",
    role: "staff",
  });

  await assert.rejects(
    async () => {
      await handleLoginRequest(service, {
        email: "staff@example.test",
        password: "Wrong-Password-123!",
      });
    },
    (error: unknown) => {
      if (!(error instanceof AuthHttpError)) {
        return false;
      }

      assert.equal(error.status, 401);
      assert.equal(error.code, "invalid_credentials");
      assert.equal(error.message, "Invalid email or password.");
      return true;
    }
  );
}

async function testLogoutFlow(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = createService(repository);

  await service.createInternalUser({
    email: "admin@example.test",
    password: "Admin-Password-123!",
    role: "admin",
  });

  const loginResult = await handleLoginRequest(service, {
    email: "admin@example.test",
    password: "Admin-Password-123!",
  });

  const request = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      authorization: `Bearer ${loginResult.sessionToken}`,
    },
  });

  await handleLogoutRequest(service, request);

  const user = await service.getCurrentSessionUser(loginResult.sessionToken);
  assert.equal(user, null);
}

async function testCurrentSessionLookupFlow(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = createService(repository);

  await service.createInternalUser({
    email: "ops@example.test",
    password: "Ops-Password-123!",
    role: "staff",
  });

  const loginResult = await handleLoginRequest(service, {
    email: "ops@example.test",
    password: "Ops-Password-123!",
  });

  const request = new Request("http://localhost:3000/api/auth/session", {
    headers: {
      authorization: `Bearer ${loginResult.sessionToken}`,
    },
  });

  const result = await handleGetCurrentSessionUserRequest(service, request);
  assert.equal(result.user.email, "ops@example.test");
}

async function testRedirectBehaviorAfterLogin(): Promise<void> {
  assert.equal(resolvePostLoginRedirect("admin"), "/admin/bookings");
  assert.equal(resolvePostLoginRedirect("staff"), "/admin/bookings");
  assert.equal(resolvePostLoginRedirect("staff", "/admin/availability"), "/admin/availability");
  assert.equal(resolvePostLoginRedirect("staff", "https://evil.example"), "/admin/bookings");
}

async function run(): Promise<void> {
  await testSuccessfulLoginFlow();
  await testSuccessfulLoginFlowUsesSafeNextDestinationWhenProvided();
  await testFailedLoginFlow();
  await testLogoutFlow();
  await testCurrentSessionLookupFlow();
  await testRedirectBehaviorAfterLogin();

  console.log("auth-http: ok");
}

void run();
