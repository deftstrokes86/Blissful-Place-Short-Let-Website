import type { ReservationStatus } from "@/types/booking";

interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

interface DraftReservationSnapshot {
  token: string;
  status: ReservationStatus;
}

interface DraftSnapshotResponse {
  resumeToken: string;
  reservation: DraftReservationSnapshot;
}

interface WebsiteCheckoutReservation {
  token: string;
  status: ReservationStatus;
}

export interface WebsiteCheckoutResponse {
  reservation: WebsiteCheckoutReservation;
  checkoutReference: string;
  checkoutUrl: string;
}

export interface WebsiteDraftPayload {
  stay: {
    flatId: "windsor" | "kensington" | "mayfair";
    checkIn: string;
    checkOut: string;
    guests: number;
    extraIds: ("airport" | "pantry" | "celebration")[];
  };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests: string;
  };
  paymentMethod: "website";
}

function createFallbackId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return createFallbackId();
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${createClientId()}`;
}

export async function createWebsiteDraft(payload: WebsiteDraftPayload): Promise<DraftSnapshotResponse> {
  const response = await fetch("/api/reservations/drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJsonResponse<DraftSnapshotResponse>(response);
}

export async function initiateWebsiteCheckout(input: {
  token: string;
  idempotencyKey: string;
}): Promise<WebsiteCheckoutResponse> {
  const response = await fetch("/api/payments/website/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-idempotency-key": input.idempotencyKey,
    },
    body: JSON.stringify({
      token: input.token,
      idempotencyKey: input.idempotencyKey,
    }),
  });

  return readJsonResponse<WebsiteCheckoutResponse>(response);
}
