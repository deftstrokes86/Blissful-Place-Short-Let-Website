import { getSharedLegacyGuestReservationService } from "@/server/booking/legacy-guest-reservation-service-factory";
import { parsePaymentMethodInput } from "@/server/http/reservation-payload";
import {
  jsonError,
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
    const token = pickString(body, "token");
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const paymentMethod = parsePaymentMethodInput(body, "paymentMethod");
    const reservationService = getSharedLegacyGuestReservationService();
    const reservation = await reservationService.createBranchRequest({
      token,
      paymentMethod,
      actor: "guest",
      idempotencyKey,
    });

    return jsonSuccess({ reservation }, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "create_branch_request_failed");
  }
}
