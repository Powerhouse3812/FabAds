/**
 * Shared selector types + formatting helpers. Selectors are pure: they take
 * data + args + `now`, and an optional `DataIndex` (defaults to the singleton).
 */
import type { IndustryId, PeriodKey } from "../types";
import { ALL_PERIOD_COMPARE_DAYS, PERIOD_OPTIONS } from "../types";
import type { DataIndex } from "../data";

export const DAY_MS = 86_400_000;

/** The user's preference sources (follows + competitor marks). Passed in, never read from storage here. */
export interface UserPrefs {
  followedPageIds: string[];
  followedIndustryIds: IndustryId[];
  competitorPageIds: string[];
  competitorDomainIds: string[];
}

export const EMPTY_PREFS: UserPrefs = {
  followedPageIds: [],
  followedIndustryIds: [],
  competitorPageIds: [],
  competitorDomainIds: [],
};

export interface SelectorCtx {
  now: number;
  /** ISO string or epoch ms. Null/undefined → nothing counts as New. */
  lastVisitAt?: string | number | null;
  /** Needed when `scope.myPrefsOnly` is on. */
  prefs?: UserPrefs;
  data?: DataIndex;
}

/** A counted, labelled item inside a breakdown (share is % of the block's basedOn). */
export interface RankedItem {
  id: string;
  label: string;
  count: number;
  sharePct: number;
}

export function toMs(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

export function periodDays(period: PeriodKey): number | null {
  return PERIOD_OPTIONS.find((p) => p.key === period)?.days ?? null;
}

/** Days compared for trend % (Q7): the period itself, or the last 30 for "all". */
export function comparisonDays(period: PeriodKey): number {
  return periodDays(period) ?? ALL_PERIOD_COMPARE_DAYS;
}

/** "previous 30 days" etc., for trend copy. */
export function comparisonLabel(period: PeriodKey): string {
  const d = comparisonDays(period);
  return period === "all" ? `the ${d} days before (last ${d} days vs prior ${d})` : `the previous ${d} days`;
}

/* ── formatting ─────────────────────────────────────────────────────────── */

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace(/\.0$/, "");
  if (abs >= 1_000_000) return `${fmt(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${fmt(n / 1_000)}K`;
  return String(Math.round(n));
}

export function formatDays(n: number | null): string {
  if (n == null) return "Start date unknown";
  const r = Math.round(n);
  return `${r} day${r === 1 ? "" : "s"}`;
}

export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function formatChange(changePct: number | null, cur: number): string {
  if (changePct == null) return cur > 0 ? "New this period" : "No launches in either period";
  if (changePct === 0) return "No change";
  return `${changePct > 0 ? "+" : ""}${changePct}%`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${formatCompact(n)} ${n === 1 ? one : many}`;
}

/** Stable sort helper: compare by key fns in order, then by id. */
export function byKeys<T extends { id: string }>(...keys: ((x: T) => number)[]): (a: T, b: T) => number {
  return (a, b) => {
    for (const k of keys) {
      const d = k(b) - k(a);
      if (d !== 0 && !Number.isNaN(d)) return d;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}
