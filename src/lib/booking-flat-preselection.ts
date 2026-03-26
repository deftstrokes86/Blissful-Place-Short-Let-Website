import type { FlatId, StayFormState } from "@/types/booking";

const FLAT_ID_LOOKUP: Record<string, FlatId> = {
  windsor: "windsor",
  "windsor-residence": "windsor",
  kensington: "kensington",
  "kensington-lodge": "kensington",
  mayfair: "mayfair",
  "mayfair-suite": "mayfair",
};
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type BookingFlatPreselectionSource = "draft" | "url" | "none";
export type BookingStayDatePreselectionSource = "draft" | "url" | "none";

export interface BookingStayDateRange {
  checkIn: string;
  checkOut: string;
}

export interface DeriveSelectedDateRangeInput {
  year: number;
  month: number;
  selectedDays: readonly number[];
}

export interface ResolveBookingFlatPreselectionInput {
  urlFlatParam: string | null | undefined;
  resumedDraftFlatId: StayFormState["flatId"] | FlatId | null | undefined;
}

export interface ResolveBookingStayDatePreselectionInput {
  urlCheckInParam: string | null | undefined;
  urlCheckOutParam: string | null | undefined;
  resumedDraftCheckIn: string | null | undefined;
  resumedDraftCheckOut: string | null | undefined;
}

export interface BookingFlatPreselectionResult {
  flatId: FlatId | null;
  source: BookingFlatPreselectionSource;
}

export interface BookingStayDatePreselectionResult {
  range: BookingStayDateRange | null;
  source: BookingStayDatePreselectionSource;
}

export interface BookingBlockedDateSpanLike {
  startDate: string;
  endDate: string;
}

export interface DeriveFlatSelectionContextNoteInput {
  urlFlatParam: string | null | undefined;
  preselectionSource: BookingFlatPreselectionSource;
  activeFlatId: StayFormState["flatId"] | FlatId | null | undefined;
}

export interface DeriveStayDateSelectionContextNoteInput {
  preselectionSource: BookingStayDatePreselectionSource;
  activeCheckIn: string | null | undefined;
  activeCheckOut: string | null | undefined;
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

function formatDateAsIso(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseIsoDateString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const isSameDate =
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;

  if (!isSameDate) {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateNightCountFromRange(checkIn: string, checkOut: string): number | null {
  const parsedCheckIn = parseIsoDateString(checkIn);
  const parsedCheckOut = parseIsoDateString(checkOut);

  if (!parsedCheckIn || !parsedCheckOut || parsedCheckOut <= parsedCheckIn) {
    return null;
  }

  const diffMs = parsedCheckOut.getTime() - parsedCheckIn.getTime();
  return Math.floor(diffMs / MILLISECONDS_PER_DAY);
}

function resolveStayDateRange(
  checkInValue: string | null | undefined,
  checkOutValue: string | null | undefined
): BookingStayDateRange | null {
  if (typeof checkInValue !== "string" || typeof checkOutValue !== "string") {
    return null;
  }

  const checkIn = checkInValue.trim();
  const checkOut = checkOutValue.trim();

  const parsedCheckIn = parseIsoDateString(checkIn);
  const parsedCheckOut = parseIsoDateString(checkOut);

  if (!parsedCheckIn || !parsedCheckOut) {
    return null;
  }

  if (calculateNightCountFromRange(checkIn, checkOut) === null) {
    return null;
  }

  return {
    checkIn,
    checkOut,
  };
}

export function buildBookingHref(flatId?: FlatId | null, stayDateRange?: BookingStayDateRange | null): string {
  const params = new URLSearchParams();

  if (flatId) {
    params.set("flat", flatId);
  }

  const resolvedRange = stayDateRange
    ? resolveStayDateRange(stayDateRange.checkIn, stayDateRange.checkOut)
    : null;

  if (resolvedRange) {
    params.set("checkIn", resolvedRange.checkIn);
    params.set("checkOut", resolvedRange.checkOut);
  }

  const query = params.toString();
  return query.length > 0 ? `/book?${query}` : "/book";
}

export function deriveSelectedDateRangeForBooking(
  input: DeriveSelectedDateRangeInput
): BookingStayDateRange | null {
  if (!Number.isInteger(input.year) || !Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
    return null;
  }

  const uniqueSortedDays = [...new Set(input.selectedDays)]
    .filter((day) => Number.isInteger(day) && day > 0)
    .sort((left, right) => left - right);

  if (uniqueSortedDays.length === 0) {
    return null;
  }

  for (let index = 1; index < uniqueSortedDays.length; index += 1) {
    if (uniqueSortedDays[index] !== uniqueSortedDays[index - 1] + 1) {
      return null;
    }
  }

  const checkInDate = new Date(Date.UTC(input.year, input.month - 1, uniqueSortedDays[0]));
  const expectedCheckInDay = uniqueSortedDays[0];

  if (
    checkInDate.getUTCFullYear() !== input.year ||
    checkInDate.getUTCMonth() + 1 !== input.month ||
    checkInDate.getUTCDate() !== expectedCheckInDay
  ) {
    return null;
  }

  const lastDay = uniqueSortedDays[uniqueSortedDays.length - 1];
  const checkOutDate = new Date(Date.UTC(input.year, input.month - 1, lastDay + 1));

  return {
    checkIn: formatDateAsIso(checkInDate),
    checkOut: formatDateAsIso(checkOutDate),
  };
}

export function resolveFlatQueryParam(value: string | null | undefined): FlatId | null {
  return resolveFlatToken(value);
}

export function resolveStayRangeQueryPrefill(
  checkInValue: string | null | undefined,
  checkOutValue: string | null | undefined
): BookingStayDateRange | null {
  return resolveStayDateRange(checkInValue, checkOutValue);
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

export function resolveBookingStayDatePreselection(
  input: ResolveBookingStayDatePreselectionInput
): BookingStayDatePreselectionResult {
  const draftRange = resolveStayDateRange(input.resumedDraftCheckIn, input.resumedDraftCheckOut);

  if (draftRange) {
    return {
      range: draftRange,
      source: "draft",
    };
  }

  const urlRange = resolveStayDateRange(input.urlCheckInParam, input.urlCheckOutParam);

  if (urlRange) {
    return {
      range: urlRange,
      source: "url",
    };
  }

  return {
    range: null,
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

export function applyStayDateRangePrefillToStay(
  stay: StayFormState,
  preselectedRange: BookingStayDateRange | null
): StayFormState {
  if (!preselectedRange) {
    return stay;
  }

  const { checkIn, checkOut } = preselectedRange;

  if ((stay.checkIn && stay.checkIn !== checkIn) || (stay.checkOut && stay.checkOut !== checkOut)) {
    return stay;
  }

  if (stay.checkIn === checkIn && stay.checkOut === checkOut) {
    return stay;
  }

  return {
    ...stay,
    checkIn,
    checkOut,
  };
}

export function hasBlockedSpanOverlapForStay(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  blockedSpans: readonly BookingBlockedDateSpanLike[]
): boolean {
  const resolvedRange = resolveStayDateRange(checkIn, checkOut);

  if (!resolvedRange || blockedSpans.length === 0) {
    return false;
  }

  return blockedSpans.some(
    (span) => resolvedRange.checkIn < span.endDate && span.startDate < resolvedRange.checkOut
  );
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

export function deriveStayDateSelectionContextNote(input: DeriveStayDateSelectionContextNoteInput): string | null {
  const activeRange = resolveStayDateRange(input.activeCheckIn, input.activeCheckOut);

  if (!activeRange) {
    return null;
  }

  if (input.preselectionSource === "url") {
    return "Dates carried from Live Availability. You can adjust them anytime before continuing.";
  }

  return null;
}
