import type { BookingToken } from "../../types/booking";
import type {
  DraftCreateInput,
  DraftUpdateInput,
} from "../../types/booking-backend";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { ReservationService } from "./reservation-service";

interface DraftServiceDependencies {
  reservationService: Pick<
    ReservationService,
    "createDraftReservation" | "updateDraftReservation" | "getReservationByToken"
  >;
}

export interface DraftSnapshot {
  resumeToken: BookingToken;
  reservation: ReservationRepositoryReservation;
}

const RESUME_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,200}$/;

function hasDraftMutationPayload(input: DraftUpdateInput): boolean {
  return Object.keys(input).length > 0;
}

function assertValidResumeToken(token: BookingToken): BookingToken {
  const normalized = token.trim();

  if (!RESUME_TOKEN_PATTERN.test(normalized)) {
    throw new Error("Malformed draft token.");
  }

  return normalized;
}

export class DraftService {
  private readonly reservationService: DraftServiceDependencies["reservationService"];

  constructor(dependencies: DraftServiceDependencies) {
    this.reservationService = dependencies.reservationService;
  }

  async createDraft(input: DraftCreateInput): Promise<DraftSnapshot> {
    const reservation = await this.reservationService.createDraftReservation(input);

    return {
      resumeToken: reservation.token,
      reservation,
    };
  }

  async saveDraftProgress(token: BookingToken, input: DraftUpdateInput): Promise<DraftSnapshot> {
    if (!hasDraftMutationPayload(input)) {
      throw new Error("Draft update payload is empty.");
    }

    const resumeToken = assertValidResumeToken(token);
    const reservation = await this.reservationService.updateDraftReservation(resumeToken, input);

    return {
      resumeToken: reservation.token,
      reservation,
    };
  }

  async resumeDraft(token: BookingToken): Promise<DraftSnapshot> {
    const resumeToken = assertValidResumeToken(token);
    const reservation = await this.reservationService.getReservationByToken(resumeToken);
    if (!reservation) {
      throw new Error("Draft reservation not found.");
    }

    if (reservation.status !== "draft") {
      throw new Error("Reservation is no longer an editable draft.");
    }

    return {
      resumeToken: reservation.token,
      reservation,
    };
  }
}
