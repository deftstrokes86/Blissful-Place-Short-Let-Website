import { PrismaClient } from "@prisma/client";

import { resolvePrismaClientOptions } from "./prisma-config";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export function createPrismaClient(): PrismaClient {
  return new PrismaClient(resolvePrismaClientOptions());
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
