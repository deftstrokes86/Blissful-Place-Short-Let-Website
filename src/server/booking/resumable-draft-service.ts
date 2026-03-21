import {
  deriveResumeStepIndex,
  resolveResumePaymentMethod,
  type ResumeStepIndex,
} from "../../lib/booking-draft-resume";
import { getBranchStepLabels } from "../../lib/booking-branch-config";
import type {
  AvailabilityCheckpoint,
  BookingToken,
  BookingStepLabels,
  PaymentMethod,
} from "../../types/booking";
import type { DraftCreateInput, DraftUpdateInput } from "../../types/booking-backend";
import type { DraftSnapshot } from "./draft-service";
import type { ReservationRepositoryReservation } from "./reservation-repository";

export interface ResumableDraftStore {
  createDraft(input: DraftCreateInput): Promise<DraftSnapshot>;
  saveDraftProgress(token: BookingToken, input: DraftUpdateInput): Promise<DraftSnapshot>;
  resumeDraft(token: BookingToken): Promise<DraftSnapshot>;
}

interface ResumableDraftServiceDependencies {
  draftStore: ResumableDraftStore;
}

export interface ResumableDraftBranchContext {
  resolvedPaymentMethod: PaymentMethod | null;
  resumeStepIndex: ResumeStepIndex;
  savedProgressStep: number | null;
  stepLabels: BookingStepLabels;
  stayReady: boolean;
  guestReady: boolean;
}

export interface ResumableDraftAvailabilityNeeds {
  createBranchRequest: boolean;
  onlinePaymentHandoff: boolean;
  transferConfirmation: boolean;
  posConfirmation: boolean;
  requiredCheckpoints: AvailabilityCheckpoint[];
}

export interface ResumableDraftSession {
  resumeToken: BookingToken;
  reservation: ReservationRepositoryReservation;
  branchContext: ResumableDraftBranchContext;
  availabilityRevalidationNeeds: ResumableDraftAvailabilityNeeds;
}

export type BranchTransientStateScope =
  | "website_transient"
  | "transfer_transient"
  | "pos_transient"
  | "branch_messages";

export interface BranchResetResult {
  applied: boolean;
  clearedTransientState: BranchTransientStateScope[];
}

export interface PaymentMethodSwitchResult {
  snapshot: ResumableDraftSession;
  branchReset: BranchResetResult;
}

const BRANCH_TRANSIENT_SCOPES: BranchTransientStateScope[] = [
  "website_transient",
  "transfer_transient",
  "pos_transient",
  "branch_messages",
];

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function isStayReady(reservation: ReservationRepositoryReservation): boolean {
  if (!reservation.stay.flatId || reservation.stay.guests < 1) {
    return false;
  }

  const checkIn = parseIsoDate(reservation.stay.checkIn);
  const checkOut = parseIsoDate(reservation.stay.checkOut);

  if (!checkIn || !checkOut) {
    return false;
  }

  return checkOut.getTime() > checkIn.getTime();
}

function isGuestReady(reservation: ReservationRepositoryReservation): boolean {
  return (
    isNonEmptyString(reservation.guest.firstName) &&
    isNonEmptyString(reservation.guest.lastName) &&
    isNonEmptyString(reservation.guest.email) &&
    isNonEmptyString(reservation.guest.phone)
  );
}

function deriveRequiredCheckpoints(reservation: ReservationRepositoryReservation): AvailabilityCheckpoint[] {
  if (reservation.status === "draft") {
    return ["pre_hold_request"];
  }

  if (reservation.status === "pending_online_payment") {
    return ["pre_online_payment_handoff"];
  }

  if (reservation.status === "awaiting_transfer_verification") {
    return ["pre_transfer_confirmation"];
  }

  if (reservation.status === "pending_pos_coordination") {
    return ["pre_pos_confirmation"];
  }

  return [];
}

function buildBranchContext(reservation: ReservationRepositoryReservation): ResumableDraftBranchContext {
  const stayReady = isStayReady(reservation);
  const guestReady = isGuestReady(reservation);
  const resolvedPaymentMethod = resolveResumePaymentMethod(reservation.status, reservation.paymentMethod);
  const resumeStepIndex = deriveResumeStepIndex({
    status: reservation.status,
    paymentMethod: resolvedPaymentMethod,
    stayReady,
    guestReady,
  });

  return {
    resolvedPaymentMethod,
    resumeStepIndex,
    savedProgressStep: reservation.progressContext.currentStep,
    stepLabels: getBranchStepLabels(resolvedPaymentMethod),
    stayReady,
    guestReady,
  };
}

function buildAvailabilityNeeds(reservation: ReservationRepositoryReservation): ResumableDraftAvailabilityNeeds {
  const checkpoints = deriveRequiredCheckpoints(reservation);

  return {
    createBranchRequest: checkpoints.includes("pre_hold_request"),
    onlinePaymentHandoff: checkpoints.includes("pre_online_payment_handoff"),
    transferConfirmation: checkpoints.includes("pre_transfer_confirmation"),
    posConfirmation: checkpoints.includes("pre_pos_confirmation"),
    requiredCheckpoints: checkpoints,
  };
}

export class ResumableDraftService {
  private readonly draftStore: ResumableDraftStore;

  constructor(dependencies: ResumableDraftServiceDependencies) {
    this.draftStore = dependencies.draftStore;
  }

  async createResumableDraft(input: DraftCreateInput): Promise<ResumableDraftSession> {
    const snapshot = await this.draftStore.createDraft(input);
    return this.toSession(snapshot);
  }

  async updateResumableDraft(token: BookingToken, input: DraftUpdateInput): Promise<ResumableDraftSession> {
    const snapshot = await this.draftStore.saveDraftProgress(token, input);
    return this.toSession(snapshot);
  }

  async loadResumableDraft(token: BookingToken): Promise<ResumableDraftSession> {
    const snapshot = await this.draftStore.resumeDraft(token);
    return this.toSession(snapshot);
  }

  deriveAvailabilityRevalidationNeeds(
    reservation: ReservationRepositoryReservation
  ): ResumableDraftAvailabilityNeeds {
    return buildAvailabilityNeeds(reservation);
  }

  async changePaymentMethodAfterResume(input: {
    token: BookingToken;
    nextPaymentMethod: PaymentMethod;
  }): Promise<PaymentMethodSwitchResult> {
    const currentSnapshot = await this.loadResumableDraft(input.token);
    const currentMethod = currentSnapshot.branchContext.resolvedPaymentMethod;

    if (currentMethod === input.nextPaymentMethod) {
      return {
        snapshot: currentSnapshot,
        branchReset: {
          applied: false,
          clearedTransientState: [],
        },
      };
    }

    const updated = await this.updateResumableDraft(input.token, {
      paymentMethod: input.nextPaymentMethod,
      progressContext: {
        currentStep: 2,
        activeBranch: input.nextPaymentMethod,
      },
    });

    return {
      snapshot: updated,
      branchReset: {
        applied: true,
        clearedTransientState: [...BRANCH_TRANSIENT_SCOPES],
      },
    };
  }

  private toSession(snapshot: DraftSnapshot): ResumableDraftSession {
    return {
      resumeToken: snapshot.resumeToken,
      reservation: snapshot.reservation,
      branchContext: buildBranchContext(snapshot.reservation),
      availabilityRevalidationNeeds: buildAvailabilityNeeds(snapshot.reservation),
    };
  }
}
