import { getSharedLegacyGuestReservationService } from "@/server/booking/legacy-guest-reservation-service-factory";
import { parseDraftInput } from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const input = parseDraftInput(body);
    const reservationService = getSharedLegacyGuestReservationService();
    const reservation = await reservationService.createDraft(input, idempotencyKey);

    return jsonSuccess({ reservation }, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "create_draft_failed");
  }
}
