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

    const checkout = await websitePaymentService.initiateCheckout({
      token,
      idempotencyKey,
    });

    return jsonSuccess(checkout, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_initiate_failed");
  }
}
