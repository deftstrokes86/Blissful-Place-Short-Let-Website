import { getSharedTourSlotService } from "@/server/tour/tour-slot-service-factory";
import { handleCreateTourAppointmentRequest } from "@/server/tour/tour-slot-http";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const service = getSharedTourSlotService();

    const result = await handleCreateTourAppointmentRequest(service, {
      date: pickString(body, "date"),
      time: pickString(body, "time"),
      guestName: pickString(body, "guestName"),
      guestEmail: pickString(body, "guestEmail"),
      guestPhone: pickOptionalString(body, "guestPhone"),
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "tour_appointment_failed");
  }
}
