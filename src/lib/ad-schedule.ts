/**
 * Per-ad scheduling persisted into the existing `launch_config` JSON (no new DB
 * columns — the ad_account.timezone + any schedule columns are owned by the
 * reports/migration slice and aren't live yet).
 *
 * Shape under launch_config:
 *   adSchedules: { [adId]: { scheduled_at: ISO string, timezone: IANA id } }
 *
 * The ad's `status` ("scheduled") still rides the normal launch_ads.status
 * update path; only the when/where lives here.
 */

import { format } from "date-fns";
import { getTimezoneLabel } from "./timezones";

export interface AdScheduleEntry {
  /** Absolute instant the ad goes live, as an ISO string. */
  scheduled_at: string;
  /** IANA timezone the user picked (display + backend hint). */
  timezone: string;
}

export type AdSchedules = Record<string, AdScheduleEntry>;

/** Editor-friendly value: date + time are split for the picker inputs. */
export interface ScheduleValue {
  /** "yyyy-MM-dd" or undefined when unset. */
  date?: string;
  /** "HH:mm" (24h) or undefined when unset. */
  time?: string;
  timezone: string;
}

/** Read the adSchedules map out of a launch_config blob (safe on null). */
export function readAdSchedules(launchConfig: Record<string, unknown> | null | undefined): AdSchedules {
  const raw = (launchConfig as { adSchedules?: unknown } | null | undefined)?.adSchedules;
  return raw && typeof raw === "object" ? ({ ...(raw as AdSchedules) }) : {};
}

/**
 * Merge schedule entries into a launch_config, returning a NEW config object.
 * Passing `null` as an entry value removes that ad's schedule.
 */
export function mergeAdSchedules(
  launchConfig: Record<string, unknown> | null | undefined,
  updates: Record<string, AdScheduleEntry | null>,
): Record<string, unknown> {
  const current = readAdSchedules(launchConfig);
  for (const [adId, entry] of Object.entries(updates)) {
    if (entry === null) delete current[adId];
    else current[adId] = entry;
  }
  return { ...(launchConfig || {}), adSchedules: current };
}

/** Split a stored entry into the editor's date/time/timezone shape. */
export function entryToValue(entry: AdScheduleEntry | undefined, defaultTimezone: string): ScheduleValue {
  if (!entry?.scheduled_at) return { timezone: entry?.timezone || defaultTimezone };
  const d = new Date(entry.scheduled_at);
  if (Number.isNaN(d.getTime())) return { timezone: entry.timezone || defaultTimezone };
  return {
    date: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm"),
    timezone: entry.timezone || defaultTimezone,
  };
}

/**
 * Build a stored entry from an editor value. Returns null when date or time is
 * missing (an incomplete schedule must not be persisted).
 *
 * The ISO is produced from the picked wall-clock date+time. We intentionally
 * keep it simple (native Date → toISOString) and store the chosen `timezone`
 * alongside, which is the field the backend honors for the actual go-live.
 */
export function valueToEntry(value: ScheduleValue): AdScheduleEntry | null {
  if (!value.date || !value.time) return null;
  const iso = new Date(`${value.date}T${value.time}`).toISOString();
  if (iso === "Invalid Date" || Number.isNaN(Date.parse(iso))) return null;
  return { scheduled_at: iso, timezone: value.timezone };
}

/**
 * One-line human preview, e.g. "Goes live 25 Jun 2026, 9:00 AM · Asia/Kolkata".
 * Returns null when the value is incomplete.
 */
export function formatSchedulePreview(value: ScheduleValue): string | null {
  if (!value.date || !value.time) return null;
  const d = new Date(`${value.date}T${value.time}`);
  if (Number.isNaN(d.getTime())) return null;
  const datePart = format(d, "d MMM yyyy");
  const timePart = format(d, "h:mm a");
  return `Goes live ${datePart}, ${timePart} · ${getTimezoneLabel(value.timezone)}`;
}
