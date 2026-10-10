/** Small pure helpers for the ad drawer. */
import { toast } from "sonner";
import type { AdDemographic } from "@/lib/insights-v3/types";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/** ISO → "14 Sep 2026". Null or bad input → null (caller decides how to show it). */
export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DATE.format(d);
}

/** Copy to clipboard with a toast. Never throws (clipboard can be blocked). */
export async function copyText(text: string, okMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMessage);
  } catch {
    toast.error("Couldn't copy. Your browser blocked clipboard access.");
  }
}

/** "18-24", "65+" groups → "18–65+ years old". Empty → "—". */
export function ageRangeLabel(demographics: AdDemographic[]): string {
  const bands = demographics
    .map((d) => {
      const m = d.ageGroup.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (m) return { min: parseInt(m[1], 10), max: parseInt(m[2], 10), open: false };
      const plus = d.ageGroup.match(/^(\d+)\+$/);
      if (plus) return { min: parseInt(plus[1], 10), max: parseInt(plus[1], 10), open: true };
      return null;
    })
    .filter((b): b is { min: number; max: number; open: boolean } => b !== null);
  if (bands.length === 0) return "—";
  const min = Math.min(...bands.map((b) => b.min));
  const open = bands.some((b) => b.open);
  const max = Math.max(...bands.map((b) => b.max));
  return `${min}–${open ? `${max}+` : max} years old`;
}

export function genderLabel(demographics: AdDemographic[]): string {
  const set = new Set(demographics.map((d) => d.gender));
  return set.size === 1 ? Array.from(set)[0] : "All";
}

/** 11.9 → "11.9", 12 → "12". */
export function fmtPoints(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}
