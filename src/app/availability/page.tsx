"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageIntro } from "@/components/common/PageIntro";
import { formatCurrency } from "@/lib/booking-utils";
import { fetchCalendarMonthAvailability, type CalendarBlockedSpanResponse } from "@/lib/booking-frontend-api";
import { buildBookingHref } from "@/lib/booking-flat-preselection";
import { FLATS } from "@/lib/constants";
import type { FlatId } from "@/types/booking";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface CalendarDayView {
  day: number;
  isoDate: string;
  blockedSpan: CalendarBlockedSpanResponse | null;
}

function getCurrentLagosYearMonth(): { year: number; month: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Africa/Lagos",
  });
  const parts = formatter.formatToParts(new Date());
  const yearText = parts.find((part) => part.type === "year")?.value ?? "";
  const monthText = parts.find((part) => part.type === "month")?.value ?? "";
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const fallback = new Date();
    return {
      year: fallback.getUTCFullYear(),
      month: fallback.getUTCMonth() + 1,
    };
  }

  return { year, month };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getMonthStartWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function dateFallsInSpan(isoDate: string, span: CalendarBlockedSpanResponse): boolean {
  return span.startDate <= isoDate && isoDate < span.endDate;
}

function buildCalendarDays(year: number, month: number, blockedSpans: CalendarBlockedSpanResponse[]): CalendarDayView[] {
  const daysInMonth = getDaysInMonth(year, month);

  const days: CalendarDayView[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = `${year}-${pad2(month)}-${pad2(day)}`;
    const blockedSpan = blockedSpans.find((span) => dateFallsInSpan(isoDate, span)) ?? null;

    days.push({
      day,
      isoDate,
      blockedSpan,
    });
  }

  return days;
}

function formatMonthLabel(year: number, month: number): string {
  const labelDate = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(labelDate);
}

function formatBlockedSpan(span: CalendarBlockedSpanResponse): string {
  const start = span.startDate.slice(5);
  const end = span.endDate.slice(5);
  const statusLabel = span.blockType === "soft_hold" ? "Held" : "Booked";

  return `${start} to ${end} (${statusLabel})`;
}

export default function Availability() {
  const initialCalendarMonth = getCurrentLagosYearMonth();
  const [selectedFlat, setSelectedFlat] = useState<FlatId>("mayfair");
  const [selectedYear, setSelectedYear] = useState(initialCalendarMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(initialCalendarMonth.month);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [blockedSpans, setBlockedSpans] = useState<CalendarBlockedSpanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const monthResult = await fetchCalendarMonthAvailability({
          flatId: selectedFlat,
          year: selectedYear,
          month: selectedMonth,
        });

        if (isCancelled) {
          return;
        }

        setBlockedSpans(monthResult.blockedSpans);
      } catch (error: unknown) {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load availability right now.";
        setBlockedSpans([]);
        setLoadError(message);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [selectedFlat, selectedYear, selectedMonth]);

  const selectedFlatDetails = useMemo(
    () => FLATS.find((flat) => flat.id === selectedFlat) ?? FLATS[0],
    [selectedFlat]
  );

  const monthLabel = useMemo(() => formatMonthLabel(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const monthStartOffset = useMemo(() => getMonthStartWeekday(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const calendarDays = useMemo(
    () => buildCalendarDays(selectedYear, selectedMonth, blockedSpans),
    [selectedYear, selectedMonth, blockedSpans]
  );

  const blockedSummary = useMemo(() => {
    if (blockedSpans.length === 0) {
      return "No blocked stays for this month.";
    }

    return blockedSpans.slice(0, 3).map(formatBlockedSpan).join(" | ");
  }, [blockedSpans]);

  const toggleDate = (day: number, isUnavailable: boolean) => {
    if (isUnavailable) {
      return;
    }

    if (selectedDates.includes(day)) {
      setSelectedDates(selectedDates.filter((selectedDay) => selectedDay !== day));
      return;
    }

    setSelectedDates([...selectedDates, day]);
  };

  const shiftMonth = (delta: number) => {
    const shifted = new Date(Date.UTC(selectedYear, selectedMonth - 1 + delta, 1));
    setSelectedYear(shifted.getUTCFullYear());
    setSelectedMonth(shifted.getUTCMonth() + 1);
    setSelectedDates([]);
  };

  return (
    <main className="container" style={{ paddingTop: "6rem", minHeight: "100vh" }}>
      <PageIntro
        title="Live Availability"
        description="Review blocked and open dates for each residence before continuing to booking."
        backLabel="Back to Home"
        wrapperStyle={{ marginBottom: "3rem" }}
        titleStyle={{ marginTop: "1rem" }}
      />

      <div style={{ background: "var(--bg-panel)", padding: "2rem", borderRadius: "var(--radius-lg)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <h2 className="heading-sm" style={{ margin: 0 }}>{monthLabel}</h2>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-outline" onClick={() => shiftMonth(-1)}>
              Previous
            </button>
            <button type="button" className="btn btn-outline" onClick={() => shiftMonth(1)}>
              Next
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {FLATS.map((flat) => (
            <button
              key={flat.id}
              type="button"
              className={`btn ${selectedFlat === flat.id ? "btn-primary" : "btn-outline"}`}
              onClick={() => {
                setSelectedFlat(flat.id);
                setSelectedDates([]);
              }}
            >
              {flat.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
              }}
            />
            Available
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--primary)",
                opacity: "0.2",
              }}
            />
            Unavailable
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--primary)",
              }}
            />
            Selected
          </span>
        </div>

        {loadError && <div className="booking-inline-note booking-inline-note-muted">{loadError}</div>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1rem",
            textAlign: "center",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {day}
            </div>
          ))}

          {Array.from({ length: monthStartOffset }).map((_, index) => (
            <div key={`offset-${index}`} />
          ))}

          {calendarDays.map((entry) => {
            const isSelected = selectedDates.includes(entry.day);
            const unavailable = entry.blockedSpan !== null;
            const statusLabel = entry.blockedSpan?.blockType === "soft_hold" ? "Held" : "Booked";

            return (
              <button
                key={entry.isoDate}
                onClick={() => toggleDate(entry.day, unavailable)}
                disabled={unavailable}
                style={{
                  aspectRatio: "1",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                  background: isSelected
                    ? "var(--primary)"
                    : unavailable
                      ? "rgba(238, 29, 82, 0.05)"
                      : "transparent",
                  color: isSelected ? "#fff" : unavailable ? "var(--text-secondary)" : "var(--text-primary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  opacity: unavailable ? 0.6 : 1,
                  cursor: unavailable ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {unavailable && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      background:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(238, 29, 82, 0.1) 10px, rgba(238, 29, 82, 0.1) 20px)",
                    }}
                  />
                )}

                <span style={{ fontSize: "1.25rem", fontWeight: "bold", position: "relative", zIndex: 1 }}>{entry.day}</span>

                {!unavailable && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {formatCurrency(selectedFlatDetails.rate)}
                  </span>
                )}

                {unavailable && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--primary)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {statusLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="heading-sm serif">Selected Dates</h3>
            <p className="text-secondary">
              {selectedDates.length > 0 ? `${selectedDates.length} nights selected` : "None selected"}
            </p>
            <p className="text-secondary" style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
              {isLoading ? "Loading unavailable dates..." : blockedSummary}
            </p>
          </div>

          <div style={{ display: "grid", gap: "0.65rem", justifyItems: "end" }}>
            <Link
              href={buildBookingHref(selectedFlat)}
              className="btn btn-primary"
              style={{ opacity: selectedDates.length === 0 ? 0.5 : 1, pointerEvents: selectedDates.length === 0 ? "none" : "auto" }}
            >
              Continue to Booking
            </Link>
            <Link href="/tour" className="booking-support-link" style={{ fontSize: "0.85rem" }}>
              Schedule a Private Tour
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
