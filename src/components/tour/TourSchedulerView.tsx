import Link from "next/link";

export interface TourSlotSnapshot {
  time: string;
  available: boolean;
  reason: "booked" | "past" | null;
}

export interface TourScheduleDateSnapshot {
  date: string;
  weekdayLabel: string;
  dateLabel: string;
  availableSlots: number;
  slots: TourSlotSnapshot[];
}

interface TourCalendarCell {
  key: string;
  date: string | null;
  dayNumber: number | null;
  availableSlots: number;
  isSelected: boolean;
  isUnavailable: boolean;
}

interface TourSchedulerViewProps {
  visibleYear: number;
  visibleMonth: number;
  dates: TourScheduleDateSnapshot[] | null | undefined;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedDateEntry: TourScheduleDateSnapshot | null | undefined;
  isTimePanelOpen: boolean;
  guestName: string | null | undefined;
  guestEmail: string | null | undefined;
  guestPhone: string | null | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  notice: {
    tone: "ok" | "error";
    message: string;
  } | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onOpenTimePanel: () => void;
  onGuestNameChange: (value: string) => void;
  onGuestEmailChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onConfirm: () => Promise<void>;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthStartWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatTimeLabel(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function toReasonLabel(reason: TourSlotSnapshot["reason"]): string | null {
  if (reason === "booked") {
    return "Booked";
  }

  if (reason === "past") {
    return "Past";
  }

  return null;
}

function buildCalendarCells(input: {
  year: number;
  month: number;
  dates: TourScheduleDateSnapshot[];
  selectedDate: string | null;
}): TourCalendarCell[] {
  const daysInMonth = getDaysInMonth(input.year, input.month);
  const offset = getMonthStartWeekday(input.year, input.month);

  const dateMap = new Map(input.dates.map((entry) => [entry.date, entry]));
  const cells: TourCalendarCell[] = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push({
      key: `offset-${index}`,
      date: null,
      dayNumber: null,
      availableSlots: 0,
      isSelected: false,
      isUnavailable: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = formatIsoDate(input.year, input.month, day);
    const entry = dateMap.get(date) ?? null;
    const availableSlots = entry?.availableSlots ?? 0;

    cells.push({
      key: date,
      date,
      dayNumber: day,
      availableSlots,
      isSelected: input.selectedDate === date,
      isUnavailable: availableSlots <= 0,
    });
  }

  const remainder = cells.length % 7;
  if (remainder > 0) {
    const trailing = 7 - remainder;

    for (let index = 0; index < trailing; index += 1) {
      cells.push({
        key: `trailing-${index}`,
        date: null,
        dayNumber: null,
        availableSlots: 0,
        isSelected: false,
        isUnavailable: true,
      });
    }
  }

  return cells;
}

function getStepClassName(input: { complete: boolean; active: boolean }): string {
  let className = "tour-step-chip";

  if (input.complete) {
    className += " is-complete";
  } else if (input.active) {
    className += " is-active";
  }

  return className;
}

export function TourSchedulerView({
  visibleYear,
  visibleMonth,
  dates,
  selectedDate,
  selectedTime,
  selectedDateEntry,
  isTimePanelOpen,
  guestName,
  guestEmail,
  guestPhone,
  isLoading,
  isSubmitting,
  notice,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectTime,
  onOpenTimePanel,
  onGuestNameChange,
  onGuestEmailChange,
  onGuestPhoneChange,
  onConfirm,
}: TourSchedulerViewProps) {
  const safeDates = Array.isArray(dates) ? dates : [];
  const safeSelectedDateEntry = selectedDateEntry
    ? {
        ...selectedDateEntry,
        slots: Array.isArray(selectedDateEntry.slots) ? selectedDateEntry.slots : [],
      }
    : null;
  const safeGuestName = guestName ?? "";
  const safeGuestEmail = guestEmail ?? "";
  const safeGuestPhone = guestPhone ?? "";

  const calendarCells = buildCalendarCells({
    year: visibleYear,
    month: visibleMonth,
    dates: safeDates,
    selectedDate,
  });

  const monthLabel = formatMonthLabel(visibleYear, visibleMonth);
  const availableTimeSlots = safeSelectedDateEntry?.slots.filter((slot) => slot.available) ?? [];
  const hasSelectableDates = safeDates.some((entry) => entry.availableSlots > 0);
  const selectedDateLabel = safeSelectedDateEntry
    ? `${safeSelectedDateEntry.weekdayLabel}, ${safeSelectedDateEntry.dateLabel}`
    : "Not selected";
  const selectedTimeLabel = selectedTime ? formatTimeLabel(selectedTime) : "Not selected";

  const detailsComplete = safeGuestName.trim().length > 0 && safeGuestEmail.trim().length > 0;
  const canConfirm =
    Boolean(selectedDate && selectedTime) && detailsComplete && !isLoading && !isSubmitting;

  const steps = [
    {
      key: "step-1",
      number: "Step 1",
      label: "Choose Date",
      complete: Boolean(selectedDate),
      active: !selectedDate,
    },
    {
      key: "step-2",
      number: "Step 2",
      label: "Choose Time",
      complete: Boolean(selectedTime),
      active: Boolean(selectedDate) && !selectedTime,
    },
    {
      key: "step-3",
      number: "Step 3",
      label: "Enter Details",
      complete: detailsComplete,
      active: Boolean(selectedDate && selectedTime) && !detailsComplete,
    },
    {
      key: "step-4",
      number: "Step 4",
      label: "Confirm Tour",
      complete: false,
      active: canConfirm,
    },
  ];

  return (
    <section className="tour-flow-shell" aria-labelledby="tour-scheduler-heading">
      <div className="tour-flow-header">
        <div>
          <h2
            id="tour-scheduler-heading"
            className="heading-sm serif"
            style={{ marginBottom: "0.45rem" }}
          >
            Schedule a Private Tour
          </h2>
          <p className="text-secondary tour-flow-subtitle">
            Choose your date on the calendar, pick a time between 11:00 AM and 3:00 PM, then
            confirm in one smooth flow.
          </p>
        </div>
        <span className="tour-live-pill">Live Slots</span>
      </div>

      <ol className="tour-step-strip" aria-label="tour booking steps">
        {steps.map((step) => (
          <li key={step.key} className={getStepClassName({ complete: step.complete, active: step.active })}>
            <span className="tour-step-chip-number">{step.number}</span>
            <span className="tour-step-chip-label">{step.label}</span>
          </li>
        ))}
      </ol>

      {notice ? (
        <div
          className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="tour-flow-layout">
        <article className="tour-step-card" aria-labelledby="tour-calendar-heading">
          <div className="tour-step-head">
            <p className="tour-step-kicker">Step 1 &amp; Step 2</p>
            <h3 id="tour-calendar-heading" className="tour-step-title">
              Calendar and Time Selection
            </h3>
            <p className="tour-step-copy text-secondary">
              Select a date in the calendar. Time options slide in from the left and slide back out
              once selected.
            </p>
          </div>

          <div className="tour-calendar-toolbar">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onPrevMonth}
              disabled={isLoading || isSubmitting}
            >
              Previous
            </button>
            <p className="tour-calendar-month">{monthLabel}</p>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={onNextMonth}
              disabled={isLoading || isSubmitting}
            >
              Next
            </button>
          </div>

          <div className={`tour-interaction-stage ${isTimePanelOpen ? "show-time" : ""}`}>
            <div className="tour-calendar-surface" aria-label="tour-date-calendar">
              <div className="tour-calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="tour-calendar-grid">
                {calendarCells.map((cell) => {
                  const dayDate = cell.date;

                  if (!dayDate || cell.dayNumber === null) {
                    return <div key={cell.key} className="tour-calendar-empty" aria-hidden="true" />;
                  }

                  const className = `tour-calendar-day${cell.isSelected ? " is-selected" : ""}${
                    cell.isUnavailable ? " is-unavailable" : ""
                  }`;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={className}
                      disabled={cell.isUnavailable || isLoading || isSubmitting}
                      onClick={() => onSelectDate(dayDate)}
                    >
                      <span className="tour-calendar-day-number">{cell.dayNumber}</span>
                      <span className="tour-calendar-day-meta">
                        {cell.isUnavailable ? "Unavailable" : `${cell.availableSlots} open`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!isLoading && !hasSelectableDates ? (
                <p className="tour-calendar-empty-note text-secondary">
                  No selectable dates in this month yet.
                </p>
              ) : null}
            </div>

            <div className={`tour-time-drawer ${isTimePanelOpen ? "is-open" : ""}`} aria-label="tour-time-panel">
              <div className="tour-time-drawer-header">
                <p className="tour-step-kicker" style={{ marginBottom: "0.15rem" }}>
                  Step 2
                </p>
                <h4 className="tour-time-drawer-title">Choose Time</h4>
                <p className="text-secondary" style={{ fontSize: "0.86rem" }}>
                  {selectedDateLabel}
                </p>
              </div>

              {availableTimeSlots.length === 0 ? (
                <p className="text-secondary">No available times for this date.</p>
              ) : (
                <div className="tour-time-grid" aria-label="tour-time-options">
                  {availableTimeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    const reasonLabel = toReasonLabel(slot.reason);

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        className={`tour-time-option ${isSelected ? "is-selected" : ""}`}
                        disabled={isSubmitting}
                        onClick={() => onSelectTime(slot.time)}
                      >
                        <span>{formatTimeLabel(slot.time)}</span>
                        {reasonLabel ? <span className="tour-time-reason">{reasonLabel}</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tour-selection-row">
            <div className="tour-selection-chip">
              <span className="tour-summary-label">Selected Date</span>
              <span className="tour-summary-value">{selectedDateLabel}</span>
            </div>
            <div className="tour-selection-chip">
              <span className="tour-summary-label">Selected Time</span>
              <span className="tour-summary-value">{selectedTimeLabel}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={!safeSelectedDateEntry || isSubmitting}
              onClick={onOpenTimePanel}
            >
              {selectedTime ? "Change Time" : "Choose Time"}
            </button>
          </div>
        </article>

        <aside className="tour-right-column">
          <section className="tour-summary-card" aria-labelledby="tour-step-4-heading">
            <div className="tour-step-head" style={{ marginBottom: "0.75rem" }}>
              <p className="tour-step-kicker">Step 4</p>
              <h3 id="tour-step-4-heading" className="tour-step-title">
                Confirm Tour
              </h3>
            </div>

            <div className="tour-summary-grid">
              <div className="tour-summary-row">
                <span className="tour-summary-label">Selected Date</span>
                <span className="tour-summary-value">{selectedDateLabel}</span>
              </div>
              <div className="tour-summary-row">
                <span className="tour-summary-label">Selected Time</span>
                <span className="tour-summary-value">{selectedTimeLabel}</span>
              </div>
              <div className="tour-summary-row">
                <span className="tour-summary-label">Appointment Type</span>
                <span className="tour-summary-value">Private Tour</span>
              </div>
            </div>

            <p className="tour-summary-note">
              We reserve your chosen date and time immediately once you confirm, so your slot stays
              yours.
            </p>
          </section>

          <section className="tour-step-card" aria-labelledby="tour-details-heading">
            <div className="tour-step-head">
              <p className="tour-step-kicker">Step 3</p>
              <h3 id="tour-details-heading" className="tour-step-title">
                Enter Details
              </h3>
              <p className="tour-step-copy text-secondary">
                Add your contact details for confirmation and concierge follow-up.
              </p>
            </div>

            <div className="tour-form-grid">
              <label className="tour-field" htmlFor="tour-guest-name">
                <span className="tour-field-label">Full Name</span>
                <input
                  id="tour-guest-name"
                  className="standard-input"
                  value={safeGuestName}
                  onChange={(event) => onGuestNameChange(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Your full name"
                />
              </label>

              <label className="tour-field" htmlFor="tour-guest-email">
                <span className="tour-field-label">Email</span>
                <input
                  id="tour-guest-email"
                  className="standard-input"
                  type="email"
                  value={safeGuestEmail}
                  onChange={(event) => onGuestEmailChange(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                />
              </label>

              <label className="tour-field tour-field-full" htmlFor="tour-guest-phone">
                <span className="tour-field-label">Phone (optional)</span>
                <input
                  id="tour-guest-phone"
                  className="standard-input"
                  value={safeGuestPhone}
                  onChange={(event) => onGuestPhoneChange(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="+234..."
                />
              </label>
            </div>

            <div className="tour-details-actions">
              <button
                type="button"
                className="btn btn-primary btn-full"
                disabled={!canConfirm}
                onClick={() => {
                  void onConfirm();
                }}
              >
                {isSubmitting ? "Confirming..." : "Confirm Tour Appointment"}
              </button>

              <Link href="/availability" className="tour-secondary-link">
                Check Accommodation Availability
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
