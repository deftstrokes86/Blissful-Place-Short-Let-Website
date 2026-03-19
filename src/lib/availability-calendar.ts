export interface AvailabilityDay {
  day: number;
  available: boolean;
  priceLabel: string;
}

interface BuildAvailabilityMonthInput {
  daysInMonth: number;
  monthStartWeekdayOffset: number;
}

function isWeekend(day: number, monthStartWeekdayOffset: number): boolean {
  const dayOfWeek = (day + monthStartWeekdayOffset) % 7;
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isBookedDay(day: number, monthStartWeekdayOffset: number): boolean {
  if (day % 7 === 0) {
    return true;
  }

  if (isWeekend(day, monthStartWeekdayOffset) && day % 3 === 0) {
    return true;
  }

  return day % 11 === 0;
}

function getPriceLabel(day: number): string {
  return day % 5 === 0 ? "?300k" : "?250k";
}

export function buildMockAvailabilityMonth(input: BuildAvailabilityMonthInput): AvailabilityDay[] {
  const month: AvailabilityDay[] = [];

  for (let day = 1; day <= input.daysInMonth; day += 1) {
    const booked = isBookedDay(day, input.monthStartWeekdayOffset);

    month.push({
      day,
      available: !booked,
      priceLabel: getPriceLabel(day),
    });
  }

  return month;
}

