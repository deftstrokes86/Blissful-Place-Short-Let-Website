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
    const staffId = pickString(body, "staffId");
    const verificationNote = pickOptionalString(body, "verificationNote") ?? undefined;
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token || !staffId) {
      return jsonError("Token and staffId are required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const offlinePaymentService = getSharedOfflinePaymentService();
    const result = await offlinePaymentService.verifyTransferByStaff({
      token,
      staffId,
      verificationNote,
    });

    return jsonSuccess({ reservation: result.reservation, transferMetadata: result.transferMetadata });
  } catch (error) {
    return jsonErrorFromUnknown(error, "transfer_verification_failed");
  }
}
