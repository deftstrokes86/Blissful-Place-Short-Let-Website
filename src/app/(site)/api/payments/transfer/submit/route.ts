import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import { getSharedOfflinePaymentService } from "@/server/booking/offline-payment-service-factory";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const token = pickString(body, "token");
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token) {
      return jsonError("Token is required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const offlinePaymentService = getSharedOfflinePaymentService();
    const result = await offlinePaymentService.createTransferSubmission({
      token,
      actor: "guest",
    });

    return jsonSuccess({ reservation: result.reservation, availability: result.availability });
  } catch (error) {
    return jsonErrorFromUnknown(error, "transfer_submission_failed");
  }
}
