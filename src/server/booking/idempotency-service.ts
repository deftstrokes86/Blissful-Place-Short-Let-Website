import { createHash } from "node:crypto";

import { withBookingDatabase } from "../db/file-database";
import { nowIso } from "../db/db-utils";
import type { IdempotencyKeyRecord } from "../../types/booking-backend";

interface RunIdempotentInput<TPayload, TResult> {
  key: string;
  action: string;
  payload: TPayload;
  reservationId?: string | null;
  execute: () => Promise<TResult>;
}

export interface WebsitePaymentIdempotencyGateway {
  run<TPayload, TResult>(input: RunIdempotentInput<TPayload, TResult>): Promise<TResult>;
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

function parseSnapshot<TResult>(snapshot: string, key: string, action: string): TResult {
  try {
    return JSON.parse(snapshot) as TResult;
  } catch (error) {
    // The stored snapshot is corrupt — surface enough context for operators to reconcile.
    throw new Error(
      `Idempotency snapshot for key '${key}' action '${action}' could not be parsed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
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

export class FileWebsitePaymentIdempotencyGateway implements WebsitePaymentIdempotencyGateway {
  async run<TPayload, TResult>(input: RunIdempotentInput<TPayload, TResult>): Promise<TResult> {
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

        return parseSnapshot<TResult>(existing.responseSnapshot, input.key, input.action);
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
}

export const fileWebsitePaymentIdempotencyGateway = new FileWebsitePaymentIdempotencyGateway();
