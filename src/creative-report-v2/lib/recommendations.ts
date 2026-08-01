/**
 * Creative Report 2.0 — Overview recommendations.
 *
 * Every recommendation is a LITERAL readout of what the report already
 * computed: a count and a sum, plus where to go next. Nothing here predicts
 * an outcome, scores a creative, or claims a cause — the honesty rule that
 * governs the rest of the module applies unchanged. If a condition doesn't
 * hold in the current filter set, its recommendation simply isn't produced
 * (never a placeholder telling the buyer everything is fine when we haven't
 * checked).
 */
import type { BucketKey } from "@/creative-report-v2/lib/paramSchema";
import { fmtCompactCurrency } from "@/creative-report-v2/lib/format";
import { breakdownRollups, type CreativeRollup } from "@/creative-report-v2/lib/selectors";

export type RecommendationTone = "attention" | "opportunity" | "neutral";

export interface Recommendation {
  id: string;
  /** Plain-language, literal: counts and sums the buyer can verify. */
  text: string;
  /** Verb-first CTA label. */
  actionLabel: string;
  tone: RecommendationTone;
  /** Bucket tab to open, when the action is "go look at these". */
  bucket?: BucketKey;
}

/** Total spend across a set of rollups — additive, safe to sum. */
function totalSpend(rollups: CreativeRollup[]): number {
  return rollups.reduce((sum, r) => sum + r.metrics.spend, 0);
}

// Currency via the module's shared formatter (fmtCompactCurrency) — a local
// helper here broke past $1M ("$1200.0k") and drifted from the row/KPI style.

export function buildRecommendations(rollups: CreativeRollup[]): Recommendation[] {
  const out: Recommendation[] = [];
  if (rollups.length === 0) return out;

  // 1. Fatiguing — the act-today case, quantified by the spend behind it.
  const fatiguing = rollups.filter((r) => r.bucket === "fatiguing");
  if (fatiguing.length > 0) {
    out.push({
      id: "rec.fatiguing",
      text: `${fatiguing.length} fatiguing ${fatiguing.length === 1 ? "creative is" : "creatives are"} carrying ${fmtCompactCurrency(totalSpend(fatiguing))} — refresh the hook or pause.`,
      actionLabel: "Review",
      tone: "attention",
      bucket: "fatiguing",
    });
  }

  // 2. Losers — spend with no return, the clearest cut candidate.
  const losers = rollups.filter((r) => r.bucket === "losers");
  if (losers.length > 0) {
    out.push({
      id: "rec.losers",
      text: `${losers.length} ${losers.length === 1 ? "creative is" : "creatives are"} below your loser threshold on ${fmtCompactCurrency(totalSpend(losers))} of spend.`,
      actionLabel: "Cut",
      tone: "attention",
      bucket: "losers",
    });
  }

  // 3. Scaling — the upside mirror, so the screen isn't only bad news.
  const scaling = rollups.filter((r) => r.bucket === "scaling");
  if (scaling.length > 0) {
    out.push({
      id: "rec.scaling",
      text: `${scaling.length} ${scaling.length === 1 ? "creative is" : "creatives are"} already scaling on ${fmtCompactCurrency(totalSpend(scaling))} — room for more budget.`,
      actionLabel: "Scale",
      tone: "opportunity",
      bucket: "scaling",
    });
  }

  // 4. Brand divergence — the widest gap between a brand's folded ROAS and
  //    the portfolio's, stated as the observation it is (not a diagnosis).
  const brands = breakdownRollups(rollups, "brand");
  if (brands.length >= 2) {
    const portfolioSpend = totalSpend(rollups);
    const portfolioRevenue = rollups.reduce((s, r) => s + r.metrics.revenue, 0);
    const portfolioRoas = portfolioSpend > 0 ? portfolioRevenue / portfolioSpend : 0;
    // Only brands with real spend behind them can diverge meaningfully.
    const material = brands.filter((b) => b.metrics.spend >= 1000);
    if (material.length > 0 && portfolioRoas > 0) {
      const worst = material.reduce((a, b) => (a.metrics.roas < b.metrics.roas ? a : b));
      const gapPct = Math.round(((worst.metrics.roas - portfolioRoas) / portfolioRoas) * 100);
      if (gapPct <= -10) {
        out.push({
          id: "rec.brandGap",
          text: `${worst.label} is running ${Math.abs(gapPct)}% below portfolio ROAS across ${worst.creativeCount} ${worst.creativeCount === 1 ? "creative" : "creatives"}.`,
          actionLabel: "Open",
          tone: "attention",
        });
      }
    }
  }

  // 5. New creatives — thin data, so the ask is "look", never "judge".
  // Counted with a plain filter: bucketCreatives() is a display selector
  // with a row cap, and a capped count here would understate the truth.
  const fresh = rollups.filter((r) => r.bucket === "new");
  if (fresh.length > 0) {
    out.push({
      id: "rec.new",
      text: `${fresh.length} new ${fresh.length === 1 ? "creative has" : "creatives have"} launched — too early to judge, worth a look.`,
      actionLabel: "Check",
      tone: "neutral",
      bucket: "new",
    });
  }

  return out;
}
