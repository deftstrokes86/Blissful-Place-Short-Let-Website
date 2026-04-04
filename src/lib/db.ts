import { prisma } from "../server/db/prisma";

// Compatibility wrapper for older imports. Prefer importing from @/server/db/prisma directly.
export function getDbClient() {
  return prisma;
}
