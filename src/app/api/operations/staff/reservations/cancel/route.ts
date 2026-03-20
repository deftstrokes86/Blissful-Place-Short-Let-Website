import {
  handleCancelReservationRequest,
} from "@/server/booking/staff-operations-http";
import { getSharedStaffOperationsService } from "@/server/booking/staff-operations-service-factory";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const service = getSharedStaffOperationsService();

    const result = await handleCancelReservationRequest(service, {
      token: pickString(body, "token"),
      idempotencyKey: pickIdempotencyKey(request, body),
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "staff_reservation_cancel_failed");
  }
}
