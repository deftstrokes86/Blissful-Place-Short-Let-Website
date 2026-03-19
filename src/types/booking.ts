import type { LucideIcon } from "@/lib/lucide-react";

export type FlatId = "windsor" | "kensington" | "mayfair";
export type ExtraId = "airport" | "pantry" | "celebration";
export type PaymentMethod = "website" | "transfer" | "pos";
export type BookingStepLabels = [string, string, string, string, string, string];

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

export interface StayFormState {
  flatId: FlatId | "";
  checkIn: string;
  checkOut: string;
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
