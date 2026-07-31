/**
 * schedule.ts — On/off toggle plus a start/end DATE range for workflow rules.
 *
 * Part of `src/workflows/core/`, the domain-agnostic workflow seam. NO-IMPORTS
 * RULE: nothing here may import `@/creative-report/*`, `@/data/*`,
 * `@/components/*`, or `react`.
 *
 * Deliberately narrow shape (Maalik's call): date range only. No hours-of-day,
 * no days-of-week, no invert flag. Don't widen this without a explicit
 * decision — it mirrors what the Automations screen is allowed to show.
 */

export interface WorkflowSchedule {
  /** ISO yyyy-mm-dd. Undefined = no lower bound. */
  startDate?: string;
  /** ISO yyyy-mm-dd, inclusive. Undefined = no upper bound. */
  endDate?: string;
}

export const DEFAULT_SCHEDULE: WorkflowSchedule = {};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parses a validated yyyy-mm-dd string into calendar parts without going through Date/timezone math. */
function parseIsoDateParts(iso: string): { year: number; month: number; day: number } | undefined {
  if (!ISO_DATE_RE.test(iso)) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return { year, month, day };
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = parseIsoDateParts(value);
  if (!parts) return false;
  // Reject dates like 2026-02-30 by round-tripping through Date (UTC to dodge local-tz shifts).
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return d.getUTCFullYear() === parts.year && d.getUTCMonth() === parts.month - 1 && d.getUTCDate() === parts.day;
}

/** Formats a Date's *local calendar* date as yyyy-mm-dd — used to compare "now" against schedule bounds day-by-day, not by timestamp. */
function toIsoDateString(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formats a yyyy-mm-dd string as "D Mon", e.g. "2026-08-04" -> "4 Aug". */
function formatDayMonth(iso: string): string {
  const parts = parseIsoDateParts(iso);
  if (!parts) return iso;
  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]}`;
}

/**
 * Whether `now` falls within `s`'s date range. `undefined` schedule always
 * returns `true` — existing persisted rules have no schedule and the
 * Automations screen must not die on load.
 *
 * Comparison is done on calendar dates (yyyy-mm-dd strings, which sort
 * lexicographically the same as chronologically), not on timestamps — so
 * `endDate` covers the entire day it names, not just up to 00:00.
 */
export function isWithinSchedule(s: WorkflowSchedule | undefined, now: Date): boolean {
  if (!s) return true;
  const today = toIsoDateString(now);
  if (s.startDate && isValidIsoDate(s.startDate) && today < s.startDate) return false;
  if (s.endDate && isValidIsoDate(s.endDate) && today > s.endDate) return false;
  return true;
}

/** Always returns a valid schedule, never throws — malformed input degrades to DEFAULT_SCHEDULE fields. */
export function sanitizeSchedule(raw: unknown): WorkflowSchedule {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SCHEDULE };
  const candidate = raw as Record<string, unknown>;
  const startDate = isValidIsoDate(candidate.startDate) ? candidate.startDate : undefined;
  const endDate = isValidIsoDate(candidate.endDate) ? candidate.endDate : undefined;
  return { startDate, endDate };
}

/**
 * Sentence-case, human-readable description of the range:
 * "Any time" / "From 4 Aug" / "Until 12 Jul" / "4–12 Aug" (en dash).
 */
export function describeSchedule(s: WorkflowSchedule | undefined): string {
  const startDate = s?.startDate && isValidIsoDate(s.startDate) ? s.startDate : undefined;
  const endDate = s?.endDate && isValidIsoDate(s.endDate) ? s.endDate : undefined;

  if (!startDate && !endDate) return "Any time";
  if (startDate && !endDate) return `From ${formatDayMonth(startDate)}`;
  if (!startDate && endDate) return `Until ${formatDayMonth(endDate)}`;

  // Both present.
  return `${formatDayMonth(startDate as string)}–${formatDayMonth(endDate as string)}`;
}

/**
 * Honest active/inactive state for a schedule at a given instant. An enabled
 * rule that silently does nothing is a lie — mirrors the guard
 * `BoardsPanel.tsx` already applies for disabled smart boards.
 */
export function scheduleState(s: WorkflowSchedule | undefined, now: Date): { active: boolean; reason?: string } {
  if (isWithinSchedule(s, now)) return { active: true };

  const today = toIsoDateString(now);
  const startDate = s?.startDate && isValidIsoDate(s.startDate) ? s.startDate : undefined;
  const endDate = s?.endDate && isValidIsoDate(s.endDate) ? s.endDate : undefined;

  if (startDate && today < startDate) {
    return { active: false, reason: `Starts ${formatDayMonth(startDate)}` };
  }
  if (endDate && today > endDate) {
    return { active: false, reason: `Ended ${formatDayMonth(endDate)}` };
  }
  // Defensive fallback — should be unreachable given isWithinSchedule's logic.
  return { active: false };
}
