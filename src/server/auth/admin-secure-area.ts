import { resolveAdminPostLoginRedirect } from "./require-auth";

export function pickNextAdminPathParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  return typeof value === "string" ? value : null;
}

export function resolveAuthenticatedSecureAreaRedirect(requestedPath?: string | null): string {
  return resolveAdminPostLoginRedirect(requestedPath);
}
