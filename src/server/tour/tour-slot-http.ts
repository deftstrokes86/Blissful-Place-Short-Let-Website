import type { TourSlotService } from "./tour-slot-service";

function normalizeRequiredString(value: string | null | undefined, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }

  return trimmed;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalDays(value: string | null | undefined): number {
  if (!value) {
    return 14;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
    throw new Error("days must be an integer between 1 and 31.");
  }

  return parsed;
}

export async function handleGetTourScheduleRequest(
  service: Pick<TourSlotService, "listScheduleWindow">,
  input: {
    startDate?: string | null;
    days?: string | null;
  }
) {
  const schedule = await service.listScheduleWindow({
    startDate: normalizeOptionalString(input.startDate),
    days: normalizeOptionalDays(input.days),
  });

  return { schedule };
}

export async function handleCreateTourAppointmentRequest(
  service: Pick<TourSlotService, "bookSlot">,
  input: {
    date: string | null;
    time: string | null;
    guestName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
  }
) {
  const appointment = await service.bookSlot({
    date: normalizeRequiredString(input.date, "date"),
    time: normalizeRequiredString(input.time, "time"),
    guestName: normalizeRequiredString(input.guestName, "guestName"),
    guestEmail: normalizeRequiredString(input.guestEmail, "guestEmail"),
    guestPhone: normalizeOptionalString(input.guestPhone),
  });

  return { appointment };
}
