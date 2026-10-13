import type { SavableType, TrendBucket } from "@/lib/insights-v3/types";

const INT = new Intl.NumberFormat("en-US");

/** 1234 → "1,234". Null/NaN → "—". */
export function fmtInt(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? INT.format(n) : "—";
}

/** "ads" + 1 → "ad"; naive de-pluralisation for the nouns the kit uses. */
export function singular(noun: string): string {
  if (/ies$/i.test(noun)) return noun.replace(/ies$/i, "y");
  if (/ses$/i.test(noun)) return noun.replace(/es$/i, "");
  return noun.replace(/s$/i, "");
}

export function pluralize(n: number, noun: string, nounSingular?: string): string {
  return n === 1 ? (nounSingular ?? singular(noun)) : noun;
}

const D_SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const D_FULL = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const D_MONTH = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const D_MONTH_SHORT = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

function parse(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Tooltip label for one trend bucket: "Mar 3 – Mar 9, 2026" / "Mar 3, 2026" / "March 2026". */
export function bucketRangeLabel(startIso: string, bucket: TrendBucket): string {
  const s = parse(startIso);
  if (!s) return startIso;
  if (bucket === "day") return D_FULL.format(s);
  if (bucket === "month") return D_MONTH.format(s);
  const e = new Date(s.getTime() + 6 * 86_400_000);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  return `${sameYear ? D_SHORT.format(s) : D_FULL.format(s)} – ${D_FULL.format(e)}`;
}

/** Short axis tick for a bucket start. */
export function bucketTickLabel(startIso: string, bucket: TrendBucket): string {
  const s = parse(startIso);
  if (!s) return startIso;
  return bucket === "month" ? D_MONTH_SHORT.format(s) : D_SHORT.format(s);
}

/** "+24%" / "−12%" / "0%". */
export function fmtPct(p: number): string {
  const r = Math.round(p);
  if (r === 0) return "0%";
  return `${r > 0 ? "+" : "−"}${Math.abs(r)}%`;
}

/** Sentence-case a SavableType-ish noun for aria labels. */
export function lower(s: SavableType | string): string {
  return s.replace(/-/g, " ").toLowerCase();
}
