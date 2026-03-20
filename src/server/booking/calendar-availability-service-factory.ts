import { CalendarAvailabilityService } from "./calendar-availability-service";
import { fileAvailabilityBlockRepository } from "./file-availability-block-repository";

let sharedCalendarAvailabilityService: CalendarAvailabilityService | null = null;

export function getSharedCalendarAvailabilityService(): CalendarAvailabilityService {
  if (sharedCalendarAvailabilityService) {
    return sharedCalendarAvailabilityService;
  }

  sharedCalendarAvailabilityService = new CalendarAvailabilityService({
    repository: {
      listByFlat: (flatId) => fileAvailabilityBlockRepository.listByFlat(flatId),
    },
  });

  return sharedCalendarAvailabilityService;
}

