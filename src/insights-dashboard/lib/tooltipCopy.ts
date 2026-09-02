/**
 * tooltipCopy — the one registry for every `InfoTip` on the Industry
 * Insights dashboard (`/insights/overview`).
 *
 * Maalik's ask, verbatim: "on this page, give tooltip on every data point,
 * action, kpi, metrix, content. that what it is and what it provide and
 * what actionable comes from it." Every entry therefore answers exactly
 * three questions, in this order:
 *   1. `what`   — the plain definition (what it is).
 *   2. `gives`  — why it's on the dashboard at all (what it gives you).
 *   3. `action` — the next step, when a genuine one exists (what to do
 *                 with it). Optional: a few things have no real next step,
 *                 and inventing one would be worse than leaving it out.
 *
 * Copy lives here, not inline in components, for two reasons: Maalik can
 * read and edit every tooltip as one list instead of hunting 18 files, and
 * two blocks can never describe the same concept two different ways — the
 * exact bug that already shipped once (YouVsMarket and ShareOfVoice
 * disagreeing about a brand's ad count). Where two blocks render the
 * literal same concept (e.g. "New ads (30d)" in both `TopCompetitors` and
 * `DomainsTeaser`), they share ONE key here on purpose.
 *
 * ── Rules every entry in this file follows ──────────────────────────────
 *  - Short. Each part is one sentence. FabAds/FabFunnel vocabulary only —
 *    no invented metric names, no "AI" framing anywhere.
 *  - Honest about prototype limits. Several actions on this page are inert
 *    (local `useState` + a toast, nothing written anywhere real, resets on
 *    reload) — see `src/lib/ad-entity-write-store.ts` for what a REAL
 *    optimistic write store looks like elsewhere in FabAds, and note that
 *    Industry Insights' follow/brief/watch/save actions are NOT that: they
 *    are component-local state with no persistence layer at all. The
 *    `action` line for those says so plainly rather than promising a write
 *    that never happens.
 *  - Never restates what `Provenance` (`components/Provenance.tsx`) already
 *    says — no entry here mentions where a number came from or how fresh it
 *    is; that is Provenance's job. This file is meaning + action only.
 *
 * ── Namespaces (so 14 parallel editors can't collide on a key) ──────────
 *   kpi.*    — the 5 KpiRow tiles.
 *   block.*  — one entry per block's own heading, explaining the whole block.
 *   metric.* — a labelled figure inside a block that isn't a table column.
 *   column.* — a literal table/list column header (or its pseudo-header
 *              equivalent, e.g. TopCompetitors' ranked-list header row).
 *   action.* — a button, link, or chip a user can act on.
 *   chart.*  — a chart's own heading/legend, when it needs an explanation
 *              beyond what its block heading already gives.
 *
 * Add new keys in the matching namespace. Do not invent a new namespace for
 * one entry; `metric.*` is the catch-all for "a labelled number that isn't
 * a KPI tile and isn't a column".
 */

export interface TooltipCopy {
  /** Bold first line — a short label, not a restatement of the trigger's own text. */
  label: string;
  /** What this is, one sentence. */
  what: string;
  /** What it gives you — why it's on the dashboard, one sentence. */
  gives: string;
  /**
   * What to do with it, one sentence. Omit only when there is genuinely no
   * next step — never invent one to fill the slot.
   */
  action?: string;
}

export const TOOLTIP_COPY: Record<string, TooltipCopy> = {
  // ── kpi.* — KpiRow's 5 primary tiles (KPI_PRIMARY_KEYS) ────────────────
  "kpi.total-saved-ads": {
    label: "Total saved ads",
    what: "Every ad you've saved to a board, across your workspace.",
    gives: "Shows how much swipe-file material you've collected so far.",
    action: "Click the tile to open Saved and review what's there.",
  },
  "kpi.industries-followed": {
    label: "Industries followed",
    what: "How many industries you're tracking, out of the full catalogue.",
    gives: "Shows how wide your coverage is before change signals can appear.",
    action: "No direct link yet — manage your list from Manage preferences.",
  },
  "kpi.brands-followed": {
    label: "Brands followed",
    what: "Every brand you follow, plus how many have gone quiet lately.",
    gives: "Flags stale follows so your watchlist stays worth checking.",
    action: "The inactive count under the number explains itself — no link yet.",
  },
  "kpi.competitors-followed": {
    label: "Competitors followed",
    what: "The subset of followed brands you've also marked as competitors.",
    gives: "Sets the scope for every \"tracked\" badge and competitor total on this page.",
    action: "No direct link yet — manage this list from Manage preferences.",
  },
  "kpi.total-competitor-ads": {
    label: "Total competitor ads",
    what: "Ads running right now from the competitors you follow.",
    gives: "One number for how much your tracked competitors currently have live.",
    action: "Click the tile to open Competitors and see who's running what.",
  },

  // ── block.* — one per block heading ────────────────────────────────────
  "block.change-feed": {
    label: "What changed",
    what: "New, shifted, or withdrawn ads since your last scan, biggest change first.",
    gives: "The weekly catch-up, pre-computed, so you don't have to compare scans yourself.",
    action: "Dismiss a change you don't need — or scroll for the rest.",
  },
  "block.long-runners": {
    label: "Top performing ads",
    what: "Competitor ads ranked by days still running — not by measured performance.",
    gives: "Longevity is the best outside signal available, but a weak one.",
    action: "Open a card for Discover, or brief/save it for later.",
  },
  "block.top-competitors": {
    label: "Top competitors",
    what: "Top 5 advertisers by ads launched in the last 30 days, across the industries FabAds tracks.",
    gives: "Shows who's shipping the most new creative, plus their 12-week launch pace.",
    action: "Follow a competitor, or open Competitors for the full list.",
  },
  "block.angle-mix": {
    label: "Copy angle mix",
    what: "Which copy angles the market runs, with your own mix beside it once you have ads live.",
    gives: "Shows where your messaging leans differently from what's working around you.",
    action: "Click a slice or legend row to see those ads in Discover.",
  },
  "block.you-vs-market": {
    label: "You vs market",
    what: "Your live ads, launch pace, and creative lifespan against the market average.",
    gives: "Shows whether you're refreshing creative faster or slower than competitors — not who's winning.",
    action: "Scope is creative behaviour only — no spend or performance data here.",
  },
  "block.domains-teaser": {
    label: "Top domains & pages",
    what: "Top domains or advertiser pages across the industries FabAds tracks, with live and new-ad counts.",
    gives: "Surfaces top advertisers you may not already follow — not just your existing competitors.",
    action: "Follow a row, or click View ads to open it in Discover.",
  },
  "block.share-of-voice": {
    label: "Top industries · brand share",
    what: "The biggest industries FabAds tracks and which brands hold the most live ads in each.",
    gives: "Shows who leads an industry by creative volume — never by spend.",
    action: "Click an industry or brand name to open it in Discover.",
  },
  "block.board-hygiene": {
    label: "Board hygiene",
    what: "Saved boards with stale sources or saves that were never turned into a brief.",
    gives: "Surfaces swipe files that quietly went stale, so nothing saved goes to waste.",
    action: "Expand to see which boards need a look, then Review or mark it done.",
  },
  "block.where-to-go": {
    label: "Where to go",
    what: "Every surface in Industry Insights — My Feeds, Discover, Saved Ads, Competitor, Domain, Trends.",
    gives: "One table of contents so you don't have to remember the module's own nav.",
    action: "Click a row to jump straight to that surface.",
  },
  "block.setup-checklist": {
    label: "Finish setup",
    what: "The three steps that unlock this dashboard: follow industries, track a competitor, install the extension.",
    gives: "Shows exactly what's left before change signals and comparisons have anything to work from.",
    action: "Use the highlighted step's button to continue where you left off.",
  },
  "block.trends-summary": {
    label: "Trends",
    what: "How many updates live in the Trends newsroom right now, by source.",
    gives: "A numbers-only preview so you know if it's worth a visit.",
    action: "Click a count or View all to read the actual stories.",
  },
  "block.page-sources": {
    label: "Data sources",
    what: "This page's figures are built from these named upstreams, one country at a time.",
    gives: "Shows exactly who's behind the numbers, so nothing here is unattributed.",
  },
  "block.what-to-try-next": {
    label: "What to try next",
    what: "One suggestion at a time — an angle gap, a real corpus hook, a format, or an advertiser to follow.",
    gives: "Turns what the page above already showed into one concrete next move.",
    action: "Use the arrows to cycle suggestions; each action's own tooltip says whether it's fully wired yet.",
  },

  // ── metric.* — labelled figures that aren't KPI tiles or table columns ─
  "metric.long-runner-tier": {
    label: "Creative maturity",
    what: "Testing (under 21 days), working (21–45), or proven (45+ days) still running.",
    gives: "A quick read on how long this creative has survived without being pulled.",
    action: "Click the tier to see every ad in that band in Discover.",
  },
  "metric.you-vs-market-live-ads": {
    label: "Live ads",
    what: "Your live ad count next to the average across the industries FabAds tracks.",
    gives: "Shows whether you're running noticeably more or fewer live ads than typical.",
  },
  "metric.you-vs-market-ads-per-week": {
    label: "New ads per week",
    what: "Your weekly launch pace next to the per-advertiser average over 12 weeks.",
    gives: "Shows whether you're refreshing creative faster or slower than a typical competitor.",
  },
  "metric.you-vs-market-lifespan": {
    label: "Average creative lifespan",
    what: "How long your ads stay live, on average, next to the market median.",
    gives: "A longer or shorter lifespan than the market isn't good or bad on its own.",
  },
  "metric.you-vs-market-verdict": {
    label: "Verdict",
    what: "Whether you sit above, below, or even with the market on this row.",
    gives: "A direction, not a score — below the market isn't automatically worse.",
  },
  "metric.refresh-cadence": {
    label: "Refresh cadence",
    what: "The typical gap between when you ship one new creative and the next.",
    gives: "Shorter isn't always better — it depends on how fast your angles fatigue.",
  },
  "metric.copy-angle-share": {
    label: "Angle share",
    what: "This angle's share of the market's live creative, with your own share beside it once you have ads live.",
    gives: "Shows which angles the market leans on that you're under-using, or over-using.",
    action: "Click to open every ad using this angle in Discover.",
  },
  "metric.angle-gap": {
    label: "Widest gap",
    what: "The copy angle where your share differs most from the market's.",
    gives: "Points to the one angle worth testing next, or dropping if you're overexposed.",
  },
  "metric.domain-vs-page-toggle": {
    label: "Domain vs page",
    what: "A domain is where ads point; a page is the Meta identity running them.",
    gives: "One advertiser can run several pages against one domain, so rankings can differ by which you pick.",
  },
  "metric.top-competitors-basis": {
    label: "Followed competitors",
    what: "How many of these competitors you follow, and their combined live ads right now.",
    gives: "Separates \"ads launched in 30 days\" above from \"ads running today\" in this line.",
  },
  "metric.brand-share-callout": {
    label: "Brand share",
    what: "The top brand's slice of this industry's live ads, with your own slice beside it once you have ads live.",
    gives: "Shows who leads and exactly how far behind (or ahead) you are.",
    action: "Click a brand name to see its ads in Discover.",
  },
  "metric.board-stale-count": {
    label: "Stale",
    what: "Saved ads whose original source has since gone inactive.",
    gives: "Flags swipe-file items that no longer reflect a live ad.",
    action: "Expand the card to see which boards they're in.",
  },
  "metric.board-never-briefed-count": {
    label: "Never briefed",
    what: "Ads you saved but never turned into a brief.",
    gives: "Flags saves that turned into dead weight instead of action.",
    action: "Expand the card to see which boards they're in.",
  },
  "metric.scan-state": {
    label: "Scan status",
    what: "Indexed (scanned), scanning (in progress), or not started for this industry.",
    gives: "Tells you whether a low or zero count is a real finding or just an unfinished scan.",
  },
  "metric.trends-source-count": {
    label: "Source count",
    what: "How many Trends updates come from this one source.",
    gives: "Breaks the total down so you know where the volume is coming from.",
    action: "Click to open Trends filtered to just this source.",
  },
  "metric.trends-total-updates": {
    label: "Total updates",
    what: "Every update currently tracked across all six Trends sources.",
    gives: "The single number for how much is in the newsroom right now.",
  },
  "metric.trends-new-updates": {
    label: "New updates",
    what: "Updates that appeared since the last time this was checked.",
    gives: "Tells you if it's worth a visit today, or nothing's changed.",
  },
  // ── column.* — literal table/list column headers ───────────────────────
  "column.live-ads": {
    label: "Live ads",
    what: "Ads currently running for this domain or page, right now.",
    gives: "The \"is this still active\" number — separate from how much launched recently.",
  },
  "column.new-ads-30d": {
    label: "New ads (30d)",
    what: "Ads launched in the last 30 days — not the same as ads live now.",
    gives: "Shows momentum: who's actively shipping, not just who has a lot running.",
  },

  // ── action.* — buttons, links, chips a user can act on ─────────────────
  "action.brief-it": {
    label: "Brief it",
    what: "Marks this for your weekly brief, for this browser session only.",
    gives: "A quick flag so you don't lose track of it while you keep scanning.",
    action: "Nothing is queued anywhere real yet — it resets if you reload the page.",
  },
  "action.dismiss-signal": {
    label: "Dismiss",
    what: "Hides this change from the feed.",
    gives: "Lets you clear noise without losing the ability to bring it back.",
    action: "Removes it from view now; Undo restores it if you change your mind.",
  },
  "action.save-ad": {
    label: "Save",
    what: "Marks this ad as saved, for this browser session only.",
    gives: "A quick bookmark while you browse the gallery.",
    action: "Not yet wired to your real boards — it resets if you reload the page.",
  },
  "action.variation-disabled": {
    label: "Variation",
    what: "Would send this ad's hook and thumbnail into Genie as a starting point.",
    gives: "Turned off because Genie can't read that context from a link yet.",
    action: "Disabled for now — nothing happens if you click it.",
  },
  "action.follow-competitor": {
    label: "Follow",
    what: "Adds this competitor to your watchlist, for this session only.",
    gives: "Lets you track a shipping-heavy competitor you don't already follow.",
    action: "Session-only — nothing is written to your workspace, and it resets on reload.",
  },
  "action.follow-domain": {
    label: "Follow",
    what: "Adds this domain or page to your watchlist, for this session only.",
    gives: "Lets you track a top advertiser you hadn't already followed.",
    action: "Session-only — nothing is written to your workspace, and it resets on reload.",
  },
  "action.follow-industry": {
    label: "Follow",
    what: "Adds this industry to your followed list.",
    gives: "Unlocks data that's already indexed — no waiting on a new scan.",
    action: "Session-only in this prototype — nothing is written to your workspace yet.",
  },
  "action.mark-reviewed": {
    label: "Mark reviewed",
    what: "Clears this board from the attention list, for this session only.",
    gives: "Lets you acknowledge a board without actually cleaning it up yet.",
    action: "Session-only — it'll flag again if it goes stale, and resets on reload.",
  },
  "action.review-board": {
    label: "Review",
    what: "Opens this board's real page, where the saved ads actually live.",
    gives: "The way to go fix what the stale/never-briefed counts are flagging.",
    action: "Takes you to the real board — nothing simulated here.",
  },
  "action.view-ads": {
    label: "View ads",
    what: "Opens this domain's ads in Discover, filtered to just this advertiser.",
    gives: "The fastest way from a ranked row to the actual creative.",
    action: "A page row still links to its domain — Discover has no page-level filter yet.",
  },
  "action.domain-detail": {
    label: "Domain detail",
    what: "Would open a full profile for this domain or page — ad history, tracker, landing pages.",
    gives: "Currently a placeholder, not the real page.",
    action: "Opens a \"Coming soon\" panel — no detail page exists here yet.",
  },
  "action.refresh-now": {
    label: "Refresh now",
    what: "Restates when the last complete scan finished.",
    gives: "Confirms your data's freshness without you having to guess.",
    action: "No live re-scan happens — there's no scheduled sync yet, just this note.",
  },
  "action.manage-preferences": {
    label: "Manage preferences",
    what: "Opens the page where you follow industries and competitors.",
    gives: "The one place to change what this whole dashboard is built from.",
    action: "Takes you to the real preferences screen.",
  },

  // ── chart.* — a chart's own heading/legend, beyond its block heading ───
  "chart.launch-cadence": {
    label: "Launch cadence",
    what: "Ads launched per week across the industries FabAds tracks, over the last 12 weeks.",
    gives: "Shows whether the market's shipping pace is picking up or slowing down.",
    action: "A flagged week names what likely drove the spike.",
  },
};

/** Rendered in place of a missing key — loud in dev (see `getTooltipCopy`),
 * but never a crash and never an empty tooltip for the person actually
 * looking at the page. */
const MISSING_TOOLTIP_COPY: TooltipCopy = {
  label: "No tooltip yet",
  what: "This element has no tooltip copy registered.",
  gives: "Add an entry to TOOLTIP_COPY in tooltipCopy.ts under this key.",
};

/**
 * Looks up one tooltip's copy by registry key.
 *
 * A typo is certain across 14 parallel editors referencing keys by hand, so
 * a missing key is DEV-LOUD (a `console.warn` naming the exact key to add)
 * and PROD-SILENT (no warning, just the neutral fallback below) — never a
 * thrown error and never a blank tooltip either way.
 */
export function getTooltipCopy(key: string): TooltipCopy {
  const copy = TOOLTIP_COPY[key];
  if (!copy) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- deliberate dev-only signal, see doc comment above.
      console.warn(
        `[tooltipCopy] No copy registered for key "${key}". Add it to TOOLTIP_COPY in src/insights-dashboard/lib/tooltipCopy.ts.`,
      );
    }
    return MISSING_TOOLTIP_COPY;
  }
  return copy;
}
