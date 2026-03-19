import type {
  BookingReviewLabels,
  ExtraId,
  ExtraOption,
  ISODateString,
  PricingBreakdown,
} from "@/types/booking";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PricingInput {
  nightlyRate: number;
  checkIn: ISODateString;
  checkOut: ISODateString;
  selectedExtraIds: ExtraId[];
  extrasCatalog: readonly Pick<ExtraOption, "id" | "price">[];
}

export interface PricingComputation {
  nights: number | null;
  staySubtotal: number | null;
  extrasSubtotal: number;
  estimatedTotal: number | null;
}

export interface BookingPricingInput {
  selectedFlatRate: number | null;
  checkIn: string;
  checkOut: string;
  selectedExtraIds: readonly ExtraId[];
  extrasCatalog: readonly Pick<ExtraOption, "id" | "price">[];
}

export interface BookingReviewLabelInput {
  residenceName: string | null;
  nights: number | null;
  guests: number;
}

export function parseIsoDate(value: ISODateString): Date | null {
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

export function calculateNightCount(checkIn: string, checkOut: string): number | null {
  const checkInDate = parseIsoDate(checkIn as ISODateString);
  const checkOutDate = parseIsoDate(checkOut as ISODateString);

  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return null;
  }

  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  return Math.floor(diffMs / MILLISECONDS_PER_DAY);
}

export function calculateExtrasSubtotal(
  selectedExtraIds: readonly ExtraId[],
  extrasCatalog: readonly Pick<ExtraOption, "id" | "price">[]
): number {
  const uniqueSelectedIds = new Set(selectedExtraIds);

  return extrasCatalog.reduce((sum, extra) => {
    if (!uniqueSelectedIds.has(extra.id)) {
      return sum;
    }

    return sum + extra.price;
  }, 0);
}

export function calculateEstimatedPricing(input: PricingInput): PricingComputation {
  const nights = calculateNightCount(input.checkIn, input.checkOut);
  const extrasSubtotal = calculateExtrasSubtotal(input.selectedExtraIds, input.extrasCatalog);
  const staySubtotal = nights === null ? null : input.nightlyRate * nights;

  return {
    nights,
    staySubtotal,
    extrasSubtotal,
    estimatedTotal: staySubtotal === null ? null : staySubtotal + extrasSubtotal,
  };
}

export function calculateBookingPricing(input: BookingPricingInput): PricingComputation {
  const nights = calculateNightCount(input.checkIn, input.checkOut);
  const extrasSubtotal = calculateExtrasSubtotal(input.selectedExtraIds, input.extrasCatalog);
  const staySubtotal = input.selectedFlatRate !== null && nights !== null ? input.selectedFlatRate * nights : null;

  return {
    nights,
    staySubtotal,
    extrasSubtotal,
    estimatedTotal: staySubtotal === null ? null : staySubtotal + extrasSubtotal,
  };
}

export function createBookingReviewLabels(input: BookingReviewLabelInput): BookingReviewLabels {
  const nightCount = input.nights;

  return {
    residence: input.residenceName ?? "Residence pending",
    nights: nightCount !== null ? `${nightCount} night${nightCount === 1 ? "" : "s"}` : "Nights pending",
    guests:
      input.guests > 0
        ? `${input.guests} guest${input.guests === 1 ? "" : "s"}`
        : "Guests pending",
  };
}

export function createPricingBreakdown(input: PricingInput): PricingBreakdown | null {
  const computed = calculateEstimatedPricing(input);

  if (computed.nights === null || computed.staySubtotal === null || computed.estimatedTotal === null) {
    return null;
  }

  return {
    currency: "NGN",
    nightlyRate: input.nightlyRate,
    nights: computed.nights,
    staySubtotal: computed.staySubtotal,
    extrasSubtotal: computed.extrasSubtotal,
    estimatedTotal: computed.estimatedTotal,
  };
}

