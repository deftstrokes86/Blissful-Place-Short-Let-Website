import { randomUUID } from "node:crypto";

import type { AuthRole, AuthSessionRecord, AuthUserRecord } from "../../types/auth";
import type { AuthRepository } from "./auth-repository";
import { hashPassword, verifyPassword } from "./passwords";

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type AuthServiceErrorCode = "invalid_credentials" | "inactive_user";

export class AuthServiceError extends Error {
  readonly code: AuthServiceErrorCode;

  constructor(code: AuthServiceErrorCode, message: string) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
  }
}

export interface CreateInternalUserInput {
  email: string;
  password: string;
  role: AuthRole;
  isActive?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  sessionTtlMs?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
}

export interface LoginResult {
  sessionToken: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

interface AuthServiceDependencies {
  repository: AuthRepository;
  now?: () => Date;
  createSessionToken?: () => string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

function isExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly now: () => Date;
  private readonly createSessionToken: () => string;

  constructor(dependencies: AuthServiceDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createSessionToken = dependencies.createSessionToken ?? (() => randomUUID());
  }

  async createInternalUser(input: CreateInternalUserInput): Promise<AuthUserRecord> {
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);

    return this.repository.createUser({
      email,
      passwordHash,
      role: input.role,
      isActive: input.isActive ?? true,
    });
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const email = normalizeEmail(input.email);
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw new AuthServiceError("invalid_credentials", "Invalid email or password.");
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthServiceError("invalid_credentials", "Invalid email or password.");
    }

    if (!user.isActive) {
      throw new AuthServiceError("inactive_user", "User is inactive.");
    }

    const now = this.now();
    const expiresAt = new Date(now.getTime() + (input.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS)).toISOString();
    const sessionToken = this.createSessionToken();

    await this.repository.createSession({
      userId: user.id,
      sessionToken,
      expiresAt,
    });

    return {
      sessionToken,
      expiresAt,
      user: toAuthenticatedUser(user),
    };
  }

  async logout(sessionToken: string): Promise<void> {
    await this.repository.deleteSessionByToken(sessionToken);
  }

  async getCurrentSessionUser(sessionToken: string): Promise<AuthenticatedUser | null> {
    const session = await this.repository.findSessionByToken(sessionToken);
    if (!session) {
      return null;
    }

    const now = this.now();
    if (isExpired(session.expiresAt, now)) {
      await this.repository.deleteSessionByToken(sessionToken);
      return null;
    }

    const user = await this.repository.findUserById(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return toAuthenticatedUser(user);
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    await this.logout(sessionToken);
  }

  async createAuthenticatedSession(user: AuthUserRecord, sessionTtlMs?: number): Promise<AuthSessionRecord> {
    const now = this.now();
    const expiresAt = new Date(now.getTime() + (sessionTtlMs ?? DEFAULT_SESSION_TTL_MS)).toISOString();

    return this.repository.createSession({
      userId: user.id,
      sessionToken: this.createSessionToken(),
      expiresAt,
    });
  }
}
