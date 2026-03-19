import type {
  AvailabilityCheckpoint,
  AvailabilityConflict,
  AvailabilityResult,
  ISODateTimeString,
  PaymentMethod,
  StayDetailsInput,
} from "@/types/booking";
import { calculateNightCount } from "@/lib/booking-pricing";

export interface AvailabilityCheckRequest {
  checkpoint: AvailabilityCheckpoint;
  stay: StayDetailsInput;
  paymentMethod?: PaymentMethod;
  reservationId?: string;
  requestedAt: ISODateTimeString;
}

export interface AvailabilityService {
  check(request: AvailabilityCheckRequest): Promise<AvailabilityResult>;
}

function nowIso(): ISODateTimeString {
  return new Date().toISOString();
}

function buildUnavailableResult(
  checkpoint: AvailabilityCheckpoint,
  conflicts: AvailabilityConflict[],
  reasons: string[]
): AvailabilityResult {
  return {
    checkpoint,
    isAvailable: false,
    checkedAt: nowIso(),
    reasons,
    conflicts,
    inventoryVersion: "placeholder-v1",
  };
}

function buildAvailableResult(checkpoint: AvailabilityCheckpoint): AvailabilityResult {
  return {
    checkpoint,
    isAvailable: true,
    checkedAt: nowIso(),
    reasons: ["Placeholder availability check passed."],
    conflicts: [],
    inventoryVersion: "placeholder-v1",
  };
}

function validateStayWindowForAvailability(stay: StayDetailsInput): AvailabilityConflict[] {
  const conflicts: AvailabilityConflict[] = [];

  const nights = calculateNightCount(stay.checkIn, stay.checkOut);
  if (nights === null) {
    conflicts.push({
      code: "invalid_window",
      field: "dates",
      message: "Check-out must be after check-in.",
    });
  }

  if (stay.guests < 1) {
    conflicts.push({
      code: "capacity_exceeded",
      field: "guests",
      message: "At least one guest is required.",
    });
  }

  return conflicts;
}

export class PlaceholderAvailabilityService implements AvailabilityService {
  async check(request: AvailabilityCheckRequest): Promise<AvailabilityResult> {
    const conflicts = validateStayWindowForAvailability(request.stay);

    if (conflicts.length > 0) {
      return buildUnavailableResult(
        request.checkpoint,
        conflicts,
        ["Placeholder check failed due to invalid stay details."]
      );
    }

    return buildAvailableResult(request.checkpoint);
  }
}

const DEFAULT_SERVICE = new PlaceholderAvailabilityService();

async function runAvailabilityCheckpoint(
  checkpoint: AvailabilityCheckpoint,
  stay: StayDetailsInput,
  options: {
    paymentMethod?: PaymentMethod;
    reservationId?: string;
    service?: AvailabilityService;
    requestedAt?: ISODateTimeString;
  } = {}
): Promise<AvailabilityResult> {
  const service = options.service ?? DEFAULT_SERVICE;

  return service.check({
    checkpoint,
    stay,
    paymentMethod: options.paymentMethod,
    reservationId: options.reservationId,
    requestedAt: options.requestedAt ?? nowIso(),
  });
}

export async function runInitialAvailabilityCheck(
  stay: StayDetailsInput,
  options: { service?: AvailabilityService; reservationId?: string; requestedAt?: ISODateTimeString } = {}
): Promise<AvailabilityResult> {
  return runAvailabilityCheckpoint("stay_details_entry", stay, options);
}

export async function runPreHoldAvailabilityRecheck(
  stay: StayDetailsInput,
  options: {
    paymentMethod: PaymentMethod;
    service?: AvailabilityService;
    reservationId?: string;
    requestedAt?: ISODateTimeString;
  }
): Promise<AvailabilityResult> {
  return runAvailabilityCheckpoint("pre_hold_request", stay, options);
}

export async function runPreCheckoutAvailabilityRecheck(
  stay: StayDetailsInput,
  options: {
    paymentMethod: "website";
    service?: AvailabilityService;
    reservationId?: string;
    requestedAt?: ISODateTimeString;
  }
): Promise<AvailabilityResult> {
  return runAvailabilityCheckpoint("pre_online_payment_handoff", stay, options);
}

export async function runPreConfirmationAvailabilityRecheck(
  stay: StayDetailsInput,
  options: {
    paymentMethod: "transfer" | "pos";
    service?: AvailabilityService;
    reservationId?: string;
    requestedAt?: ISODateTimeString;
  }
): Promise<AvailabilityResult> {
  const checkpoint: AvailabilityCheckpoint =
    options.paymentMethod === "transfer" ? "pre_transfer_confirmation" : "pre_pos_confirmation";

  return runAvailabilityCheckpoint(checkpoint, stay, options);
}
