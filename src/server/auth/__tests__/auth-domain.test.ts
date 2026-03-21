import assert from "node:assert/strict";

import {
  createAuthSessionRecord,
  createAuthUserRecord,
  ensureAuthRole,
  type AuthSessionCreateInput,
  type AuthUserCreateInput,
} from "../auth-domain";
import type { AuthRepository } from "../auth-repository";
import type { AuthRole, AuthSessionRecord, AuthUserRecord } from "../../../types/auth";

class InMemoryAuthRepository implements AuthRepository {
  private readonly usersByEmail = new Map<string, AuthUserRecord>();
  private readonly sessionsByToken = new Map<string, AuthSessionRecord>();

  async createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord> {
    if (this.usersByEmail.has(input.email)) {
      throw new Error("User email already exists.");
    }

    const created: AuthUserRecord = {
      ...input,
      id: `user_${this.usersByEmail.size + 1}`,
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
    };

    this.usersByEmail.set(created.email, created);
    return { ...created };
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    for (const user of this.usersByEmail.values()) {
      if (user.id === id) {
        return user;
      }
    }

    return null;
  }

  async createSession(input: Omit<AuthSessionRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthSessionRecord> {
    const created: AuthSessionRecord = {
      ...input,
      id: `session_${this.sessionsByToken.size + 1}`,
      createdAt: "2026-09-01T10:01:00.000Z",
      updatedAt: "2026-09-01T10:01:00.000Z",
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

function createBaseUserInput(overrides?: Partial<AuthUserCreateInput>): AuthUserCreateInput {
  return {
    email: "ops-admin@example.test",
    passwordHash: "hashed-password",
    role: "admin",
    isActive: true,
    ...overrides,
  };
}

function createBaseSessionInput(overrides?: Partial<AuthSessionCreateInput>): AuthSessionCreateInput {
  return {
    userId: "user_1",
    sessionToken: "session_token_1",
    expiresAt: "2026-09-30T10:00:00.000Z",
    ...overrides,
  };
}

async function testCreateUserRecordShape(): Promise<void> {
  const input = createBaseUserInput();
  const user = createAuthUserRecord({
    id: "user_1",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...input,
  });

  assert.equal(user.id, "user_1");
  assert.equal(user.email, "ops-admin@example.test");
  assert.equal(user.passwordHash, "hashed-password");
  assert.equal(user.role, "admin");
  assert.equal(user.isActive, true);
}

async function testValidRoleSupport(): Promise<void> {
  const staff = ensureAuthRole("staff");
  const admin = ensureAuthRole("admin");

  assert.equal(staff, "staff");
  assert.equal(admin, "admin");
}

async function testSessionRecordShapeSupport(): Promise<void> {
  const input = createBaseSessionInput();
  const session = createAuthSessionRecord({
    id: "session_1",
    createdAt: "2026-09-01T10:01:00.000Z",
    updatedAt: "2026-09-01T10:01:00.000Z",
    ...input,
  });

  assert.equal(session.id, "session_1");
  assert.equal(session.userId, "user_1");
  assert.equal(session.sessionToken, "session_token_1");
  assert.equal(session.expiresAt, "2026-09-30T10:00:00.000Z");
}

async function testRejectInvalidRoleValues(): Promise<void> {
  assert.throws(() => ensureAuthRole("guest"), /Invalid auth role/i);

  assert.throws(
    () =>
      createAuthUserRecord({
        id: "user_2",
        email: "ops-staff@example.test",
        passwordHash: "hashed-password",
        role: "guest" as unknown as AuthRole,
        isActive: true,
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
      }),
    /Invalid auth role/i
  );
}

async function testUserSessionTypeSafetyInDomainLayer(): Promise<void> {
  const repository = new InMemoryAuthRepository();

  const createdUser = await repository.createUser({
    email: "ops@example.test",
    passwordHash: "hashed-value",
    role: "staff",
    isActive: true,
  });

  const createdSession = await repository.createSession({
    userId: createdUser.id,
    sessionToken: "session_token_2",
    expiresAt: "2026-10-01T09:00:00.000Z",
  });

  const fetched = await repository.findSessionByToken(createdSession.sessionToken);
  assert.ok(fetched);
  assert.equal(fetched?.userId, createdUser.id);
  assert.equal(fetched?.sessionToken, "session_token_2");

  const role: AuthRole = "staff";
  assert.equal(role, "staff");

  // @ts-expect-error invalid role must not type-check
  const invalidRole: AuthRole = "guest";
  assert.equal(typeof invalidRole, "string");
}

async function run(): Promise<void> {
  await testCreateUserRecordShape();
  await testValidRoleSupport();
  await testSessionRecordShapeSupport();
  await testRejectInvalidRoleValues();
  await testUserSessionTypeSafetyInDomainLayer();

  console.log("auth-domain: ok");
}

void run();

