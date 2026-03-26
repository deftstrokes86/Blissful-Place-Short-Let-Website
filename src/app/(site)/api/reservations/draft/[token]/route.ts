import { parseDraftInput } from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  readJsonObject,
} from "@/server/http/route-helpers";
import { reservationDomainService } from "@/server/services/reservation-domain-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const reservation = await reservationDomainService.getReservationByToken(token);
    if (!reservation) {
      return jsonError("Reservation not found.", 404, "not_found");
    }

    return jsonSuccess({ reservation });
  } catch (error) {
    return jsonErrorFromUnknown(error, "get_draft_failed");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const body = await readJsonObject(request);
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const input = parseDraftInput(body);
    const reservation = await reservationDomainService.updateDraft(token, input, idempotencyKey);

    return jsonSuccess({ reservation });
  } catch (error) {
    return jsonErrorFromUnknown(error, "update_draft_failed");
  }
}
