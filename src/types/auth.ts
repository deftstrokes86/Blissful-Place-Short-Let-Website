export type AuthUserId = string;
export type AuthSessionId = string;
export type SessionToken = string;
export type AuthEmail = string;

export type AuthRole = "admin" | "staff";

export interface AuthUserRecord {
  id: AuthUserId;
  email: AuthEmail;
  passwordHash: string;
  role: AuthRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionRecord {
  id: AuthSessionId;
  userId: AuthUserId;
  sessionToken: SessionToken;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserCreateInput {
  email: AuthEmail;
  passwordHash: string;
  role: AuthRole;
  isActive: boolean;
}

export interface AuthSessionCreateInput {
  userId: AuthUserId;
  sessionToken: SessionToken;
  expiresAt: string;
}
