import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import {
  TourSchedulerView,
  type TourScheduleDateSnapshot,
} from "../../../components/tour/TourSchedulerView";

function createDates(): TourScheduleDateSnapshot[] {
  return [
    {
      date: "2026-03-25",
      weekdayLabel: "Wed",
      dateLabel: "Mar 25",
      availableSlots: 2,
      slots: [
        { time: "11:00", available: false, reason: "booked" },
        { time: "11:30", available: true, reason: null },
        { time: "12:00", available: true, reason: null },
        { time: "12:30", available: false, reason: "past" },
      ],
    },
  ];
}

function renderView(input: {
  dates: TourScheduleDateSnapshot[];
  selectedDate: string | null;
  selectedTime: string | null;
  isTimePanelOpen: boolean;
}): string {
  const selectedDateEntry =
    input.selectedDate && input.dates.length > 0
      ? input.dates.find((entry) => entry.date === input.selectedDate) ?? null
      : null;

  return renderToStaticMarkup(
    TourSchedulerView({
      visibleYear: 2026,
      visibleMonth: 3,
      dates: input.dates,
      selectedDate: input.selectedDate,
      selectedTime: input.selectedTime,
      selectedDateEntry,
      isTimePanelOpen: input.isTimePanelOpen,
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "",
      isLoading: false,
      isSubmitting: false,
      notice: null,
      onPrevMonth: () => undefined,
      onNextMonth: () => undefined,
      onSelectDate: () => undefined,
      onSelectTime: () => undefined,
      onOpenTimePanel: () => undefined,
      onGuestNameChange: () => undefined,
      onGuestEmailChange: () => undefined,
      onGuestPhoneChange: () => undefined,
      onConfirm: async () => undefined,
    })
  );
}

async function testTourViewRendersCalendarAndOpenTimeDrawer(): Promise<void> {
  const html = renderView({
    dates: createDates(),
    selectedDate: "2026-03-25",
    selectedTime: null,
    isTimePanelOpen: true,
  });

  assert.ok(html.includes('aria-label="tour-date-calendar"'));
  assert.ok(html.includes("March 2026"));
  assert.ok(html.includes("tour-time-drawer is-open"));
  assert.ok(html.includes("11:30 AM"));
  assert.ok(html.includes("Step 1"));
  assert.ok(html.includes("Step 2"));
  assert.ok(html.includes("Step 3"));
  assert.ok(html.includes("Step 4"));
  assert.ok(html.includes("Choose Date"));
  assert.ok(html.includes("Choose Time"));
  assert.ok(html.includes("Enter Details"));
  assert.ok(html.includes("Confirm Tour"));
  assert.ok(html.includes("Private Tour"));
}

async function testTourViewShowsSelectedTimeAndCollapsedDrawer(): Promise<void> {
  const html = renderView({
    dates: createDates(),
    selectedDate: "2026-03-25",
    selectedTime: "11:30",
    isTimePanelOpen: false,
  });

  assert.ok(html.includes("Selected Time"));
  assert.ok(html.includes("11:30 AM"));
  assert.ok(html.includes("Change Time"));
  assert.equal(html.includes("tour-time-drawer is-open"), false);
  assert.ok(html.includes("Confirm Tour Appointment"));
}

async function testTourViewShowsEmptyCalendarState(): Promise<void> {
  const html = renderToStaticMarkup(
    TourSchedulerView({
      visibleYear: 2026,
      visibleMonth: 3,
      dates: [],
      selectedDate: null,
      selectedTime: null,
      selectedDateEntry: null,
      isTimePanelOpen: false,
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: "",
      isLoading: false,
      isSubmitting: false,
      notice: null,
      onPrevMonth: () => undefined,
      onNextMonth: () => undefined,
      onSelectDate: () => undefined,
      onSelectTime: () => undefined,
      onOpenTimePanel: () => undefined,
      onGuestNameChange: () => undefined,
      onGuestEmailChange: () => undefined,
      onGuestPhoneChange: () => undefined,
      onConfirm: async () => undefined,
    })
  );

  assert.ok(html.includes("No selectable dates in this month yet."));
}

async function run(): Promise<void> {
  await testTourViewRendersCalendarAndOpenTimeDrawer();
  await testTourViewShowsSelectedTimeAndCollapsedDrawer();
  await testTourViewShowsEmptyCalendarState();

  console.log("tour-ui: ok");
}

void run();
