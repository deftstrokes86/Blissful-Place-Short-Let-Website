import type { BookingActor, BookingToken, PaymentMethod } from "../../types/booking";
import type { DraftCreateInput, DraftUpdateInput } from "../../types/booking-backend";
import type { AvailabilityCheckResult } from "./availability-service";
import type { DraftService } from "./draft-service";
import type { WebsitePaymentIdempotencyGateway } from "./idempotency-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";
import type { ReservationService } from "./reservation-service";

interface LegacyGuestReservationServiceDependencies {
  draftService: Pick<DraftService, "createDraft" | "saveDraftProgress">;
  reservationService: Pick<ReservationService, "getReservationByToken" | "transitionReservation">;
  availabilityService: {
    runPreHoldRecheck(
      stay: ReservationRepositoryReservation["stay"],
      paymentMethod: PaymentMethod,
      reservationId?: string
    ): Promise<AvailabilityCheckResult>;
  };
  idempotencyGateway: WebsitePaymentIdempotencyGateway;
}

class LegacyGuestReservationAvailabilityError extends Error {
  readonly httpStatus = 409 as const;

  constructor() {
    super("Pre-hold availability recheck failed.");
  }
}

export class LegacyGuestReservationService {
  private readonly draftService: LegacyGuestReservationServiceDependencies["draftService"];
  private readonly reservationService: LegacyGuestReservationServiceDependencies["reservationService"];
  private readonly availabilityService: LegacyGuestReservationServiceDependencies["availabilityService"];
  private readonly idempotencyGateway: LegacyGuestReservationServiceDependencies["idempotencyGateway"];

  constructor(dependencies: LegacyGuestReservationServiceDependencies) {
    this.draftService = dependencies.draftService;
    this.reservationService = dependencies.reservationService;
    this.availabilityService = dependencies.availabilityService;
    this.idempotencyGateway = dependencies.idempotencyGateway;
  }

  async createDraft(input: DraftCreateInput, idempotencyKey: string): Promise<ReservationRepositoryReservation> {
    return this.idempotencyGateway.run({
      key: idempotencyKey,
      action: "legacy_guest_reservation.create_draft",
      payload: input,
      execute: async () => {
        const snapshot = await this.draftService.createDraft(input);
        return snapshot.reservation;
      },
    });
  }

  async saveDraft(
    token: BookingToken,
    input: DraftUpdateInput,
    idempotencyKey: string
  ): Promise<ReservationRepositoryReservation> {
    return this.idempotencyGateway.run({
      key: idempotencyKey,
      action: "legacy_guest_reservation.save_draft",
      payload: {
        token,
        input,
      },
      execute: async () => {
        const snapshot = await this.draftService.saveDraftProgress(token, input);
        return snapshot.reservation;
      },
    });
  }

  async loadReservation(token: BookingToken): Promise<ReservationRepositoryReservation | null> {
    return this.reservationService.getReservationByToken(token);
  }

  async createBranchRequest(input: {
    token: BookingToken;
    paymentMethod: PaymentMethod;
    actor: BookingActor;
    idempotencyKey: string;
  }): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(input.token);

    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "legacy_guest_reservation.create_branch_request",
      reservationId: reservation.id,
      payload: {
        token: input.token,
        paymentMethod: input.paymentMethod,
        actor: input.actor,
      },
      execute: async () => {
        const availability = await this.availabilityService.runPreHoldRecheck(
          reservation.stay,
          input.paymentMethod,
          reservation.id
        );

        if (!availability.isAvailable) {
          throw new LegacyGuestReservationAvailabilityError();
        }

        return this.reservationService.transitionReservation({
          token: input.token,
          event: "branch_request_created",
          actor: input.actor,
          paymentMethod: input.paymentMethod,
          availabilityPassed: true,
        });
      },
    });
  }

  async cancelReservation(input: {
    token: BookingToken;
    actor: BookingActor;
    idempotencyKey?: string;
  }): Promise<ReservationRepositoryReservation> {
    const reservation = await this.requireReservation(input.token);

    if (!input.idempotencyKey) {
      return this.reservationService.transitionReservation({
        token: input.token,
        event: "cancel_requested",
        actor: input.actor,
      });
    }

    return this.idempotencyGateway.run({
      key: input.idempotencyKey,
      action: "legacy_guest_reservation.cancel",
      reservationId: reservation.id,
      payload: {
        token: input.token,
        actor: input.actor,
      },
      execute: () =>
        this.reservationService.transitionReservation({
          token: input.token,
          event: "cancel_requested",
          actor: input.actor,
        }),
    });
  }

  private async requireReservation(token: BookingToken): Promise<ReservationRepositoryReservation> {
    const reservation = await this.reservationService.getReservationByToken(token);

    if (!reservation) {
      throw new Error("Reservation not found.");
    }

    return reservation;
  }
}
