import type {
  AvailabilityCheckpoint,
  AvailabilityResult,
  FlatId,
  GuestDetailsInput,
  PaymentMethod,
  ReservationStatus,
  StayDetailsInput,
} from "@/types/booking";
import type { DraftCreateInput, DraftUpdateInput } from "@/types/booking-backend";

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

export interface DraftReservationSnapshot {
  token: string;
  status: ReservationStatus;
  paymentMethod: PaymentMethod | null;
  stay: StayDetailsInput;
  guest: GuestDetailsInput;
  progressContext: {
    currentStep: number | null;
    activeBranch: PaymentMethod | null;
  };
  transferHoldExpiresAt: string | null;
  lastTouchedAt: string;
}

export interface DraftBranchContextSnapshot {
  resolvedPaymentMethod: PaymentMethod | null;
  resumeStepIndex: number;
  savedProgressStep: number | null;
  stepLabels: [string, string, string, string, string, string];
  stayReady: boolean;
  guestReady: boolean;
}

export interface DraftAvailabilityRevalidationNeedsSnapshot {
  createBranchRequest: boolean;
  onlinePaymentHandoff: boolean;
  transferConfirmation: boolean;
  posConfirmation: boolean;
  requiredCheckpoints: AvailabilityCheckpoint[];
}

export interface DraftSnapshotResponse {
  resumeToken: string;
  reservation: DraftReservationSnapshot;
  branchContext: DraftBranchContextSnapshot;
  availabilityRevalidationNeeds: DraftAvailabilityRevalidationNeedsSnapshot;
}

export interface ResumedDraftRevalidationResponse {
  token: string;
  checkpoint: AvailabilityCheckpoint;
  canProceed: boolean;
  requiresStayUpdate: boolean;
  blockingMessage: string | null;
  guidance: string | null;
  availability: AvailabilityResult;
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

export type BookingDraftPayload = DraftCreateInput;
export type BookingDraftUpdatePayload = DraftUpdateInput;

export interface CalendarBlockedSpanResponse {
  blockId: string;
  sourceType: "reservation" | "manual";
  sourceId: string;
  blockType: "hard_block" | "soft_hold";
  startDate: string;
  endDate: string;
  expiresAt: string | null;
}

export interface CalendarMonthAvailabilityResponse {
  flatId: FlatId;
  month: string;
  startDate: string;
  endDate: string;
  timezone: string;
  blockedSpans: CalendarBlockedSpanResponse[];
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

export async function createBookingDraft(payload: BookingDraftPayload): Promise<DraftSnapshotResponse> {
  const response = await fetch("/api/reservations/drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJsonResponse<DraftSnapshotResponse>(response);
}

export async function loadBookingDraft(token: string): Promise<DraftSnapshotResponse> {
  const response = await fetch(`/api/reservations/drafts/${token}`, {
    method: "GET",
    cache: "no-store",
  });

  return readJsonResponse<DraftSnapshotResponse>(response);
}

export async function saveBookingDraftProgress(
  token: string,
  payload: BookingDraftUpdatePayload
): Promise<DraftSnapshotResponse> {
  const response = await fetch(`/api/reservations/drafts/${token}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJsonResponse<DraftSnapshotResponse>(response);
}

export async function revalidateResumedDraftProgression(input: {
  token: string;
  checkpoint:
    | "pre_hold_request"
    | "pre_online_payment_handoff"
    | "pre_transfer_confirmation"
    | "pre_pos_confirmation";
}): Promise<ResumedDraftRevalidationResponse> {
  const response = await fetch(`/api/reservations/drafts/${input.token}/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkpoint: input.checkpoint,
    }),
  });

  return readJsonResponse<ResumedDraftRevalidationResponse>(response);
}

export async function createWebsiteDraft(payload: WebsiteDraftPayload): Promise<DraftSnapshotResponse> {
  return createBookingDraft(payload);
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

export async function runAvailabilityCheckpoint(input: {
  checkpoint: AvailabilityCheckpoint;
  stay: StayDetailsInput;
  paymentMethod?: PaymentMethod;
  reservationId?: string;
}): Promise<AvailabilityResult> {
  const body: {
    checkpoint: AvailabilityCheckpoint;
    stay: StayDetailsInput;
    paymentMethod?: PaymentMethod;
    reservationId?: string;
  } = {
    checkpoint: input.checkpoint,
    stay: input.stay,
  };

  if (input.paymentMethod) {
    body.paymentMethod = input.paymentMethod;
  }

  if (input.reservationId) {
    body.reservationId = input.reservationId;
  }

  const response = await fetch("/api/availability/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await readJsonResponse<{ result: AvailabilityResult }>(response);
  return payload.result;
}

export async function fetchCalendarMonthAvailability(input: {
  flatId: FlatId;
  year: number;
  month: number;
}): Promise<CalendarMonthAvailabilityResponse> {
  const params = new URLSearchParams({
    flatId: input.flatId,
    year: String(input.year),
    month: String(input.month),
  });

  const response = await fetch(`/api/availability/calendar?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ month: CalendarMonthAvailabilityResponse }>(response);
  return payload.month;
}

