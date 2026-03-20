import {
  handleVerifyTransferPaymentRequest,
} from "@/server/booking/staff-operations-http";
import { getSharedStaffOperationsService } from "@/server/booking/staff-operations-service-factory";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  pickOptionalString,
  pickString,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const service = getSharedStaffOperationsService();

    const result = await handleVerifyTransferPaymentRequest(service, {
      token: pickString(body, "token"),
      staffId: pickString(body, "staffId"),
      verificationNote: pickOptionalString(body, "verificationNote"),
      idempotencyKey: pickIdempotencyKey(request, body),
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "staff_transfer_verification_failed");
  }
}
