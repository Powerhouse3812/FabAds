/**
 * Industry Insights Dashboard — type layer.
 *
 * The contract every dashboard component and selector codes against. Types
 * only: no values, no JSX, no runtime imports. The matching fixture corpus
 * lives in `./fixtures.ts`.
 *
 * ── Determinism rule (enforced in fixtures.ts, documented here) ────────────
 * Every number, label and ordering in a `DashboardFixture` is derived from a
 * string hash (FNV-1a) plus one module-level `NOW` constant bucketed to the
 * start of the day. There is NO `Math.random()` and NO ad-hoc `new Date()` in
 * the data layer, so two renders — and two viewers — always see identical
 * figures. Anything you add downstream must keep that property.
 *
 * ── Credibility rules baked into these shapes ─────────────────────────────
 *  1. Every number carries a `provenance` tier and a freshness caption.
 *  2. A missing metric is `value: null` PLUS a required `naReason`. Never a
 *     bare dash — the UI must be able to say why the number is absent.
 *  3. Generated prose (`DailyBrief`) is never labelled "AI".
 *  4. Nothing promises "updated daily" — no scheduled re-sync exists.
 *  5. An undetected tracker is the literal string `"not detected"`, never
 *     an empty string and never null. An empty cell reads as zero.
 *  6. Data a backend genuinely does not hold (sales/visits for a non-ecom
 *     domain) is structurally ABSENT from the type, not present-and-null.
 *     That is why `DomainRow` is a discriminated union.
 */

// ─────────────────────────────────────────────────────────────────────────
// Core enums
// ─────────────────────────────────────────────────────────────────────────

/**
 * Which demo state the page is rendering.
 *
 * Three of these describe HOW MUCH data exists; two describe whether the
 * fetch behind it worked. They are deliberately one union rather than two,
 * because the URL carries exactly one `?state=` and a reviewer flips between
 * all five from the same control.
 *
 *  - `populated` — a healthy, fully-indexed workspace.
 *  - `thin`      — day 1: one followed industry, nothing indexed yet.
 *  - `zero`      — brand new workspace, nothing followed.
 *  - `loading`   — FIRST PAINT. Nothing has resolved. Every collection is
 *                  empty and every KPI is `value: null`, but that emptiness
 *                  means "not yet", NOT "none". `meta.isLoading` is the flag
 *                  to branch on: render skeletons, never an empty state. A
 *                  skeleton and an empty state mean opposite things.
 *  - `error`     — PARTIAL failure, never total. Some sources answered and
 *                  some did not: the Meta Ad Library returned, StoreLeads did
 *                  not, and the last complete scan is 3 days old. Everything
 *                  `observed` and `derived` is present (and honestly labelled
 *                  as 3 days old); every `estimated` figure is missing with an
 *                  `naReason` that names StoreLeads. See `DataSourceStatus`.
 *
 * A total blank error page is easy and unrealistic. This page's entire claim
 * is that its numbers are honest about where they came from and how fresh
 * they are — so the failure state has to be able to say WHICH source is down
 * and WHICH provenance tier degraded because of it.
 */
export type DashboardState =
  | "populated"
  | "thin"
  | "zero"
  | "loading"
  | "error";

/**
 * Where a number came from. This distinction is the page's whole credibility
 * layer — every figure on screen must be attributable to one of these.
 *
 *  - `observed`  — seen directly in the Meta Ad Library. The ad exists, its
 *                  start date is published, its format is visible. Highest
 *                  confidence; we are reporting, not inferring.
 *  - `estimated` — modelled by a third party (StoreLeads) rather than
 *                  measured: monthly sales, monthly visits, product counts.
 *                  Directionally useful, never exact. Must be labelled.
 *  - `derived`   — computed by us from observed data: lifespans, week-over-
 *                  week deltas, share of live creative, change signals. Only
 *                  as good as our scan cadence, so it carries freshness.
 */
export type ProvenanceTier = "observed" | "estimated" | "derived";

// ─────────────────────────────────────────────────────────────────────────
// Source health + freshness — what makes the `error` state honest
// ─────────────────────────────────────────────────────────────────────────

/**
 * The three upstreams behind this page, one per `ProvenanceTier`.
 *
 * The 1:1 mapping is the whole point: when a source goes down we can say
 * exactly which tier of numbers degraded, and a component can decide whether
 * a given figure is still trustworthy by looking up its own tier.
 *
 *  - `meta-ad-library` → `observed`
 *  - `storeleads`      → `estimated`
 *  - `fabads-scan`     → `derived`
 */
export type DataSourceKey = "meta-ad-library" | "storeleads" | "fabads-scan";

/**
 * Whether a source answered on the last run.
 *
 *  - `ok`      — answered.
 *  - `failed`  — did not answer. Everything that depends on it is missing,
 *                never guessed and never zero.
 *  - `pending` — we are still waiting (the `loading` state).
 */
export type DataSourceState = "ok" | "failed" | "pending";

/**
 * One upstream's health.
 *
 * INVARIANT: `state === "failed"` MUST carry a non-empty `naReason`. That
 * string is the exact sentence every metric depending on this source prints
 * in place of its number — one source of truth for the wording, so the KPI
 * tile and the table cell cannot disagree about why a figure is gone.
 */
export interface DataSourceStatus {
  key: DataSourceKey;
  /** Display name, e.g. "StoreLeads". Print this, not the key. */
  name: string;
  state: DataSourceState;
  /** Which provenance tier depends on this source. */
  tier: ProvenanceTier;
  /** What this source supplies, one line. Renders as a source-list caption. */
  supplies: string;
  /** Days since it last answered. `null` when it never has. */
  lastSuccessDaysAgo: number | null;
  /** "Answered on the last run" / "Last answered 3 days ago" / "No answer yet". */
  lastSuccessLabel: string;
  /** Present iff `state !== "ok"`. Plain-words explanation, one sentence. */
  failureNote?: string;
  /** Present iff `state !== "ok"`. The exact reason a missing figure prints. */
  naReason?: string;
  /** Named things that are missing while this is down. `[]` when `ok`. */
  affects: string[];
}

/**
 * How old the data on screen is.
 *
 *  - `fresh`   — the last complete scan is from today.
 *  - `aging`   — one day old. Worth a caption, not a banner.
 *  - `stale`   — `staleAfterDays` or older. Say so at the top of the page;
 *                a page that claims to be honest about freshness cannot bury
 *                "this is 3 days old" in a tooltip.
 *  - `unknown` — no scan has ever completed (thin / zero / loading). NOT the
 *                same as fresh, and must not be rendered as fresh.
 */
export type StalenessLevel = "fresh" | "aging" | "stale" | "unknown";

export interface StalenessInfo {
  level: StalenessLevel;
  /** Whole days since the last COMPLETE scan. `null` when there has been none. */
  ageDays: number | null;
  /** `level === "stale"`. Precomputed so components don't re-derive the rule. */
  isStale: boolean;
  /** Age in days at which we start calling data stale. */
  staleAfterDays: number;
  /** "Last complete scan 3 days ago" / "Nothing scanned yet". */
  label: string;
  /** One-sentence disclosure. Never implies a scheduled re-sync. */
  note: string;
}

/** The six kinds of change we detect between two scans. */
export type ChangeSignalKind =
  | "new-angle"
  | "offer-shift"
  | "format-expansion"
  | "velocity-change"
  | "landing-page-change"
  | "withdrawal";

/**
 * Creative maturity band, from `daysRunning`.
 *
 *  - `testing` — under 21 days.
 *  - `working` — 21 to 45 days inclusive.
 *  - `proven`  — over 45 days.
 *
 * The brief's bands were "under 14 / 21–45 / 45+", which leaves a 14–21 day
 * gap. We fold 14–21 into `testing`: a creative in its third week has not yet
 * cleared a full learning-plus-scale window, so calling it "working" would
 * overstate what we can see. The boundary is `LONG_RUNNER_TIER_BOUNDS` in
 * fixtures.ts if it ever needs moving.
 */
export type LongRunnerTier = "testing" | "working" | "proven";

/** Followed-advertiser activity band. `quiet` = no new creative in 21+ days. */
export type WatchStatus = "active" | "ramping" | "quiet";

/** Business model behind a domain. Drives which columns a row even has. */
export type DomainType = "ecom" | "affiliate" | "leadgen" | "ppc" | "telehealth";

/** Storefront platform, ecom domains only. */
export type EcomPlatform = "Shopify" | "Shopify Plus" | "WooCommerce";

/** Affiliate/performance click trackers we can fingerprint. */
export type TrackerName = "RedTrack" | "Voluum" | "Clickflare";

/**
 * A tracker cell. Never empty, never null — when we cannot fingerprint one,
 * the value is the literal string `"not detected"` so the UI can render an
 * honest word instead of a blank that reads as zero.
 */
export type TrackerValue = TrackerName | "not detected";

/** Media kind, mirrors `InsightAd["mediaType"]`. */
export type MediaType = "image" | "video";

/**
 * Copy-angle taxonomy. These six map 1:1 onto the six intent groups in the
 * `HEADLINES_BY_INTENT` bank inside `src/lib/insights-dummy-data.ts`, so an
 * angle is looked up from an ad's real headline rather than hashed. That is
 * what makes a Discover `?angle=` filter return exactly what a slice claims.
 */
export type AngleKey =
  | "question"
  | "stat"
  | "urgency"
  | "benefit"
  | "curiosity"
  | "direct";

/** The three setup steps. Deliberately three — see `SetupChecklistItem`. */
export type SetupChecklistKey =
  | "follow-industries"
  | "track-competitor"
  | "install-extension";

/** Whether we have actually scanned a followed industry yet. */
export type IndustryScanState = "indexed" | "scanning" | "not-started";

// ─────────────────────────────────────────────────────────────────────────
// Numeric derivation layer
// ─────────────────────────────────────────────────────────────────────────

/**
 * `InsightAd` stores its metrics as pre-formatted display strings
 * (`impressions: "10.0K"`, `spend: "$200"`, `activeDuration: "7 days"`,
 * `estimatedAudienceSize: "500K - 1,000K"`). Charts and KPIs need real
 * numbers, so every ad is parsed once into this shape.
 *
 * `launchedDaysAgo` is the one SYNTHESISED field: the source data generates
 * `createdAt` as one ad every three days, so 800 ads span ~6.6 years and the
 * recent weeks are nearly empty. We replace that with a hash-seeded,
 * recency-weighted distribution so a 12-week chart has real density.
 */
export interface AdNumerics {
  adId: string;
  impressions: number;
  reach: number;
  spend: number;
  spendTillNow: number;
  activeDurationDays: number;
  audienceMin: number;
  audienceMax: number;
  audienceMid: number;
  similarAdsCount: number;
  /** Synthesised, recency-weighted. Not parsed from `createdAt`. */
  launchedDaysAgo: number;
}

// ─────────────────────────────────────────────────────────────────────────
// KPI row
// ─────────────────────────────────────────────────────────────────────────

/**
 * One headline metric tile.
 *
 * INVARIANT: `value === null` MUST be paired with a non-empty `naReason`.
 * The page rule is "never a bare dash; say why a metric is absent." A real
 * zero is `value: "0"` with a caption that explains it — that is a fact, not
 * an absence, and needs no `naReason`.
 */
export interface KpiTile {
  key: string;
  label: string;
  /** Display-ready string, already formatted. `null` ⇒ `naReason` required. */
  value: string | null;
  /** Why the number is missing. Required whenever `value` is null. */
  naReason?: string;
  /** Source + freshness, always present. e.g. "Meta Ad Library · scanned 6h ago". */
  caption: string;
  /** Week-over-week change. Omitted when there is no prior scan to compare. */
  deltaPct?: number;
  provenance: ProvenanceTier;
  /** 12 points, oldest first, for a sparkline. Omitted when there is no history. */
  series?: number[];
}

// ─────────────────────────────────────────────────────────────────────────
// Change signals
// ─────────────────────────────────────────────────────────────────────────

/**
 * One detected change between scans.
 *
 * `observationCount` powers the recurrence gate: a single observation is not
 * a trend, so the UI should visually separate (or de-emphasise) anything with
 * `meetsRecurrenceGate === false` rather than presenting it as a finding.
 */
export interface ChangeSignal {
  id: string;
  kind: ChangeSignalKind;
  /** Advertiser / page name behind the change. */
  advertiser: string;
  domain: string;
  industry: string;
  /** What happened, in plain words. One sentence, no jargon. */
  headline: string;
  /** 1–2 concrete supporting facts. Each is a complete, quotable string. */
  evidence: string[];
  /** How many separate scans have shown this. 1 = not yet a trend. */
  observationCount: number;
  firstSeenDaysAgo: number;
  lastSeenDaysAgo: number;
  provenance: ProvenanceTier;
  /** `InsightAd["id"]` of a representative ad, or null when none applies
   *  (e.g. a withdrawal, where the ad is gone). */
  representativeAdId: string | null;
  /** `observationCount >= SIGNAL_RECURRENCE_GATE`. Precomputed for the UI. */
  meetsRecurrenceGate: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Long-runner gallery
// ─────────────────────────────────────────────────────────────────────────

/**
 * View-model over `InsightAd` for the long-runner gallery.
 *
 * Longevity is a WEAK proxy. Past ~90 days a creative may be saturated rather
 * than proven — the same ad running to a burnt audience looks identical to a
 * winner from the outside. `saturationCaveat` flags those so the UI can say so
 * instead of implying "longest = best".
 */
export interface LongRunnerAd {
  adId: string;
  brand: string;
  domain: string;
  industry: string;
  thumbUrl: string;
  mediaUrl: string;
  mediaType: MediaType;
  /** CSS aspect-ratio string, e.g. "3/4". Carried through from the source ad. */
  mediaAspectRatio: string;
  headline: string;
  /** Opening line of the primary text — the hook. */
  hook: string;
  daysRunning: number;
  tier: LongRunnerTier;
  /** How many near-identical variants we see from the same advertiser. */
  similarCount: number;
  /** "Video" | "Image" | "Carousel" — from `InsightAd["adType"]`. */
  format: string;
  provenance: ProvenanceTier;
  /** True at 90+ days running. Surface the caveat when true. */
  saturationCaveat: boolean;
  /** Present iff `saturationCaveat`. Ready-to-render caveat sentence. */
  caveatNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Launch cadence
// ─────────────────────────────────────────────────────────────────────────

/** One week in the 12-week launch-cadence chart. Exactly one week is a spike. */
export interface LaunchCadenceWeek {
  /** "Jun 9" — month/day of the Monday that starts the week. */
  weekStartLabel: string;
  weekStartISO: string;
  /** 0 = oldest of the 12, 11 = current week. */
  weekIndex: number;
  adsLaunched: number;
  isSpike: boolean;
  /** Present iff `isSpike`. Names what drove it. */
  spikeNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Angle mix
// ─────────────────────────────────────────────────────────────────────────

/**
 * One slice of the copy-angle breakdown.
 *
 * `angleKey` is resolved from real ad headlines via the intent bank, so
 * `discoverHref` is a promise the data can keep: following it would return
 * `adCount` ads.
 */
export interface AngleSlice {
  /** Display label, e.g. "Question-led". */
  angle: string;
  angleKey: AngleKey;
  /** Share of live creative in your followed industries using this angle. */
  marketPct: number;
  /** Share of YOUR live creative using this angle. */
  yourPct: number;
  adCount: number;
  discoverHref: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Movers
// ─────────────────────────────────────────────────────────────────────────

/**
 * A domain whose creative volume moved sharply. `deltaPct` is derived from
 * the two counts and is internally consistent with them (can be negative).
 */
export interface Mover {
  domain: string;
  industry: string;
  deltaPct: number;
  adCount30d: number;
  adCountPrev30d: number;
  /** Whether this domain is already on the user's watchlist. */
  tracked: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Domain table — discriminated union on `type`
// ─────────────────────────────────────────────────────────────────────────

/** Fields every domain row has, whatever its business model. */
export interface DomainRowBase {
  domain: string;
  industry: string;
  liveAds: number;
  firstSeenDaysAgo: number;
  lastNewCreativeDaysAgo: number;
  tracked: boolean;
  provenance: ProvenanceTier;
  /**
   * Per-CELL unavailability: column key → the reason that cell has no value.
   *
   * Only ever populated in the `error` state, where a named source failed and
   * the columns it feeds have nothing honest to print. Absent everywhere else.
   * Read it with `domainCellNaReason(row, columnKey)` from `./selectors`.
   *
   * This is how the "null always carries a reason" invariant survives into a
   * table: an ecom row in `error` has `estSalesPerMonth: null` AND
   * `unavailable.estSalesPerMonth = "StoreLeads did not respond to the last
   * scan"`. Rendering the null as 0 or as a dash would both be lies.
   */
  unavailable?: Record<string, string>;
}

/**
 * Ecom store. The ONLY domain type with sales/visits data, because
 * StoreLeads models storefronts and nothing else. Those two figures are
 * `estimated`, not observed — label them.
 */
export interface EcomDomainRow extends DomainRowBase {
  type: "ecom";
  /**
   * StoreLeads modelled. USD. Estimated, not measured.
   *
   * `null` ONLY in the `error` state, where StoreLeads did not answer — and
   * then `unavailable.estSalesPerMonth` carries the reason. It is never null
   * in `populated`. Do not render a null as `$0`: no figure came back, which
   * is not the same as a store that sells nothing.
   */
  estSalesPerMonth: number | null;
  /** StoreLeads modelled monthly sessions. Same null rule as `estSalesPerMonth`. */
  estVisits: number | null;
  productCount: number;
  platform: EcomPlatform;
}

/**
 * Affiliate / media-buying domain. NO sales or visits data exists for these —
 * that is a real backend fact, not a gap, so those fields are structurally
 * absent rather than null.
 */
export interface AffiliateDomainRow extends DomainRowBase {
  type: "affiliate";
  tracker: TrackerValue;
  /** Distinct offers seen running behind this domain. */
  offers: number;
  avgCreativeLifeDays: number;
  /** Creative churn in the last 7 days. */
  rotation7d: { added: number; paused: number };
}

/**
 * Lead-gen / PPC / telehealth funnel. Like affiliate, carries NO sales or
 * visits data. Grouped because the three share an identical column set.
 */
export interface FunnelDomainRow extends DomainRowBase {
  type: "leadgen" | "ppc" | "telehealth";
  tracker: TrackerValue;
  /** Distinct landing pages behind the ads. */
  landers: number;
  /** Dominant copy angle, display label (see `AngleSlice["angle"]`). */
  topAngle: string;
  /** ISO-ish market codes, e.g. ["US", "CA"]. */
  markets: string[];
}

/**
 * Narrow on `type` to reach the type-specific columns. Only `EcomDomainRow`
 * has `estSalesPerMonth` / `estVisits`; only affiliate/funnel rows have
 * `tracker`. There is no "null sales" state to render.
 */
export type DomainRow = EcomDomainRow | AffiliateDomainRow | FunnelDomainRow;

/** Domain-universe breakdown. `total` is the sum of the five. */
export interface DomainTypeCounts {
  ecom: number;
  affiliate: number;
  leadgen: number;
  ppc: number;
  telehealth: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────
// You vs your market
// ─────────────────────────────────────────────────────────────────────────

export interface FormatMixEntry {
  /** "Video" | "Image" | "Carousel". */
  format: string;
  pct: number;
}

export interface AngleMixEntry {
  angleKey: AngleKey;
  angle: string;
  pct: number;
}

/**
 * The user's own brand, for the "You vs your market" block.
 *
 * SCOPE RULE: creative behaviour ONLY. How many ads are live, how often new
 * ones ship, how long they last, what formats and angles are used. Never
 * ROAS, never spend, never performance — Insights does not see the user's
 * results and must not imply it does.
 */
export interface MyBrand {
  name: string;
  domain: string;
  industry: string;
  liveAds: number;
  adsLaunchedPerWeek: number;
  avgCreativeLifespanDays: number;
  /** Median gap in days between shipping new creative. */
  refreshCadenceDays: number;
  /** Ready-to-render, e.g. "new creative every 9 days". */
  refreshCadenceLabel: string;
  formatMix: FormatMixEntry[];
  angleMix: AngleMixEntry[];
  /** One-line reminder of what this comparison does and doesn't cover. */
  scopeNote: string;
  provenance: ProvenanceTier;
}

/**
 * CREATIVE share of voice — share of live creative in an industry. Never
 * spend share: we cannot see spend, and implying we can would be a lie.
 */
export interface ShareOfVoiceRow {
  industry: string;
  you: { name: string; pct: number; adCount: number };
  leaders: Array<{ domain: string; pct: number; adCount: number }>;
  /** All live ads indexed in this industry — the denominator. */
  totalLiveAds: number;
  /** Fixed disclosure string, e.g. "Share of live creative, not spend." */
  basis: string;
  provenance: ProvenanceTier;
}

// ─────────────────────────────────────────────────────────────────────────
// Watchlist
// ─────────────────────────────────────────────────────────────────────────

/** One followed advertiser. */
export interface WatchItem {
  id: string;
  advertiser: string;
  domain: string;
  industry: string;
  lastNewCreativeDaysAgo: number;
  liveAds: number;
  newCreatives30d: number;
  status: WatchStatus;
  avatarUrl: string;
}

/**
 * Watchlist rollup. `quiet` advertisers (21+ days without new creative) are
 * the actionable signal — either they stopped, or the slot is wasted.
 */
export interface WatchlistHealth {
  items: WatchItem[];
  followCount: number;
  followCap: number;
  /** True when `followCount / followCap >= 0.8`. */
  nearCap: boolean;
  /** Ready-to-render cap sentence, e.g. "18 of 25 slots used." */
  capNote: string;
  activeCount: number;
  rampingCount: number;
  quietCount: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Boards
// ─────────────────────────────────────────────────────────────────────────

/**
 * One saved-ads board.
 *
 * `staleItemCount` = saved ads whose SOURCE ad has since gone inactive — the
 * swipe file has rotted. `neverBriefedCount` = saved but never turned into a
 * brief — saving without shipping.
 */
export interface BoardHealthItem {
  id: string;
  name: string;
  itemCount: number;
  lastTouchedDaysAgo: number;
  staleItemCount: number;
  neverBriefedCount: number;
  href: string;
}

/**
 * Board rollup. Deliberately exposes NO vanity total (no "412 ads saved!").
 * The only totals here are the two that imply an action.
 */
export interface BoardHealth {
  boards: BoardHealthItem[];
  staleTotal: number;
  neverBriefedTotal: number;
  /** One-line framing of what the two totals mean. */
  note: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Coverage (the thin / zero rescue)
// ─────────────────────────────────────────────────────────────────────────

export interface FollowedIndustry {
  industry: string;
  indexedAds: number;
  advertisers: number;
  /** `null` when we have never scanned it. */
  lastScanDaysAgo: number | null;
  scanState: IndustryScanState;
}

/**
 * A suggested industry, with REAL counts attached. The whole point is that a
 * suggestion is only credible if we can prove there is something behind it.
 */
export interface AdjacentIndustry {
  industry: string;
  liveAds: number;
  advertisers: number;
  /** Why we are suggesting it, e.g. "Shares advertisers with Credit Repair". */
  reason: string;
}

/**
 * Coverage picture. In the thin state this carries the page's most important
 * distinction: 0 indexed ads in "Credit Repair" is a gap on OUR side — we
 * have not scanned it — NOT proof that the market is empty. `gapNote` states
 * that in words; `adjacent` proves it with counts from neighbouring
 * industries we HAVE indexed.
 */
export interface CoverageInfo {
  followed: FollowedIndustry[];
  followedCount: number;
  /** How many industries exist in the catalogue overall. */
  seededIndustryCount: number;
  /** Sum of `followed[].indexedAds`. */
  indexedAdTotal: number;
  adjacent: AdjacentIndustry[];
  /** Heading for the adjacent block, tuned per state. */
  adjacentHeading: string;
  /** Present when coverage is thin or absent; null when coverage is healthy. */
  gapNote: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Setup checklist
// ─────────────────────────────────────────────────────────────────────────

/**
 * One setup step. There are EXACTLY THREE, always, in every state:
 * follow your industries · track your first competitor · install the Chrome
 * extension.
 *
 * There is deliberately no "turn on the weekly digest" item — that feature
 * does not exist and the page will not promise it.
 */
export interface SetupChecklistItem {
  key: SetupChecklistKey;
  label: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  href: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Daily brief
// ─────────────────────────────────────────────────────────────────────────

/** One structured fact the brief paragraph was assembled from. */
export interface DailyBriefFact {
  label: string;
  value: string;
  provenance: ProvenanceTier;
}

/**
 * A short written summary of the week, assembled from this module's own
 * numbers (ads / advertisers / domains / signals) and nothing else.
 *
 * COPY RULE: never label this "AI", "AI-generated", "AI summary" or similar.
 * It is written from data we can point at, and `facts` is exactly the set it
 * was built from — the UI should be able to show the working.
 */
export interface DailyBrief {
  paragraph: string;
  facts: DailyBriefFact[];
  /** Attribution + freshness, e.g. "Built from 34 changes observed this week". */
  generatedLabel: string;
  /** False when there is nothing to summarise. */
  available: boolean;
  /** Present iff `!available`. Honest reason, no filler. */
  unavailableReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Page meta
// ─────────────────────────────────────────────────────────────────────────

/**
 * Page-level scale + freshness. `null` on the count fields means "we cannot
 * say yet", and the matching KPI tile carries the reason.
 */
export interface DashboardMeta {
  state: DashboardState;
  /** ISO string of the single module-level NOW. Stable for the session. */
  generatedAtISO: string;
  /** "Data as of Aug 29" — derived from NOW, never re-read mid-session. */
  dataAsOfLabel: string;
  /** "Last scan 6h ago" / "First scan in progress" / "Not scanned yet". */
  lastScanLabel: string;
  /**
   * Freshness disclosure. No scheduled re-sync exists, so this NEVER says
   * "updated daily" — it says when we last looked and how a refresh happens.
   */
  refreshNote: string;
  followedIndustryCount: number;
  /** Total industries in the catalogue. */
  seededIndustryCount: number;
  liveAdsObserved: number | null;
  domainCount: number | null;
  domainTypeCounts: DomainTypeCounts | null;
  newSignalsThisWeek: number;
  /** What the 12-week cadence chart is scoped to. Renders under the chart. */
  cadenceScopeNote: string;
  /** One-line framing of why the page looks the way it does in this state. */
  stateNote: string;

  // ── Fetch health (added with the `loading` / `error` states) ────────────

  /**
   * TRUE ONLY IN `loading`. Nothing has resolved yet.
   *
   * Every collection is `[]` and every KPI is `value: null` — but that is
   * "not yet", not "none". Branch on this BEFORE any `isEmpty` check and
   * render skeletons. An empty state here tells the user they have no data
   * when in fact we simply haven't looked yet.
   */
  isLoading: boolean;
  /**
   * All three upstreams, always, in every state, in a fixed order:
   * Meta Ad Library · StoreLeads · FabAds scan history.
   */
  sources: DataSourceStatus[];
  /** Only the ones that did not answer. `[]` in every state but `error`. */
  failedSources: DataSourceStatus[];
  /**
   * Provenance tiers whose source is down, so a component can ask "is my
   * tier still trustworthy?" without knowing which vendor feeds it.
   * `["estimated"]` in `error`; `[]` elsewhere.
   */
  degradedTiers: ProvenanceTier[];
  /** How old the data on screen is. Present in every state. */
  staleness: StalenessInfo;
}

// ─────────────────────────────────────────────────────────────────────────
// The fixture
// ─────────────────────────────────────────────────────────────────────────

/**
 * Everything the dashboard renders, for one state. Returned by
 * `getDashboardFixture(state)` in `./fixtures.ts`, memoised per state.
 *
 * Empty collections are `[]`, never undefined — components branch on
 * `length`, not on existence. `myBrand` is the one nullable collection: it is
 * null in `zero` (nothing configured yet) and in `loading` (nothing resolved
 * yet).
 *
 * ── Reading emptiness correctly ───────────────────────────────────────────
 * `loading` and `zero` both hand you empty collections and null KPI values,
 * and they mean OPPOSITE things. `meta.isLoading` is the only safe
 * discriminator — check it before any `isEmpty` / `length === 0` branch.
 *
 * `error` is NOT empty: it is `populated` with the StoreLeads-fed figures
 * removed and a 3-day-old scan timestamp. Every collection is full.
 */
export interface DashboardFixture {
  state: DashboardState;
  meta: DashboardMeta;
  kpis: KpiTile[];
  signals: ChangeSignal[];
  longRunners: LongRunnerAd[];
  cadence: LaunchCadenceWeek[];
  angles: AngleSlice[];
  movers: Mover[];
  domains: DomainRow[];
  domainTypeCounts: DomainTypeCounts;
  myBrand: MyBrand | null;
  shareOfVoice: ShareOfVoiceRow[];
  watchlist: WatchlistHealth;
  boards: BoardHealth;
  coverage: CoverageInfo;
  checklist: SetupChecklistItem[];
  brief: DailyBrief;
}
