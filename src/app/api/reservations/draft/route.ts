import { reservationDomainService } from "@/server/services/reservation-domain-service";
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
    const reservation = await reservationDomainService.createDraft(input, idempotencyKey);

    return jsonSuccess({ reservation }, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "create_draft_failed");
  }
}