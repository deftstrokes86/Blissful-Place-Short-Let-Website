import assert from "node:assert/strict";

import type { TourAppointmentRecord } from "../../../types/booking-backend";
import {
  TOUR_SLOT_TIMES,
  TourSlotService,
  type TourSlotRepository,
} from "../tour-slot-service";

class InMemoryTourSlotRepository implements TourSlotRepository {
  private readonly appointments: TourAppointmentRecord[];

  constructor(initial: TourAppointmentRecord[] = []) {
    this.appointments = [...initial];
  }

  async listAppointments(): Promise<TourAppointmentRecord[]> {
    return this.appointments.map((entry) => ({ ...entry }));
  }

  async createAppointment(record: TourAppointmentRecord): Promise<TourAppointmentRecord> {
    this.appointments.push({ ...record });
    return { ...record };
  }
}

function createService(repository: TourSlotRepository, nowIso: string): TourSlotService {
  return new TourSlotService({
    repository,
    now: () => new Date(nowIso),
    createId: () => "tour_appt_1",
  });
}

async function testSlotsMatchRequiredWindow(): Promise<void> {
  assert.deepEqual(TOUR_SLOT_TIMES, [
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
  ]);
}

async function testScheduleMarksBookedSlotsAsUnavailable(): Promise<void> {
  const repository = new InMemoryTourSlotRepository([
    {
      id: "tour_appt_existing",
      date: "2026-03-25",
      time: "11:30",
      guestName: "Existing Guest",
      guestEmail: "existing@example.com",
      guestPhone: null,
      status: "booked",
      createdAt: "2026-03-24T10:00:00.000Z",
      updatedAt: "2026-03-24T10:00:00.000Z",
    },
  ]);

  const service = createService(repository, "2026-03-25T06:00:00.000Z");
  const schedule = await service.listScheduleWindow({
    startDate: "2026-03-25",
    days: 1,
  });

  assert.equal(schedule.timezone, "Africa/Lagos");
  assert.equal(schedule.dates.length, 1);
  assert.equal(schedule.dates[0]?.slots.length, TOUR_SLOT_TIMES.length);
  assert.deepEqual(
    schedule.dates[0]?.slots.map((slot) => slot.time),
    Array.from(TOUR_SLOT_TIMES)
  );

  const blocked = schedule.dates[0]?.slots.find((slot) => slot.time === "11:30");
  assert.equal(blocked?.available, false);
  assert.equal(blocked?.reason, "booked");
}

async function testCannotBookAlreadyBookedSlot(): Promise<void> {
  const repository = new InMemoryTourSlotRepository();
  const service = createService(repository, "2026-03-25T06:00:00.000Z");

  await service.bookSlot({
    date: "2026-03-25",
    time: "14:00",
    guestName: "First Guest",
    guestEmail: "first@example.com",
    guestPhone: null,
  });

  await assert.rejects(
    async () => {
      await service.bookSlot({
        date: "2026-03-25",
        time: "14:00",
        guestName: "Second Guest",
        guestEmail: "second@example.com",
        guestPhone: null,
      });
    },
    /already booked/i
  );
}

async function testScheduleMarksPastSlotsAsUnavailable(): Promise<void> {
  const repository = new InMemoryTourSlotRepository();
  const service = createService(repository, "2026-03-25T12:45:00.000Z");

  const schedule = await service.listScheduleWindow({
    startDate: "2026-03-25",
    days: 1,
  });

  const past = schedule.dates[0]?.slots.find((slot) => slot.time === "13:30");
  const future = schedule.dates[0]?.slots.find((slot) => slot.time === "14:00");

  assert.equal(past?.available, false);
  assert.equal(past?.reason, "past");
  assert.equal(future?.available, true);
  assert.equal(future?.reason, null);
}

async function testCannotBookPastSlot(): Promise<void> {
  const repository = new InMemoryTourSlotRepository();
  const service = createService(repository, "2026-03-25T12:45:00.000Z");

  await assert.rejects(
    async () => {
      await service.bookSlot({
        date: "2026-03-25",
        time: "13:30",
        guestName: "Past Guest",
        guestEmail: "past@example.com",
        guestPhone: null,
      });
    },
    /past/i
  );
}

async function run(): Promise<void> {
  await testSlotsMatchRequiredWindow();
  await testScheduleMarksBookedSlotsAsUnavailable();
  await testCannotBookAlreadyBookedSlot();
  await testScheduleMarksPastSlotsAsUnavailable();
  await testCannotBookPastSlot();

  console.log("tour-slot-service: ok");
}

void run();
