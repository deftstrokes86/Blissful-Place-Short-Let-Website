import type {
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

export function calculateNightCount(checkIn: ISODateString, checkOut: ISODateString): number | null {
  const checkInDate = parseIsoDate(checkIn);
  const checkOutDate = parseIsoDate(checkOut);

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
