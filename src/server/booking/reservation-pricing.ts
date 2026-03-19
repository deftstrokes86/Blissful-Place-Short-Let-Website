import type { ExtraId } from "../../types/booking";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface PricingInput {
  nightlyRate: number | null;
  checkIn: string;
  checkOut: string;
  selectedExtraIds: readonly ExtraId[];
  extrasCatalog: readonly { id: ExtraId; flatFee: number }[];
}

export interface ReservationPricingComputation {
  nights: number | null;
  staySubtotal: number | null;
  extrasSubtotal: number;
  estimatedTotal: number | null;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;

  return valid ? date : null;
}

function calculateNights(checkIn: string, checkOut: string): number | null {
  const checkInDate = parseIsoDate(checkIn);
  const checkOutDate = parseIsoDate(checkOut);

  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return null;
  }

  const diff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.floor(diff / MILLISECONDS_PER_DAY);
}

function calculateExtrasSubtotal(
  selectedExtraIds: readonly ExtraId[],
  extrasCatalog: readonly { id: ExtraId; flatFee: number }[]
): number {
  const selected = new Set(selectedExtraIds);

  return extrasCatalog.reduce((sum, extra) => {
    if (!selected.has(extra.id)) {
      return sum;
    }

    return sum + extra.flatFee;
  }, 0);
}

export function computeReservationPricing(input: PricingInput): ReservationPricingComputation {
  const nights = calculateNights(input.checkIn, input.checkOut);
  const extrasSubtotal = calculateExtrasSubtotal(input.selectedExtraIds, input.extrasCatalog);
  const staySubtotal = input.nightlyRate !== null && nights !== null ? input.nightlyRate * nights : null;

  return {
    nights,
    staySubtotal,
    extrasSubtotal,
    estimatedTotal: staySubtotal === null ? null : staySubtotal + extrasSubtotal,
  };
}
