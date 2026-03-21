import { getSharedDraftService } from "./draft-service-factory";
import { ResumableDraftService } from "./resumable-draft-service";

let sharedResumableDraftService: ResumableDraftService | null = null;

export function getSharedResumableDraftService(): ResumableDraftService {
  if (sharedResumableDraftService) {
    return sharedResumableDraftService;
  }

  sharedResumableDraftService = new ResumableDraftService({
    draftStore: getSharedDraftService(),
  });

  return sharedResumableDraftService;
}
