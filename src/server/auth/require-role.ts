import type { AuthRole } from "../../types/auth";
import type { AuthenticatedUser } from "./auth-service";
import {
  AuthorizationError,
  requireAuthenticatedRequest,
  type RequireAuthenticatedRequestOptions,
} from "./require-auth";

export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: readonly AuthRole[]
): AuthenticatedUser {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(403, "forbidden", "You do not have permission to perform this action.");
  }

  return user;
}

export interface RequireRoleForRequestOptions extends RequireAuthenticatedRequestOptions {
  allowedRoles: readonly AuthRole[];
}

export async function requireRoleForRequest(
  request: Request,
  options: RequireRoleForRequestOptions
): Promise<AuthenticatedUser> {
  const context = await requireAuthenticatedRequest(request, options);
  return requireRole(context.user, options.allowedRoles);
}

export async function requireStaffOrAdminRequest(
  request: Request,
  options: Omit<RequireRoleForRequestOptions, "allowedRoles"> = {}
): Promise<AuthenticatedUser> {
  return requireRoleForRequest(request, {
    ...options,
    allowedRoles: ["admin", "staff"],
  });
}
