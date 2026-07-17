/**
 * Creative Report 2.0 — formatting helpers.
 * Currency is USD across the whole module (locked decision). Copy standards
 * from handoff §9: counts pluralized, names/campaigns truncated with tooltip,
 * dates "12 Jul" / "12 Jul 2026", never a bare "–".
 */

const CURRENCY = "$";

/** Full currency, thousands-separated: $12,480. */
export function fmtCurrency(value: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 0;
  return `${CURRENCY}${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Compact currency: $980, $12.4k, $1.2M. */
export function fmtCompactCurrency(value: number): string {
  return `${CURRENCY}${fmtCompact(value)}`;
}

/** Compact number: 980, 12.4k, 1.2M, 3.4B. */
export function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs < 1000) return `${sign}${Math.round(abs)}`;
  if (abs < 1_000_000) return `${sign}${trim(abs / 1000)}k`;
  if (abs < 1_000_000_000) return `${sign}${trim(abs / 1_000_000)}M`;
  return `${sign}${trim(abs / 1_000_000_000)}B`;
}

function trim(n: number): string {
  // One decimal, but drop a trailing ".0".
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Plain number with thousands separators. */
export function fmtNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** Percentage with 1 decimal by default: 1.8%. */
export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Ratio like ROAS: 2.5×. */
export function fmtMultiple(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}×`;
}

export type DeltaTone = "up" | "down" | "flat";

export interface DeltaFmt {
  label: string;
  tone: DeltaTone;
}

/**
 * Signed delta as a percentage-point/relative change label + tone.
 * `higherIsBetter` decides whether "up" reads as good (tone is purely
 * directional here; colour mapping is the component's job).
 */
export function fmtDelta(pct: number | null, decimals = 0): DeltaFmt {
  if (pct === null || Number.isNaN(pct)) return { label: "—", tone: "flat" };
  const rounded = Math.round(pct * 10 ** decimals) / 10 ** decimals;
  if (rounded === 0) return { label: "0%", tone: "flat" };
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded.toFixed(decimals)}%`,
    tone: rounded > 0 ? "up" : "down",
  };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "12 Jul" (same year) or "12 Jul 2026" (different year). */
export function fmtDate(input: string | Date, opts?: { year?: boolean }): string {
  const d = typeof input === "string" ? new Date(`${input}T00:00:00`) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const showYear = opts?.year ?? d.getFullYear() !== new Date().getFullYear();
  return showYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`;
}

/** "12 Jul – 18 Jul" style range. */
export function fmtDateRange(from: string, to: string): string {
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

/** Pluralize a count: pluralize(1,"creative") → "1 creative". */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count.toLocaleString("en-US")} ${word}`;
}

/** Truncate + return {text, truncated} so callers can add a title tooltip. */
export function truncate(
  value: string,
  max: number,
): { text: string; truncated: boolean } {
  if (value.length <= max) return { text: value, truncated: false };
  return { text: `${value.slice(0, max - 1).trimEnd()}…`, truncated: true };
}

export const NAME_MAX = 48;
export const CAMPAIGN_MAX = 40;

/** "N/A — no video" for image ads (never a bare dash). */
export const NA_NO_VIDEO = "N/A — no video";
/** Low-volume label with n. */
export function notEnoughData(n: number): string {
  return `Not enough data yet (n=${n})`;
}

/** Relative "age" like "3 days ago" / "Today". */
export function fmtAgeDays(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
