/**
 * Annotation slice — creative drawer panels (fatigue, benchmarks, funnel,
 * components, script/elements, demographics, trend, ad-preview).
 * Element ids are namespaced `drawer.<panel>.<element>`.
 */
import type { AnnotationSlice } from "@/creative-report/annotations/types";

export const drawerAnnotations: AnnotationSlice = {
  // ── KpiStrip ─────────────────────────────────────────────────────────────
  "drawer.kpi.spend": {
    reason:
      "Spend is Meta's raw cost field, summed as-is across this creative's own daily rows for the filtered window — no derivation. The trend beside it is last 7 days vs the prior 7 (spendTrendPct), not shown anywhere else in the drawer.",
    impact:
      "The denominator behind every efficiency read in FunnelStrip below (CPM/CPA/ROAS) — a spend swing here explains a lot of what moves those numbers.",
    whenToAct:
      "Trend swinging sharply → confirm it's a deliberate budget change before reading anything else in the drawer as a performance shift.",
    importance: "medium",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the spend daily-row field over the filtered window for this creative's instances; the trend folds the last 7 days against the prior 7 from the same stored daily rows.",
    backend: "daily-series",
  },
  "drawer.kpi.revenue": {
    reason:
      "Revenue is Meta's raw purchase-value field, summed the same way as spend across this creative's daily rows — no derivation, and no trend is shown for it here.",
    impact:
      "Paired with Spend it's what FunnelStrip's ROAS is built from below — read the two together, not this number alone.",
    whenToAct:
      "Revenue flat while spend climbs → check FunnelStrip's ROAS/CPA before assuming the creative itself is the problem.",
    importance: "medium",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the revenue daily-row field over the filtered window for this creative's instances — a plain read-time aggregate, nothing recomputed.",
    backend: "read-time",
  },
  "drawer.kpi.purchases": {
    reason:
      "Purchases is Meta's raw conversion count, summed over this creative's filtered window — no derivation, and no trend is shown for it here.",
    impact:
      "The sample size behind FunnelStrip's CPA/CVR below — a low count is the reason to read those as directional, not precise.",
    whenToAct:
      "CPA or ROAS below looks surprising → check this count before trusting the ratio.",
    importance: "low",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the purchases daily-row field over the filtered window for this creative's instances — a plain read-time aggregate, nothing recomputed.",
    backend: "read-time",
  },
  "drawer.kpi.impressions": {
    reason:
      "Impressions is Meta's raw delivery count, summed over this creative's filtered window — no derivation, and no trend is shown for it here.",
    impact:
      "The reach behind Hook rate above (video3s ÷ impressions) and CPM in FunnelStrip below — read it alongside those, not alone.",
    whenToAct:
      "Impressions climbing while Hook rate/CTR hold flat is healthy scale; impressions climbing while they soften is the fatigue tell the Fatigue verdict above flags.",
    importance: "low",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the impressions daily-row field over the filtered window for this creative's instances — a plain read-time aggregate, nothing recomputed.",
    backend: "read-time",
  },

  "drawer.fatigue.verdict": {
    reason:
      "Rule-based flag, not a Meta field. Fires when 14-day CTR is down ≥15%, or 7-day frequency exceeds the threshold, or hook-rate is falling — whichever trips first.",
    impact:
      "Signals the creative is wearing out before ROAS collapses — the window to refresh the hook while the body still works.",
    whenToAct:
      "Frequency climbing past the ceiling with CTR softening → queue a hook refresh this week, don't wait for ROAS to break.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo:
      "Compute rolling 14-day CTR and hook-rate deltas plus 7-day frequency from stored daily rows; evaluate the threshold rule. Precompute the rolling deltas in the nightly rollup, not on read.",
    backend: "daily-series",
  },

  // ── FunnelStrip ─────────────────────────────────────────────────────────
  "drawer.funnel.cpm": {
    reason:
      "CPM is folded from summed spend and impressions across the filtered window, not a Meta-reported average of daily CPMs.",
    impact:
      "Tracks raw reach cost — rising CPM squeezes the whole funnel below it even when downstream rates hold.",
    whenToAct:
      "CPM climbing while CTR/CVR hold steady points at auction pressure, not creative fatigue — check placement/audience before touching the creative.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo:
      "(spend sum ÷ impressions sum) × 1000 over the folded window — a read-time ratio off already-fetched Meta spend/impression totals, same pattern as CTR.",
    backend: "read-time",
  },
  "drawer.funnel.ctr": {
    reason:
      "Folded as sum(clicks) ÷ sum(impressions) across the window — never an average of daily CTR values, which would overweight low-volume days.",
    impact:
      "The first funnel checkpoint — a soft CTR here caps everything downstream regardless of how good CVR/ROAS look.",
    whenToAct:
      "CTR trending down over 14 days is the earliest fatigue tell — pairs with the Fatigue verdict above.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo:
      "Sum clicks and impressions from Meta's daily insights rows first, divide once — trivial at read time, no extra storage beyond the raw daily sums already fetched.",
    backend: "read-time",
  },
  "drawer.funnel.outboundCtr": {
    reason:
      "Same fold pattern as CTR but the numerator is outbound (link) clicks — a stricter off-platform intent signal than raw CTR.",
    impact:
      "The gap between CTR and outbound CTR shows how much click volume is on-platform engagement vs traffic that actually left for the landing page.",
    whenToAct:
      "Wide gap between CTR and outbound CTR → the hook earns attention but the offer/CTA isn't pulling people out — check the CTA and landing page before blaming the hook.",
    importance: "medium",
    personas: ["Performance marketer"],
    provenance: "derived-from-meta",
    howTo:
      "sum(outboundClicks) ÷ sum(impressions) over the folded window — the same read-time ratio as CTR, just a different Meta-direct numerator.",
    backend: "read-time",
  },
  "drawer.funnel.cvr": {
    reason:
      "Folded as sum(purchases) ÷ sum(clicks) — the on-site conversion checkpoint, isolated from the impression/CTR stages above it.",
    impact:
      "Low CVR with a healthy CTR points at the landing page or offer, not the ad creative — keeps blame from landing on the wrong stage.",
    whenToAct:
      "CVR dropping while CTR/CPM stay flat → check the landing page and checkout before touching the creative.",
    importance: "medium",
    personas: ["Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo:
      "sum(purchases) ÷ sum(clicks) from the same folded daily sums used for CTR — read-time, no extra fetch.",
    backend: "read-time",
  },
  "drawer.funnel.cpa": {
    reason:
      "spend ÷ purchases over the folded window, shown as '—' when purchases are zero rather than a misleading $0. The delta compares this window's CPA to the immediately preceding equal-length window.",
    impact:
      "The cost-efficiency number buyers actually budget against — CPA rising while ROAS holds usually means AOV is propping up an efficiency problem underneath.",
    whenToAct:
      "CPA up ≥15% period-over-period while spend is flat → efficiency is degrading independent of scale, worth a look before increasing budget further.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo:
      "spend ÷ purchases for the current folded window is a read-time ratio; the delta needs the matched-length preceding window folded from stored daily rows, so the period-over-period leg is what sets the cost class.",
    backend: "daily-series",
  },
  "drawer.funnel.roas": {
    reason:
      "revenue ÷ spend over the folded window; delta compares this window's ROAS to the immediately preceding equal-length window, shown only when compare is enabled and both windows have valid spend.",
    impact:
      "The bottom-line number every other stage feeds into — a ROAS drop with the upstream stages flat means down-funnel value (AOV, repeat-purchase mix) shifted, not the ad's pulling power.",
    whenToAct:
      "ROAS down while CTR/CVR hold → look at order value and offer mix, not the creative itself.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead", "Brand manager"],
    provenance: "derived-from-meta",
    howTo:
      "sum(revenue) ÷ sum(spend) for the current window is a read-time ratio; the compare delta folds the prior equal-length window from stored daily rows (same fold as the overview KPIs), which is what sets the cost class.",
    backend: "daily-series",
  },

  // ── TrendChart ──────────────────────────────────────────────────────────
  "drawer.trend.spendVsRevenue": {
    reason:
      "Each point folds that day's spend and revenue from the creative's own daily rows — the same per-day granularity the Fatigue CTR trend uses, not a synthetic smoothing.",
    impact:
      "Shows whether revenue is tracking spend or diverging — a widening gap (spend up, revenue flat) is the earliest visual tell that efficiency is slipping, before CPA/ROAS confirm it numerically.",
    whenToAct:
      "Lines crossing or diverging for 3+ consecutive days is worth investigating before the summary ROAS/CPA numbers above catch up to it.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo:
      "Read directly off each creative's stored daily rows (spend, revenue) for the filtered date range — needs the per-creative daily series retained (bounded to the report's max window, e.g. 90 days), not just period-level sums.",
    backend: "daily-series",
  },

  // ── ComponentBreakdown ──────────────────────────────────────────────────
  "drawer.components.confidence": {
    reason:
      "Confidence isn't a Meta signal — it's a sample-size gate on purchase volume: ≥30 purchases = high, ≥10 = medium, else low, applied per creative.",
    impact:
      "Keeps the panel from treating a 2-purchase blip with the same weight as a statistically meaningful result — low confidence means don't act on the signal yet.",
    whenToAct:
      "Treat 'low' confidence rows as directional only — wait for more spend/volume before running a real test off the signal.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "ours-only",
    howTo:
      "Threshold the creative's already-folded purchase count against fixed cutoffs (30/10) — a read-time comparison against a sum already fetched for CPA/CVR, no new query.",
    backend: "read-time",
  },
  "drawer.components.hookSignal": {
    reason:
      "Hook rate (video3s ÷ impressions, Meta-derived) is compared against the real median hook rate of the video creatives in your current filtered view — not an invented benchmark. Both sides of the comparison are your own Meta data; the only thing that's ours is the choice of median as the reference point.",
    impact:
      "Flags whether the opening 3 seconds is likely carrying or capping the scroll-stop, before CTR/CVR fully confirm it — and because the reference moves with your filters, the read stays true to whatever slice you're looking at.",
    whenToAct:
      "Hook rate meaningfully below your median with CTR also soft → the hook is the first thing to test, not the offer. Widen the filters first if the view holds only a handful of videos.",
    importance: "medium",
    personas: ["Performance marketer"],
    provenance: "derived-from-meta",
    howTo:
      "hookRate = sum(video3s views) ÷ sum(impressions) from the folded window; the reference is the true median (mean of the two centre values on an even list) of that same rate across every video creative in the current filtered view. Fewer than two such creatives → no median exists, so the row states the raw rate and drops the comparison rather than inventing one. All read-time over the already-folded rows.",
    backend: "read-time",
  },

  // ── ScriptElementsPanel ─────────────────────────────────────────────────
  "drawer.script.framework": {
    reason:
      "The copywriting-framework label (e.g. PAS, AIDA) isn't read from Meta — it names the persuasion structure the script follows. In this prototype the label is an illustrative tag on the mock creative, not a live classification.",
    impact:
      "Names the persuasion structure being tested so a buyer can deliberately try a different framework rather than guessing at what to change next.",
    whenToAct:
      "When a creative plateaus, swapping the framework (not just the wording) is a bigger lever than editing individual lines.",
    importance: "low",
    personas: ["Solo creator", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Classify hook/body/CTA text against a fixed framework taxonomy with a lightweight rule-based or LLM classifier once at creative ingestion, then cache the label on the creative record — never re-run on read.",
    backend: "batch-rollup",
  },
  "drawer.script.dropAttribution": {
    reason:
      "The 'possible drop point' highlight (on a frame, or on hook/CTA/audio) is a hypothesis, not a measured diagnosis — it names where attention is likeliest thinning, phrased as a maybe.",
    impact:
      "Points the buyer at one specific script/frame element to test next instead of a vague 'this is fatiguing' verdict.",
    whenToAct:
      "Combine with the Fatigue verdict — if both agree on timing, the flagged element is the highest-value next test.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo:
      "Map Meta's video percentile-watched-actions (video_p25/p50/p75/p95_watched_actions) onto the frame timeline to find the steepest retention drop, then attribute it to the nearest script section — needs the video-insights breakdown fields, an extra per-creative call beyond the default spend/impressions fetch.",
    backend: "meta-breakdown-call",
  },
  "drawer.script.audienceFit": {
    reason:
      "Audience-fit (strong/moderate/weak + best segment) isn't a Meta field — it's a fit hypothesis about where this creative is resonating, phrased as a lead worth checking, not a measured diagnosis.",
    impact:
      "Points spend toward the segment where this specific creative is already resonating instead of broadening it evenly.",
    whenToAct:
      "'Strong' fit on a narrow segment → worth a segment-specific budget bump before broadening the audience.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Fold this creative's own daily rows by age/gender/geo (same fold demographicSplit already does) and compare each segment's ROAS/CTR against the account or category norm for that segment — the top outperforming segment becomes the flagged 'best segment', cached nightly alongside the category-norm rollup.",
    backend: "batch-rollup",
  },

  // ── BenchmarkPanel ──────────────────────────────────────────────────────
  "drawer.benchmark.categoryNorm": {
    reason:
      "Median ROAS and CTR across every other creative sharing this category — a genuine cross-creative aggregate, not a per-creative number.",
    impact:
      "Gives an apples-to-apples bar for the category instead of judging this creative in isolation.",
    whenToAct:
      "Sitting meaningfully below the category median on ROAS with healthy spend → this creative is underperforming its peers, not just underperforming in absolute terms.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Today this medians every peer creative's folded ROAS/CTR at read time over the full dataset; at real scale it needs a nightly batch job that pre-aggregates the median per categoryId and caches it, since scanning every peer creative on every drawer open doesn't hold up past a few thousand creatives.",
    backend: "batch-rollup",
  },
  "drawer.benchmark.platformBestPractice": {
    reason:
      "A static checklist, not a data-driven score — checks this creative's own 7-day frequency against a fixed per-platform ceiling, and its format against the platform's preferred format.",
    impact:
      "Catches basic platform-fit misses (wrong format, frequency past ceiling) before spending time on deeper creative diagnosis.",
    whenToAct:
      "A failed check here is worth fixing before anything else — it's a structural mismatch, not a performance judgment call.",
    importance: "low",
    personas: ["Solo creator", "Agency lead"],
    provenance: "ours-only",
    howTo:
      "Compare the creative's already-folded 7-day frequency and its format field against hardcoded per-platform constants — a pure read-time comparison, no aggregation or extra fetch.",
    backend: "read-time",
  },
  "drawer.benchmark.rankedEdits": {
    reason:
      "Ranks this creative's per-component ROAS gap against the Winners bank's spend-weighted average ROAS for that same component value — sorted worst-gap-first, never below zero.",
    impact:
      "Turns 'this creative could be better' into a specific, ordered test list — which element to change first for the best chance of closing the gap to your own winners.",
    whenToAct:
      "Top of the list with a large gap and ≥2 winner creatives backing the comparison → that's the next A/B test to queue.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "ours-only",
    howTo:
      "Requires a per-dimension/value rollup of the Winners bank (creative count + spend-weighted avgRoas per hook/headline/CTA/... value) built from marked-winner (or bootstrap-archetype) creatives; compute that rollup in a nightly batch job and cache it, then do the gap comparison against this creative's own ROAS at read time.",
    backend: "batch-rollup",
  },

  // ── DemographicsPanel ───────────────────────────────────────────────────
  "drawer.demographics.split": {
    reason:
      "Each age/gender/geo row folds real per-instance breakdown tags against the filtered window — the same fold math as the funnel metrics, just grouped by demographic dimension instead of by day.",
    impact:
      "Shows where spend is actually working within the audience instead of one blended number — a segment can be dragging blended ROAS down while another is carrying it.",
    whenToAct:
      "A segment materially below the blended ROAS with meaningful spend → that segment is a candidate for exclusion or a segment-specific creative, not a reason to pause the whole ad.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager", "Performance marketer"],
    provenance: "derived-from-meta",
    howTo:
      "Meta doesn't return age/gender/region on the default insights fetch — it needs the breakdowns param (age, gender, region) requested per creative/ad, then folded the same way as the top-line metrics. That's an extra API call per creative beyond the default fetch.",
    backend: "meta-breakdown-call",
  },
};
