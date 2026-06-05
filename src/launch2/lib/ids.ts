/** ID + idempotency-key helpers for Launch 2.0. */

function rand(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Short id for entities (campaigns/adsets/ads/drafts). */
export function makeId(prefix = "id"): string {
  return `${prefix}_${rand().slice(0, 8)}`;
}

/**
 * Idempotency key for a launch dispatch. Stays stable across retries and
 * double-clicks so the server dedupes — the N=N reliability invariant.
 */
export function makeDedupeKey(): string {
  return `lk_${rand()}`;
}
