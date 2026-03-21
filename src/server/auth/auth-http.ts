import { AuthService, AuthServiceError, type AuthenticatedUser, type LoginResult } from "./auth-service";
import { getSessionTokenFromRequest } from "./require-auth";

export class AuthHttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthHttpError";
    this.status = status;
    this.code = code;
  }
}

export interface AuthHttpInterface {
  login(input: { email: string; password: string }): Promise<LoginResult>;
  logout(sessionToken: string): Promise<void>;
  getCurrentSessionUser(sessionToken: string): Promise<AuthenticatedUser | null>;
}

interface ParsedLoginBody {
  email: string;
  password: string;
}

export interface AuthLoginHttpResult {
  user: AuthenticatedUser;
  sessionToken: string;
  expiresAt: string;
  redirectTo: string;
}

function pickRequiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string") {
    throw new AuthHttpError(400, "invalid_request", `${field} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AuthHttpError(400, "invalid_request", `${field} is required.`);
  }

  return normalized;
}

function parseLoginBody(body: Record<string, unknown>): ParsedLoginBody {
  return {
    email: pickRequiredString(body, "email").toLowerCase(),
    password: pickRequiredString(body, "password"),
  };
}

function mapAuthServiceError(error: AuthServiceError): AuthHttpError {
  if (error.code === "invalid_credentials" || error.code === "inactive_user") {
    return new AuthHttpError(401, "invalid_credentials", "Invalid email or password.");
  }

  return new AuthHttpError(500, "auth_failed", "Authentication failed.");
}

export function resolvePostLoginRedirect(role: "admin" | "staff"): string {
  switch (role) {
    case "admin":
    case "staff":
      return "/admin/bookings";
    default:
      return "/admin/bookings";
  }
}

export async function handleLoginRequest(
  service: AuthHttpInterface,
  body: Record<string, unknown>
): Promise<AuthLoginHttpResult> {
  const parsed = parseLoginBody(body);

  try {
    const result = await service.login({
      email: parsed.email,
      password: parsed.password,
    });

    return {
      user: result.user,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      redirectTo: resolvePostLoginRedirect(result.user.role),
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw mapAuthServiceError(error);
    }

    throw error;
  }
}

export async function handleLogoutRequest(service: AuthHttpInterface, request: Request): Promise<void> {
  const sessionToken = getSessionTokenFromRequest(request);
  if (!sessionToken) {
    return;
  }

  await service.logout(sessionToken);
}

export async function handleGetCurrentSessionUserRequest(
  service: AuthHttpInterface,
  request: Request
): Promise<{ user: AuthenticatedUser }> {
  const sessionToken = getSessionTokenFromRequest(request);
  if (!sessionToken) {
    throw new AuthHttpError(401, "unauthenticated", "Authentication is required.");
  }

  const user = await service.getCurrentSessionUser(sessionToken);
  if (!user) {
    throw new AuthHttpError(401, "unauthenticated", "Authentication is required.");
  }

  return { user };
}

export function isAuthHttpError(error: unknown): error is AuthHttpError {
  return error instanceof AuthHttpError;
}

export function asAuthHttpInterface(service: AuthService): AuthHttpInterface {
  return service;
}

