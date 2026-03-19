import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import { getSharedOfflinePaymentService } from "@/server/booking/offline-payment-service-factory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const token = pickString(body, "token");
    const contactWindow = pickString(body, "contactWindow");
    const note = pickOptionalString(body, "note") ?? undefined;
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token || !contactWindow) {
      return jsonError("Token and contactWindow are required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const offlinePaymentService = getSharedOfflinePaymentService();
    const result = await offlinePaymentService.createPosCoordinationRequest({
      token,
      actor: "guest",
      contactWindow,
      note,
      idempotencyKey,
    });

    return jsonSuccess({ reservation: result.reservation, posMetadata: result.posMetadata });
  } catch (error) {
    return jsonErrorFromUnknown(error, "pos_request_submission_failed");
  }
}
