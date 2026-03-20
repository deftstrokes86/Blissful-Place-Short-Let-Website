import { getRequiredFlutterwaveWebhookSecretHash } from "@/lib/payments/flutterwave-config";
import { getSharedWebsitePaymentService } from "@/server/booking/website-payment-service-factory";
import {
  FlutterwaveWebhookService,
} from "@/server/payments/flutterwave-webhook-service";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    const webhookService = new FlutterwaveWebhookService({
      websitePaymentService: getSharedWebsitePaymentService(),
      secretHash: getRequiredFlutterwaveWebhookSecretHash(),
    });

    const result = await webhookService.handleWebhookRequest({
      rawBody,
      headers: request.headers,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "flutterwave_webhook_failed");
  }
}
