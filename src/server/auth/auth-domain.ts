import type {
  AuthRole,
  AuthSessionCreateInput,
  AuthSessionRecord,
  AuthUserCreateInput,
  AuthUserRecord,
} from "../../types/auth";
import { isAuthRole } from "./auth-repository";

function ensureNonEmptyString(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function ensureIsoDateTime(value: string, field: string): string {
  const normalized = ensureNonEmptyString(value, field);
  if (Number.isNaN(new Date(normalized).getTime())) {
    throw new Error(`${field} must be a valid ISO date-time.`);
  }

  return normalized;
}

export function ensureAuthRole(value: unknown): AuthRole {
  if (!isAuthRole(value)) {
    throw new Error("Invalid auth role.");
  }

  return value;
}

export function createAuthUserRecord(input: AuthUserRecord): AuthUserRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    email: ensureNonEmptyString(input.email, "email"),
    passwordHash: ensureNonEmptyString(input.passwordHash, "passwordHash"),
    role: ensureAuthRole(input.role),
    isActive: Boolean(input.isActive),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export function createAuthSessionRecord(input: AuthSessionRecord): AuthSessionRecord {
  return {
    id: ensureNonEmptyString(input.id, "id"),
    userId: ensureNonEmptyString(input.userId, "userId"),
    sessionToken: ensureNonEmptyString(input.sessionToken, "sessionToken"),
    expiresAt: ensureIsoDateTime(input.expiresAt, "expiresAt"),
    createdAt: ensureIsoDateTime(input.createdAt, "createdAt"),
    updatedAt: ensureIsoDateTime(input.updatedAt, "updatedAt"),
  };
}

export type { AuthSessionCreateInput, AuthUserCreateInput };
