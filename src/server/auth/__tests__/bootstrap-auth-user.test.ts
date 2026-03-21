import assert from "node:assert/strict";

import { AuthService } from "../auth-service";
import { verifyPassword } from "../passwords";
import {
  BootstrapAuthError,
  bootstrapInitialAuthUser,
  type BootstrapAuthUserStore,
} from "../bootstrap-auth-user";
import type { AuthRepository } from "../auth-repository";
import type { AuthSessionRecord, AuthUserRecord } from "../../../types/auth";

class InMemoryBootstrapRepository implements AuthRepository, BootstrapAuthUserStore {
  private readonly usersById = new Map<string, AuthUserRecord>();
  private readonly usersByEmail = new Map<string, AuthUserRecord>();
  private readonly sessionsByToken = new Map<string, AuthSessionRecord>();
  private userSequence = 0;
  private sessionSequence = 0;

  async countUsers(): Promise<number> {
    return this.usersById.size;
  }

  async createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord> {
    if (this.usersByEmail.has(input.email)) {
      throw new Error("User email already exists.");
    }

    this.userSequence += 1;
    const now = "2026-12-01T09:00:00.000Z";
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
    const now = "2026-12-01T09:10:00.000Z";

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

function createHarness() {
  const repository = new InMemoryBootstrapRepository();
  const authService = new AuthService({ repository });

  return {
    repository,
    authService,
  };
}

async function testBootstrapCreatesAdminUser(): Promise<void> {
  const { repository, authService } = createHarness();

  const result = await bootstrapInitialAuthUser(
    {
      enabled: true,
      email: "admin@example.test",
      password: "Admin-Password-123!",
      role: "admin",
    },
    {
      authService,
      userStore: repository,
    }
  );

  assert.equal(result.created, true);
  assert.equal(result.user.role, "admin");
  assert.equal(await repository.countUsers(), 1);
}

async function testBootstrapAssignsRequestedRole(): Promise<void> {
  const { repository, authService } = createHarness();

  const result = await bootstrapInitialAuthUser(
    {
      enabled: true,
      email: "staff@example.test",
      password: "Staff-Password-123!",
      role: "staff",
    },
    {
      authService,
      userStore: repository,
    }
  );

  assert.equal(result.created, true);
  assert.equal(result.user.role, "staff");
}

async function testBootstrapHashesPassword(): Promise<void> {
  const { repository, authService } = createHarness();

  const password = "Hashed-Password-123!";
  const result = await bootstrapInitialAuthUser(
    {
      enabled: true,
      email: "hash@example.test",
      password,
      role: "admin",
    },
    {
      authService,
      userStore: repository,
    }
  );

  assert.notEqual(result.user.passwordHash, password);
  assert.equal(await verifyPassword(password, result.user.passwordHash), true);
}

async function testBootstrapRequiresEnabledFlag(): Promise<void> {
  const { repository, authService } = createHarness();

  await assert.rejects(
    async () => {
      await bootstrapInitialAuthUser(
        {
          enabled: false,
          email: "admin@example.test",
          password: "Admin-Password-123!",
          role: "admin",
        },
        {
          authService,
          userStore: repository,
        }
      );
    },
    (error: unknown) => {
      if (!(error instanceof BootstrapAuthError)) {
        return false;
      }

      assert.equal(error.code, "bootstrap_disabled");
      return true;
    }
  );
}

async function testBootstrapIsIdempotentForExistingEmail(): Promise<void> {
  const { repository, authService } = createHarness();

  const firstRun = await bootstrapInitialAuthUser(
    {
      enabled: true,
      email: "admin@example.test",
      password: "Admin-Password-123!",
      role: "admin",
    },
    {
      authService,
      userStore: repository,
    }
  );

  const secondRun = await bootstrapInitialAuthUser(
    {
      enabled: true,
      email: "admin@example.test",
      password: "Different-Password-123!",
      role: "admin",
    },
    {
      authService,
      userStore: repository,
    }
  );

  assert.equal(firstRun.created, true);
  assert.equal(secondRun.created, false);
  assert.equal(secondRun.user.email, "admin@example.test");
  assert.equal(await repository.countUsers(), 1);
}

async function testBootstrapBlockedAfterAnyInitialUserExists(): Promise<void> {
  const { repository, authService } = createHarness();

  await authService.createInternalUser({
    email: "existing@example.test",
    password: "Existing-Password-123!",
    role: "admin",
  });

  await assert.rejects(
    async () => {
      await bootstrapInitialAuthUser(
        {
          enabled: true,
          email: "new-admin@example.test",
          password: "New-Password-123!",
          role: "admin",
        },
        {
          authService,
          userStore: repository,
        }
      );
    },
    (error: unknown) => {
      if (!(error instanceof BootstrapAuthError)) {
        return false;
      }

      assert.equal(error.code, "bootstrap_already_completed");
      return true;
    }
  );
}

async function run(): Promise<void> {
  await testBootstrapCreatesAdminUser();
  await testBootstrapAssignsRequestedRole();
  await testBootstrapHashesPassword();
  await testBootstrapRequiresEnabledFlag();
  await testBootstrapIsIdempotentForExistingEmail();
  await testBootstrapBlockedAfterAnyInitialUserExists();

  console.log("bootstrap-auth-user: ok");
}

void run();
