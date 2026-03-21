import assert from "node:assert/strict";

import { AuthService, AuthServiceError } from "../auth-service";
import { hashPassword, verifyPassword } from "../passwords";
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
    const now = "2026-10-01T09:00:00.000Z";
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
    const now = "2026-10-01T09:05:00.000Z";

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

async function testPasswordHashingAndVerificationSuccessFailure(): Promise<void> {
  const plainPassword = "A-Strong-Password-123!";
  const hashed = await hashPassword(plainPassword);

  assert.notEqual(hashed, plainPassword);
  assert.equal(await verifyPassword(plainPassword, hashed), true);
  assert.equal(await verifyPassword("Wrong-Password-123!", hashed), false);
}

async function testCreateStaffAdminUserWithHashedPassword(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-fixed",
  });

  const createdAdmin = await service.createInternalUser({
    email: "admin@example.test",
    password: "Admin-Password-123!",
    role: "admin",
  });

  const createdStaff = await service.createInternalUser({
    email: "staff@example.test",
    password: "Staff-Password-123!",
    role: "staff",
  });

  assert.equal(createdAdmin.role, "admin");
  assert.equal(createdStaff.role, "staff");
  assert.notEqual(createdAdmin.passwordHash, "Admin-Password-123!");
  assert.notEqual(createdStaff.passwordHash, "Staff-Password-123!");
}

async function testSuccessfulLoginSessionCreation(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-login-success",
  });

  await service.createInternalUser({
    email: "ops@example.test",
    password: "Ops-Password-123!",
    role: "staff",
  });

  const result = await service.login({
    email: "ops@example.test",
    password: "Ops-Password-123!",
  });

  assert.equal(result.sessionToken, "session-token-login-success");
  assert.equal(result.user.email, "ops@example.test");
  assert.equal(result.user.role, "staff");
  assert.ok(result.expiresAt.length > 0);
}

async function testInvalidPasswordRejection(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-invalid-password",
  });

  await service.createInternalUser({
    email: "ops@example.test",
    password: "Correct-Password-123!",
    role: "staff",
  });

  await assert.rejects(
    async () => {
      await service.login({
        email: "ops@example.test",
        password: "Wrong-Password-123!",
      });
    },
    (error: unknown) => {
      if (!(error instanceof AuthServiceError)) {
        return false;
      }

      assert.equal(error.code, "invalid_credentials");
      return true;
    }
  );
}

async function testInactiveUserRejection(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-inactive",
  });

  await service.createInternalUser({
    email: "inactive@example.test",
    password: "Inactive-Password-123!",
    role: "staff",
    isActive: false,
  });

  await assert.rejects(
    async () => {
      await service.login({
        email: "inactive@example.test",
        password: "Inactive-Password-123!",
      });
    },
    (error: unknown) => {
      if (!(error instanceof AuthServiceError)) {
        return false;
      }

      assert.equal(error.code, "inactive_user");
      return true;
    }
  );
}

async function testCreateAuthenticatedSessionForExistingUser(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-created-directly",
  });

  const createdUser = await service.createInternalUser({
    email: "direct-session@example.test",
    password: "Direct-Password-123!",
    role: "staff",
  });

  const session = await service.createAuthenticatedSession(createdUser, 60_000);
  assert.equal(session.sessionToken, "session-token-created-directly");

  const currentUser = await service.getCurrentSessionUser(session.sessionToken);
  assert.ok(currentUser);
  assert.equal(currentUser?.id, createdUser.id);
}

async function testLogoutSessionInvalidation(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-logout",
  });

  await service.createInternalUser({
    email: "logout@example.test",
    password: "Logout-Password-123!",
    role: "admin",
  });

  const loggedIn = await service.login({
    email: "logout@example.test",
    password: "Logout-Password-123!",
  });

  const beforeLogout = await service.getCurrentSessionUser(loggedIn.sessionToken);
  assert.ok(beforeLogout);
  assert.equal(beforeLogout?.email, "logout@example.test");

  await service.logout(loggedIn.sessionToken);

  const afterLogout = await service.getCurrentSessionUser(loggedIn.sessionToken);
  assert.equal(afterLogout, null);
}

async function testInvalidateSessionAlias(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-invalidate",
  });

  await service.createInternalUser({
    email: "invalidate@example.test",
    password: "Invalidate-Password-123!",
    role: "admin",
  });

  const loggedIn = await service.login({
    email: "invalidate@example.test",
    password: "Invalidate-Password-123!",
  });

  await service.invalidateSession(loggedIn.sessionToken);
  const currentUser = await service.getCurrentSessionUser(loggedIn.sessionToken);
  assert.equal(currentUser, null);
}

async function testLoadCurrentAuthenticatedUserFromSession(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  const service = new AuthService({
    repository,
    now: () => new Date("2026-10-01T09:00:00.000Z"),
    createSessionToken: () => "session-token-load-current-user",
  });

  await service.createInternalUser({
    email: "current@example.test",
    password: "Current-Password-123!",
    role: "admin",
  });

  const loginResult = await service.login({
    email: "current@example.test",
    password: "Current-Password-123!",
  });

  const currentUser = await service.getCurrentSessionUser(loginResult.sessionToken);
  assert.ok(currentUser);
  assert.equal(currentUser?.role, "admin");
}

async function testExpiredSessionIsRejectedAndInvalidated(): Promise<void> {
  const repository = new InMemoryAuthRepository();
  let now = new Date("2026-10-01T09:00:00.000Z");

  const service = new AuthService({
    repository,
    now: () => now,
    createSessionToken: () => "session-token-expired-flow",
  });

  await service.createInternalUser({
    email: "expired@example.test",
    password: "Expired-Password-123!",
    role: "staff",
  });

  const loginResult = await service.login({
    email: "expired@example.test",
    password: "Expired-Password-123!",
    sessionTtlMs: 1_000,
  });

  now = new Date("2026-10-01T09:00:05.000Z");

  const expiredLookup = await service.getCurrentSessionUser(loginResult.sessionToken);
  assert.equal(expiredLookup, null);

  const storedSession = await repository.findSessionByToken(loginResult.sessionToken);
  assert.equal(storedSession, null);
}

async function run(): Promise<void> {
  await testPasswordHashingAndVerificationSuccessFailure();
  await testCreateStaffAdminUserWithHashedPassword();
  await testSuccessfulLoginSessionCreation();
  await testInvalidPasswordRejection();
  await testInactiveUserRejection();
  await testCreateAuthenticatedSessionForExistingUser();
  await testLogoutSessionInvalidation();
  await testInvalidateSessionAlias();
  await testLoadCurrentAuthenticatedUserFromSession();
  await testExpiredSessionIsRejectedAndInvalidated();

  console.log("auth-service: ok");
}

void run();
