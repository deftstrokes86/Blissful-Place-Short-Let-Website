import { getSharedResumableDraftService } from "@/server/booking/resumable-draft-service-factory";
import { handleCreateResumableDraftRequest } from "@/server/booking/resumable-draft-http";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);

    const resumableDraftService = getSharedResumableDraftService();
    const result = await handleCreateResumableDraftRequest(resumableDraftService, body);

    return jsonSuccess(result, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "create_draft_failed");
  }
}
