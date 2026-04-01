import { createHash } from "node:crypto";

import { prisma } from "../db/prisma";
import type { WebsitePaymentIdempotencyGateway } from "./idempotency-service";

interface RunIdempotentInput<TPayload, TResult> {
  key: string;
  action: string;
  payload: TPayload;
  reservationId?: string | null;
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

function parseSnapshot<TResult>(snapshot: unknown, key: string, action: string): TResult {
  try {
    const raw = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
    return JSON.parse(raw) as TResult;
  } catch (error) {
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

export class PrismaWebsitePaymentIdempotencyGateway implements WebsitePaymentIdempotencyGateway {
  async run<TPayload, TResult>(input: RunIdempotentInput<TPayload, TResult>): Promise<TResult> {
    const lockKey = `${input.action}:${input.key}`;

    return runWithPerKeyLock(lockKey, async () => {
      const payloadHash = hashPayload(input.payload);

      const existing = await prisma.idempotencyKey.findUnique({
        where: { key_action: { key: input.key, action: input.action } },
      });

      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          throw new Error(`Idempotency conflict for key '${input.key}' and action '${input.action}'.`);
        }

        return parseSnapshot<TResult>(existing.responseSnapshot, input.key, input.action);
      }

      const result = await input.execute();

      await prisma.idempotencyKey.create({
        data: {
          key: input.key,
          action: input.action,
          reservationId: input.reservationId ?? null,
          payloadHash,
          responseSnapshot: result as object,
          expiresAt: null,
        },
      });

      return result;
    });
  }
}

export const prismaWebsitePaymentIdempotencyGateway = new PrismaWebsitePaymentIdempotencyGateway();
