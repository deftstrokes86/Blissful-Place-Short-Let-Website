import type { FlatId, StayFormState } from "@/types/booking";

const FLAT_ID_LOOKUP: Record<string, FlatId> = {
  windsor: "windsor",
  "windsor-residence": "windsor",
  kensington: "kensington",
  "kensington-lodge": "kensington",
  mayfair: "mayfair",
  "mayfair-suite": "mayfair",
};

export type BookingFlatPreselectionSource = "draft" | "url" | "none";

export interface ResolveBookingFlatPreselectionInput {
  urlFlatParam: string | null | undefined;
  resumedDraftFlatId: StayFormState["flatId"] | FlatId | null | undefined;
}

export interface BookingFlatPreselectionResult {
  flatId: FlatId | null;
  source: BookingFlatPreselectionSource;
}

export interface DeriveFlatSelectionContextNoteInput {
  urlFlatParam: string | null | undefined;
  preselectionSource: BookingFlatPreselectionSource;
  activeFlatId: StayFormState["flatId"] | FlatId | null | undefined;
}

export function buildBookingHref(flatId?: FlatId | null): string {
  if (!flatId) {
    return "/book";
  }

  return `/book?flat=${flatId}`;
}

function normalizeFlatToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveFlatToken(value: string | null | undefined): FlatId | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeFlatToken(value);
  if (normalized.length === 0) {
    return null;
  }

  return FLAT_ID_LOOKUP[normalized] ?? null;
}

export function resolveFlatQueryParam(value: string | null | undefined): FlatId | null {
  return resolveFlatToken(value);
}

export function resolveBookingFlatPreselection(
  input: ResolveBookingFlatPreselectionInput
): BookingFlatPreselectionResult {
  const draftFlatId = resolveFlatToken(input.resumedDraftFlatId);
  if (draftFlatId) {
    return {
      flatId: draftFlatId,
      source: "draft",
    };
  }

  const urlFlatId = resolveFlatQueryParam(input.urlFlatParam);
  if (urlFlatId) {
    return {
      flatId: urlFlatId,
      source: "url",
    };
  }

  return {
    flatId: null,
    source: "none",
  };
}

export function applyFlatPreselectionToStay(
  stay: StayFormState,
  preselectedFlatId: FlatId | null
): StayFormState {
  if (!preselectedFlatId) {
    return stay;
  }

  if (stay.flatId && stay.flatId !== preselectedFlatId) {
    return stay;
  }

  if (stay.flatId === preselectedFlatId) {
    return stay;
  }

  return {
    ...stay,
    flatId: preselectedFlatId,
  };
}

export function deriveFlatSelectionContextNote(input: DeriveFlatSelectionContextNoteInput): string | null {
  const resolvedUrlFlatId = resolveFlatQueryParam(input.urlFlatParam);
  const activeFlatId = resolveFlatToken(input.activeFlatId);

  if (input.preselectionSource === "draft") {
    return null;
  }

  if (resolvedUrlFlatId && input.preselectionSource === "url" && activeFlatId === resolvedUrlFlatId) {
    return "Residence preselected from your previous page. You can change it anytime.";
  }

  const normalizedUrlToken = normalizeFlatToken(input.urlFlatParam ?? "");
  const hasUrlSelectionRequest = normalizedUrlToken.length > 0;

  if (hasUrlSelectionRequest && !resolvedUrlFlatId && !activeFlatId) {
    return "We couldn't match that residence link. Please choose your residence to continue.";
  }

  return null;
}
