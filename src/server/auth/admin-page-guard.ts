import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthRole } from "../../types/auth";
import type { AuthenticatedUser } from "./auth-service";
import { getSharedAuthService } from "./auth-service-factory";
import {
  AuthorizationError,
  DEFAULT_AUTH_SESSION_COOKIE_NAME,
  requireAuthenticatedUser,
  type SessionUserResolver,
} from "./require-auth";
import { requireRole } from "./require-role";

const DEFAULT_ALLOWED_ADMIN_ROLES: readonly AuthRole[] = ["admin", "staff"];

interface RequireAdminSessionUserInput {
  sessionToken: string | null | undefined;
  resolveUser?: SessionUserResolver;
  allowedRoles?: readonly AuthRole[];
}

export async function requireAdminSessionUser(
  input: RequireAdminSessionUserInput
): Promise<AuthenticatedUser> {
  const sessionToken = input.sessionToken?.trim() ?? "";
  if (!sessionToken) {
    throw new AuthorizationError(401, "unauthenticated", "Authentication is required.");
  }

  const resolveUser = input.resolveUser ?? ((token: string) => getSharedAuthService().getCurrentSessionUser(token));
  const user = await resolveUser(sessionToken);
  const authenticatedUser = requireAuthenticatedUser(user);

  return requireRole(authenticatedUser, input.allowedRoles ?? DEFAULT_ALLOWED_ADMIN_ROLES);
}

interface RequireAdminPageAccessOrRedirectOptions {
  redirectTo?: string;
  cookieName?: string;
  allowedRoles?: readonly AuthRole[];
  resolveUser?: SessionUserResolver;
}

export async function requireAdminPageAccessOrRedirect(
  options: RequireAdminPageAccessOrRedirectOptions = {}
): Promise<AuthenticatedUser> {
  const redirectTo = options.redirectTo ?? "/login";
  const cookieName = options.cookieName ?? DEFAULT_AUTH_SESSION_COOKIE_NAME;
  const cookieStore = await cookies();

  try {
    return await requireAdminSessionUser({
      sessionToken: cookieStore.get(cookieName)?.value ?? null,
      resolveUser: options.resolveUser,
      allowedRoles: options.allowedRoles,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect(redirectTo);
    }

    throw error;
  }
}

