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
    const staffId = pickString(body, "staffId");
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token || !staffId) {
      return jsonError("Token and staffId are required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const offlinePaymentService = getSharedOfflinePaymentService();
    const result = await offlinePaymentService.confirmPosPaymentByStaff({
      token,
      staffId,
    });

    return jsonSuccess({ reservation: result.reservation, posMetadata: result.posMetadata });
  } catch (error) {
    return jsonErrorFromUnknown(error, "pos_payment_confirmation_failed");
  }
}
