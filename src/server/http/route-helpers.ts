import { NextResponse } from "next/server";

export interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

export function jsonSuccess<T>(data: T, status: number = 200): NextResponse<ApiSuccessShape<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status }
  );
}

export function jsonError(message: string, status: number, code: string): NextResponse<ApiErrorShape> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }

  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  return body;
}

export function pickString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function pickOptionalString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function pickNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function pickIdempotencyKey(request: Request, body: Record<string, unknown>): string | null {
  const headerValue = request.headers.get("x-idempotency-key");
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  return pickString(body, "idempotencyKey");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function httpStatusFromError(message: string): number {
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return 404;
  }

  if (normalized.includes("idempotency conflict")) {
    return 409;
  }

  if (
    normalized.includes("requires") ||
    normalized.includes("must") ||
    normalized.includes("only") ||
    normalized.includes("not allowed") ||
    normalized.includes("invalid")
  ) {
    return 400;
  }

  return 500;
}

/**
 * Resolve an HTTP status code from an unknown thrown value.
 *
 * Domain errors may carry an explicit `httpStatus` property (e.g.
 * `ReservationTransitionError.httpStatus = 409`). When present that value is
 * used directly, avoiding the need for brittle message-string matching across
 * every new error type.
 */
function resolveHttpStatus(error: unknown): number {
  if (
    error instanceof Error &&
    "httpStatus" in error &&
    typeof (error as { httpStatus: unknown }).httpStatus === "number"
  ) {
    return (error as { httpStatus: number }).httpStatus;
  }

  return httpStatusFromError(errorToMessage(error));
}

export function jsonErrorFromUnknown(
  error: unknown,
  fallbackCode: string = "request_failed"
): NextResponse<ApiErrorShape> {
  const message = errorToMessage(error);
  const status = resolveHttpStatus(error);
  const code = status === 500 ? fallbackCode : "invalid_request";

  return jsonError(message, status, code);
}
