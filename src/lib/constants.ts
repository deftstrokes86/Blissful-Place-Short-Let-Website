import {
  Plane,
  ShoppingBag,
  Sparkles,
} from "@/lib/lucide-react";
import type {
  FlatOption,
  ExtraOption,
  PaymentOption,
  ReservationStatus,
  PaymentMethod,
  StayFormState,
  GuestFormState,
  StayTouchedState,
  GuestTouchedState,
  WebsiteTransientState,
  TransferTransientState,
  PosTransientState,
} from "@/types/booking";

export const FLATS: FlatOption[] = [
  {
    id: "windsor",
    name: "Windsor Residence",
    rate: 120000,
    blurb: "Warm, restful interiors designed for unwinding after a long journey.",
  },
  {
    id: "kensington",
    name: "Kensington Lodge",
    rate: 120000,
    blurb: "Clean, orderly layout suited for focused work and quiet stays.",
  },
  {
    id: "mayfair",
    name: "Mayfair Suite",
    rate: 120000,
    blurb: "Bold finishing touches for guests who appreciate a statement setting.",
  },
];

export const EXTRAS: ExtraOption[] = [
  {
    id: "airport",
    title: "Premium Airport Transfer",
    price: 30000,
    desc: "Chauffeur pickup from MMA to your residence.",
    icon: Plane,
  },
  {
    id: "pantry",
    title: "Pantry Pre-Stocking",
    price: 50000,
    desc: "Premium grocery and beverage setup before arrival.",
    icon: ShoppingBag,
  },
  {
    id: "celebration",
    title: "Celebration Setup",
    price: 75000,
    desc: "Curated decor and setup for special moments.",
    icon: Sparkles,
  },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "website",
    title: "Pay via Website",
    desc: "Checkout-oriented path with payment portal handoff.",
    reassurance: "Best for immediate confirmation after successful payment.",
  },
  {
    id: "transfer",
    title: "Bank Transfer",
    desc: "Guided transfer flow with proof submission and staff verification.",
    reassurance: "Hold lasts up to 1 hour pending proof and verification.",
  },
  {
    id: "pos",
    title: "POS",
    desc: "Staff-assisted card payment coordination after request submission.",
    reassurance: "Reservation remains pending until POS payment is completed.",
  },
];

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  draft: "Draft",
  pending_online_payment: "Pending Online Payment",
  pending_transfer_submission: "Pending Transfer Submission",
  awaiting_transfer_verification: "Awaiting Transfer Verification",
  pending_pos_coordination: "Pending POS Coordination",
  confirmed: "Confirmed",
  expired: "Hold Expired",
  cancelled: "Cancelled",
  failed_payment: "Failed Payment",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  website: "Pay via Website",
  transfer: "Bank Transfer",
  pos: "POS",
};

export const TRANSFER_HOLD_MS = 60 * 60 * 1000;

export const INITIAL_STAY: StayFormState = {
  flatId: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
  extraIds: [],
};

export const INITIAL_GUEST: GuestFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialRequests: "",
};

export const INITIAL_STAY_TOUCHED: StayTouchedState = {
  flatId: false,
  checkIn: false,
  checkOut: false,
  guests: false,
};

export const INITIAL_GUEST_TOUCHED: GuestTouchedState = {
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
};

export const INITIAL_WEBSITE_STATE: WebsiteTransientState = {
  outcome: "idle",
  message: null,
  isProcessing: false,
};

export const INITIAL_TRANSFER_STATE: TransferTransientState = {
  reference: "",
  proofNote: "",
  holdExpiresAt: null,
  error: null,
  isSubmitting: false,
};

export const INITIAL_POS_STATE: PosTransientState = {
  contactWindow: "",
  note: "",
  error: null,
  isSubmitting: false,
  requestSubmitted: false,
};

export const STEP0 = 0;
export const STEP1 = 1;
export const STEP2 = 2;
export const STEP3 = 3;
export const STEP4 = 4;
export const STEP5 = 5;

