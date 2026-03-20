import { getSharedWebsitePaymentService } from "@/server/booking/website-payment-service-factory";
import {
  FlutterwaveCallbackService,
  parseFlutterwaveCallbackParams,
} from "@/server/payments/flutterwave-callback-service";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const callbackParams = parseFlutterwaveCallbackParams(new URL(request.url));

    const callbackService = new FlutterwaveCallbackService({
      websitePaymentService: getSharedWebsitePaymentService(),
    });

    const result = await callbackService.handleRedirectReturn(callbackParams);

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "website_checkout_callback_failed");
  }
}
