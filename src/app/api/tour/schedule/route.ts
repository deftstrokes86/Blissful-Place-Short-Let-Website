import { getSharedTourSlotService } from "@/server/tour/tour-slot-service-factory";
import { handleGetTourScheduleRequest } from "@/server/tour/tour-slot-http";
import { jsonErrorFromUnknown, jsonSuccess } from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const service = getSharedTourSlotService();

    const result = await handleGetTourScheduleRequest(service, {
      startDate: url.searchParams.get("startDate"),
      days: url.searchParams.get("days"),
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "tour_schedule_failed");
  }
}
