import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  BookingDatabaseState,
  ExtraRecord,
  FlatRecord,
} from "@/types/booking-backend";

const DATA_FILE_PATH = join(process.cwd(), ".data", "booking-mvp-db.json");

function nowIso(): string {
  return new Date().toISOString();
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
    paymentAttempts: [],
    transferVerifications: [],
    posCoordinations: [],
    reservationEvents: [],
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
  const parsed = JSON.parse(raw) as BookingDatabaseState;

  return {
    flats: parsed.flats ?? [],
    extras: parsed.extras ?? [],
    reservations: parsed.reservations ?? [],
    availabilityBlocks: parsed.availabilityBlocks ?? [],
    paymentAttempts: parsed.paymentAttempts ?? [],
    transferVerifications: parsed.transferVerifications ?? [],
    posCoordinations: parsed.posCoordinations ?? [],
    reservationEvents: parsed.reservationEvents ?? [],
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

export function createDatabaseId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function getDatabaseFilePath(): string {
  return DATA_FILE_PATH;
}
