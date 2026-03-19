import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";
import {
  websitePaymentService,
  type WebsitePaymentOutcome,
} from "@/server/services/website-payment-service";

export const runtime = "nodejs";

const WEBSITE_OUTCOMES: readonly WebsitePaymentOutcome[] = ["success", "failed", "cancelled"];

function parseWebsiteOutcome(value: unknown): WebsitePaymentOutcome {
  if (typeof value !== "string") {
    throw new Error("Invalid outcome");
  }

  if (!WEBSITE_OUTCOMES.includes(value as WebsitePaymentOutcome)) {
    throw new Error("Invalid outcome");
  }

  return value as WebsitePaymentOutcome;
}

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

    const outcome = parseWebsiteOutcome(body.outcome);
    const providerReference = pickOptionalString(body, "providerReference") ?? undefined;

    const reservation = await websitePaymentService.handleCheckoutOutcome({
      token,
      outcome,
      providerReference,
      idempotencyKey,
    });

    return jsonSuccess({ reservation });
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_outcome_failed");
  }
}
