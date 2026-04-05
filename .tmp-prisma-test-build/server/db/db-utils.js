"use strict";
/**
 * Shared low-level utilities for all file-based repository implementations.
 *
 * Centralised here to avoid the same trivial helpers being redefined in every
 * repository file (nowIso was previously duplicated in 6+ locations).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowIso = nowIso;
/** Returns the current wall-clock time as an ISO-8601 string. */
function nowIso() {
    return new Date().toISOString();
}
