import { getSharedWebsitePaymentService } from "@/server/booking/website-payment-service-factory";
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

    const websitePaymentService = getSharedWebsitePaymentService();
    const checkout = await websitePaymentService.retryCheckout({
      token,
      idempotencyKey,
    });

    return jsonSuccess(checkout);
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_retry_failed");
  }
}
