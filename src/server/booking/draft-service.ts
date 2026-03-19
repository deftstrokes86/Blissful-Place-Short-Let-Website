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

function hasDraftMutationPayload(input: DraftUpdateInput): boolean {
  return Object.keys(input).length > 0;
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

    const reservation = await this.reservationService.updateDraftReservation(token, input);

    return {
      resumeToken: reservation.token,
      reservation,
    };
  }

  async resumeDraft(token: BookingToken): Promise<DraftSnapshot> {
    const reservation = await this.reservationService.getReservationByToken(token);
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
