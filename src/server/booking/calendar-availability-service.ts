import { parseIsoDate } from "../../lib/booking-pricing";
import type { FlatId, ISODateString } from "../../types/booking";
import type { AvailabilityBlockRecord } from "../../types/booking-backend";

export const CALENDAR_AVAILABILITY_TIMEZONE = "Africa/Lagos";

export interface CalendarAvailabilityBlock {
  id: string;
  flatId: FlatId;
  sourceType: AvailabilityBlockRecord["sourceType"];
  sourceId: string;
  blockType: AvailabilityBlockRecord["blockType"];
  startDate: ISODateString;
  endDate: ISODateString;
  status: AvailabilityBlockRecord["status"];
  expiresAt: string | null;
}

export interface CalendarAvailabilityRepository {
  listByFlat(flatId: FlatId): Promise<CalendarAvailabilityBlock[]>;
}

export interface CalendarBlockedSpan {
  blockId: string;
  sourceType: AvailabilityBlockRecord["sourceType"];
  sourceId: string;
  blockType: AvailabilityBlockRecord["blockType"];
  startDate: ISODateString;
  endDate: ISODateString;
  expiresAt: string | null;
}

export interface CalendarRangeAvailabilityInput {
  flatId: FlatId;
  startDate: ISODateString;
  endDate: ISODateString;
  excludeSourceId?: string;
}

export interface CalendarRangeAvailabilityResult {
  flatId: FlatId;
  startDate: ISODateString;
  endDate: ISODateString;
  timezone: typeof CALENDAR_AVAILABILITY_TIMEZONE;
  isAvailable: boolean;
  blockedSpans: CalendarBlockedSpan[];
}

export interface CalendarMonthBlockedInput {
  flatId: FlatId;
  year: number;
  month: number;
}

export interface CalendarMonthBlockedResult {
  flatId: FlatId;
  month: string;
  startDate: ISODateString;
  endDate: ISODateString;
  timezone: typeof CALENDAR_AVAILABILITY_TIMEZONE;
  blockedSpans: CalendarBlockedSpan[];
}

export interface ProposedStayAvailabilityInput {
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  excludeSourceId?: string;
}

export interface ProposedStayAvailabilityResult {
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  timezone: typeof CALENDAR_AVAILABILITY_TIMEZONE;
  isAvailable: boolean;
  overlappingBlocks: CalendarBlockedSpan[];
}

interface CalendarAvailabilityServiceDependencies {
  repository: CalendarAvailabilityRepository;
  now?: () => Date;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(value: string): ISODateString {
  return value.slice(0, 10) as ISODateString;
}

function assertValidWindow(startDate: ISODateString, endDate: ISODateString): void {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end <= start) {
    throw new Error("Invalid date window. End date must be after start date.");
  }
}

function dateRangesOverlap(
  firstStartIso: string,
  firstEndIso: string,
  secondStartIso: string,
  secondEndIso: string
): boolean {
  const firstStart = parseIsoDate(toIsoDate(firstStartIso));
  const firstEnd = parseIsoDate(toIsoDate(firstEndIso));
  const secondStart = parseIsoDate(toIsoDate(secondStartIso));
  const secondEnd = parseIsoDate(toIsoDate(secondEndIso));

  if (!firstStart || !firstEnd || !secondStart || !secondEnd) {
    return false;
  }

  // Check-in inclusive, check-out exclusive.
  return firstStart < secondEnd && secondStart < firstEnd;
}

function maxIsoDate(left: ISODateString, right: ISODateString): ISODateString {
  return left > right ? left : right;
}

function minIsoDate(left: ISODateString, right: ISODateString): ISODateString {
  return left < right ? left : right;
}

function isActiveBlock(block: CalendarAvailabilityBlock, nowMs: number): boolean {
  if (block.status !== "active") {
    return false;
  }

  if (!block.expiresAt) {
    return true;
  }

  return new Date(block.expiresAt).getTime() > nowMs;
}

function toBlockedSpan(
  block: CalendarAvailabilityBlock,
  queryStart: ISODateString,
  queryEnd: ISODateString
): CalendarBlockedSpan {
  return {
    blockId: block.id,
    sourceType: block.sourceType,
    sourceId: block.sourceId,
    blockType: block.blockType,
    startDate: maxIsoDate(block.startDate, queryStart),
    endDate: minIsoDate(block.endDate, queryEnd),
    expiresAt: block.expiresAt,
  };
}

export class CalendarOverlapError extends Error {
  readonly code = "calendar_overlap_detected";
}

export class CalendarAvailabilityService {
  private readonly repository: CalendarAvailabilityRepository;
  private readonly nowProvider: () => Date;

  constructor(dependencies: CalendarAvailabilityServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
  }

  async queryFlatAvailability(input: CalendarRangeAvailabilityInput): Promise<CalendarRangeAvailabilityResult> {
    assertValidWindow(input.startDate, input.endDate);

    const nowMs = this.nowProvider().getTime();
    const blocks = await this.repository.listByFlat(input.flatId);

    const blockedSpans = blocks
      .filter((block) => {
        if (!isActiveBlock(block, nowMs)) {
          return false;
        }

        if (input.excludeSourceId && block.sourceId === input.excludeSourceId) {
          return false;
        }

        return dateRangesOverlap(block.startDate, block.endDate, input.startDate, input.endDate);
      })
      .map((block) => toBlockedSpan(block, input.startDate, input.endDate))
      .sort((left, right) => left.startDate.localeCompare(right.startDate) || left.endDate.localeCompare(right.endDate));

    return {
      flatId: input.flatId,
      startDate: input.startDate,
      endDate: input.endDate,
      timezone: CALENDAR_AVAILABILITY_TIMEZONE,
      isAvailable: blockedSpans.length === 0,
      blockedSpans,
    };
  }

  async queryBlockedDatesForMonth(input: CalendarMonthBlockedInput): Promise<CalendarMonthBlockedResult> {
    if (!Number.isInteger(input.year) || input.year < 1970 || input.year > 9999) {
      throw new Error("Invalid year for month query.");
    }

    if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
      throw new Error("Invalid month for month query.");
    }

    const startDate = `${input.year}-${pad2(input.month)}-01` as ISODateString;
    const nextMonthYear = input.month === 12 ? input.year + 1 : input.year;
    const nextMonthValue = input.month === 12 ? 1 : input.month + 1;
    const endDate = `${nextMonthYear}-${pad2(nextMonthValue)}-01` as ISODateString;

    const range = await this.queryFlatAvailability({
      flatId: input.flatId,
      startDate,
      endDate,
    });

    return {
      flatId: input.flatId,
      month: `${input.year}-${pad2(input.month)}`,
      startDate,
      endDate,
      timezone: CALENDAR_AVAILABILITY_TIMEZONE,
      blockedSpans: range.blockedSpans,
    };
  }

  async checkProposedStayAvailability(
    input: ProposedStayAvailabilityInput
  ): Promise<ProposedStayAvailabilityResult> {
    const availability = await this.queryFlatAvailability({
      flatId: input.flatId,
      startDate: input.checkIn,
      endDate: input.checkOut,
      excludeSourceId: input.excludeSourceId,
    });

    return {
      flatId: input.flatId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      timezone: availability.timezone,
      isAvailable: availability.isAvailable,
      overlappingBlocks: availability.blockedSpans,
    };
  }

  async assertCanCreateReservation(input: ProposedStayAvailabilityInput): Promise<void> {
    await this.assertNoOverlap(input, "create");
  }

  async assertCanConfirmReservation(input: ProposedStayAvailabilityInput): Promise<void> {
    await this.assertNoOverlap(input, "confirm");
  }

  private async assertNoOverlap(input: ProposedStayAvailabilityInput, stage: "create" | "confirm"): Promise<void> {
    const result = await this.checkProposedStayAvailability(input);
    if (result.isAvailable) {
      return;
    }

    throw new CalendarOverlapError(
      `Cannot ${stage} reservation because stay overlaps an active calendar block.`
    );
  }
}
