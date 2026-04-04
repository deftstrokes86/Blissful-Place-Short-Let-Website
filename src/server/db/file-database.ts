// Legacy JSON file database for older non-Prisma flows.
// New server-side data access should use Prisma + Supabase Postgres via DATABASE_URL.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { nowIso } from "./db-utils";
export { createDatabaseId } from "./database-identifiers";

import type {
  BookingDatabaseState,
  DraftProgressContext,
  DraftProgressStep,
  ExtraRecord,
  FlatRecord,
  NotificationAudience,
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  ReservationNotificationRecord,
  ReservationRecord,
} from "@/types/booking-backend";
import type { PaymentMethod } from "@/types/booking";

const DATA_FILE_PATH = join(process.cwd(), ".data", "booking-mvp-db.json");
const MIN_DRAFT_STEP: DraftProgressStep = 0;
const MAX_DRAFT_STEP: DraftProgressStep = 5;

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "website" || value === "transfer" || value === "pos";
}

function isNotificationAudience(value: unknown): value is NotificationAudience {
  return value === "guest" || value === "staff";
}

function isNotificationChannel(value: unknown): value is NotificationChannel {
  return value === "email" || value === "internal";
}

function isNotificationStatus(value: unknown): value is NotificationStatus {
  return value === "pending" || value === "sent" || value === "failed";
}

function isNotificationEventType(value: unknown): value is NotificationEventType {
  return typeof value === "string" && value.trim().length > 0;
}

function isDraftProgressStep(value: unknown): value is DraftProgressStep {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_DRAFT_STEP && value <= MAX_DRAFT_STEP;
}

function normalizeProgressContext(
  value: ReservationRecord["progressContext"] | undefined,
  paymentMethod: PaymentMethod | null
): DraftProgressContext {
  const fallback: DraftProgressContext = {
    currentStep: MIN_DRAFT_STEP,
    activeBranch: paymentMethod,
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    currentStep: isDraftProgressStep(value.currentStep) ? value.currentStep : fallback.currentStep,
    activeBranch: isPaymentMethod(value.activeBranch) ? value.activeBranch : fallback.activeBranch,
  };
}

function normalizeReservationRecord(value: ReservationRecord): ReservationRecord {
  const paymentMethod = isPaymentMethod(value.paymentMethod) ? value.paymentMethod : null;
  const updatedAt = value.updatedAt ?? value.createdAt ?? nowIso();

  return {
    ...value,
    paymentMethod,
    progressContext: normalizeProgressContext(value.progressContext, paymentMethod),
    lastTouchedAt: value.lastTouchedAt ?? updatedAt,
  };
}

function normalizeNotificationRecord(value: ReservationNotificationRecord): ReservationNotificationRecord {
  const updatedAt = value.updatedAt ?? value.createdAt ?? nowIso();
  const createdAt = value.createdAt ?? updatedAt;

  return {
    ...value,
    eventType: isNotificationEventType(value.eventType) ? value.eventType : "reservation_request_received",
    templateKey: isNotificationEventType(value.templateKey) ? value.templateKey : "reservation_request_received",
    audience: isNotificationAudience(value.audience) ? value.audience : "guest",
    channel: isNotificationChannel(value.channel) ? value.channel : "internal",
    recipient: value.recipient ?? "",
    title: value.title ?? "Notification",
    body: value.body ?? null,
    templateRef: value.templateRef ?? null,
    status: isNotificationStatus(value.status) ? value.status : "pending",
    dedupeKey: value.dedupeKey ?? `legacy-${value.id}`,
    payload: value.payload ?? {},
    reservationId: value.reservationId ?? null,
    reservationToken: value.reservationToken ?? null,
    paymentAttemptId: value.paymentAttemptId ?? null,
    errorMessage: value.errorMessage ?? null,
    sentAt: value.sentAt ?? null,
    createdAt,
    updatedAt,
  };
}

function createSeedFlats(now: string): FlatRecord[] {
  return [
    {
      id: "windsor",
      name: "Windsor Residence",
      nightlyRate: 150000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kensington",
      name: "Kensington Lodge",
      nightlyRate: 180000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mayfair",
      name: "Mayfair Suite",
      nightlyRate: 250000,
      maxGuests: 6,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function createSeedExtras(now: string): ExtraRecord[] {
  return [
    { id: "airport", title: "Premium Airport Transfer", flatFee: 65000, createdAt: now, updatedAt: now },
    { id: "pantry", title: "Pantry Pre-Stocking", flatFee: 45000, createdAt: now, updatedAt: now },
    { id: "celebration", title: "Celebration Setup", flatFee: 75000, createdAt: now, updatedAt: now },
  ];
}

function createEmptyDatabaseState(): BookingDatabaseState {
  const now = nowIso();
  return {
    flats: createSeedFlats(now),
    extras: createSeedExtras(now),
    reservations: [],
    availabilityBlocks: [],
    centralStockByItem: {},
    inventoryItems: [],
    inventoryTemplates: [],
    templateItems: [],
    flatInventory: [],
    stockMovements: [],
    flatReadiness: [],
    inventoryAlerts: [],
    maintenanceIssues: [],
    workerTasks: [],
    tourAppointments: [],
    paymentAttempts: [],
    transferVerifications: [],
    posCoordinations: [],
    reservationEvents: [],
    reservationNotifications: [],
    idempotencyKeys: [],
  };
}

async function ensureDataFile(): Promise<void> {
  if (existsSync(DATA_FILE_PATH)) {
    return;
  }

  await mkdir(dirname(DATA_FILE_PATH), { recursive: true });
  const initialState = createEmptyDatabaseState();
  await writeFile(DATA_FILE_PATH, JSON.stringify(initialState, null, 2), "utf8");
}

async function readDatabaseState(): Promise<BookingDatabaseState> {
  await ensureDataFile();
  const raw = await readFile(DATA_FILE_PATH, "utf8");

  let parsed: BookingDatabaseState;
  try {
    parsed = JSON.parse(raw) as BookingDatabaseState;
  } catch (error) {
    throw new Error(
      `Booking database file is corrupt or unreadable at ${DATA_FILE_PATH}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    flats: parsed.flats ?? [],
    extras: parsed.extras ?? [],
    reservations: (parsed.reservations ?? []).map(normalizeReservationRecord),
    availabilityBlocks: parsed.availabilityBlocks ?? [],
    centralStockByItem: parsed.centralStockByItem ?? {},
    inventoryItems: parsed.inventoryItems ?? [],
    inventoryTemplates: parsed.inventoryTemplates ?? [],
    templateItems: parsed.templateItems ?? [],
    flatInventory: parsed.flatInventory ?? [],
    stockMovements: parsed.stockMovements ?? [],
    flatReadiness: parsed.flatReadiness ?? [],
    inventoryAlerts: parsed.inventoryAlerts ?? [],
    maintenanceIssues: parsed.maintenanceIssues ?? [],
    workerTasks: parsed.workerTasks ?? [],
    tourAppointments: parsed.tourAppointments ?? [],
    paymentAttempts: parsed.paymentAttempts ?? [],
    transferVerifications: parsed.transferVerifications ?? [],
    posCoordinations: parsed.posCoordinations ?? [],
    reservationEvents: parsed.reservationEvents ?? [],
    reservationNotifications: (parsed.reservationNotifications ?? []).map(normalizeNotificationRecord),
    idempotencyKeys: parsed.idempotencyKeys ?? [],
  };
}

async function writeDatabaseState(state: BookingDatabaseState): Promise<void> {
  await writeFile(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
}

let databaseQueue: Promise<unknown> = Promise.resolve();

export async function readBookingDatabase(): Promise<BookingDatabaseState> {
  return readDatabaseState();
}

export async function withBookingDatabase<T>(
  operation: (state: BookingDatabaseState) => Promise<T> | T
): Promise<T> {
  const queuedOperation = databaseQueue.then(async () => {
    const state = await readDatabaseState();
    const result = await operation(state);
    await writeDatabaseState(state);
    return result;
  });

  databaseQueue = queuedOperation.then(
    () => undefined,
    () => undefined
  );

  return queuedOperation;
}

export function getDatabaseFilePath(): string {
  return DATA_FILE_PATH;
}






