"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageIntro } from "@/components/common/PageIntro";
import {
  buildAvailabilityCalendarDays,
  canNavigateToPreviousMonth,
  filterSelectableCalendarDays,
  formatBlockedSpan,
  formatMonthLabel,
  getCurrentLagosIsoDate,
  getCurrentLagosYearMonth,
  getMonthStartWeekday,
  shiftYearMonth,
  type AvailabilityDayStatus,
} from "@/lib/availability-calendar";
import { formatCurrency } from "@/lib/booking-utils";
import { fetchCalendarMonthAvailability, type CalendarBlockedSpanResponse } from "@/lib/booking-frontend-api";
import { buildBookingHref } from "@/lib/booking-flat-preselection";
import { FLATS } from "@/lib/constants";
import type { FlatId } from "@/types/booking";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type TransitionMode = "idle" | "next" | "previous" | "flat";

const DAY_STATUS_CLASS: Record<AvailabilityDayStatus, string> = {
  available: "is-available",
  blocked: "is-blocked",
  past: "is-past",
};

function formatSelectedDateList(year: number, month: number, selectedDates: readonly number[]): string {
  if (selectedDates.length === 0) {
    return "No dates selected yet.";
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Lagos",
  });

  return [...selectedDates]
    .sort((left, right) => left - right)
    .map((day) => dayFormatter.format(new Date(Date.UTC(year, month - 1, day))))
    .join(" • ");
}

export default function Availability() {
  const initialCalendarMonth = useMemo(() => getCurrentLagosYearMonth(), []);
  const todayIso = useMemo(() => getCurrentLagosIsoDate(), []);

  const [selectedFlat, setSelectedFlat] = useState<FlatId>("mayfair");
  const [selectedYear, setSelectedYear] = useState(initialCalendarMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(initialCalendarMonth.month);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [blockedSpans, setBlockedSpans] = useState<CalendarBlockedSpanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transitionMode, setTransitionMode] = useState<TransitionMode>("idle");
  const [calendarTransitionKey, setCalendarTransitionKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBlockedSpans([]);

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

  useEffect(() => {
    if (transitionMode === "idle") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTransitionMode("idle");
    }, 420);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [transitionMode]);

  const selectedFlatDetails = useMemo(
    () => FLATS.find((flat) => flat.id === selectedFlat) ?? FLATS[0],
    [selectedFlat]
  );

  const monthLabel = useMemo(() => formatMonthLabel(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const monthStartOffset = useMemo(() => getMonthStartWeekday(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const calendarDays = useMemo(
    () =>
      buildAvailabilityCalendarDays({
        year: selectedYear,
        month: selectedMonth,
        blockedSpans,
        todayIso,
      }),
    [selectedYear, selectedMonth, blockedSpans, todayIso]
  );

  useEffect(() => {
    // If fresh availability changes invalidate selected days, drop them so CTA/state stay truthful.
    setSelectedDates((existing) => {
      const sanitized = filterSelectableCalendarDays(existing, calendarDays);

      if (
        sanitized.length === existing.length &&
        sanitized.every((day, index) => day === existing[index])
      ) {
        return existing;
      }

      return sanitized;
    });
  }, [calendarDays]);

  const blockedSummary = useMemo(() => {
    if (blockedSpans.length === 0) {
      return "No blocked stays for this month.";
    }

    return blockedSpans.slice(0, 3).map(formatBlockedSpan).join(" | ");
  }, [blockedSpans]);

  const selectedDateList = useMemo(
    () => formatSelectedDateList(selectedYear, selectedMonth, selectedDates),
    [selectedYear, selectedMonth, selectedDates]
  );

  const previousMonthAllowed = useMemo(
    () =>
      canNavigateToPreviousMonth({
        selectedYear,
        selectedMonth,
        minimumYear: initialCalendarMonth.year,
        minimumMonth: initialCalendarMonth.month,
      }),
    [selectedYear, selectedMonth, initialCalendarMonth.month, initialCalendarMonth.year]
  );

  const selectionAnimationKey = `${selectedFlat}-${selectedYear}-${selectedMonth}-${selectedDates
    .slice()
    .sort((left, right) => left - right)
    .join("-")}`;

  const continueToBookingEnabled = selectedDates.length > 0;

  const triggerCalendarTransition = (mode: TransitionMode) => {
    setTransitionMode(mode);
    setCalendarTransitionKey((value) => value + 1);
  };

  const handleShiftMonth = (delta: number) => {
    if (delta < 0 && !previousMonthAllowed) {
      return;
    }

    triggerCalendarTransition(delta > 0 ? "next" : "previous");

    const shiftedMonth = shiftYearMonth({
      year: selectedYear,
      month: selectedMonth,
      delta,
    });

    setSelectedYear(shiftedMonth.year);
    setSelectedMonth(shiftedMonth.month);
    setSelectedDates([]);
  };

  const handleFlatSelect = (flatId: FlatId) => {
    if (flatId === selectedFlat) {
      return;
    }

    triggerCalendarTransition("flat");
    setSelectedFlat(flatId);
    setSelectedDates([]);
  };

  const handleDateToggle = (day: number, isSelectable: boolean) => {
    if (!isSelectable) {
      return;
    }

    setSelectedDates((existing) => {
      if (existing.includes(day)) {
        return existing.filter((selectedDay) => selectedDay !== day);
      }

      return [...existing, day];
    });
  };

  return (
    <main className="container availability-page">
      <PageIntro
        title="Live Availability"
        description="Review open and blocked dates for each residence, then continue to booking with confidence."
        backLabel="Back to Home"
        wrapperStyle={{ marginBottom: "2rem" }}
        titleStyle={{ marginTop: "1rem" }}
      />

      <section className="availability-shell">
        <div className="availability-topbar">
          <div className="availability-title-block">
            <h2 className="heading-sm">{monthLabel}</h2>
            <p className="text-secondary">{selectedFlatDetails.name} availability calendar</p>
          </div>

          <div className="availability-month-controls" role="group" aria-label="Change month">
            <button
              type="button"
              className="btn btn-outline-white availability-month-button"
              onClick={() => handleShiftMonth(-1)}
              disabled={!previousMonthAllowed}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-white availability-month-button"
              onClick={() => handleShiftMonth(1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="availability-flat-tabs" role="tablist" aria-label="Select residence">
          {FLATS.map((flat) => {
            const isActive = selectedFlat === flat.id;

            return (
              <button
                key={flat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`availability-flat-tab${isActive ? " is-active" : ""}`}
                onClick={() => handleFlatSelect(flat.id)}
              >
                <span>{flat.name}</span>
                <span className="availability-flat-rate">{formatCurrency(flat.rate)} / night</span>
              </button>
            );
          })}
        </div>

        <div className="availability-legend" aria-label="Calendar legend">
          <span className="availability-legend-item is-available">
            <i className="availability-dot availability-dot-available" aria-hidden="true" />
            <span>
              Available
              <small>Future date</small>
            </span>
          </span>
          <span className="availability-legend-item is-blocked">
            <i className="availability-dot availability-dot-blocked" aria-hidden="true" />
            <span>
              Unavailable
              <small>Booked or held</small>
            </span>
          </span>
          <span className="availability-legend-item is-past">
            <i className="availability-dot availability-dot-past" aria-hidden="true" />
            <span>
              Past
              <small>Disabled date</small>
            </span>
          </span>
          <span className="availability-legend-item is-selected">
            <i className="availability-dot availability-dot-selected" aria-hidden="true" />
            <span>
              Selected
              <small>Added to stay</small>
            </span>
          </span>
        </div>

        {loadError ? <div className="booking-inline-note booking-inline-note-muted">{loadError}</div> : null}

        <div className="availability-main-layout">
          <div className="availability-calendar-card">
            <div
              className={`availability-calendar-surface transition-${transitionMode}`}
              key={`${selectedFlat}-${selectedYear}-${selectedMonth}-${calendarTransitionKey}`}
            >
              <div className="availability-weekday-row">
                {DAYS_OF_WEEK.map((dayName) => (
                  <span key={dayName}>{dayName}</span>
                ))}
              </div>

              <div className={`availability-day-grid${isLoading ? " is-loading" : ""}`}>
                {Array.from({ length: monthStartOffset }).map((_, index) => (
                  <div key={`offset-${index}`} className="availability-day-offset" aria-hidden="true" />
                ))}

                {calendarDays.map((entry) => {
                  const isSelected = selectedDates.includes(entry.day);
                  const className = `availability-day-tile ${DAY_STATUS_CLASS[entry.status]}${isSelected ? " is-selected" : ""}${entry.isSelectable ? " is-selectable" : ""}`;

                  return (
                    <button
                      key={entry.isoDate}
                      type="button"
                      className={className}
                      onClick={() => handleDateToggle(entry.day, entry.isSelectable)}
                      disabled={!entry.isSelectable}
                      aria-label={`${entry.isoDate} ${entry.statusLabel}`}
                    >
                      <span className="availability-day-number">{entry.day}</span>
                      <span className="availability-day-status">
                        {entry.status === "available" ? formatCurrency(selectedFlatDetails.rate) : entry.statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="availability-summary-card" aria-live="polite">
            <h3 className="heading-sm serif">Selected Stay Snapshot</h3>

            <div key={selectionAnimationKey} className="availability-summary-values">
              <p>
                <strong>Residence:</strong> {selectedFlatDetails.name}
              </p>
              <p>
                <strong>Dates:</strong> {selectedDateList}
              </p>
              <p>
                <strong>Nights Selected:</strong> {selectedDates.length}
              </p>
            </div>

            <p className="availability-summary-note">
              {isLoading ? "Refreshing blocked dates..." : blockedSummary}
            </p>

            <div className="availability-summary-actions">
              <Link
                href={buildBookingHref(selectedFlat)}
                className={`btn btn-primary availability-continue-btn${continueToBookingEnabled ? " is-ready" : " is-disabled"}`}
                aria-disabled={!continueToBookingEnabled}
                tabIndex={continueToBookingEnabled ? 0 : -1}
                onClick={(event) => {
                  if (!continueToBookingEnabled) {
                    event.preventDefault();
                  }
                }}
              >
                Continue to Booking
              </Link>

              <Link href="/tour" className="booking-support-link availability-tour-link">
                Schedule a Private Tour
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

