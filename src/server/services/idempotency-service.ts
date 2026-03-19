import { createHash } from "node:crypto";

import { withBookingDatabase } from "@/server/db/file-database";
import type { BookingId } from "@/types/booking";
import type { IdempotencyKeyRecord } from "@/types/booking-backend";

interface IdempotentExecutionInput<TPayload, TResult> {
  key: string;
  action: string;
  payload: TPayload;
  reservationId?: BookingId | null;
  execute: () => Promise<TResult>;
}

const idempotencyLocks = new Map<string, Promise<unknown>>();

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseSnapshot<TResult>(snapshot: string): TResult {
  return JSON.parse(snapshot) as TResult;
}

async function runWithPerKeyLock<T>(lockKey: string, task: () => Promise<T>): Promise<T> {
  const active = idempotencyLocks.get(lockKey) ?? Promise.resolve();

  const current = active.then(task);
  idempotencyLocks.set(lockKey, current);

  try {
    return await current;
  } finally {
    if (idempotencyLocks.get(lockKey) === current) {
      idempotencyLocks.delete(lockKey);
    }
  }
}

export async function executeWithIdempotency<TPayload, TResult>(
  input: IdempotentExecutionInput<TPayload, TResult>
): Promise<TResult> {
  const lockKey = `${input.action}:${input.key}`;

  return runWithPerKeyLock(lockKey, async () => {
    const payloadHash = hashPayload(input.payload);

    const existing = await withBookingDatabase(async (db) => {
      return db.idempotencyKeys.find((entry) => entry.key === input.key && entry.action === input.action) ?? null;
    });

    if (existing) {
      if (existing.payloadHash !== payloadHash) {
        throw new Error(`Idempotency conflict for key '${input.key}' and action '${input.action}'.`);
      }

      return parseSnapshot<TResult>(existing.responseSnapshot);
    }

    const result = await input.execute();

    const record: IdempotencyKeyRecord = {
      key: input.key,
      action: input.action,
      reservationId: input.reservationId ?? null,
      payloadHash,
      responseSnapshot: JSON.stringify(result),
      createdAt: nowIso(),
      expiresAt: null,
    };

    await withBookingDatabase(async (db) => {
      db.idempotencyKeys.push(record);
    });

    return result;
  });
}

