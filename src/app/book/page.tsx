"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  EXTRAS,
  FLATS,
  INITIAL_GUEST,
  INITIAL_GUEST_TOUCHED,
  INITIAL_POS_STATE,
  INITIAL_STAY,
  INITIAL_STAY_TOUCHED,
  INITIAL_TRANSFER_STATE,
  INITIAL_WEBSITE_STATE,
  STEP0,
  STEP1,
  STEP2,
  STEP3,
  STEP4,
  STEP5,
  TRANSFER_HOLD_MS,
} from "@/lib/constants";
import {
  getAvailabilityReasonForStep,
  getBranchStepLabels,
  getContinueLabel,
  getOutcomeStepLabel,
  getPendingStatusForMethod,
  isContinueDisabled,
  shouldShowContinueButton,
} from "@/lib/booking-branch-config";
import { calculateBookingPricing, createBookingReviewLabels } from "@/lib/booking-pricing";
import { getNextReservationState, isWithinTransferHold, resolveTransition } from "@/lib/booking-state-machine";
import {
  createBookingDraft,
  createIdempotencyKey,
  fetchCalendarMonthAvailability,
  initiateWebsiteCheckout,
  loadBookingDraft,
  revalidateResumedDraftProgression,
  runAvailabilityCheckpoint as runAvailabilityCheckpointRequest,
  saveBookingDraftProgress,
  type BookingDraftPayload,
  type CalendarBlockedSpanResponse,
  type DraftSnapshotResponse,
  type DraftReservationSnapshot,
} from "@/lib/booking-frontend-api";
import { deriveResumeStepIndex } from "@/lib/booking-draft-resume";
import {
  applyFlatPreselectionToStay,
  deriveFlatSelectionContextNote,
  resolveBookingFlatPreselection,
  type BookingFlatPreselectionSource,
} from "@/lib/booking-flat-preselection";
import { deriveBookingResumeUxState } from "@/lib/booking-resume-ux";
import { formatTransferHoldLabel, wait } from "@/lib/booking-utils";
import {
  getGuestValidationState,
  getStayValidationState,
  isGuestValidationReady,
  isStayValidationReady,
  validateBranchProgression,
} from "@/lib/booking-validation";

import { BookingFlowControls } from "@/components/booking/BookingFlowControls";
import { BookingInlineNotices } from "@/components/booking/BookingInlineNotices";
import { BookingPageIntro } from "@/components/booking/BookingPageIntro";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { BranchActionStep } from "@/components/booking/steps/BranchActionStep";
import { BranchOutcomeStep } from "@/components/booking/steps/BranchOutcomeStep";
import { BranchReviewStep } from "@/components/booking/steps/BranchReviewStep";
import { GuestDetailsStep } from "@/components/booking/steps/GuestDetailsStep";
import { PaymentMethodStep } from "@/components/booking/steps/PaymentMethodStep";
import { StayDetailsStep } from "@/components/booking/steps/StayDetailsStep";
import type {
  AvailabilityCheckpoint,
  ExtraId,
  GuestFormState,
  GuestTouchedState,
  PaymentMethod,
  PosTransientState,
  ReservationStatus,
  StayFormState,
  StayTouchedState,
  TransferTransientState,
  WebsiteTransientState,
} from "@/types/booking";
const DRAFT_TOKEN_STORAGE_KEY = "blissful.booking.resumeToken";
type DraftProgressStep = 0 | 1 | 2 | 3 | 4 | 5;

function hasCompleteDraftStay(stay: StayFormState): boolean {
  return Boolean(stay.flatId) && Boolean(stay.checkIn) && Boolean(stay.checkOut) && stay.guests > 0;
}

function hasCompleteDraftGuest(guest: GuestFormState): boolean {
  return (
    guest.firstName.trim().length > 0 &&
    guest.lastName.trim().length > 0 &&
    guest.email.trim().length > 0 &&
    guest.phone.trim().length > 0
  );
}

function toDraftSnapshotStay(stay: DraftReservationSnapshot["stay"]): StayFormState {
  return {
    flatId: stay.flatId,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: stay.guests,
    extraIds: [...stay.extraIds],
  };
}

function toDraftSnapshotGuest(guest: DraftReservationSnapshot["guest"]): GuestFormState {
  return {
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    specialRequests: guest.specialRequests,
  };
}

function toProgressStepIndex(step: number | null | undefined): DraftProgressStep | null {
  if (step === null || step === undefined) {
    return null;
  }

  if (step < STEP0 || step > STEP5) {
    return null;
  }

  return step as DraftProgressStep;
}

function getResumeStepIndexFromSnapshot(
  snapshot: DraftSnapshotResponse,
  fallback: {
    paymentMethod: PaymentMethod | null;
    stayReady: boolean;
    guestReady: boolean;
  }
): number {
  const savedProgressStep = toProgressStepIndex(snapshot.reservation.progressContext.currentStep);
  if (savedProgressStep !== null) {
    return savedProgressStep;
  }

  const branchSavedStep = toProgressStepIndex(snapshot.branchContext.savedProgressStep);
  if (branchSavedStep !== null) {
    return branchSavedStep;
  }

  const branchResumeStep = toProgressStepIndex(snapshot.branchContext.resumeStepIndex);
  if (branchResumeStep !== null) {
    return branchResumeStep;
  }

  return deriveResumeStepIndex({
    status: snapshot.reservation.status,
    paymentMethod: fallback.paymentMethod,
    stayReady: fallback.stayReady,
    guestReady: fallback.guestReady,
  });
}

function getResumeAvailabilityNotice(snapshot: DraftSnapshotResponse): string | null {
  const checkpoints = snapshot.availabilityRevalidationNeeds.requiredCheckpoints;

  if (checkpoints.includes("pre_online_payment_handoff")) {
    return "Availability will be rechecked before secure payment handoff.";
  }

  if (checkpoints.includes("pre_transfer_confirmation")) {
    return "Availability will be rechecked before transfer verification can confirm your reservation.";
  }

  if (checkpoints.includes("pre_pos_confirmation")) {
    return "Availability will be rechecked before POS confirmation can complete your reservation.";
  }

  if (checkpoints.includes("pre_hold_request")) {
    return "Saved draft loaded. Dates are not reserved yet and will be rechecked before branch request creation.";
  }

  return null;
}


export default function BookingPage() {
  const [stay, setStay] = useState<StayFormState>(INITIAL_STAY);
  const [guest, setGuest] = useState<GuestFormState>(INITIAL_GUEST);
  const [stayTouched, setStayTouched] = useState<StayTouchedState>(INITIAL_STAY_TOUCHED);
  const [guestTouched, setGuestTouched] = useState<GuestTouchedState>(INITIAL_GUEST_TOUCHED);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(STEP0);
  const [reservationStatus, setReservationStatus] = useState<ReservationStatus>("draft");

  const [websiteState, setWebsiteState] = useState<WebsiteTransientState>(INITIAL_WEBSITE_STATE);
  const [transferState, setTransferState] = useState<TransferTransientState>(INITIAL_TRANSFER_STATE);
  const [posState, setPosState] = useState<PosTransientState>(INITIAL_POS_STATE);

  const [availabilityNote, setAvailabilityNote] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [branchResetNotice, setBranchResetNotice] = useState<string | null>(null);
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [blockedDateSpans, setBlockedDateSpans] = useState<CalendarBlockedSpanResponse[]>([]);
  const [isLoadingBlockedDates, setIsLoadingBlockedDates] = useState(false);
  const [blockedDatesError, setBlockedDatesError] = useState<string | null>(null);
  const [isHydratingDraft, setIsHydratingDraft] = useState(true);
  const [isPersistingDraft, setIsPersistingDraft] = useState(false);
  const [isResumingDraft, setIsResumingDraft] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const [staleAvailabilityRecoveryNotice, setStaleAvailabilityRecoveryNotice] = useState<string | null>(null);
  const [flatPreselectionSource, setFlatPreselectionSource] = useState<BookingFlatPreselectionSource>("none");
  const [urlRequestedFlatParam, setUrlRequestedFlatParam] = useState<string | null>(null);

  // Prevent duplicate prototype submissions when branch actions are triggered quickly.
  const branchActionLockRef = useRef(false);
  const draftPersistCountRef = useRef(0);
  const [isBranchActionLocked, setIsBranchActionLocked] = useState(false);
  const checkInInputRef = useRef<HTMLInputElement | null>(null);
  const checkOutInputRef = useRef<HTMLInputElement | null>(null);

  const stepLabels = useMemo(() => getBranchStepLabels(paymentMethod), [paymentMethod]);
  const selectedFlat = useMemo(() => FLATS.find((flat) => flat.id === stay.flatId) ?? null, [stay.flatId]);
  const selectedExtras = useMemo(() => EXTRAS.filter((extra) => stay.extraIds.includes(extra.id)), [stay.extraIds]);

  const { nights, extrasSubtotal, staySubtotal, estimatedTotal } = useMemo(
    () =>
      calculateBookingPricing({
        selectedFlatRate: selectedFlat?.rate ?? null,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        selectedExtraIds: stay.extraIds,
        extrasCatalog: EXTRAS,
      }),
    [selectedFlat?.rate, stay.checkIn, stay.checkOut, stay.extraIds],
  );

  const stayValidation = useMemo(() => getStayValidationState(stay), [stay]);
  const guestValidation = useMemo(() => getGuestValidationState(guest), [guest]);

  const stayReady = isStayValidationReady(stayValidation);
  const guestReady = isGuestValidationReady(guestValidation);

  const guestName = `${guest.firstName} ${guest.lastName}`.trim();
  const transferTimeLeft = formatTransferHoldLabel(transferState.holdExpiresAt);
  const reviewLabels = useMemo(
    () =>
      createBookingReviewLabels({
        residenceName: selectedFlat?.name ?? null,
        nights,
        guests: stay.guests,
      }),
    [selectedFlat?.name, nights, stay.guests],
  );

  const flatSelectionContextNote = useMemo(
    () =>
      deriveFlatSelectionContextNote({
        urlFlatParam: urlRequestedFlatParam,
        preselectionSource: flatPreselectionSource,
        activeFlatId: stay.flatId,
      }),
    [urlRequestedFlatParam, flatPreselectionSource, stay.flatId],
  );

  const blockedDateSelectionWarning = useMemo(() => {
    if (!stay.checkIn || !stay.checkOut) {
      return null;
    }

    const overlapsBlockedSpan = blockedDateSpans.some(
      (span) => stay.checkIn < span.endDate && span.startDate < stay.checkOut
    );

    if (!overlapsBlockedSpan) {
      return null;
    }

    return "Selected stay overlaps unavailable dates for this residence.";
  }, [stay.checkIn, stay.checkOut, blockedDateSpans]);

  const blockedDateSummary = useMemo(() => {
    if (!selectedFlat) {
      return "Select a residence to load blocked dates.";
    }

    if (blockedDateSpans.length === 0) {
      return `No blocked dates currently recorded for ${selectedFlat.name}.`;
    }

    const preview = blockedDateSpans
      .slice(0, 3)
      .map((span) => {
        const statusLabel = span.blockType === "soft_hold" ? "Held" : "Booked";
        return `${span.startDate} to ${span.endDate} (${statusLabel})`;
      })
      .join(" | ");

    const suffix = blockedDateSpans.length > 3 ? " | ..." : "";
    return `Unavailable ranges for ${selectedFlat.name}: ${preview}${suffix}`;
  }, [blockedDateSpans, selectedFlat]);

  const monthQueries = useMemo(() => {
    const unique = new Set<string>();
    const result: Array<{ year: number; month: number }> = [];

    const now = new Date();
    const checkInDate = stay.checkIn ? new Date(`${stay.checkIn}T00:00:00`) : now;
    const checkOutDate = stay.checkOut ? new Date(`${stay.checkOut}T00:00:00`) : null;

    const pushQuery = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (unique.has(key)) {
        return;
      }

      unique.add(key);
      result.push({ year, month });
    };

    pushQuery(checkInDate);

    if (checkOutDate) {
      pushQuery(checkOutDate);
    }

    return result;
  }, [stay.checkIn, stay.checkOut]);

  useEffect(() => {
    if (!selectedFlat) {
      setBlockedDateSpans([]);
      setBlockedDatesError(null);
      setIsLoadingBlockedDates(false);
      return;
    }

    let cancelled = false;

    setIsLoadingBlockedDates(true);
    setBlockedDatesError(null);

    Promise.all(
      monthQueries.map((query) =>
        fetchCalendarMonthAvailability({
          flatId: selectedFlat.id,
          year: query.year,
          month: query.month,
        })
      )
    )
      .then((results) => {
        if (cancelled) {
          return;
        }

        const uniqueSpans = new Map<string, CalendarBlockedSpanResponse>();

        for (const monthResult of results) {
          for (const span of monthResult.blockedSpans) {
            const key = `${span.blockId}:${span.startDate}:${span.endDate}:${span.blockType}`;
            uniqueSpans.set(key, span);
          }
        }

        const sorted = Array.from(uniqueSpans.values()).sort(
          (left, right) => left.startDate.localeCompare(right.startDate) || left.endDate.localeCompare(right.endDate)
        );

        setBlockedDateSpans(sorted);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setBlockedDateSpans([]);
        setBlockedDatesError(getRequestErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingBlockedDates(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFlat, monthQueries]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (draftToken) {
        window.localStorage.setItem(DRAFT_TOKEN_STORAGE_KEY, draftToken);
      } else {
        window.localStorage.removeItem(DRAFT_TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors and keep booking flow usable.
    }
  }, [draftToken]);

  useEffect(() => {
    let active = true;

    async function hydrateDraftFromStorage(): Promise<void> {
      if (typeof window === "undefined") {
        if (active) {
          setIsHydratingDraft(false);
        }
        return;
      }

      let resumeToken: string | null = null;
      let urlFlatParam: string | null = null;
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryToken = searchParams.get("draft");
        urlFlatParam = searchParams.get("flat");
        const storedToken = window.localStorage.getItem(DRAFT_TOKEN_STORAGE_KEY);
        resumeToken = queryToken ?? storedToken;
      } catch {
        resumeToken = null;
        urlFlatParam = null;
      }

      if (active) {
        setUrlRequestedFlatParam(urlFlatParam);
      }

      if (!resumeToken) {
        if (active) {
          const preselection = resolveBookingFlatPreselection({
            resumedDraftFlatId: null,
            urlFlatParam,
          });
          setStay((current) => applyFlatPreselectionToStay(current, preselection.flatId));
          setFlatPreselectionSource(preselection.source);
          setIsResumingDraft(false);
          setIsHydratingDraft(false);
        }
        return;
      }

      if (active) {
        setIsResumingDraft(true);
        setShowDraftRestoredNotice(false);
      }

      try {
        const snapshot = await loadBookingDraft(resumeToken);
        if (!active) {
          return;
        }

        const restoredStay = toDraftSnapshotStay(snapshot.reservation.stay);
        const restoredGuest = toDraftSnapshotGuest(snapshot.reservation.guest);
        const restoredPaymentMethod = snapshot.branchContext.resolvedPaymentMethod;
        const resumeStep = getResumeStepIndexFromSnapshot(snapshot, {
          paymentMethod: restoredPaymentMethod,
          stayReady: hasCompleteDraftStay(restoredStay),
          guestReady: hasCompleteDraftGuest(restoredGuest),
        });

        const parsedHoldExpiresAt = snapshot.reservation.transferHoldExpiresAt
          ? new Date(snapshot.reservation.transferHoldExpiresAt).getTime()
          : null;

        const holdExpiresAt =
          parsedHoldExpiresAt !== null && Number.isFinite(parsedHoldExpiresAt)
            ? parsedHoldExpiresAt
            : null;

        setStay(restoredStay);
        setGuest(restoredGuest);
        setStayTouched(INITIAL_STAY_TOUCHED);
        setGuestTouched(INITIAL_GUEST_TOUCHED);
        setPaymentMethod(restoredPaymentMethod);
        setPaymentTouched(Boolean(restoredPaymentMethod));
        setReservationStatus(snapshot.reservation.status);
        setStepIndex(resumeStep);

        setWebsiteState(INITIAL_WEBSITE_STATE);
        setTransferState({
          ...INITIAL_TRANSFER_STATE,
          holdExpiresAt: restoredPaymentMethod === "transfer" ? holdExpiresAt : null,
        });
        setPosState(INITIAL_POS_STATE);
        setDraftToken(snapshot.resumeToken);
        setAvailabilityNote(getResumeAvailabilityNotice(snapshot));
        setShowDraftRestoredNotice(true);
        setFlowNotice(null);
        setFlatPreselectionSource(restoredStay.flatId ? "draft" : "none");
      } catch (error) {
        if (!active) {
          return;
        }

        try {
          window.localStorage.removeItem(DRAFT_TOKEN_STORAGE_KEY);
        } catch {
          // Ignore storage errors.
        }

        const preselection = resolveBookingFlatPreselection({
          resumedDraftFlatId: null,
          urlFlatParam,
        });
        setStay((current) => applyFlatPreselectionToStay(current, preselection.flatId));
        setFlatPreselectionSource(preselection.source);
        setDraftToken(null);
        setFlowNotice(
          `Saved draft could not be restored: ${getRequestErrorMessage(error)}`
        );
      } finally {
        if (active) {
          setIsResumingDraft(false);
          setIsHydratingDraft(false);
        }
      }
    }

    void hydrateDraftFromStorage();

    return () => {
      active = false;
    };
  }, []);

  function clearBranchTransientState() {
    setWebsiteState(INITIAL_WEBSITE_STATE);
    setTransferState(INITIAL_TRANSFER_STATE);
    setPosState(INITIAL_POS_STATE);
    setFlowNotice(null);
    setAvailabilityNote(null);
  }

  function toggleExtra(id: ExtraId) {
    setStay((current) => ({
      ...current,
      extraIds: current.extraIds.includes(id)
        ? current.extraIds.filter((extraId) => extraId !== id)
        : [...current.extraIds, id],
    }));
  }

  function handleStayChange<K extends keyof StayFormState>(field: K, value: StayFormState[K]) {
    setStay((current) => ({ ...current, [field]: value }));
    if (field === "flatId" || field === "checkIn" || field === "checkOut") {
      setStaleAvailabilityRecoveryNotice(null);
    }
  }

  function handleGuestChange<K extends keyof GuestFormState>(field: K, value: GuestFormState[K]) {
    setGuest((current) => ({ ...current, [field]: value }));
  }

  function markStayTouched(field: keyof StayTouchedState) {
    setStayTouched((current) => ({ ...current, [field]: true }));
  }

  function markGuestTouched(field: keyof GuestTouchedState) {
    setGuestTouched((current) => ({ ...current, [field]: true }));
  }

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) return;

    input.focus();
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
    }
  }

  function beginBranchActionLock(): boolean {
    if (branchActionLockRef.current) {
      return false;
    }

    branchActionLockRef.current = true;
    setIsBranchActionLocked(true);
    return true;
  }

  function endBranchActionLock() {
    branchActionLockRef.current = false;
    setIsBranchActionLocked(false);
  }

  function beginDraftPersistence() {
    draftPersistCountRef.current += 1;
    setIsPersistingDraft(true);
  }

  function endDraftPersistence() {
    draftPersistCountRef.current = Math.max(0, draftPersistCountRef.current - 1);
    if (draftPersistCountRef.current === 0) {
      setIsPersistingDraft(false);
    }
  }

  function createDraftProgressContext(progressStep: number, activeBranch: PaymentMethod | null): NonNullable<BookingDraftPayload["progressContext"]> {
    return {
      currentStep: toProgressStepIndex(progressStep),
      activeBranch,
    };
  }

  function handlePaymentMethodChange(nextMethod: PaymentMethod) {
    if (isHydratingDraft || isPersistingDraft) {
      return;
    }

    if (paymentMethod === nextMethod) {
      return;
    }

    setPaymentTouched(true);
    setBranchResetNotice(null);
    setAvailabilityNote(null);

    if (paymentMethod && paymentMethod !== nextMethod) {
      clearBranchTransientState();
      setReservationStatus("draft");
      setBranchResetNotice(
        "Payment method changed. Path-specific details and messages were reset to preserve shared stay data."
      );
      if (stepIndex > STEP2) {
        setStepIndex(STEP2);
      }
    }

    setPaymentMethod(nextMethod);
    syncDraftPaymentMethod(nextMethod);
  }

  function buildAvailabilityStayInput() {
    if (!stay.flatId || !stay.checkIn || !stay.checkOut || stay.guests < 1) {
      return null;
    }

    return {
      flatId: stay.flatId,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: stay.guests,
      extraIds: [...stay.extraIds],
    };
  }
  function buildGuestDraftInput() {
    if (!hasCompleteDraftGuest(guest)) {
      return null;
    }

    return {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      specialRequests: guest.specialRequests,
    };
  }

  async function upsertDraftProgress(input: {
    payload: BookingDraftPayload;
    progressStep?: number;
    activeBranch?: PaymentMethod | null;
    createIfMissing?: boolean;
    onErrorMessage: string;
  }): Promise<string | null> {
    if (!draftToken && input.createIfMissing === false) {
      return null;
    }

    const payload: BookingDraftPayload = {
      ...input.payload,
      progressContext:
        input.payload.progressContext ??
        createDraftProgressContext(
          input.progressStep ?? stepIndex,
          input.activeBranch === undefined ? paymentMethod : input.activeBranch
        ),
    };

    beginDraftPersistence();

    try {
      if (draftToken) {
        const updated = await saveBookingDraftProgress(draftToken, payload);
        setDraftToken(updated.resumeToken);
        return updated.resumeToken;
      }

      const created = await createBookingDraft(payload);
      setDraftToken(created.resumeToken);
      return created.resumeToken;
    } catch {
      setFlowNotice(input.onErrorMessage);
      return null;
    } finally {
      endDraftPersistence();
    }
  }

  function syncDraftPaymentMethod(nextMethod: PaymentMethod): void {
    void upsertDraftProgress({
      payload: {
        paymentMethod: nextMethod,
      },
      progressStep: STEP2,
      activeBranch: nextMethod,
      createIfMissing: false,
      onErrorMessage: "Payment method changed, but draft sync is temporarily unavailable.",
    });
  }

  async function runAvailabilityCheckpoint(input: {
    checkpoint: AvailabilityCheckpoint;
    reason: string;
    paymentMethod?: PaymentMethod;
  }): Promise<boolean> {
    const stayInput = buildAvailabilityStayInput();

    if (!stayReady || !stayInput) {
      setAvailabilityNote("Complete valid stay details before running availability checks.");
      return false;
    }

    setIsCheckingAvailability(true);

    try {
      const result = await runAvailabilityCheckpointRequest({
        checkpoint: input.checkpoint,
        stay: stayInput,
        paymentMethod: input.paymentMethod,
      });

      if (!result.isAvailable) {
        const firstConflict = result.conflicts[0]?.message;
        const firstReason = result.reasons[0];
        setAvailabilityNote(firstConflict ?? firstReason ?? "Selected dates are currently unavailable.");
        return false;
      }

      setStaleAvailabilityRecoveryNotice(null);
      setAvailabilityNote(`Availability check passed ${input.reason}. Ready to proceed.`);
      return true;
    } catch (error) {
      setAvailabilityNote(getRequestErrorMessage(error));
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  async function runCriticalResumedDraftRevalidation(input: {
    checkpoint:
      | "pre_hold_request"
      | "pre_online_payment_handoff"
      | "pre_transfer_confirmation"
      | "pre_pos_confirmation";
    reason: string;
    paymentMethod?: PaymentMethod;
  }): Promise<boolean> {
    if (!draftToken) {
      return runAvailabilityCheckpoint(input);
    }

    const stayInput = buildAvailabilityStayInput();

    if (!stayReady || !stayInput) {
      setAvailabilityNote("Complete valid stay details before running availability checks.");
      return false;
    }

    setIsCheckingAvailability(true);

    try {
      const result = await revalidateResumedDraftProgression({
        token: draftToken,
        checkpoint: input.checkpoint,
      });

      if (result.canProceed) {
        setStaleAvailabilityRecoveryNotice(null);
        setAvailabilityNote(`Availability check passed ${input.reason}. Ready to proceed.`);
        return true;
      }

      const firstConflict = result.availability.conflicts[0]?.message;
      const firstReason = result.availability.reasons[0];
      const blockingMessage =
        result.blockingMessage ??
        "Saved dates are no longer available. Update your stay details or choose another residence to continue.";

      setAvailabilityNote(firstConflict ?? firstReason ?? result.guidance ?? blockingMessage);
      setFlowNotice(null);
      setShowDraftRestoredNotice(true);
      setStaleAvailabilityRecoveryNotice(blockingMessage);
      setBranchResetNotice(
        "Please update your stay details and continue. Your guest details and preferences are still saved."
      );
      setReservationStatus("draft");
      setStepIndex(STEP0);

      void upsertDraftProgress({
        payload: {},
        progressStep: STEP0,
        activeBranch: paymentMethod,
        createIfMissing: false,
        onErrorMessage: "Draft status updated locally, but save sync is temporarily unavailable.",
      });

      return false;
    } catch (error) {
      setAvailabilityNote(getRequestErrorMessage(error));
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  // Drives the shared pre-branch flow and hands off into the selected payment branch.
  async function handleContinue() {
    if (isBranchActionLocked || isHydratingDraft || isPersistingDraft) {
      return;
    }

    setShowDraftRestoredNotice(false);

    if (stepIndex === STEP0) {
      setStayTouched({ flatId: true, checkIn: true, checkOut: true, guests: true });
      if (!stayReady) return;

      const ok = await runAvailabilityCheckpoint({
        checkpoint: "stay_details_entry",
        reason: getAvailabilityReasonForStep(stepIndex, paymentMethod),
      });

      if (ok) {
        const stayDraft = buildAvailabilityStayInput();
        if (stayDraft) {
          await upsertDraftProgress({
            payload: {
              stay: stayDraft,
            },
            progressStep: STEP1,
            activeBranch: paymentMethod,
            onErrorMessage: "Stay details look good, but draft save is temporarily unavailable.",
          });
        }

        setStepIndex(STEP1);
      }

      return;
    }

    if (stepIndex === STEP1) {
      setGuestTouched({ firstName: true, lastName: true, email: true, phone: true });
      if (guestReady) {
        const guestDraft = buildGuestDraftInput();

        if (guestDraft) {
          await upsertDraftProgress({
            payload: {
              guest: guestDraft,
            },
            progressStep: STEP2,
            activeBranch: paymentMethod,
            createIfMissing: false,
            onErrorMessage: "Guest details are valid, but draft save is temporarily unavailable.",
          });
        }

        setAvailabilityNote(null);
        setStepIndex(STEP2);
      }
      return;
    }

    if (stepIndex === STEP2) {
      setPaymentTouched(true);
      if (!paymentMethod) return;

      const ok = await runAvailabilityCheckpoint({
        checkpoint: "pre_hold_request",
        reason: getAvailabilityReasonForStep(stepIndex, paymentMethod),
        paymentMethod,
      });
      if (!ok) return;

      setBranchResetNotice(null);
      setFlowNotice(null);

      const pendingStatus = resolveTransition({
        from: reservationStatus,
        event: "branch_request_created",
        paymentMethod,
        availabilityPassed: true,
      });

      if (!pendingStatus) {
        return;
      }

      const stayDraft = buildAvailabilityStayInput();
      const guestDraft = buildGuestDraftInput();

      await upsertDraftProgress({
        payload: {
          ...(stayDraft ? { stay: stayDraft } : {}),
          ...(guestDraft ? { guest: guestDraft } : {}),
          paymentMethod,
        },
        progressStep: STEP3,
        activeBranch: paymentMethod,
        onErrorMessage: "Payment method selected, but draft sync is temporarily unavailable.",
      });

      setReservationStatus(pendingStatus);

      if (paymentMethod === "transfer" && !transferState.holdExpiresAt) {
        setTransferState((current) => ({
          ...current,
          holdExpiresAt: Date.now() + TRANSFER_HOLD_MS,
          error: null,
        }));
      }

      setStepIndex(STEP3);
      return;
    }

    if (stepIndex === STEP3) {
      if (!paymentMethod) return;

      if (paymentMethod === "website") {
        const ok = await runAvailabilityCheckpoint({
          checkpoint: "pre_online_payment_handoff",
          reason: getAvailabilityReasonForStep(stepIndex, paymentMethod),
        });
        if (!ok) return;
        setWebsiteState(INITIAL_WEBSITE_STATE);
      } else {
        setAvailabilityNote(null);
      }

      await upsertDraftProgress({
        payload: {},
        progressStep: STEP4,
        activeBranch: paymentMethod,
        createIfMissing: false,
        onErrorMessage: "Progress saved locally, but draft sync is temporarily unavailable.",
      });

      setStepIndex(STEP4);
    }
  }

  function handleBack() {
    if (stepIndex <= STEP0 || isCheckingAvailability || isBranchActionLocked || isHydratingDraft || isPersistingDraft) {
      return;
    }

    const previousStep = stepIndex;
    const nextStep = Math.max(STEP0, stepIndex - 1);

    setStepIndex(nextStep);
    setBranchResetNotice(null);
    setFlowNotice(null);

    void upsertDraftProgress({
      payload: {},
      progressStep: nextStep,
      activeBranch: nextStep >= STEP3 ? paymentMethod : null,
      createIfMissing: false,
      onErrorMessage: "Navigation updated, but draft sync is temporarily unavailable.",
    });

    if (nextStep <= STEP2) {
      setReservationStatus("draft");
      if (previousStep >= STEP3) {
        clearBranchTransientState();
      }
      return;
    }

    if (nextStep === STEP3 && paymentMethod) {
      setReservationStatus(getPendingStatusForMethod(paymentMethod));
      setAvailabilityNote(null);
    }
  }

  function getRequestErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return "Unable to start checkout right now. Please try again.";
  }

  function handleContinueEditingRestoredBooking() {
    setStepIndex(STEP0);
    setFlowNotice(null);
  }

  function handleDismissRestoredNotice() {
    setShowDraftRestoredNotice(false);
  }

  function buildWebsiteDraftPayload(): BookingDraftPayload {
    const stayDraft = buildAvailabilityStayInput();
    const guestDraft = buildGuestDraftInput();

    if (!stayDraft) {
      throw new Error("Complete valid stay details before starting checkout.");
    }

    if (!guestDraft) {
      throw new Error("Complete guest details before starting checkout.");
    }

    return {
      stay: stayDraft,
      guest: guestDraft,
      paymentMethod: "website",
    };
  }

  async function ensureWebsiteDraftToken(): Promise<string> {
    const token = await upsertDraftProgress({
      payload: buildWebsiteDraftPayload(),
      progressStep: STEP4,
      activeBranch: "website",
      onErrorMessage: "Checkout could not save your draft right now.",
    });

    if (!token) {
      throw new Error("Unable to prepare checkout draft.");
    }

    return token;
  }

  async function handleInitiateWebsiteCheckout() {
    if (paymentMethod !== "website") {
      return;
    }

    const availabilityOk = await runCriticalResumedDraftRevalidation({
      checkpoint: "pre_online_payment_handoff",
      reason: "before checkout handoff",
      paymentMethod: "website",
    });

    if (!availabilityOk) {
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setWebsiteState((current) => ({ ...current, isProcessing: true, message: null }));
    setFlowNotice("Preparing secure checkout...");

    try {
      const token = await ensureWebsiteDraftToken();
      const checkout = await initiateWebsiteCheckout({
        token,
        idempotencyKey: createIdempotencyKey("website-checkout"),
      });

      setDraftToken(checkout.reservation.token);
      setReservationStatus(checkout.reservation.status);
      setFlowNotice("Redirecting to secure checkout...");
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      const message = getRequestErrorMessage(error);
      setWebsiteState({
        outcome: "failed",
        isProcessing: false,
        message,
      });
      setFlowNotice("We could not start secure checkout. Your details were kept, so you can retry.");
    } finally {
      endBranchActionLock();
      setWebsiteState((current) => (current.isProcessing ? { ...current, isProcessing: false } : current));
    }
  }
  function handleSwitchPaymentMethodFromBranch() {
    if (isBranchActionLocked || isCheckingAvailability || isHydratingDraft || isPersistingDraft) {
      return;
    }

    clearBranchTransientState();
    setPaymentMethod(null);
    setPaymentTouched(false);
    setReservationStatus("draft");
    setBranchResetNotice("Payment method reset. Choose a new option to rebuild your booking path.");
    setStepIndex(STEP2);

    void upsertDraftProgress({
      payload: {
        paymentMethod: null,
      },
      progressStep: STEP2,
      activeBranch: null,
      createIfMissing: false,
      onErrorMessage: "Payment method reset locally, but draft sync is temporarily unavailable.",
    });
  }

  function handleTransferReferenceChange(value: string) {
    setTransferState((current) => ({ ...current, reference: value, error: null }));
  }

  function handleTransferProofNoteChange(value: string) {
    setTransferState((current) => ({ ...current, proofNote: value, error: null }));
  }

  async function handleSubmitTransferProof() {
    const withinHold = isWithinTransferHold(transferState.holdExpiresAt);
    const progression = validateBranchProgression({
      intent: "submit_transfer_proof",
      paymentMethod,
      currentStatus: reservationStatus,
      availabilityPassed: true,
      transferReference: transferState.reference,
      transferProofNote: transferState.proofNote,
      withinTransferHold: withinHold,
    });

    if (!progression.isValid) {
      const holdExpired = progression.errors.some((error) => error.field === "transferHold");

      if (holdExpired) {
        setReservationStatus("cancelled");
        setTransferState((current) => ({
          ...current,
          error: "The 1-hour transfer hold period has expired.",
        }));
        setFlowNotice("Transfer hold expired before proof submission. This reservation request has been cancelled.");
        setStepIndex(STEP5);
        return;
      }

      const firstError = progression.errors[0];
      setTransferState((current) => ({
        ...current,
        error: firstError?.message ?? "Please review the transfer details and try again.",
      }));
      return;
    }

    const availabilityOk = await runCriticalResumedDraftRevalidation({
      checkpoint: "pre_hold_request",
      reason: "before transfer proof submission",
      paymentMethod: "transfer",
    });

    if (!availabilityOk) {
      setTransferState((current) => ({
        ...current,
        error: "Selected dates are no longer available. Update your stay details to continue.",
      }));
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setTransferState((current) => ({ ...current, error: null, isSubmitting: true }));

    try {
      await wait(800);

      const nextStatus = getNextReservationState({
        from: reservationStatus,
        event: "transfer_proof_submitted",
        withinTransferHold: true,
      }).to;

      if (!nextStatus) {
        setTransferState((current) => ({
          ...current,
          isSubmitting: false,
          error: "Transfer submission could not be processed from this status.",
        }));
        return;
      }

      setTransferState((current) => ({ ...current, isSubmitting: false, error: null }));
      setReservationStatus(nextStatus);
      setFlowNotice("Transfer proof received. Our team will verify and confirm your booking shortly.");

      await upsertDraftProgress({
        payload: {},
        progressStep: STEP5,
        activeBranch: "transfer",
        createIfMissing: false,
        onErrorMessage: "Transfer proof submitted, but draft sync is temporarily unavailable.",
      });

      setStepIndex(STEP5);
    } finally {
      endBranchActionLock();
      setTransferState((current) => (current.isSubmitting ? { ...current, isSubmitting: false } : current));
    }
  }

  function handlePosContactWindowChange(value: string) {
    setPosState((current) => ({ ...current, contactWindow: value, error: null }));
  }

  function handlePosNoteChange(value: string) {
    setPosState((current) => ({ ...current, note: value, error: null }));
  }

  async function handleSubmitPosRequest() {
    const progression = validateBranchProgression({
      intent: "submit_pos_request",
      paymentMethod,
      currentStatus: reservationStatus,
      availabilityPassed: true,
      posContactWindow: posState.contactWindow,
    });

    if (!progression.isValid) {
      const firstError = progression.errors[0];
      setPosState((current) => ({
        ...current,
        error: firstError?.message ?? "Please select your preferred window for coordination.",
      }));
      return;
    }

    const availabilityOk = await runCriticalResumedDraftRevalidation({
      checkpoint: "pre_hold_request",
      reason: "before POS coordination submission",
      paymentMethod: "pos",
    });

    if (!availabilityOk) {
      setPosState((current) => ({
        ...current,
        error: "Selected dates are no longer available. Update your stay details to continue.",
      }));
      return;
    }

    if (!beginBranchActionLock()) {
      return;
    }

    setPosState((current) => ({ ...current, isSubmitting: true, error: null }));

    try {
      await wait(800);

      setPosState((current) => ({
        ...current,
        isSubmitting: false,
        error: null,
        requestSubmitted: true,
      }));

      setReservationStatus("pending_pos_coordination");
      setFlowNotice("Coordination request submitted. A concierge representative will reach out to arrange your POS payment.");

      await upsertDraftProgress({
        payload: {},
        progressStep: STEP5,
        activeBranch: "pos",
        createIfMissing: false,
        onErrorMessage: "POS request submitted, but draft sync is temporarily unavailable.",
      });

      setStepIndex(STEP5);
    } finally {
      endBranchActionLock();
      setPosState((current) => (current.isSubmitting ? { ...current, isSubmitting: false } : current));
    }
  }

  const resumeUxState = deriveBookingResumeUxState({
    isResumingDraft,
    showDraftRestoredNotice,
    staleAvailabilityRecoveryNotice,
    flowNotice,
    isPersistingDraft,
  });
  const showContinueButton = shouldShowContinueButton(stepIndex);
  const continueDisabled = isHydratingDraft || resumeUxState.disableProgressActions || isContinueDisabled({
    stepIndex,
    isCheckingAvailability,
    isBranchActionLocked,
    stayReady,
    guestReady,
    paymentMethod,
  });

  const outcomeStepLabel = getOutcomeStepLabel(paymentMethod, reservationStatus, stepLabels);
  const continueLabel = getContinueLabel(stepIndex, paymentMethod);

  return (
    <main className="booking-page" style={{ paddingBottom: 0 }}>
      <BookingPageIntro />

      <section className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "1200px" }}>
        <BookingProgress stepLabels={stepLabels} stepIndex={stepIndex} />

        <div className="booking-layout">
          <div className="booking-details-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <BookingInlineNotices
              resumingNotice={resumeUxState.resumingNotice}
              restoredNotice={resumeUxState.restoredNotice}
              recoveryNotice={resumeUxState.recoveryNotice}
              flowNotice={resumeUxState.effectiveFlowNotice}
              branchResetNotice={branchResetNotice}
              availabilityNote={availabilityNote}
              showContinueEditingAction={resumeUxState.showContinueEditingAction}
              onContinueEditing={handleContinueEditingRestoredBooking}
              onDismissRestoredNotice={handleDismissRestoredNotice}
            />

            {stepIndex === STEP0 && (
              <StayDetailsStep
                stay={stay}
                stayTouched={stayTouched}
                stayValidation={stayValidation}
                onSelectFlat={(flatId) => {
                  handleStayChange("flatId", flatId);
                  markStayTouched("flatId");
                  setFlatPreselectionSource("none");
                }}
                onCheckInChange={(value) => handleStayChange("checkIn", value)}
                onCheckOutChange={(value) => handleStayChange("checkOut", value)}
                onGuestsChange={(value) => {
                  handleStayChange("guests", value);
                  markStayTouched("guests");
                }}
                onMarkTouched={markStayTouched}
                onToggleExtra={toggleExtra}
                onOpenCheckInPicker={() => openDatePicker(checkInInputRef.current)}
                onOpenCheckOutPicker={() => openDatePicker(checkOutInputRef.current)}
                checkInInputRef={checkInInputRef}
                checkOutInputRef={checkOutInputRef}
                blockedDateSummary={blockedDateSummary}
                blockedDateSelectionWarning={blockedDateSelectionWarning}
                blockedDateError={blockedDatesError}
                isLoadingBlockedDates={isLoadingBlockedDates}
                flatSelectionContextNote={flatSelectionContextNote}
              />
            )}

            {stepIndex === STEP1 && (
              <GuestDetailsStep
                guest={guest}
                guestTouched={guestTouched}
                guestValidation={guestValidation}
                onFieldChange={handleGuestChange}
                onMarkTouched={markGuestTouched}
              />
            )}

            {stepIndex === STEP2 && (
              <PaymentMethodStep
                paymentMethod={paymentMethod}
                paymentTouched={paymentTouched}
                onPaymentMethodChange={handlePaymentMethodChange}
              />
            )}

            {stepIndex === STEP3 && paymentMethod && (
              <BranchReviewStep
                paymentMethod={paymentMethod}
                stepLabel={stepLabels[STEP3]}
                reviewResidenceLabel={reviewLabels.residence}
                reviewNightsLabel={reviewLabels.nights}
                reviewGuestsLabel={reviewLabels.guests}
              />
            )}

            {stepIndex === STEP4 && (
              <BranchActionStep
                stepLabel={stepLabels[STEP4]}
                paymentMethod={paymentMethod}
                websiteState={websiteState}
                transferState={transferState}
                posState={posState}
                transferTimeLeft={transferTimeLeft}
                isBranchActionLocked={isBranchActionLocked || isPersistingDraft}
                isCheckingAvailability={isCheckingAvailability}
                onInitiateWebsiteCheckout={handleInitiateWebsiteCheckout}
                onSwitchMethod={handleSwitchPaymentMethodFromBranch}
                onTransferReferenceChange={handleTransferReferenceChange}
                onTransferProofNoteChange={handleTransferProofNoteChange}
                onSubmitTransferProof={handleSubmitTransferProof}
                onPosContactWindowChange={handlePosContactWindowChange}
                onPosNoteChange={handlePosNoteChange}
                onSubmitPosRequest={handleSubmitPosRequest}
              />
            )}

            {stepIndex === STEP5 && (
              <BranchOutcomeStep
                paymentMethod={paymentMethod}
                reservationStatus={reservationStatus}
                finalStepLabel={outcomeStepLabel}
                guestEmail={guest.email}
                onSwitchPaymentMethod={handleSwitchPaymentMethodFromBranch}
              />
            )}

            <BookingFlowControls
              stepIndex={stepIndex}
              showContinueButton={showContinueButton}
              continueDisabled={continueDisabled}
              continueLabel={continueLabel}
              continueLabelOverride={resumeUxState.continueLabelOverride}
              isCheckingAvailability={isCheckingAvailability}
              isBranchActionLocked={isBranchActionLocked || isPersistingDraft}
              onBack={handleBack}
              onContinue={handleContinue}
            />
          </div>

          <div className="booking-summary-col">
            <BookingSummaryCard
              stepLabel={stepLabels[stepIndex]}
              reservationStatus={reservationStatus}
              paymentMethod={paymentMethod}
              selectedFlat={selectedFlat}
              stayGuests={stay.guests}
              checkIn={stay.checkIn}
              checkOut={stay.checkOut}
              guestName={guestName}
              guestEmail={guest.email}
              nights={nights}
              staySubtotal={staySubtotal}
              extrasSubtotal={extrasSubtotal}
              selectedExtras={selectedExtras}
              estimatedTotal={estimatedTotal}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
