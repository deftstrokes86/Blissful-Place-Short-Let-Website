import { DEFAULT_AUTH_SESSION_COOKIE_NAME } from "./require-auth";

const ONE_SECOND_MS = 1000;

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

function serializeCookie(input: {
  name: string;
  value: string;
  expiresAt?: string;
  maxAgeSeconds?: number;
}): string {
  const parts: string[] = [`${input.name}=${encodeURIComponent(input.value)}`];

  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");

  if (isProductionEnvironment()) {
    parts.push("Secure");
  }

  if (typeof input.maxAgeSeconds === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(input.maxAgeSeconds))}`);
  }

  if (input.expiresAt) {
    const expires = new Date(input.expiresAt);
    if (!Number.isNaN(expires.getTime())) {
      parts.push(`Expires=${expires.toUTCString()}`);
    }
  }

  return parts.join("; ");
}

export function createAuthSessionSetCookieHeader(input: {
  sessionToken: string;
  expiresAt: string;
  cookieName?: string;
}): string {
  const expires = new Date(input.expiresAt);
  const now = Date.now();
  const maxAgeSeconds = Number.isNaN(expires.getTime())
    ? undefined
    : Math.max(0, Math.floor((expires.getTime() - now) / ONE_SECOND_MS));

  return serializeCookie({
    name: input.cookieName ?? DEFAULT_AUTH_SESSION_COOKIE_NAME,
    value: input.sessionToken,
    expiresAt: input.expiresAt,
    maxAgeSeconds,
  });
}

export function createClearedAuthSessionCookieHeader(cookieName?: string): string {
  return serializeCookie({
    name: cookieName ?? DEFAULT_AUTH_SESSION_COOKIE_NAME,
    value: "",
    expiresAt: "1970-01-01T00:00:00.000Z",
    maxAgeSeconds: 0,
  });
}
