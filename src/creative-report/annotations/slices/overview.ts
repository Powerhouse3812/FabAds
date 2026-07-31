/**
 * Annotation slice — Overview screen (bucket tabs, Catalogue breakdown,
 * recommendations, automations preview, trust meter) plus the `overview.kpi.*`
 * entries KpiCards still uses on the Owner Report. Element ids namespaced
 * `overview.<element>`. Authored in the P6 annotation-overlay fan-out;
 * Covers BOTH live Overviews: the 3.0 redesign (bucket tabs, breakdown,
 * recommendations, automations preview) and the 2.0 legacy screen, whose
 * `overview.fatiguingNow` / `overview.topMovers` entries are grouped and
 * labelled below.
 */
import type { AnnotationSlice } from "@/creative-report/annotations/types";

export const overviewAnnotations: AnnotationSlice = {
  "overview.kpi.spend": {
    reason:
      "Spend is Meta's raw cost field, summed as-is across every active instance in the filtered range — no derivation.",
    impact:
      "The denominator for every efficiency read on this screen; a spend spike with flat revenue is the first thing to check before assuming ROAS broke.",
    whenToAct:
      "Delta swings sharply against the compare period → confirm it's from more creatives running or higher CPMs, not just a filter change.",
    importance: "medium",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the `spend` daily-row field over the current range; the delta folds the same-length prior period from stored daily rows and diffs the two sums.",
    backend: "daily-series",
  },
  "overview.kpi.revenue": {
    reason:
      "Revenue is Meta's raw purchase-value field, summed the same way as spend — no derivation.",
    impact:
      "Paired with spend it's what ROAS is built from; a revenue dip with spend holding steady is usually creative fatigue, not a targeting fault.",
    whenToAct:
      "Delta trending down two periods running while spend holds → treat it as a portfolio-level fatigue signal, not one bad creative.",
    importance: "medium",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the `revenue` daily-row field for the current window; the delta needs the prior equal-length window folded the same way.",
    backend: "daily-series",
  },
  "overview.kpi.roas": {
    reason:
      "ROAS = revenue ÷ spend, recomputed from the folded sums — never averaged per-creative (the cardinal rule in foldRows/kpiSummary).",
    impact:
      "The number buyers scan first; below your winner threshold at real spend is what pushes a creative toward Losers.",
    whenToAct:
      "ROAS delta negative two periods running → don't wait for the bucket to flip to Losers, sort the grid by ROAS delta to see which creative is dragging it.",
    importance: "high",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo:
      "Divide current-period folded revenue by folded spend; the delta re-runs the same division on the prior-period sums and diffs the two ratios.",
    backend: "daily-series",
  },
  "overview.kpi.cpa": {
    reason:
      "CPA = spend ÷ purchases, recomputed from folded sums; renders as \"not enough data\" (never a bare dash) when purchases are zero.",
    impact:
      "Rising CPA alongside flat ROAS usually means volume is coming from a thinner audience, not that the creative itself broke.",
    whenToAct:
      "CPA delta up while ROAS holds → widen or refresh targeting before touching the creative.",
    importance: "medium",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo:
      "Divide folded spend by folded purchases for the current window; the delta re-divides the prior-period sums, guarded against divide-by-zero.",
    backend: "daily-series",
  },
  "overview.kpi.purchases": {
    reason:
      "Purchases is Meta's raw conversion count, summed over the range — no derivation, and KpiSummary carries no delta for it.",
    impact:
      "The sample size behind every ratio above; a low count is the reason to read CPA/ROAS as directional rather than precise.",
    whenToAct:
      "A ROAS or CPA number looks surprising → swap this metric in and check whether it's actually backed by enough purchases to trust.",
    importance: "low",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "meta-direct",
    howTo: "Sum the `purchases` daily-row field over the range — a plain read-time aggregate, nothing recomputed.",
    backend: "read-time",
  },
  "overview.kpi.ctr": {
    reason:
      "CTR = clicks ÷ impressions, recomputed from folded sums; KpiSummary has no delta for it so it always renders flat.",
    impact:
      "A portfolio-level attention read — useful to sanity-check against a single creative's CTR trend in the drawer.",
    whenToAct:
      "Fatiguing rows start citing CTR moves → swap this in to see whether the shift is portfolio-wide or one creative.",
    importance: "low",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo: "Divide total clicks by total impressions from the current folded sums — read-time, no stored history needed.",
    backend: "read-time",
  },
  "overview.bucket": {
    reason:
      "Winners / Scaling / Fatiguing / New / Losers is a rule-based classification per creative (assignBucket in selectors.ts), evaluated in priority order New → Fatiguing → Winners → Scaling → Losers → unclassified. Not a Meta field.",
    impact:
      "This is the day's shortlist — each tab opens that bucket's creatives right below (top spenders first, with a view-all handoff to the grid), so it's usually the first stop in triage.",
    whenToAct:
      "Losers count climbing while Winners holds steady → the portfolio is spend-heavy on underperformers; work that bucket before scaling anything new.",
    importance: "high",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Evaluate the same threshold rule (shown inline, editable via Edit formulas) against every creative's folded metrics and fatigue verdict for the active filter set, then tally counts per bucket. Precompute the per-creative bucket assignment in the nightly rollup; the count itself is a cheap read-time tally on top of that.",
    backend: "batch-rollup",
  },

  /* ---- Creative Report 2.0 (legacy) Overview only ----------------------
   * These two ids are rendered by components/legacy/FatiguingNowList and
   * components/legacy/TopMovers, i.e. only on /reports/creative-v2. The 3.0
   * Overview folds both facts into its bucket tabs and does not render them.
   * Kept here (not in a v2-only slice) because the annotation registry is
   * shared infrastructure and WhyDot is inert for ids it never renders. */
  "overview.fatiguingNow": {
    reason:
      "The Fatiguing bucket's members, worst-spend-first (fatiguingNow() in selectors.ts) — a triage shortlist, not a Meta report.",
    impact:
      "The \"act today\" list — the reason chip (CTR / Freq / Hook) tells you which lever moved, so you know whether to refresh the hook, cap frequency, or wait.",
    whenToAct:
      "A high-spend creative lands here → pause, iterate, or view it today; letting it ride burns budget on a signal that already fired.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo:
      "Filter the active rollups to bucket === 'fatiguing' (itself driven by the 14-day CTR/hook and 7-day frequency rule), sort by spend, cap at 5 — same nightly per-creative rollup as the bucket counts, no extra query.",
    backend: "batch-rollup",
  },
  "overview.topMovers": {
    reason:
      "Ranks creatives by |ROAS delta| over the compare period, floored at $500 spend to filter out noise (topMovers() in selectors.ts) — an ours-only ranking, not a Meta list.",
    impact:
      "Surfaces what's moving before it shows up in a bucket flip — often the earliest sign a Winner is decaying or a middling creative is about to turn into Scaling.",
    whenToAct:
      "A creative shows a large negative ROAS delta with rising spend → check its drawer before the next scaling decision, not after.",
    importance: "medium",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo:
      "Compute roasDeltaPct for every rollup in view (current vs. prior equal-length window, both folded from stored daily rows), filter to spend ≥ $500, sort by |delta|, cap at 6. The compare-window fold is the only added cost over the base rollup.",
    backend: "daily-series",
  },
  "overview.breakdown": {
    reason:
      "Groups the filtered creatives by Catalogue brand, category, or product (breakdownRollups in selectors.ts), then folds — sums first, recomputes ratios after — to one row per value, same discipline as the Owner Report's by-brand table. A creative with no link on the active dimension is excluded from the table rather than folded into a fake \"Unknown\" row.",
    impact:
      "Puts \"which brand/category/product is actually winning\" on the morning-triage screen instead of requiring a trip to the Owner Report — the first place to look before deciding where to push budget or briefs next.",
    whenToAct:
      "A row's ROAS diverges hard from the portfolio KPIs above, or the excluded-creatives count is large → drill into the Owner Report or fix Catalogue links before trusting the split.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager", "Performance marketer"],
    provenance: "ours-only",
    howTo:
      "A nightly job aggregates each filtered creative's daily rows by its Catalogue brand/category/product id and caches the folded totals per dimension; this card reads that cache and switches which cached grouping it displays on toggle, rather than summing rows live on every click.",
    backend: "batch-rollup",
  },
  "overview.trustMeter": {
    reason:
      "A real backtest of the fatigue rule (computeTrustMeter in trustMeter.ts): for every creative with 28+ days of history, re-run the CURRENT fatigue rule at a cutoff 14 days before its latest data, using only data available then, then check whether CTR kept declining afterward.",
    impact:
      "Tells you how much to trust the Fatiguing bucket itself this period — a thin flagged-count or low hit-rate is a reason to eyeball a fatigue flag before pausing spend on it.",
    whenToAct:
      "Hit-rate drops noticeably from what you're used to, or the sample stays thin for weeks → the rule or its thresholds may need retuning, not just the individual creative.",
    importance: "medium",
    personas: ["Agency lead", "Performance marketer", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "For each qualifying creative, fold spend up to the cutoff, run computeFatigue against the buyer's live thresholds, then fold CTR before/after the cutoff from stored daily rows to check for continued decline. Needs each creative's daily history, so it runs as a nightly batch across the portfolio with the hit/flagged counts cached, never recomputed on page load.",
    backend: "daily-series",
  },
  "overview.recommendations": {
    reason:
      "Each line is a literal count + sum readout from buildRecommendations() over the current filter set — fatiguing/losers/scaling counts and their spend, a brand-vs-portfolio ROAS gap, and a new-creative count. None of it predicts an outcome, scores a creative, or infers a cause; it restates numbers the report already computed.",
    impact:
      "The single 'what to do today' list — collapses the bucket row, top movers, and owner-report brand breakdown into the handful of lines actually worth acting on right now, each with a one-click way to go look.",
    whenToAct:
      "The list is empty → genuinely nothing crossed a threshold this range, not a loading or error state; a line appearing that wasn't there yesterday is itself the signal to open it before the next scaling or budget call.",
    importance: "high",
    personas: ["Solo creator", "Agency lead", "Performance marketer", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Filter the already-loaded rollups by bucket for fatiguing/losers/scaling/new, summing spend per group; for the brand-gap line, fold rollups by brand (breakdownRollups) and compare each brand's ROAS to the portfolio's, surfacing the widest gap past a materiality and threshold floor. All read-time over data the Overview already has in memory — no new query, no stored history.",
    backend: "read-time",
  },
  "overview.automationsPreview": {
    reason:
      "A UI placeholder, not a data readout — it previews the four routing destinations a quick-create rule could send a matched creative to.",
    impact:
      "Sets expectations for where Overview-level automation is headed without pretending it works today; the dashed tiles and disabled affordance keep it from being mistaken for a live control.",
    whenToAct:
      "Never — there's nothing to act on here yet. Use 'Open Automations' to reach the real rules/boards engine instead.",
    importance: "low",
    personas: ["Agency lead", "Performance marketer", "Brand manager"],
    howTo:
      "None of the four routes (folder, Genie knowledge base, Launch, Meta ad library) are implemented at the Overview level — the tiles are non-interactive and nothing is sent anywhere on this screen. The real rules/boards automations engine already exists and is reachable via this card's 'Open Automations' link.",
  },
};
