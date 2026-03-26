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
    const transferReference = pickString(body, "transferReference");
    const proofNote = pickString(body, "proofNote");
    const idempotencyKey = pickIdempotencyKey(request, body);

    if (!token || !transferReference || !proofNote) {
      return jsonError("Token, transferReference, and proofNote are required.", 400, "invalid_request");
    }

    if (!idempotencyKey) {
      return jsonError("Idempotency key is required.", 400, "invalid_request");
    }

    const offlinePaymentService = getSharedOfflinePaymentService();
    const result = await offlinePaymentService.submitTransferProof({
      token,
      transferReference,
      proofNote,
      actor: "guest",
      idempotencyKey,
    });

    return jsonSuccess({ reservation: result.reservation, transferMetadata: result.transferMetadata });
  } catch (error) {
    return jsonErrorFromUnknown(error, "transfer_proof_submission_failed");
  }
}
