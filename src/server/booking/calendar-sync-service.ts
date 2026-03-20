import { AvailabilityBlockService, type AvailabilityBlockRepository, type AvailabilityBlockingReservation, type AvailabilityOverlapInput } from "./availability-block-service";
import type { AvailabilityBlockRecord } from "../../types/booking-backend";

export type CalendarSyncAction = "created" | "updated" | "released" | "unchanged";

export type CalendarSyncReservation = AvailabilityBlockingReservation;

export interface ReservationCalendarSyncEvent {
  type: string;
  reservation: CalendarSyncReservation;
  occurredAt?: string;
}

export interface CalendarSyncResult {
  sourceId: string;
  action: CalendarSyncAction;
  block: AvailabilityBlockRecord | null;
}

interface CalendarSyncServiceDependencies {
  repository: AvailabilityBlockRepository;
  blockService?: AvailabilityBlockService;
  now?: () => Date;
  createId?: () => string;
}

function hasReservationEventShape(input: CalendarSyncReservation | ReservationCalendarSyncEvent): input is ReservationCalendarSyncEvent {
  return "reservation" in input;
}

function sameProjection(left: AvailabilityBlockRecord, right: AvailabilityBlockRecord): boolean {
  return (
    left.id === right.id &&
    left.flatId === right.flatId &&
    left.sourceType === right.sourceType &&
    left.sourceId === right.sourceId &&
    left.blockType === right.blockType &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.status === right.status &&
    left.expiresAt === right.expiresAt &&
    left.releasedAt === right.releasedAt
  );
}

function resolveAction(
  previous: AvailabilityBlockRecord | null,
  next: AvailabilityBlockRecord | null
): CalendarSyncAction {
  if (!previous && !next) {
    return "unchanged";
  }

  if (!previous && next) {
    return "created";
  }

  if (previous && !next) {
    return previous.status === "active" ? "released" : "unchanged";
  }

  if (!previous || !next) {
    return "unchanged";
  }

  return sameProjection(previous, next) ? "unchanged" : "updated";
}

export class CalendarSyncService {
  private readonly repository: AvailabilityBlockRepository;
  private readonly blockService: AvailabilityBlockService;

  constructor(dependencies: CalendarSyncServiceDependencies) {
    this.repository = dependencies.repository;
    this.blockService =
      dependencies.blockService ??
      new AvailabilityBlockService({
        repository: dependencies.repository,
        now: dependencies.now,
        createId: dependencies.createId,
      });
  }

  async sync(input: CalendarSyncReservation | ReservationCalendarSyncEvent): Promise<CalendarSyncResult> {
    if (hasReservationEventShape(input)) {
      return this.syncFromEvent(input);
    }

    return this.syncFromReservation(input);
  }

  async syncFromEvent(event: ReservationCalendarSyncEvent): Promise<CalendarSyncResult> {
    return this.syncFromReservation(event.reservation);
  }

  async syncFromReservation(reservation: CalendarSyncReservation): Promise<CalendarSyncResult> {
    const previous = await this.repository.findBySource("reservation", reservation.id);
    const next = await this.blockService.syncReservationBlock(reservation);

    return {
      sourceId: reservation.id,
      action: resolveAction(previous, next),
      block: next,
    };
  }

  async findOverlappingActiveBlocks(input: AvailabilityOverlapInput): Promise<AvailabilityBlockRecord[]> {
    return this.blockService.findOverlappingActiveBlocks(input);
  }
}
