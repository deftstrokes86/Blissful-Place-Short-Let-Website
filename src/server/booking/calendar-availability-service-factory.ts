import { CalendarAvailabilityService } from "./calendar-availability-service";
import { prismaAvailabilityBlockRepository } from "./prisma-availability-block-repository";

let sharedCalendarAvailabilityService: CalendarAvailabilityService | null = null;

export function getSharedCalendarAvailabilityService(): CalendarAvailabilityService {
  if (sharedCalendarAvailabilityService) {
    return sharedCalendarAvailabilityService;
  }

  sharedCalendarAvailabilityService = new CalendarAvailabilityService({
    repository: {
      listByFlat: (flatId) => prismaAvailabilityBlockRepository.listByFlat(flatId),
    },
  });

  return sharedCalendarAvailabilityService;
}

