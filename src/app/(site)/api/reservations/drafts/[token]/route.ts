import { getSharedResumableDraftService } from "@/server/booking/resumable-draft-service-factory";
import {
  handleLoadResumableDraftRequest,
  handleSaveResumableDraftRequest,
} from "@/server/booking/resumable-draft-http";
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

    const resumableDraftService = getSharedResumableDraftService();
    const result = await handleLoadResumableDraftRequest(resumableDraftService, { token });

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

    const resumableDraftService = getSharedResumableDraftService();
    const result = await handleSaveResumableDraftRequest(resumableDraftService, {
      token,
      body,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonErrorFromUnknown(error, "save_draft_failed");
  }
}
