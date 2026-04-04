import { getSharedLegacyGuestReservationService } from "@/server/booking/legacy-guest-reservation-service-factory";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const token = pickString(body, "token");

    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const reservationService = getSharedLegacyGuestReservationService();
    const reservation = await reservationService.cancelReservation({ token, actor: "guest" });
    return jsonSuccess({ reservation });
  } catch (error) {
    return jsonErrorFromUnknown(error, "cancel_reservation_failed");
  }
}
