/**
 * Curated IANA timezone list for ad scheduling.
 *
 * Small + pure: no I/O, no deps. The picker uses these ids/labels; the effective
 * timezone for an ad always resolves through getAccountTimezone() so rows that
 * predate the (not-yet-applied) ad_account.timezone column still work.
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export interface TimezoneOption {
  /** IANA timezone id, e.g. "Asia/Kolkata". */
  id: string;
  /** Human label shown in the picker, e.g. "India (IST)". */
  label: string;
}

/** ~20 common timezones spanning the major ad markets. */
export const TIMEZONES: TimezoneOption[] = [
  { id: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { id: "America/Anchorage", label: "Alaska (AKT)" },
  { id: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { id: "America/Denver", label: "Denver (MT)" },
  { id: "America/Chicago", label: "Chicago (CT)" },
  { id: "America/New_York", label: "New York (ET)" },
  { id: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { id: "Europe/London", label: "London (GMT/BST)" },
  { id: "Europe/Paris", label: "Paris (CET)" },
  { id: "Europe/Berlin", label: "Berlin (CET)" },
  { id: "Europe/Moscow", label: "Moscow (MSK)" },
  { id: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { id: "Asia/Dubai", label: "Dubai (GST)" },
  { id: "Asia/Karachi", label: "Karachi (PKT)" },
  { id: "Asia/Kolkata", label: "India (IST)" },
  { id: "Asia/Dhaka", label: "Dhaka (BST)" },
  { id: "Asia/Singapore", label: "Singapore (SGT)" },
  { id: "Asia/Tokyo", label: "Tokyo (JST)" },
  { id: "Australia/Sydney", label: "Sydney (AET)" },
  { id: "Pacific/Auckland", label: "Auckland (NZT)" },
];

/** Fast lookup of a timezone label by id; falls back to the raw id. */
export function getTimezoneLabel(id: string): string {
  return TIMEZONES.find((t) => t.id === id)?.label ?? id;
}

/**
 * Resolve the effective timezone for an ad account.
 *
 * The `timezone` column is owned by the reports/migration slice and is NOT live
 * yet, so real rows return `undefined`/`null` — fall back to DEFAULT_TIMEZONE.
 */
export function getAccountTimezone(
  account: { timezone?: string | null } | null | undefined,
): string {
  return account?.timezone ?? DEFAULT_TIMEZONE;
}
