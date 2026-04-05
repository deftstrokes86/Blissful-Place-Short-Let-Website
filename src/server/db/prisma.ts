import { PrismaClient } from "@prisma/client";

import {
  describePrismaDatabaseTarget,
  resolvePrismaClientOptions,
  type PrismaServerEnv,
} from "./prisma-config";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
type PrismaClientConstructor = new (options?: ConstructorParameters<typeof PrismaClient>[0]) => PrismaClient;

function getPrismaRuntimeGuidance(env: PrismaServerEnv): string {
  return env.NODE_ENV === "production"
    ? "If this is running on Hostinger or another deployed environment, set DATABASE_URL in the host environment and redeploy."
    : "If this is local development, keep DATABASE_URL in the repo root .env or provide it in the server runtime environment before starting the app.";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class PrismaInitializationError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "PrismaInitializationError";
    this.cause = cause;
  }
}

export function createPrismaInitializationError(
  error: unknown,
  env: PrismaServerEnv = process.env
): PrismaInitializationError {
  const targetDescription = describePrismaDatabaseTarget(env);
  const targetClause =
    targetDescription.startsWith("DATABASE_URL") ? `${targetDescription}.` : `Connection target: ${targetDescription}.`;

  return new PrismaInitializationError(
    `Prisma client initialization failed before the app could access the database. ${getErrorMessage(error)} ${targetClause} ${getPrismaRuntimeGuidance(
      env
    )}`,
    error
  );
}

export function createPrismaClient(
  env: PrismaServerEnv = process.env,
  PrismaCtor: PrismaClientConstructor = PrismaClient
): PrismaClient {
  try {
    return new PrismaCtor(resolvePrismaClientOptions(env));
  } catch (error) {
    throw createPrismaInitializationError(error, env);
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
