import { PrismaClient } from "@prisma/client";

import {
  describePrismaDatabaseTarget,
  resolvePrismaClientOptions,
  type PrismaServerEnv,
} from "./prisma-config";

const globalForPrisma = globalThis as unknown as { prismaClient: PrismaClient | undefined };
let cachedPrismaClient: PrismaClient | undefined = globalForPrisma.prismaClient;

type PrismaClientConstructor = new (options?: ConstructorParameters<typeof PrismaClient>[0]) => PrismaClient;

function getPrismaRuntimeGuidance(env: PrismaServerEnv): string {
  return env.NODE_ENV === "production"
    ? "If this is running on Hostinger or another deployed environment, set DATABASE_URL in the host environment and redeploy."
    : "If this is local development, keep DATABASE_URL in the repo root .env or provide it in the server runtime environment before starting the app.";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function cachePrismaClient(client: PrismaClient, env: PrismaServerEnv = process.env): PrismaClient {
  cachedPrismaClient = client;

  if (env.NODE_ENV !== "production") {
    globalForPrisma.prismaClient = client;
  }

  return client;
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

export function getPrismaClient(
  env: PrismaServerEnv = process.env,
  PrismaCtor: PrismaClientConstructor = PrismaClient
): PrismaClient {
  if (cachedPrismaClient) {
    return cachedPrismaClient;
  }

  return cachePrismaClient(createPrismaClient(env, PrismaCtor), env);
}

export function resetPrismaClientForTests(): void {
  cachedPrismaClient = undefined;
  delete globalForPrisma.prismaClient;
}

// Keep module imports build-safe: the real Prisma client is created only when a query path touches it.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client as unknown as object, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
  set(_target, property, value) {
    const client = getPrismaClient();
    return Reflect.set(client as unknown as object, property, value, client);
  },
  has(_target, property) {
    return Reflect.has(getPrismaClient() as unknown as object, property);
  },
  ownKeys() {
    return Reflect.ownKeys(getPrismaClient() as unknown as object);
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getPrismaClient() as unknown as object, property);
    return descriptor ? { ...descriptor, configurable: true } : undefined;
  },
}) as PrismaClient;
