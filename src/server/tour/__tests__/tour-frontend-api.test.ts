import assert from "node:assert/strict";

import {
  fetchTourSchedule,
  submitTourAppointment,
  type TourScheduleResponse,
} from "../../../lib/tour-frontend-api";

function createSuccessResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

async function testFetchTourScheduleRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  const payload: TourScheduleResponse = {
    timezone: "Africa/Lagos",
    generatedAt: "2026-03-25T09:00:00.000Z",
    startDate: "2026-03-25",
    days: 14,
    dates: [
      {
        date: "2026-03-25",
        weekdayLabel: "Wed",
        dateLabel: "Mar 25",
        availableSlots: 1,
        slots: [{ time: "11:30", available: true, reason: null }],
      },
    ],
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);
    return createSuccessResponse({ schedule: payload });
  }) as typeof fetch;

  try {
    const schedule = await fetchTourSchedule({
      startDate: "2026-03-25",
      days: 14,
    });

    assert.equal(capturedUrl, "/api/tour/schedule?startDate=2026-03-25&days=14");
    assert.equal(schedule.days, 14);
    assert.equal(schedule.dates[0]?.slots[0]?.time, "11:30");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSubmitTourAppointmentRequestShape(): Promise<void> {
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;
    return createSuccessResponse({
      appointment: {
        id: "tour_appt_1",
        date: "2026-03-25",
        time: "11:30",
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: null,
        status: "booked",
        createdAt: "2026-03-25T09:00:00.000Z",
        updatedAt: "2026-03-25T09:00:00.000Z",
      },
    });
  }) as typeof fetch;

  try {
    await submitTourAppointment({
      date: "2026-03-25",
      time: "11:30",
      guestName: "Guest",
      guestEmail: "guest@example.com",
      guestPhone: null,
    });

    assert.equal(capturedInit?.method, "POST");
    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.date, "2026-03-25");
    assert.equal(body.time, "11:30");
    assert.equal(body.guestEmail, "guest@example.com");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(): Promise<void> {
  await testFetchTourScheduleRequestShape();
  await testSubmitTourAppointmentRequestShape();

  console.log("tour-frontend-api: ok");
}

void run();
