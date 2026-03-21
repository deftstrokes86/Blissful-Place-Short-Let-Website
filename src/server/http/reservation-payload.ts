import type {
  DraftCreateInput,
  DraftProgressContextInput,
  DraftProgressStep,
  DraftUpdateInput,
} from "@/types/booking-backend";
import type {
  AvailabilityCheckpoint,
  ExtraId,
  FlatId,
  GuestDetailsInput,
  PaymentMethod,
  StayDetailsInput,
} from "@/types/booking";

const PAYMENT_METHODS: readonly PaymentMethod[] = ["website", "transfer", "pos"];
const EXTRA_IDS: readonly ExtraId[] = ["airport", "pantry", "celebration"];
const FLAT_IDS: readonly FlatId[] = ["windsor", "kensington", "mayfair"];
const AVAILABILITY_CHECKPOINTS: readonly AvailabilityCheckpoint[] = [
  "stay_details_entry",
  "pre_hold_request",
  "pre_online_payment_handoff",
  "pre_transfer_confirmation",
  "pre_pos_confirmation",
];
const MIN_DRAFT_STEP: DraftProgressStep = 0;
const MAX_DRAFT_STEP: DraftProgressStep = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseGuests(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value < 1) {
    return null;
  }

  return Math.floor(value);
}

function parseExtraIds(value: unknown): ExtraId[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed: ExtraId[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    if (!EXTRA_IDS.includes(item as ExtraId)) {
      return null;
    }

    parsed.push(item as ExtraId);
  }

  return parsed;
}

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : null;
}

function parseFlatId(value: unknown): FlatId | null {
  if (typeof value !== "string") {
    return null;
  }

  return FLAT_IDS.includes(value as FlatId) ? (value as FlatId) : null;
}

function parseDraftProgressStep(value: unknown): DraftProgressStep | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }

  if (value < MIN_DRAFT_STEP || value > MAX_DRAFT_STEP) {
    return null;
  }

  return value as DraftProgressStep;
}

function parseProgressContext(value: unknown): DraftProgressContextInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const context: DraftProgressContextInput = {};

  if (Object.prototype.hasOwnProperty.call(value, "currentStep")) {
    if (value.currentStep === null) {
      context.currentStep = null;
    } else {
      const currentStep = parseDraftProgressStep(value.currentStep);
      if (currentStep === null) {
        throw new Error("Invalid progressContext.currentStep");
      }

      context.currentStep = currentStep;
    }
  }

  if (Object.prototype.hasOwnProperty.call(value, "activeBranch")) {
    if (value.activeBranch === null) {
      context.activeBranch = null;
    } else {
      const activeBranch = parsePaymentMethod(value.activeBranch);
      if (!activeBranch) {
        throw new Error("Invalid progressContext.activeBranch");
      }

      context.activeBranch = activeBranch;
    }
  }

  return context;
}

function parseStayPatch(value: unknown): Partial<StayDetailsInput> | null {
  if (!isRecord(value)) {
    return null;
  }

  const patch: Partial<StayDetailsInput> = {};

  if (Object.prototype.hasOwnProperty.call(value, "flatId")) {
    const flatId = parseFlatId(value.flatId);
    if (!flatId) {
      throw new Error("Invalid stay.flatId");
    }
    patch.flatId = flatId;
  }

  if (Object.prototype.hasOwnProperty.call(value, "checkIn")) {
    const checkIn = parseString(value.checkIn);
    if (!checkIn) {
      throw new Error("Invalid stay.checkIn");
    }
    patch.checkIn = checkIn;
  }

  if (Object.prototype.hasOwnProperty.call(value, "checkOut")) {
    const checkOut = parseString(value.checkOut);
    if (!checkOut) {
      throw new Error("Invalid stay.checkOut");
    }
    patch.checkOut = checkOut;
  }

  if (Object.prototype.hasOwnProperty.call(value, "guests")) {
    const guests = parseGuests(value.guests);
    if (guests === null) {
      throw new Error("Invalid stay.guests");
    }
    patch.guests = guests;
  }

  if (Object.prototype.hasOwnProperty.call(value, "extraIds")) {
    const extraIds = parseExtraIds(value.extraIds);
    if (!extraIds) {
      throw new Error("Invalid stay.extraIds");
    }
    patch.extraIds = extraIds;
  }

  return patch;
}

function parseGuestPatch(value: unknown): Partial<GuestDetailsInput> | null {
  if (!isRecord(value)) {
    return null;
  }

  const patch: Partial<GuestDetailsInput> = {};

  if (Object.prototype.hasOwnProperty.call(value, "firstName")) {
    const parsed = parseString(value.firstName);
    if (!parsed) {
      throw new Error("Invalid guest.firstName");
    }
    patch.firstName = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(value, "lastName")) {
    const parsed = parseString(value.lastName);
    if (!parsed) {
      throw new Error("Invalid guest.lastName");
    }
    patch.lastName = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(value, "email")) {
    const parsed = parseString(value.email);
    if (!parsed) {
      throw new Error("Invalid guest.email");
    }
    patch.email = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(value, "phone")) {
    const parsed = parseString(value.phone);
    if (!parsed) {
      throw new Error("Invalid guest.phone");
    }
    patch.phone = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(value, "specialRequests")) {
    if (typeof value.specialRequests !== "string") {
      throw new Error("Invalid guest.specialRequests");
    }
    patch.specialRequests = value.specialRequests;
  }

  return patch;
}

export function parseDraftInput(body: Record<string, unknown>): DraftCreateInput | DraftUpdateInput {
  const input: DraftCreateInput = {};

  if (Object.prototype.hasOwnProperty.call(body, "stay")) {
    const stay = parseStayPatch(body.stay);
    if (!stay) {
      throw new Error("Invalid stay payload");
    }
    input.stay = stay;
  }

  if (Object.prototype.hasOwnProperty.call(body, "guest")) {
    const guest = parseGuestPatch(body.guest);
    if (!guest) {
      throw new Error("Invalid guest payload");
    }
    input.guest = guest;
  }

  if (Object.prototype.hasOwnProperty.call(body, "paymentMethod")) {
    if (body.paymentMethod === null) {
      input.paymentMethod = null;
    } else {
      const paymentMethod = parsePaymentMethod(body.paymentMethod);
      if (!paymentMethod) {
        throw new Error("Invalid payment method");
      }
      input.paymentMethod = paymentMethod;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "progressContext")) {
    const progressContext = parseProgressContext(body.progressContext);
    if (!progressContext) {
      throw new Error("Invalid progressContext payload");
    }
    input.progressContext = progressContext;
  }

  return input;
}

export function parseStayDetailsInput(body: Record<string, unknown>, key: string = "stay"): StayDetailsInput {
  const patch = parseStayPatch(body[key]);

  if (!patch || !patch.flatId || !patch.checkIn || !patch.checkOut || !patch.guests || !patch.extraIds) {
    throw new Error("Invalid stay payload");
  }

  return {
    flatId: patch.flatId,
    checkIn: patch.checkIn,
    checkOut: patch.checkOut,
    guests: patch.guests,
    extraIds: patch.extraIds,
  };
}

export function parsePaymentMethodInput(body: Record<string, unknown>, key: string): PaymentMethod {
  const method = parsePaymentMethod(body[key]);
  if (!method) {
    throw new Error(`Invalid ${key}`);
  }

  return method;
}

export function parseOfflinePaymentMethod(
  body: Record<string, unknown>,
  key: string
): Exclude<PaymentMethod, "website"> {
  const method = parsePaymentMethodInput(body, key);
  if (method === "website") {
    throw new Error(`${key} must be 'transfer' or 'pos'.`);
  }

  return method;
}

export function parseAvailabilityCheckpointInput(
  body: Record<string, unknown>,
  key: string = "checkpoint"
): AvailabilityCheckpoint {
  const value = body[key];
  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}`);
  }

  if (!AVAILABILITY_CHECKPOINTS.includes(value as AvailabilityCheckpoint)) {
    throw new Error(`Invalid ${key}`);
  }

  return value as AvailabilityCheckpoint;
}
