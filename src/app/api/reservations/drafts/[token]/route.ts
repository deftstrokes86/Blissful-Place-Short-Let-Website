import { getSharedDraftService } from "@/server/booking/draft-service-factory";
import { parseDraftInput } from "@/server/http/reservation-payload";
import {
  jsonError,
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const draftService = getSharedDraftService();
    const result = await draftService.resumeDraft(token);

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "resume_draft_failed");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token) {
      return jsonError("Reservation token is required.", 400, "invalid_request");
    }

    const body = await readJsonObject(request);
    const input = parseDraftInput(body);

    const draftService = getSharedDraftService();
    const result = await draftService.saveDraftProgress(token, input);

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "save_draft_failed");
  }
}
