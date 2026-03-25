"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchTourSchedule,
  submitTourAppointment,
  type TourScheduleDateSnapshot,
} from "@/lib/tour-frontend-api";
import { TourSchedulerView } from "./TourSchedulerView";

interface MonthState {
  year: number;
  month: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to process the tour request right now.";
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getCurrentLagosMonth(): MonthState {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "");

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const fallback = new Date();
    return {
      year: fallback.getUTCFullYear(),
      month: fallback.getUTCMonth() + 1,
    };
  }

  return { year, month };
}

function shiftMonth(input: MonthState, delta: number): MonthState {
  const shifted = new Date(Date.UTC(input.year, input.month - 1 + delta, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

function findDateEntry(dates: TourScheduleDateSnapshot[], date: string | null): TourScheduleDateSnapshot | null {
  if (!date) {
    return null;
  }

  return dates.find((entry) => entry.date === date) ?? null;
}

export function TourSchedulerPanel() {
  const initialMonth = getCurrentLagosMonth();

  const [visibleMonth, setVisibleMonth] = useState<MonthState>(initialMonth);
  const [dates, setDates] = useState<TourScheduleDateSnapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isTimePanelOpen, setIsTimePanelOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const loadSchedule = useCallback(async (targetMonth: MonthState) => {
    setIsLoading(true);

    try {
      const days = getDaysInMonth(targetMonth.year, targetMonth.month);
      const startDate = formatIsoDate(targetMonth.year, targetMonth.month, 1);
      const schedule = await fetchTourSchedule({ startDate, days });

      setDates(schedule.dates);
      setSelectedDate((current) => {
        const match = findDateEntry(schedule.dates, current);
        if (!match || match.availableSlots <= 0) {
          return null;
        }

        return match.date;
      });
      setNotice(null);
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
      setDates([]);
      setSelectedDate(null);
      setSelectedTime(null);
      setIsTimePanelOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule(visibleMonth);
  }, [loadSchedule, visibleMonth]);

  useEffect(() => {
    const dateEntry = findDateEntry(dates, selectedDate);

    if (!dateEntry) {
      setSelectedTime(null);
      setIsTimePanelOpen(false);
      return;
    }

    if (!selectedTime) {
      return;
    }

    const slot = dateEntry.slots.find((entry) => entry.time === selectedTime);
    if (!slot || !slot.available) {
      setSelectedTime(null);
      setIsTimePanelOpen(true);
    }
  }, [dates, selectedDate, selectedTime]);

  const selectedDateEntry = useMemo(() => findDateEntry(dates, selectedDate), [dates, selectedDate]);

  async function handleConfirm(): Promise<void> {
    if (
      isSubmitting ||
      !selectedDate ||
      !selectedTime ||
      guestName.trim().length === 0 ||
      guestEmail.trim().length === 0
    ) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitTourAppointment({
        date: selectedDate,
        time: selectedTime,
        guestName,
        guestEmail,
        guestPhone: guestPhone.trim().length > 0 ? guestPhone.trim() : null,
      });

      setNotice({
        tone: "ok",
        message: `Tour booked for ${selectedDate} at ${selectedTime}. This slot is now blocked.`,
      });
      setSelectedTime(null);
      setIsTimePanelOpen(false);
      await loadSchedule(visibleMonth);
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
      await loadSchedule(visibleMonth);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TourSchedulerView
      visibleYear={visibleMonth.year}
      visibleMonth={visibleMonth.month}
      dates={dates}
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      selectedDateEntry={selectedDateEntry}
      isTimePanelOpen={isTimePanelOpen}
      guestName={guestName}
      guestEmail={guestEmail}
      guestPhone={guestPhone}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      notice={notice}
      onPrevMonth={() => {
        setVisibleMonth((current) => shiftMonth(current, -1));
        setSelectedDate(null);
        setSelectedTime(null);
        setIsTimePanelOpen(false);
      }}
      onNextMonth={() => {
        setVisibleMonth((current) => shiftMonth(current, 1));
        setSelectedDate(null);
        setSelectedTime(null);
        setIsTimePanelOpen(false);
      }}
      onSelectDate={(date) => {
        const nextEntry = findDateEntry(dates, date);
        if (!nextEntry || nextEntry.availableSlots <= 0 || isSubmitting) {
          return;
        }

        setSelectedDate(date);
        setSelectedTime(null);
        setIsTimePanelOpen(true);
      }}
      onSelectTime={(time) => {
        if (!selectedDateEntry) {
          return;
        }

        const slot = selectedDateEntry.slots.find((entry) => entry.time === time);
        if (!slot || !slot.available) {
          return;
        }

        setSelectedTime(time);
        setIsTimePanelOpen(false);
      }}
      onOpenTimePanel={() => {
        if (!selectedDateEntry || selectedDateEntry.availableSlots <= 0) {
          return;
        }

        setIsTimePanelOpen(true);
      }}
      onGuestNameChange={setGuestName}
      onGuestEmailChange={setGuestEmail}
      onGuestPhoneChange={setGuestPhone}
      onConfirm={handleConfirm}
    />
  );
}
