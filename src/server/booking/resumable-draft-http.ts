import { parseDraftInput } from "../http/reservation-payload";
import type { BookingToken } from "../../types/booking";
import type { DraftCreateInput, DraftUpdateInput } from "../../types/booking-backend";
import type { ResumableDraftService, ResumableDraftSession } from "./resumable-draft-service";

const RESUME_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,200}$/;

export interface ResumableDraftHttpInterface {
  createResumableDraft(input: DraftCreateInput): ReturnType<ResumableDraftService["createResumableDraft"]>;
  updateResumableDraft(
    token: BookingToken,
    input: DraftUpdateInput
  ): ReturnType<ResumableDraftService["updateResumableDraft"]>;
  loadResumableDraft(token: BookingToken): ReturnType<ResumableDraftService["loadResumableDraft"]>;
}

function normalizeToken(token: unknown): BookingToken {
  if (typeof token !== "string") {
    throw new Error("Reservation token is required.");
  }

  const normalized = token.trim();
  if (!normalized) {
    throw new Error("Reservation token is required.");
  }

  if (!RESUME_TOKEN_PATTERN.test(normalized)) {
    throw new Error("Invalid reservation token format.");
  }

  return normalized;
}

function ensureUpdatePayloadHasChanges(input: DraftUpdateInput): void {
  if (Object.keys(input).length === 0) {
    throw new Error("Draft update payload is empty.");
  }
}

export async function handleCreateResumableDraftRequest(
  service: ResumableDraftHttpInterface,
  body: Record<string, unknown>
): Promise<ResumableDraftSession> {
  const input = parseDraftInput(body);
  return service.createResumableDraft(input);
}

export async function handleSaveResumableDraftRequest(
  service: ResumableDraftHttpInterface,
  input: {
    token: unknown;
    body: Record<string, unknown>;
  }
): Promise<ResumableDraftSession> {
  const token = normalizeToken(input.token);
  const parsed = parseDraftInput(input.body);
  ensureUpdatePayloadHasChanges(parsed);

  return service.updateResumableDraft(token, parsed);
}

export async function handleLoadResumableDraftRequest(
  service: ResumableDraftHttpInterface,
  input: {
    token: unknown;
  }
): Promise<ResumableDraftSession> {
  const token = normalizeToken(input.token);
  return service.loadResumableDraft(token);
}
