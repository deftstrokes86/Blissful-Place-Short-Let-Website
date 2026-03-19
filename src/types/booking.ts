import type { LucideIcon } from "@/lib/lucide-react";

export type BookingId = string;
export type BookingToken = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type FlatId = "windsor" | "kensington" | "mayfair";
export type ExtraId = "airport" | "pantry" | "celebration";
export type PaymentMethod = "website" | "transfer" | "pos";

export type BookingStepLabels = [string, string, string, string, string, string];
export type BookingStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type ReservationStatus =
  | "draft"
  | "pending_online_payment"
  | "pending_transfer_submission"
  | "awaiting_transfer_verification"
  | "pending_pos_coordination"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "failed_payment";

export type ReservationEventType =
  | "stay_details_submitted"
  | "payment_method_selected"
  | "branch_request_created"
  | "online_payment_handoff_requested"
  | "online_payment_confirmed"
  | "online_payment_cancelled"
  | "online_payment_failed"
  | "try_online_payment_again"
  | "switch_payment_method"
  | "transfer_proof_submitted"
  | "transfer_verified"
  | "transfer_hold_expired"
  | "pos_payment_completed"
  | "cancel_requested";

export type AvailabilityCheckpoint =
  | "stay_details_entry"
  | "pre_hold_request"
  | "pre_online_payment_handoff"
  | "pre_transfer_confirmation"
  | "pre_pos_confirmation";

export type BookingActor = "guest" | "staff" | "system";

export type SharedStepId = "stay_details" | "guest_details" | "payment_method";
export type WebsiteBranchStepId = SharedStepId | "review_checkout" | "payment_portal" | "booking_confirmed";
export type TransferBranchStepId = SharedStepId | "review_reservation" | "transfer_details" | "awaiting_payment_confirmation";
export type PosBranchStepId = SharedStepId | "review_reservation" | "pos_coordination" | "reservation_request_submitted";
export type BranchStepId = WebsiteBranchStepId | TransferBranchStepId | PosBranchStepId;

export interface FlatOption {
  id: FlatId;
  name: string;
  rate: number;
  blurb: string;
}

export interface ExtraOption {
  id: ExtraId;
  title: string;
  price: number;
  desc: string;
  icon: LucideIcon;
}

export interface PaymentOption {
  id: PaymentMethod;
  title: string;
  desc: string;
  reassurance: string;
}

export interface StayDetailsInput {
  flatId: FlatId;
  checkIn: ISODateString;
  checkOut: ISODateString;
  guests: number;
  extraIds: ExtraId[];
}

export interface GuestDetailsInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

export interface StayFormState {
  flatId: FlatId | "";
  checkIn: ISODateString | "";
  checkOut: ISODateString | "";
  guests: number;
  extraIds: ExtraId[];
}

export interface GuestFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

export interface StayTouchedState {
  flatId: boolean;
  checkIn: boolean;
  checkOut: boolean;
  guests: boolean;
}

export interface GuestTouchedState {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
}

export interface WebsiteTransientState {
  outcome: "idle" | "failed" | "cancelled" | "success";
  message: string | null;
  isProcessing: boolean;
}

export interface TransferTransientState {
  reference: string;
  proofNote: string;
  holdExpiresAt: number | null;
  error: string | null;
  isSubmitting: boolean;
}

export interface PosTransientState {
  contactWindow: string;
  note: string;
  error: string | null;
  isSubmitting: boolean;
  requestSubmitted: boolean;
}

export interface StayValidation {
  flatId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: string | null;
}

export interface GuestValidation {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

export interface ValidationError<TField extends string = string> {
  field: TField;
  code: string;
  message: string;
}

export interface ValidationResult<TField extends string = string> {
  isValid: boolean;
  errors: ValidationError<TField>[];
}

export interface AvailabilityConflict {
  code: "sold_out" | "invalid_window" | "capacity_exceeded" | "lead_time_violation" | "unknown";
  message: string;
  field: "stay" | "flat" | "dates" | "guests" | "reservation";
}

export interface AvailabilityResult {
  checkpoint: AvailabilityCheckpoint;
  isAvailable: boolean;
  checkedAt: ISODateTimeString;
  reasons: string[];
  conflicts: AvailabilityConflict[];
  inventoryVersion: string;
}

export interface BookingReviewLabels {
  residence: string;
  nights: string;
  guests: string;
}

export interface PricingBreakdown {
  currency: "NGN";
  nightlyRate: number;
  nights: number;
  staySubtotal: number;
  extrasSubtotal: number;
  estimatedTotal: number;
}

export interface BookingDraftRecord {
  id: BookingId;
  token: BookingToken;
  stay: StayFormState;
  guest: GuestFormState;
  paymentMethod: PaymentMethod | null;
  reservationStatus: ReservationStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface TransferHoldRecord {
  startedAt: ISODateTimeString;
  expiresAt: ISODateTimeString;
  durationMs: number;
  isExpired: boolean;
}

export interface ReservationRecord {
  id: BookingId;
  token: BookingToken;
  status: ReservationStatus;
  paymentMethod: PaymentMethod;
  stay: StayDetailsInput;
  guest: GuestDetailsInput;
  pricing: PricingBreakdown;
  transferHold: TransferHoldRecord | null;
  lastAvailability: AvailabilityResult | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  confirmedAt: ISODateTimeString | null;
  cancelledAt: ISODateTimeString | null;
}

export interface ReservationEvent {
  type: ReservationEventType;
  actor: BookingActor;
  at: ISODateTimeString;
  metadata: Record<string, string | number | boolean | null>;
}

