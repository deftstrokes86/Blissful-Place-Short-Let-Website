export interface AvailabilityBlockedSpan {
  blockId: string;
  startDate: string;
  endDate: string;
  blockType: "soft_hold" | "reservation" | "hard_block";
}

export type AvailabilityDayStatus = "available" | "blocked" | "past";

export interface AvailabilityCalendarDay {
  day: number;
  isoDate: string;
  blockedSpan: AvailabilityBlockedSpan | null;
  status: AvailabilityDayStatus;
  isSelectable: boolean;
  statusLabel: string;
}

export interface BuildAvailabilityCalendarDaysInput {
  year: number;
  month: number;
  blockedSpans: readonly AvailabilityBlockedSpan[];
  todayIso: string;
}

export interface CanNavigateToPreviousMonthInput {
  selectedYear: number;
  selectedMonth: number;
  minimumYear: number;
  minimumMonth: number;
}

export interface ShiftYearMonthInput {
  year: number;
  month: number;
  delta: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrentLagosIsoDate(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Lagos",
  });

  const parts = formatter.formatToParts(now);
  const yearText = parts.find((part) => part.type === "year")?.value ?? "";
  const monthText = parts.find((part) => part.type === "month")?.value ?? "";
  const dayText = parts.find((part) => part.type === "day")?.value ?? "";

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    const fallback = now.toISOString().slice(0, 10);
    return fallback;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getCurrentLagosYearMonth(now: Date = new Date()): { year: number; month: number } {
  const todayIso = getCurrentLagosIsoDate(now);
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  return { year, month };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getMonthStartWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function shiftYearMonth(input: ShiftYearMonthInput): { year: number; month: number } {
  const shifted = new Date(Date.UTC(input.year, input.month - 1 + input.delta, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

function dateFallsInSpan(isoDate: string, span: AvailabilityBlockedSpan): boolean {
  return span.startDate <= isoDate && isoDate < span.endDate;
}

export function buildAvailabilityCalendarDays(
  input: BuildAvailabilityCalendarDaysInput
): AvailabilityCalendarDay[] {
  const daysInMonth = getDaysInMonth(input.year, input.month);
  const days: AvailabilityCalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${input.year}-${pad2(input.month)}-${pad2(day)}`;
    const blockedSpan = input.blockedSpans.find((span) => dateFallsInSpan(isoDate, span)) ?? null;
    const isPast = isoDate < input.todayIso;

    let status: AvailabilityDayStatus = "available";
    let statusLabel = "Open";

    // Past dates remain non-selectable even if a block exists.
    if (isPast) {
      status = "past";
      statusLabel = "Past";
    } else if (blockedSpan) {
      status = "blocked";
      statusLabel = blockedSpan.blockType === "soft_hold" ? "Held" : "Booked";
    }

    days.push({
      day,
      isoDate,
      blockedSpan,
      status,
      isSelectable: status === "available",
      statusLabel,
    });
  }

  return days;
}

export function filterSelectableCalendarDays(
  selectedDays: readonly number[],
  calendarDays: readonly AvailabilityCalendarDay[]
): number[] {
  if (selectedDays.length === 0) {
    return [];
  }

  const selectableDayNumbers = new Set(
    calendarDays.filter((entry) => entry.isSelectable).map((entry) => entry.day)
  );

  return selectedDays.filter((day) => selectableDayNumbers.has(day));
}

export function canNavigateToPreviousMonth(input: CanNavigateToPreviousMonthInput): boolean {
  const selectedIndex = input.selectedYear * 12 + (input.selectedMonth - 1);
  const minimumIndex = input.minimumYear * 12 + (input.minimumMonth - 1);

  return selectedIndex > minimumIndex;
}

export function formatMonthLabel(year: number, month: number): string {
  const labelDate = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(labelDate);
}

export function formatBlockedSpan(span: AvailabilityBlockedSpan): string {
  const start = span.startDate.slice(5);
  const end = span.endDate.slice(5);
  const statusLabel = span.blockType === "soft_hold" ? "Held" : "Booked";

  return `${start} to ${end} (${statusLabel})`;
}

