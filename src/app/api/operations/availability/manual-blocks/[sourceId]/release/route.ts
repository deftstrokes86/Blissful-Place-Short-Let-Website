import {
  handleReleaseManualBlockRequest,
} from "@/server/booking/staff-operations-http";
import { getSharedOperationsService } from "@/server/booking/operations-service-factory";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  pickIdempotencyKey,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    sourceId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { sourceId } = await context.params;

    let body: Record<string, unknown> = {};
    try {
      body = await readJsonObject(request);
    } catch {
      body = {};
    }

    const service = getSharedOperationsService();
    const result = await handleReleaseManualBlockRequest(service, {
      sourceId,
      idempotencyKey: pickIdempotencyKey(request, body),
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "manual_block_release_failed");
  }
}
