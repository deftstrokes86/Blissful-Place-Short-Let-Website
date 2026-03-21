import { getSharedAvailabilityService } from "./availability-service-factory";
import { getSharedResumableDraftService } from "./resumable-draft-service-factory";
import { ResumedDraftAvailabilityService } from "./resumable-draft-availability-service";

let sharedResumedDraftAvailabilityService: ResumedDraftAvailabilityService | null = null;

export function getSharedResumedDraftAvailabilityService(): ResumedDraftAvailabilityService {
  if (sharedResumedDraftAvailabilityService) {
    return sharedResumedDraftAvailabilityService;
  }

  sharedResumedDraftAvailabilityService = new ResumedDraftAvailabilityService({
    draftService: getSharedResumableDraftService(),
    availabilityService: getSharedAvailabilityService(),
  });

  return sharedResumedDraftAvailabilityService;
}
