import type { AuthRole, AuthSessionRecord, AuthUserRecord } from "../../types/auth";

export interface AuthRepository {
  createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord>;
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(id: string): Promise<AuthUserRecord | null>;
  createSession(input: Omit<AuthSessionRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthSessionRecord>;
  findSessionByToken(sessionToken: string): Promise<AuthSessionRecord | null>;
  deleteSessionByToken(sessionToken: string): Promise<void>;
}

export function isAuthRole(value: unknown): value is AuthRole {
  return value === "admin" || value === "staff";
}
