import type {
  AvailabilityResult,
  BookingActor,
  BookingId,
  BookingToken,
  ExtraId,
  FlatId,
  GuestDetailsInput,
  ISODateString,
  ISODateTimeString,
  PaymentMethod,
  ReservationEventType,
  ReservationStatus,
  StayDetailsInput,
} from "@/types/booking";

export interface FlatRecord {
  id: FlatId;
  name: string;
  nightlyRate: number;
  maxGuests: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ExtraRecord {
  id: ExtraId;
  title: string;
  flatFee: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ReservationPricingSnapshot {
  currency: "NGN";
  nightlyRate: number | null;
  nights: number | null;
  staySubtotal: number | null;
  extrasSubtotal: number;
  estimatedTotal: number | null;
}

export type DraftProgressStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface DraftProgressContext {
  currentStep: DraftProgressStep | null;
  activeBranch: PaymentMethod | null;
}

export interface DraftProgressContextInput {
  currentStep?: DraftProgressStep | null;
  activeBranch?: PaymentMethod | null;
}

export interface ReservationDraftPayload {
  stay: StayDetailsInput;
  guest: GuestDetailsInput;
  paymentMethod: PaymentMethod | null;
}

export interface ReservationRecord {
  id: BookingId;
  token: BookingToken;
  status: ReservationStatus;
  stay: StayDetailsInput;
  guest: GuestDetailsInput;
  paymentMethod: PaymentMethod | null;
  pricing: ReservationPricingSnapshot;
  progressContext: DraftProgressContext;
  transferHoldStartedAt: ISODateTimeString | null;
  transferHoldExpiresAt: ISODateTimeString | null;
  inventoryReopenedAt: ISODateTimeString | null;
  lastAvailabilityResult: AvailabilityResult | null;
  confirmedAt: ISODateTimeString | null;
  cancelledAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  lastTouchedAt: ISODateTimeString;
}

export type PaymentAttemptOutcome = "pending" | "success" | "failed" | "cancelled";

export interface PaymentAttemptRecord {
  id: string;
  reservationId: BookingId;
  paymentMethod: "website";
  provider: "prototype_gateway" | "flutterwave";
  outcome: PaymentAttemptOutcome;
  amount: number;
  currency: "NGN";
  providerReference: string | null;
  idempotencyKey: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type TransferVerificationStatus = "pending" | "verified" | "rejected" | "expired";

export interface TransferVerificationMetadataRecord {
  id: string;
  reservationId: BookingId;
  transferReference: string;
  proofNote: string;
  proofReceivedAt: ISODateTimeString;
  verificationStatus: TransferVerificationStatus;
  verifiedByStaffId: string | null;
  verifiedAt: ISODateTimeString | null;
  verificationNote: string | null;
  idempotencyKey: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type PosCoordinationStatus = "requested" | "completed" | "cancelled";

export interface PosCoordinationMetadataRecord {
  id: string;
  reservationId: BookingId;
  contactWindow: string;
  coordinationNote: string | null;
  status: PosCoordinationStatus;
  requestedAt: ISODateTimeString;
  completedAt: ISODateTimeString | null;
  completedByStaffId: string | null;
  idempotencyKey: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type AvailabilityBlockSourceType = "reservation" | "manual";
export type AvailabilityBlockType = "hard_block" | "soft_hold";
export type AvailabilityBlockStatus = "active" | "released";
export type ManualAvailabilityBlockType = "maintenance" | "owner_blackout" | "admin_block";

export interface AvailabilityBlockRecord {
  id: string;
  flatId: FlatId;
  sourceType: AvailabilityBlockSourceType;
  sourceId: string;
  blockType: AvailabilityBlockType;
  manualBlockType: ManualAvailabilityBlockType | null;
  startDate: ISODateString;
  endDate: ISODateString;
  reason: string | null;
  notes: string | null;
  createdBy: string | null;
  status: AvailabilityBlockStatus;
  expiresAt: ISODateTimeString | null;
  releasedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface IdempotencyKeyRecord {
  key: string;
  action: string;
  reservationId: BookingId | null;
  payloadHash: string;
  responseSnapshot: string;
  createdAt: ISODateTimeString;
  expiresAt: ISODateTimeString | null;
}

export interface ReservationEventRecord {
  id: string;
  reservationId: BookingId;
  type: ReservationEventType;
  actor: BookingActor;
  at: ISODateTimeString;
  metadata: Record<string, string | number | boolean | null>;
}

export type NotificationChannel = "email" | "internal";
export type NotificationAudience = "guest" | "staff";
export type NotificationStatus = "pending" | "sent" | "failed";

export type NotificationEventType =
  | "reservation_request_received"
  | "transfer_pending_confirmation"
  | "booking_confirmed"
  | "pending_transfer_created"
  | "transfer_proof_submitted"
  | "pending_pos_created"
  | "reservation_cancelled_staff_alert"
  | "reservation_confirmed_staff_alert"
  | "reservation_expired"
  | "website_payment_pending"
  | "website_payment_confirmed"
  | "website_payment_failed"
  | "transfer_payment_pending"
  | "transfer_payment_awaiting_verification"
  | "transfer_payment_confirmed"
  | "pos_request_submitted"
  | "pos_payment_confirmed"
  | "reservation_cancelled"
  | "reservation_expired_or_hold_expired"
  | "staff_transfer_pending_created"
  | "staff_transfer_proof_submitted"
  | "staff_pos_pending_created"
  | "staff_reservation_cancelled"
  | "staff_reservation_confirmed"
  | "staff_transfer_hold_nearing_expiry";

export type NotificationTemplateKey = NotificationEventType;
export interface ReservationNotificationRecord {
  id: string;
  eventType: NotificationEventType;
  templateKey: NotificationTemplateKey;
  audience: NotificationAudience;
  channel: NotificationChannel;
  recipient: string;
  title: string;
  body: string | null;
  templateRef: string | null;
  status: NotificationStatus;
  dedupeKey: string;
  payload: Record<string, string | number | boolean | null>;
  reservationId: BookingId | null;
  reservationToken: BookingToken | null;
  paymentAttemptId: string | null;
  errorMessage: string | null;
  sentAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface BookingDatabaseState {
  flats: FlatRecord[];
  extras: ExtraRecord[];
  reservations: ReservationRecord[];
  availabilityBlocks: AvailabilityBlockRecord[];
  paymentAttempts: PaymentAttemptRecord[];
  transferVerifications: TransferVerificationMetadataRecord[];
  posCoordinations: PosCoordinationMetadataRecord[];
  reservationEvents: ReservationEventRecord[];
  reservationNotifications: ReservationNotificationRecord[];
  idempotencyKeys: IdempotencyKeyRecord[];
}

export interface DraftCreateInput {
  stay?: Partial<StayDetailsInput>;
  guest?: Partial<GuestDetailsInput>;
  paymentMethod?: PaymentMethod | null;
  progressContext?: DraftProgressContextInput;
}

export interface DraftUpdateInput {
  stay?: Partial<StayDetailsInput>;
  guest?: Partial<GuestDetailsInput>;
  paymentMethod?: PaymentMethod | null;
  progressContext?: DraftProgressContextInput;
}



