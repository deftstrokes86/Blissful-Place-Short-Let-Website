import { randomUUID } from "node:crypto";

export function createDatabaseId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
