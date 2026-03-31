/**
 * Shared low-level utilities for all file-based repository implementations.
 *
 * Centralised here to avoid the same trivial helpers being redefined in every
 * repository file (nowIso was previously duplicated in 6+ locations).
 */

/** Returns the current wall-clock time as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}
