import { parseOfflinePaymentMethod } from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import { websitePaymentService } from "@/server/services/website-payment-service";

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

    const targetMethod = parseOfflinePaymentMethod(body, "targetMethod");

    const reservation = await websitePaymentService.switchFailedPaymentMethod({
      token,
      targetMethod,
      idempotencyKey,
    });

    return jsonSuccess({ reservation });
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_switch_method_failed");
  }
}
