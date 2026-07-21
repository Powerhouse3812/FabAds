/**
 * Annotation slice — Creatives grid + table (cards, metric columns, bucket
 * chips, layout affordances) and Compare (side-by-side + cross-platform
 * honesty guard). Element ids namespaced `grid.<element>` / `compare.<element>`.
 * Metric ids are shared between the card, the table header, and Compare's
 * CompareColumn rows — same derivation, one entry, referenced from all three
 * call sites rather than duplicated.
 * Authored in the P6 annotation-overlay fan-out (grid/table/compare surfaces).
 */
import type { AnnotationSlice } from "@/creative-report/annotations/types";

export const gridAnnotations: AnnotationSlice = {
  /* ---------------------------------------------------------------- */
  /*  Metrics — shared by CreativeCard, CreativeTable, CompareColumn    */
  /* ---------------------------------------------------------------- */

  "grid.metric.spend": {
    reason:
      "Meta-direct spend field, summed across every surviving daily row in the filtered date window.",
    impact:
      "The denominator for ROAS/CPA — misreading this misreads every derived ratio shown next to it.",
    whenToAct:
      "Spend spiking against a flat bucket assignment is the first thing to check before trusting the bucket.",
    importance: "medium",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "meta-direct",
    howTo:
      "Sum the `spend` field across the account's daily insights rows already fetched for the report window — no extra API call.",
    backend: "read-time",
  },
  "grid.metric.revenue": {
    reason: "Meta-direct purchase-conversion-value field, summed the same way as spend.",
    impact:
      "Feeds ROAS directly — an attribution-window or platform-side modeling change moves this without any creative change.",
    whenToAct:
      "Revenue swinging while spend holds flat usually means an attribution shift, not a creative win.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "meta-direct",
    howTo:
      "Sum the purchase `action_values` field across the same daily rows used for spend — already in the fetched payload.",
    backend: "read-time",
  },
  "grid.metric.roas": {
    reason:
      "Not a Meta field — recomputed here as revenue/spend from the summed totals, per the fold-then-divide rule (never averaged across days).",
    impact:
      "The primary bucket driver — Winners/Scaling/Losers thresholds are ROAS-gated, so this ratio decides which shelf a creative lands on.",
    whenToAct:
      "ROAS sitting right at a bucket threshold edge is worth a manual look before trusting the auto-bucket.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo: "revenue / spend from the already-summed totals — a free in-memory ratio, no extra fetch.",
    backend: "read-time",
  },
  "grid.metric.cpa": {
    reason:
      "Recomputed as spend/purchases from the summed totals; null when there are zero purchases in range (never shown as $0).",
    impact: "Cost per acquisition — the number a performance marketer optimizes toward directly.",
    whenToAct:
      "CPA showing null with real spend flags a creative burning budget with no conversions yet — worth a look, not automatically a loser.",
    importance: "high",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo: "spend / purchases from the summed totals, with an explicit divide-by-zero guard.",
    backend: "read-time",
  },
  "grid.metric.ctr": {
    reason: "Recomputed as clicks/impressions × 100 from the summed totals.",
    impact: "Early hook/creative-appeal signal, ahead of conversion data.",
    whenToAct:
      "A falling CTR alongside rising frequency is one of the fatigue triggers — check the Fatigue panel.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "derived-from-meta",
    howTo: "clicks / impressions from the summed daily totals — recomputed, never averaged per-day CTRs.",
    backend: "read-time",
  },
  "grid.metric.outboundCtr": {
    reason:
      "Same recompute as CTR but using outbound (off-platform link) clicks instead of all clicks.",
    impact:
      "Separates on-platform engagement (likes/comments count toward `clicks`) from real traffic leaving to the landing page.",
    whenToAct:
      "CTR healthy but Outbound CTR weak means engagement isn't converting into site traffic — a landing-page problem, not a creative one.",
    importance: "low",
    personas: ["Performance marketer"],
    provenance: "derived-from-meta",
    howTo: "outbound_clicks / impressions from the summed totals — same free ratio as CTR.",
    backend: "read-time",
  },
  "grid.metric.cvr": {
    reason: "Recomputed as purchases/clicks × 100 from the summed totals.",
    impact: "Where the funnel leaks between click and purchase — more a landing-page/offer signal than a creative one.",
    whenToAct:
      "CTR strong but CVR weak points at the landing page or offer — don't route this into a creative refresh.",
    importance: "medium",
    personas: ["Performance marketer", "Brand manager"],
    provenance: "derived-from-meta",
    howTo: "purchases / clicks from the summed totals — free ratio, no extra fetch.",
    backend: "read-time",
  },
  "grid.metric.cpm": {
    reason: "Recomputed as spend/impressions × 1000 from the summed totals.",
    impact:
      "Reads auction pressure/audience competitiveness — rising CPM with flat targeting usually means saturation or a seasonal bid spike.",
    whenToAct: "CPM climbing sharply while ROAS holds is worth a scaling-pace check before pushing more budget in.",
    importance: "low",
    personas: ["Agency lead"],
    provenance: "derived-from-meta",
    howTo: "spend / impressions × 1000 from the summed totals — free ratio.",
    backend: "read-time",
  },
  "grid.metric.cpc": {
    reason: "Recomputed as spend/clicks from the summed totals; null when there are zero clicks.",
    impact: "Cost efficiency of the click itself, independent of what happens after the click.",
    whenToAct: "CPC rising with CTR flat usually means auction cost (CPM) is driving it, not creative fatigue.",
    importance: "low",
    personas: ["Performance marketer"],
    provenance: "derived-from-meta",
    howTo: "spend / clicks from the summed totals, guarded against divide-by-zero.",
    backend: "read-time",
  },
  "grid.metric.hookRate": {
    reason:
      "Video-only — recomputed as 3-second video views/impressions; null for static/carousel (never a fabricated 0%).",
    impact: "How well the first 3 seconds stop the scroll — the earliest creative-quality signal, ahead of CTR.",
    whenToAct:
      "A falling hook-rate trend is one of the fatigue triggers — treat it as 'refresh the opening frame' territory.",
    importance: "medium",
    personas: ["Performance marketer", "Solo creator"],
    provenance: "derived-from-meta",
    howTo: "video_3s_views / impressions from the summed totals, only when every folded row actually carries video data.",
    backend: "read-time",
  },
  "grid.metric.holdRate": {
    reason:
      "Video-only — recomputed as thruplays/3-second-views; measures whether people who started watching kept watching.",
    impact:
      "Distinguishes a strong hook that doesn't hold (high hook-rate, low hold-rate) from a weak hook — different fixes.",
    whenToAct: "Hook-rate healthy but hold-rate weak points at mid-video pacing/story, not the opening frame.",
    importance: "low",
    personas: ["Performance marketer", "Solo creator"],
    provenance: "derived-from-meta",
    howTo: "thruplays / video_3s_views from the summed totals — same video-only guard as hook-rate.",
    backend: "read-time",
  },
  "grid.metric.frequency": {
    reason:
      "Meta-direct field reported per day (reach-based); the value shown is the mean of the daily snapshots in range, per the fold rule for non-additive fields.",
    impact: "The clearest 'same people seeing this too often' signal — the other fatigue trigger alongside CTR/hook-rate decay.",
    whenToAct: "Frequency past the fatigue ceiling with softening CTR is the fatigue trigger, even before ROAS breaks.",
    importance: "medium",
    personas: ["Performance marketer", "Agency lead"],
    provenance: "meta-direct",
    howTo: "Mean of the daily `frequency` field already returned in the account's daily insights rows for the window.",
    backend: "read-time",
  },
  "grid.metric.purchases": {
    reason: "Meta-direct conversion count, summed across the filtered daily rows.",
    impact: "Sample-size floor for confidence — low purchases means ROAS/CPA are noisy even when the ratio looks decisive.",
    whenToAct: "Purchases under roughly 10 in range means read ROAS/CPA as directional, not a scaling decision.",
    importance: "low",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "meta-direct",
    howTo: "Sum the `purchases` conversion field across the same daily rows used for spend/revenue.",
    backend: "read-time",
  },

  /* ---------------------------------------------------------------- */
  /*  Bucket + dedup — ours-only signals                                */
  /* ---------------------------------------------------------------- */

  "grid.bucket": {
    reason:
      "Not a Meta field — an auto-categorisation rule evaluated in priority order (New → Fatiguing → Winners → Scaling → Losers) against the buyer's own editable thresholds.",
    impact: "Drives triage — which shelf a creative sits on, and by extension which automations and rollups pick it up.",
    whenToAct:
      "A bucket flip right at a threshold edge (e.g. ROAS 1.95 vs a 2.0 Winners bar) is worth a manual glance, not blind trust.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Evaluate the threshold rule against this creative's already-folded metrics, fatigue verdict, and 7d spend trend. The fatigue and trend legs need rolling daily-window aggregates, so precompute those in the nightly rollup rather than on every read.",
    backend: "daily-series",
  },
  "grid.dedup": {
    reason: "Not a Meta field — a near-duplicate flag with a match % linking two creatives whose concept overlaps, so the pair isn't read as two independent results.",
    impact: "Prevents double-counting the same creative concept as two separate 'winners' in rollups and boards.",
    whenToAct: "A high dup % on two creatives both trending toward Winners is worth merging before either scales independently.",
    importance: "low",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Cross-creative similarity comparison (hash or embedding distance) across the whole library — too expensive per view. Compute in a nightly batch job and cache the match + score per creative pair.",
    backend: "batch-rollup",
  },

  /* ---------------------------------------------------------------- */
  /*  Actions — card inline row + ActionMenu kebab (no provenance/backend) */
  /* ---------------------------------------------------------------- */

  "grid.action.generateVariation": {
    reason: "Action, not a metric — opens the Genie flow seeded with this creative's components to generate a new variant.",
    impact: "The main lever for acting on a Winners/Fatiguing signal without leaving the report.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Solo creator", "Agency lead"],
    howTo: "Simulated in this prototype — sets a local optimistic flag only; nothing is sent to Genie or any real generation pipeline.",
  },
  "grid.action.relaunch": {
    reason: "Action — relaunches this creative into Launch with its existing targeting.",
    impact: "The fastest path from 'this is a Winner' to actually spending more against it.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Agency lead", "Performance marketer"],
    howTo: "Simulated (optimistic flag only) — nothing is sent to a real ad platform in this prototype.",
  },
  "grid.action.save": {
    reason: "Action — saves this creative to the Creative Library board for reuse.",
    impact: "Keeps a Winner discoverable for future briefs instead of it getting buried in the feed.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Solo creator", "Brand manager"],
    howTo: "Simulated (optimistic flag only) — nothing is sent to a real library/storage backend in this prototype.",
  },
  "grid.action.markWinner": {
    reason: "Action — manually confirms the bucket as a Winner regardless of the auto-rule.",
    impact: "Lets a buyer's judgment override the threshold rule when the numbers alone don't tell the full story (e.g. a strategic hero creative).",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Agency lead", "Brand manager"],
    howTo: "Simulated (optimistic flag only, local state) — doesn't change the underlying ROAS/spend the auto-bucket rule reads.",
  },
  "grid.action.addToBoard": {
    reason: "Action — files this creative into one of the buyer's boards (automations grouping).",
    impact: "Boards feed the automations engine — adding here is how a creative enters a rule/digest scope.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Agency lead"],
    howTo: "Simulated — writes to the local boards mock store only; no real backend persistence in this prototype.",
  },
  "grid.action.duplicate": {
    reason: "Action — clones this creative's record as a new draft to iterate on.",
    impact: "Lets a buyer branch off a Winner without touching the original's history/metrics.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Solo creator", "Agency lead"],
    howTo: "Simulated (optimistic flag only) — nothing is sent to a real ad platform or asset store in this prototype.",
  },
  "grid.action.editTargeting": {
    reason: "Action — opens targeting edit for this creative's next launch.",
    impact: "The other lever besides Relaunch for acting on a bucket signal — adjust audience instead of just resubmitting.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Performance marketer", "Agency lead"],
    howTo: "Simulated (optimistic flag only) — nothing is sent to a real ad platform in this prototype.",
  },
  "grid.action.pause": {
    reason: "Action — pauses this creative's active instances.",
    impact: "The fast brake on a Loser or a still-spending fatiguing creative.",
    whenToAct: "User-triggered — not a signal to watch for.",
    importance: "low",
    personas: ["Performance marketer", "Agency lead"],
    howTo: "Simulated (optimistic flag only) — nothing is sent to a real ad platform in this prototype.",
  },

  /* ---------------------------------------------------------------- */
  /*  Portfolio aggregate                                               */
  /* ---------------------------------------------------------------- */

  "grid.portfolio.trend": {
    reason: "Not a single Meta field — spend and revenue from every filtered creative's own daily series, summed by date.",
    impact: "The portfolio-level 'is the whole book of spend paying back' read, sitting above the per-creative table (graph + table pattern).",
    whenToAct: "Revenue diverging from spend across the whole portfolio (not just one creative) is a targeting/seasonality signal, not a single-creative fatigue signal.",
    importance: "medium",
    personas: ["Agency lead", "Brand manager"],
    provenance: "ours-only",
    howTo:
      "Sum each rollup's own folded daily spend/revenue by date across every creative in the current filter. Cross-creative and over time, so precompute in the nightly rollup and cache rather than folding on every page load.",
    backend: "daily-series",
  },

  /* ---------------------------------------------------------------- */
  /*  Compare — cross-platform honesty guard + chart presentation rules */
  /* ---------------------------------------------------------------- */

  "compare.crossPlatformWarning": {
    reason: "Not a Meta field — an ours-only honesty guard that fires when a creative's ad instances span more than one platform.",
    impact:
      "Meta and TikTok (etc.) use different attribution windows, so a naive sum across platforms would silently misstate ROAS/CPA — this warning stops that number from ever being shown as one figure.",
    whenToAct: "Whenever it's showing, read each platform's column on its own — never mentally add them together.",
    importance: "high",
    personas: ["Agency lead", "Performance marketer", "Brand manager"],
    provenance: "ours-only",
    howTo: "Group this creative's surviving ad instances by platform and check for more than one distinct value — already-fetched instance data, no extra call.",
    backend: "read-time",
  },
  "compare.chart.line": {
    reason:
      "Ours-only chart-honesty rule — each line plots one column's (creative or platform) own folded daily revenue; dates are unioned but never interpolated or summed across columns.",
    impact: "Keeps a cross-platform or cross-creative comparison from ever implying a combined total that doesn't actually exist.",
    whenToAct: "A gap in one line (not connected) means that column had no data that day — read it as missing, not zero.",
    importance: "medium",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo: "Each column's daily revenue rows are already fetched per creative/platform; union the date keys for the x-axis without merging values across columns.",
    backend: "daily-series",
  },
  "compare.chart.bar": {
    reason:
      "Ours-only presentation rule — one bar per column from that column's own already-folded metric, with no composite score and no automatic 'winner' highlight.",
    impact: "Leaves the read to the buyer instead of the tool declaring a winner, which would hide nuance (e.g. a low-ROAS column that's still profitable at scale).",
    whenToAct: "Read alongside Spend, not instead of it — a high ROAS bar on very low spend isn't yet a scaling decision.",
    importance: "low",
    personas: ["Agency lead", "Performance marketer"],
    provenance: "ours-only",
    howTo: "Read the selected metric straight off each column's already-folded metrics object; switching the metric dropdown is a local re-render, no refetch.",
    backend: "read-time",
  },
};
