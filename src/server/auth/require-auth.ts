import type { AuthenticatedUser } from "./auth-service";
import { getSharedAuthService } from "./auth-service-factory";

export const DEFAULT_AUTH_SESSION_COOKIE_NAME = "blissful_admin_session";

export type AuthorizationErrorCode = "unauthenticated" | "forbidden";

export class AuthorizationError extends Error {
  readonly status: 401 | 403;
  readonly code: AuthorizationErrorCode;

  constructor(status: 401 | 403, code: AuthorizationErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
    this.code = code;
  }
}

export type SessionUserResolver = (sessionToken: string) => Promise<AuthenticatedUser | null>;

export interface RequireAuthenticatedRequestOptions {
  resolveUser?: SessionUserResolver;
  cookieName?: string;
}

export interface AuthenticatedRequestContext {
  sessionToken: string;
  user: AuthenticatedUser;
}

function parseBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
}

function parseCookieToken(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader || !cookieName.trim()) {
    return null;
  }

  const chunks = cookieHeader.split(";");
  for (const chunk of chunks) {
    const separatorIndex = chunk.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = chunk.slice(0, separatorIndex).trim();
    if (key !== cookieName) {
      continue;
    }

    const rawValue = chunk.slice(separatorIndex + 1).trim();
    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function getSessionTokenFromRequest(
  request: Request,
  cookieName: string = DEFAULT_AUTH_SESSION_COOKIE_NAME
): string | null {
  const authorizationToken = parseBearerToken(request.headers.get("authorization"));
  if (authorizationToken) {
    return authorizationToken;
  }

  const explicitHeaderToken = request.headers.get("x-session-token")?.trim() ?? "";
  if (explicitHeaderToken.length > 0) {
    return explicitHeaderToken;
  }

  return parseCookieToken(request.headers.get("cookie"), cookieName);
}

export function requireAuthenticatedUser(user: AuthenticatedUser | null | undefined): AuthenticatedUser {
  if (!user) {
    throw new AuthorizationError(401, "unauthenticated", "Authentication is required.");
  }

  if (!user.isActive) {
    throw new AuthorizationError(401, "unauthenticated", "Authentication is required.");
  }

  return user;
}

export async function resolveSessionUserWithSharedAuthService(sessionToken: string): Promise<AuthenticatedUser | null> {
  const service = getSharedAuthService();
  return service.getCurrentSessionUser(sessionToken);
}

export async function requireAuthenticatedRequest(
  request: Request,
  options: RequireAuthenticatedRequestOptions = {}
): Promise<AuthenticatedRequestContext> {
  const sessionToken = getSessionTokenFromRequest(request, options.cookieName);
  if (!sessionToken) {
    throw new AuthorizationError(401, "unauthenticated", "Authentication is required.");
  }

  const resolver = options.resolveUser ?? resolveSessionUserWithSharedAuthService;
  const user = await resolver(sessionToken);

  return {
    sessionToken,
    user: requireAuthenticatedUser(user),
  };
}
