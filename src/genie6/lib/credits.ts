/**
 * Genie credits — one source of truth for the balance shown across the app.
 *
 * Genie 2.0 §15: the balance shows in the Genie sub-nav (already built via
 * GenieCreditsAddonCard) and NOW ALSO in Catalogue and Studio. Those three
 * surfaces were reading three different hardcoded numbers before this file
 * existed; they now all read CREDIT_BALANCE so a walkthrough never shows the
 * user two different balances on two screens.
 *
 * Values match src/components/shell/GenieCreditsAddonCard.tsx (1218/1500) so
 * the sub-nav meter and every new pill agree.
 */
export const CREDITS_USED = 1218;
export const CREDITS_LIMIT = 1500;
export const CREDITS_REMAINING = CREDITS_LIMIT - CREDITS_USED; // 282
export const CREDITS_PERCENT = Math.round((CREDITS_USED / CREDITS_LIMIT) * 100); // 81

/** `1,218` — Mono tabular-nums everywhere per DS §1 typography rules. */
export function formatCredits(n: number): string {
  return n.toLocaleString("en-IN");
}

/**
 * `1 credit` / `12 credits` — pluralised once, here.
 *
 * Several surfaces were hardcoding the word "credits" next to
 * `formatCredits()`, which printed "1 credits" wherever a cost landed on one.
 * Small, but it's the kind of thing that reads as unfinished on a screen whose
 * whole job is to be trusted about money.
 */
export function creditsLabel(n: number): string {
  return `${formatCredits(n)} ${n === 1 ? "credit" : "credits"}`;
}

/**
 * Credit-cost breakdown (§21.2 "Credits need a breakdown, not just a number").
 * Configure was showing `Generate (4 credits)` while the Results edit bar said
 * `Generate (24 credits)` — a 6× jump with no explanation. Every surface that
 * quotes a cost can now also show WHICH multipliers produced it.
 */
export interface CreditLine {
  label: string;
  /** Multiplier or additive amount, e.g. 4 outputs → `×4`. */
  factor: number;
  /** How the factor combines. "base" starts the chain. */
  op: "base" | "multiply";
  /** Optional human note, e.g. "1080p". */
  note?: string;
}

export interface CreditBreakdown {
  lines: CreditLine[];
  total: number;
}

/** Runs a line list into a total, so display and charge can never diverge. */
export function computeBreakdown(lines: CreditLine[]): CreditBreakdown {
  let total = 0;
  for (const l of lines) {
    if (l.op === "base") total = l.factor;
    else total *= l.factor;
  }
  return { lines, total: Math.ceil(total) };
}

/** True when a run would overdraw the balance — gates Generate with a reason. */
export function exceedsBalance(cost: number): boolean {
  return cost > CREDITS_REMAINING;
}
