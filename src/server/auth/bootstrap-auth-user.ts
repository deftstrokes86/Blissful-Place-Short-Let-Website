import type { AuthRole, AuthUserRecord } from "../../types/auth";
import type { AuthService } from "./auth-service";

export type BootstrapAuthErrorCode =
  | "bootstrap_disabled"
  | "invalid_input"
  | "bootstrap_already_completed"
  | "invalid_role";

export class BootstrapAuthError extends Error {
  readonly code: BootstrapAuthErrorCode;

  constructor(code: BootstrapAuthErrorCode, message: string) {
    super(message);
    this.name = "BootstrapAuthError";
    this.code = code;
  }
}

export interface BootstrapAuthUserStore {
  countUsers(): Promise<number>;
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
}

export interface BootstrapAuthInput {
  enabled: boolean;
  email: string;
  password: string;
  role: AuthRole;
}

export interface BootstrapAuthDependencies {
  authService: Pick<AuthService, "createInternalUser">;
  userStore: BootstrapAuthUserStore;
}

export interface BootstrapAuthResult {
  created: boolean;
  user: AuthUserRecord;
}

function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    throw new BootstrapAuthError("invalid_input", "Bootstrap email is required.");
  }

  return normalized;
}

function normalizePassword(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new BootstrapAuthError("invalid_input", "Bootstrap password is required.");
  }

  if (normalized.length < 12) {
    throw new BootstrapAuthError("invalid_input", "Bootstrap password must be at least 12 characters.");
  }

  return value;
}

function normalizeRole(value: string): AuthRole {
  if (value === "admin" || value === "staff") {
    return value;
  }

  throw new BootstrapAuthError("invalid_role", "Bootstrap role must be admin or staff.");
}

export async function bootstrapInitialAuthUser(
  input: BootstrapAuthInput,
  dependencies: BootstrapAuthDependencies
): Promise<BootstrapAuthResult> {
  if (!input.enabled) {
    throw new BootstrapAuthError(
      "bootstrap_disabled",
      "Auth bootstrap is disabled. Set AUTH_BOOTSTRAP_ENABLED=true for a one-time setup run."
    );
  }

  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);
  const role = normalizeRole(input.role);

  const existingByEmail = await dependencies.userStore.findUserByEmail(email);
  if (existingByEmail) {
    return {
      created: false,
      user: existingByEmail,
    };
  }

  const userCount = await dependencies.userStore.countUsers();
  if (userCount > 0) {
    throw new BootstrapAuthError(
      "bootstrap_already_completed",
      "Bootstrap is only allowed before internal users exist."
    );
  }

  const created = await dependencies.authService.createInternalUser({
    email,
    password,
    role,
    isActive: true,
  });

  return {
    created: true,
    user: created,
  };
}

export interface BootstrapAuthEnvInput {
  AUTH_BOOTSTRAP_ENABLED?: string;
  AUTH_BOOTSTRAP_EMAIL?: string;
  AUTH_BOOTSTRAP_PASSWORD?: string;
  AUTH_BOOTSTRAP_ROLE?: string;
}

export function parseBootstrapAuthEnv(input: BootstrapAuthEnvInput): BootstrapAuthInput {
  const enabled = input.AUTH_BOOTSTRAP_ENABLED?.trim().toLowerCase() === "true";
  const email = input.AUTH_BOOTSTRAP_EMAIL ?? "";
  const password = input.AUTH_BOOTSTRAP_PASSWORD ?? "";
  const role = normalizeRole(input.AUTH_BOOTSTRAP_ROLE?.trim().toLowerCase() ?? "admin");

  return {
    enabled,
    email,
    password,
    role,
  };
}
