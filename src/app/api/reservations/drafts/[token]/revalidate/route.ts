import { getSharedResumedDraftAvailabilityService } from "@/server/booking/resumable-draft-availability-service-factory";
import type { ResumableDraftCriticalCheckpoint } from "@/server/booking/resumable-draft-availability-service";
import { parseAvailabilityCheckpointInput } from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";
import type { AvailabilityCheckpoint } from "@/types/booking";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

const CRITICAL_CHECKPOINTS = new Set([
  "pre_hold_request",
  "pre_online_payment_handoff",
  "pre_transfer_confirmation",
  "pre_pos_confirmation",
]);

function isCriticalCheckpoint(value: AvailabilityCheckpoint): value is ResumableDraftCriticalCheckpoint {
  return CRITICAL_CHECKPOINTS.has(value);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const body = await readJsonObject(request);
    const checkpoint = parseAvailabilityCheckpointInput(body, "checkpoint");

    if (!isCriticalCheckpoint(checkpoint)) {
      return jsonError("Unsupported checkpoint for resumed draft revalidation.", 400, "invalid_request");
    }

    const revalidationService = getSharedResumedDraftAvailabilityService();
    const result = await revalidationService.revalidateBeforeCriticalProgression({
      token,
      checkpoint,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "draft_revalidation_failed");
  }
}
