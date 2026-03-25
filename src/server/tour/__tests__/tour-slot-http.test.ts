import assert from "node:assert/strict";

import {
  handleCreateTourAppointmentRequest,
  handleGetTourScheduleRequest,
} from "../tour-slot-http";
import type { TourSlotService } from "../tour-slot-service";

class StubTourSlotService implements Pick<TourSlotService, "listScheduleWindow" | "bookSlot"> {
  async listScheduleWindow(input: { startDate?: string | null; days: number }) {
    return {
      timezone: "Africa/Lagos" as const,
      generatedAt: "2026-03-25T09:00:00.000Z",
      startDate: input.startDate ?? "2026-03-25",
      days: input.days,
      dates: [
        {
          date: "2026-03-25",
          weekdayLabel: "Wed",
          dateLabel: "Mar 25",
          availableSlots: 1,
          slots: [
            {
              time: "11:30",
              available: true,
              reason: null,
            },
          ],
        },
      ],
    };
  }

  async bookSlot(input: {
    date: string;
    time: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string | null;
  }) {
    return {
      id: "tour_appt_1",
      date: input.date,
      time: input.time,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone ?? null,
      status: "booked" as const,
      createdAt: "2026-03-25T09:00:00.000Z",
      updatedAt: "2026-03-25T09:00:00.000Z",
    };
  }
}

async function testGetScheduleValidatesDays(): Promise<void> {
  const service = new StubTourSlotService();

  await assert.rejects(
    async () => {
      await handleGetTourScheduleRequest(service as unknown as TourSlotService, {
        startDate: "2026-03-25",
        days: "0",
      });
    },
    /days/i
  );

  const result = await handleGetTourScheduleRequest(service as unknown as TourSlotService, {
    startDate: "2026-03-25",
    days: "7",
  });

  assert.equal(result.schedule.days, 7);
  assert.equal(result.schedule.startDate, "2026-03-25");
  assert.equal(result.schedule.dates[0]?.slots[0]?.time, "11:30");
}

async function testCreateAppointmentValidatesRequiredFields(): Promise<void> {
  const service = new StubTourSlotService();

  await assert.rejects(
    async () => {
      await handleCreateTourAppointmentRequest(service as unknown as TourSlotService, {
        date: null,
        time: "11:30",
        guestName: "Guest",
        guestEmail: "guest@example.com",
        guestPhone: null,
      });
    },
    /required/i
  );

  const result = await handleCreateTourAppointmentRequest(service as unknown as TourSlotService, {
    date: "2026-03-25",
    time: "11:30",
    guestName: "Guest",
    guestEmail: "guest@example.com",
    guestPhone: null,
  });

  assert.equal(result.appointment.id, "tour_appt_1");
  assert.equal(result.appointment.guestEmail, "guest@example.com");
  assert.equal(result.appointment.time, "11:30");
}

async function run(): Promise<void> {
  await testGetScheduleValidatesDays();
  await testCreateAppointmentValidatesRequiredFields();

  console.log("tour-slot-http: ok");
}

void run();
