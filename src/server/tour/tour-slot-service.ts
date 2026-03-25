import { randomUUID } from "node:crypto";
import type { ISODateString } from "../../types/booking";
import type { TourAppointmentRecord } from "../../types/booking-backend";

const LAGOS_TIMEZONE = "Africa/Lagos";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TOUR_SLOT_TIMES = ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00"] as const;

type TourSlotTime = (typeof TOUR_SLOT_TIMES)[number];

export interface TourSlotSnapshot {
  time: string;
  available: boolean;
  reason: "booked" | "past" | null;
}

export interface TourScheduleDateSnapshot {
  date: ISODateString;
  weekdayLabel: string;
  dateLabel: string;
  availableSlots: number;
  slots: TourSlotSnapshot[];
}

export interface TourScheduleWindowSnapshot {
  timezone: "Africa/Lagos";
  generatedAt: string;
  startDate: ISODateString;
  days: number;
  dates: TourScheduleDateSnapshot[];
}

export interface TourSlotRepository {
  listAppointments(): Promise<TourAppointmentRecord[]>;
  createAppointment(record: TourAppointmentRecord): Promise<TourAppointmentRecord>;
}

interface TourSlotServiceDependencies {
  repository: TourSlotRepository;
  now?: () => Date;
  createId?: () => string;
}

interface LagosNowSnapshot {
  date: ISODateString;
  time: string;
}

function toIsoDateParts(input: string): { year: number; month: number; day: number } | null {
  const trimmed = input.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() + 1 !== month ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): ISODateString {
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return `${year}-${monthText}-${dayText}`;
}

function addDays(isoDate: ISODateString, offset: number): ISODateString {
  const parts = toIsoDateParts(isoDate);
  if (!parts) {
    throw new Error("Invalid ISO date.");
  }

  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return formatIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

function formatLagosNow(now: Date): LagosNowSnapshot {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

function formatWeekdayLabel(isoDate: ISODateString): string {
  const parts = toIsoDateParts(isoDate);
  if (!parts) {
    return "";
  }

  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: LAGOS_TIMEZONE,
  }).format(utcDate);
}

function formatDateLabel(isoDate: ISODateString): string {
  const parts = toIsoDateParts(isoDate);
  if (!parts) {
    return isoDate;
  }

  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: LAGOS_TIMEZONE,
  }).format(utcDate);
}

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

function normalizeSlotTime(value: string): TourSlotTime {
  if (!TOUR_SLOT_TIMES.includes(value as TourSlotTime)) {
    throw new Error("A valid tour slot time is required.");
  }

  return value as TourSlotTime;
}

function normalizeIsoDate(value: string): ISODateString {
  if (!toIsoDateParts(value)) {
    throw new Error("A valid date is required.");
  }

  return value as ISODateString;
}

function isSlotPast(date: ISODateString, time: TourSlotTime, lagosNow: LagosNowSnapshot): boolean {
  if (date < lagosNow.date) {
    return true;
  }

  if (date > lagosNow.date) {
    return false;
  }

  return time <= lagosNow.time;
}

export class TourSlotService {
  private readonly repository: TourSlotRepository;
  private readonly nowProvider: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: TourSlotServiceDependencies) {
    this.repository = dependencies.repository;
    this.nowProvider = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? (() => `tour_appt_${randomUUID()}`);
  }

  async listScheduleWindow(input: {
    startDate?: string | null;
    days: number;
  }): Promise<TourScheduleWindowSnapshot> {
    if (!Number.isInteger(input.days) || input.days < 1 || input.days > 31) {
      throw new Error("days must be an integer between 1 and 31.");
    }

    const now = this.nowProvider();
    const lagosNow = formatLagosNow(now);
    const startDate = input.startDate ? normalizeIsoDate(input.startDate) : lagosNow.date;

    const appointments = (await this.repository.listAppointments()).filter(
      (entry) => entry.status === "booked"
    );

    const dates: TourScheduleDateSnapshot[] = [];

    for (let offset = 0; offset < input.days; offset += 1) {
      const date = addDays(startDate, offset);

      const slots: TourSlotSnapshot[] = TOUR_SLOT_TIMES.map((time) => {
        const booked = appointments.some((entry) => entry.date === date && entry.time === time);
        const past = isSlotPast(date, time, lagosNow);
        const available = !booked && !past;

        return {
          time,
          available,
          reason: booked ? "booked" : past ? "past" : null,
        };
      });

      dates.push({
        date,
        weekdayLabel: formatWeekdayLabel(date),
        dateLabel: formatDateLabel(date),
        availableSlots: slots.filter((slot) => slot.available).length,
        slots,
      });
    }

    return {
      timezone: "Africa/Lagos",
      generatedAt: now.toISOString(),
      startDate,
      days: input.days,
      dates,
    };
  }

  async bookSlot(input: {
    date: string;
    time: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string | null;
  }): Promise<TourAppointmentRecord> {
    const now = this.nowProvider();
    const lagosNow = formatLagosNow(now);

    const date = normalizeIsoDate(normalizeRequiredString(input.date, "date"));
    const time = normalizeSlotTime(normalizeRequiredString(input.time, "time"));
    const guestName = normalizeRequiredString(input.guestName, "guestName");
    const guestEmail = normalizeRequiredString(input.guestEmail, "guestEmail").toLowerCase();

    if (!EMAIL_PATTERN.test(guestEmail)) {
      throw new Error("A valid guestEmail is required.");
    }

    if (isSlotPast(date, time, lagosNow)) {
      throw new Error("Cannot book a past tour slot.");
    }

    const existing = (await this.repository.listAppointments()).find(
      (entry) => entry.status === "booked" && entry.date === date && entry.time === time
    );

    if (existing) {
      throw new Error("This tour slot is already booked.");
    }

    const timestamp = now.toISOString();

    const created: TourAppointmentRecord = {
      id: this.createId(),
      date,
      time,
      guestName,
      guestEmail,
      guestPhone: normalizeOptionalString(input.guestPhone),
      status: "booked",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.repository.createAppointment(created);
  }
}



