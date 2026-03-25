interface ApiErrorShape {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

interface ApiSuccessShape<T> {
  ok: true;
  data: T;
}

type ApiResponseShape<T> = ApiErrorShape | ApiSuccessShape<T>;

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

export interface TourScheduleResponse {
  timezone: "Africa/Lagos";
  generatedAt: string;
  startDate: string;
  days: number;
  dates: TourScheduleDateSnapshot[];
}

export interface TourAppointmentResponse {
  id: string;
  date: string;
  time: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  status: "booked" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponseShape<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponseShape<T>;
  } catch {
    throw new Error("Request failed. Please try again.");
  }

  if (!payload) {
    throw new Error("Request failed. Please try again.");
  }

  if (!response.ok || !payload.ok) {
    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload.data;
}

export async function fetchTourSchedule(input?: {
  startDate?: string;
  days?: number;
}): Promise<TourScheduleResponse> {
  const params = new URLSearchParams();

  if (input?.startDate) {
    params.set("startDate", input.startDate);
  }

  if (typeof input?.days === "number") {
    params.set("days", String(input.days));
  }

  const query = params.toString();
  const url = query.length > 0 ? `/api/tour/schedule?${query}` : "/api/tour/schedule";

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await readJsonResponse<{ schedule: TourScheduleResponse }>(response);
  return payload.schedule;
}

export async function submitTourAppointment(input: {
  date: string;
  time: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
}): Promise<TourAppointmentResponse> {
  const response = await fetch("/api/tour/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: input.date,
      time: input.time,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone ?? null,
    }),
  });

  const payload = await readJsonResponse<{ appointment: TourAppointmentResponse }>(response);
  return payload.appointment;
}
