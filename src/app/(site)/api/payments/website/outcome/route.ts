import { getSharedWebsitePaymentService } from "@/server/booking/website-payment-service-factory";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const txRef = pickString(body, "txRef") ?? pickString(body, "tx_ref");
    const transactionId = pickOptionalString(body, "transactionId") ?? pickOptionalString(body, "transaction_id");
    const status = pickOptionalString(body, "status");

    if (!txRef) {
      return jsonError("txRef is required.", 400, "invalid_request");
    }

    const websitePaymentService = getSharedWebsitePaymentService();
    const result = await websitePaymentService.handleCallback({
      txRef,
      transactionId,
      status,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_outcome_failed");
  }
}
