/**
 * Home hub — non-component helpers (kept out of parts.tsx so that file can
 * export components only, which keeps React Fast Refresh happy).
 *
 * STATUS mirrors the hex tokens runViz uses, so status colours stay identical
 * across the whole Launch 2.0 module.
 */

/** Status hex tokens — match runViz so colours never drift across the module. */
export const STATUS = {
  ok: "#52c41a",
  warn: "#faad14",
  err: "#ff4d4f",
} as const;

/** Meter fill colour for an active/cap ratio (red over/at cap or restricted; amber ≥80%). */
export function capColor(active: number, capacity: number, restricted = false): string {
  if (restricted || active >= capacity) return STATUS.err;
  if (active / capacity >= 0.8) return STATUS.warn;
  return STATUS.ok;
}
