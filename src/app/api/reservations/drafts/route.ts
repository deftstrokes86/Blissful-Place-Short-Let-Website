import { getSharedDraftService } from "@/server/booking/draft-service-factory";
import { parseDraftInput } from "@/server/http/reservation-payload";
import {
  jsonErrorFromUnknown,
  jsonSuccess,
  readJsonObject,
} from "@/server/http/route-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const input = parseDraftInput(body);

    const draftService = getSharedDraftService();
    const result = await draftService.createDraft(input);

    return jsonSuccess(result, 201);
  } catch (error) {
    return jsonErrorFromUnknown(error, "create_draft_failed");
  }
}
