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
 * Four states now (collapsed from five — `error` is gone, `thin`/`zero` were
 * renamed). The URL carries exactly one `?state=` and a reviewer flips
 * between all four from the same control; the old `thin` / `zero` / `error`
 * values still resolve via `DashboardState`'s URL parsing in
 * `state/DashboardState.tsx` so previously shared links don't land on a
 * blank page — `thin` → `firstTime`, `zero` → `empty`, `error` → `populated`.
 *
 *  - `populated` — a healthy, fully-indexed workspace.
 *  - `firstTime` — day 1: one followed industry, a couple of brands, no
 *                  launches yet, near-zero saved ads. Renamed from `thin`.
 *  - `empty`     — brand new workspace, nothing followed, nothing saved, no
 *                  launches. Renamed from `zero`.
 *  - `loading`   — FIRST PAINT. Nothing has resolved. Every collection is
 *                  empty and every KPI is `value: null`, but that emptiness
 *                  means "not yet", NOT "none". `meta.isLoading` is the flag
 *                  to branch on: render skeletons, never an empty state. A
 *                  skeleton and an empty state mean opposite things. It did
 *                  NOT merge into `empty` for exactly this reason — the two
 *                  render almost identically and mean opposite things.
 *
 * THE CONTENT RULE for `firstTime` and `empty`: empty means YOUR side is
 * empty, the market never is. Every block still renders in every state —
 * there is no "collapse the board" branch any more. Where the user's own
 * data is genuinely absent (no brand configured, nothing followed), the
 * MARKET-side figures — top advertisers, top domains, angle mix, industry
 * share, long-running creative, change signals, Trends counts — are still
 * real numbers, because they are true regardless of what the user has set
 * up. Only the user's own side (followed counts, saved ads, their own
 * brand's share, their own ads) goes to a real zero or an absent `null`.
 * See `DashboardFixture` and the selectors in `./selectors.ts` for how each
 * collection expresses that split — never a bare dash, never a fabricated
 * number, and never "make `isEmpty` false and call it done" without saying
 * which side is empty.
 *
 * `error` (partial source failure) has been REMOVED as a state entirely, per
 * Maalik: three data states plus a loading transition, no separate failure
 * state. The source-health / staleness machinery that existed only to make
 * `error` honest (a failed source, a 3-day-old "last complete scan") has been
 * deleted from `./fixtures.ts` along with it. `useDashboardStatus()` and
 * `naReasonByTier` / `naReasonBySource` survive because real blocks still
 * read them for the (now purely "pending", never "failed") loading captions.
 */
export type DashboardState =
  | "populated"
  | "firstTime"
  | "empty"
  | "loading";

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
 *  - `pending` — we are still waiting — either the `loading` state, or a
 *                first scan that hasn't landed yet (`firstTime` / `empty`).
 *
 * `failed` was removed with the `error` state: a partial-failure source no
 * longer exists in this model, so nothing ever sets a source to anything but
 * `ok` or `pending`.
 */
export type DataSourceState = "ok" | "pending";

/**
 * One upstream's health.
 *
 * INVARIANT: `state === "pending"` MUST carry a non-empty `naReason`. That
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
  /** "Answered on the last run" / "Still waiting on the first scan". */
  lastSuccessLabel: string;
  /** Present iff `state !== "ok"`. Plain-words explanation, one sentence. */
  failureNote?: string;
  /** Present iff `state !== "ok"`. The exact reason a missing figure prints. */
  naReason?: string;
}

/**
 * How old the data on screen is.
 *
 *  - `fresh`   — the last complete scan is from today.
 *  - `aging`   — one day old. Worth a caption, not a banner.
 *  - `stale`   — `staleAfterDays` or older. Say so at the top of the page;
 *                a page that claims to be honest about freshness cannot bury
 *                "this is 3 days old" in a tooltip. Unreachable in practice
 *                now that `error` is gone — nothing on this page currently
 *                produces aged data — but the level stays real rather than
 *                deleted, since freshness is a general page concern, not an
 *                `error`-only one.
 *  - `unknown` — no scan has ever completed (firstTime / empty / loading).
 *                NOT the same as fresh, and must not be rendered as fresh.
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
  /**
   * ONE short extra line under the value, in FabAds' own words.
   *
   * This is where a signal that used to need its own block lands: the
   * `brands-followed` tile carries `"12 followed · 2 inactive"` here, which is
   * the whole of what the deleted "Watchlist health" block was for. Present
   * only when there is something to say; never a restatement of `caption`, and
   * never present on a tile whose `value` is null (there is nothing to
   * qualify).
   */
  subNote?: string;
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
  /**
   * Whether the advertiser named in `headline` is one the user already
   * follows as a competitor ("followed"), or is only part of the wider
   * market preview ("market") — i.e. answers Maalik's "who is Mantra Labs??"
   * complaint about a bare advertiser name with no context.
   *
   * Computed from the SAME tracked-competitor set that drives `tracked` /
   * `followed` on domain, page and mover rows elsewhere on this page — never
   * a separate guess, so a domain can't be "your competitor" here and
   * "market only" three rows down.
   *
   * In `populated` most signals resolve to whichever is true. In `firstTime`
   * the six-industry preview is not scoped to the user's (one or two) real
   * follows, so most signals land on "market" — a couple may still be
   * "followed" if the domain happens to coincide, and that is a real fact,
   * not an assumption. In `empty` the user follows nothing, so every signal
   * is honestly "market". Optional and additive: a consumer built before
   * this field still compiles, and adding it does not require the UI to
   * render anything new.
   */
  advertiserRelationship?: "followed" | "market";
  /**
   * Ready-to-render qualifier matching `advertiserRelationship`, e.g.
   * "a brand you follow" / "part of the wider market" — present iff
   * `advertiserRelationship` is present, so a consumer never has to invent
   * its own phrasing for the two values.
   */
  advertiserRelationshipLabel?: string;
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
  /**
   * Ads LAUNCHED in the last 30 days. NOT `liveAds`.
   *
   * `liveAds` answers "how many ads are running right now"; this answers "how
   * many did they put out in the last 30 days". A domain can run 400 ads and
   * have launched none of them this month. Label the column "New ads (30d)" —
   * never "live ads", never just "ads".
   *
   * This is the 30-day change data that used to be its own "Market movers"
   * block, folded onto the row it describes. Where a domain also appears in
   * `movers`, both carry the SAME two counts by construction.
   */
  newAds30d: number;
  /** The 30 days before that, so the change is checkable against its inputs. */
  newAdsPrev30d: number;
  /** `(newAds30d - newAdsPrev30d) / newAdsPrev30d`, whole percent. Can be negative. */
  newAds30dDeltaPct: number;
  firstSeenDaysAgo: number;
  lastNewCreativeDaysAgo: number;
  tracked: boolean;
  provenance: ProvenanceTier;
}

/**
 * Ecom store. The ONLY domain type with sales/visits data, because
 * StoreLeads models storefronts and nothing else. Those two figures are
 * `estimated`, not observed — label them.
 */
export interface EcomDomainRow extends DomainRowBase {
  type: "ecom";
  /**
   * StoreLeads modelled. USD. Estimated, not measured. Always present on
   * every domain row in every remaining state — there is no more state where
   * a named source has failed mid-table. Kept `number` (not `number | null`)
   * because nothing produces a null here any more.
   */
  estSalesPerMonth: number;
  /** StoreLeads modelled monthly sessions. */
  estVisits: number;
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
// Pages — the advertiser's Meta page, a different entity from the domain
// ─────────────────────────────────────────────────────────────────────────

/**
 * One advertiser PAGE.
 *
 * A page is not a domain. The page is the Meta identity that runs the ads; the
 * domain is where those ads point. One advertiser can run two pages against one
 * domain (a main page plus a shop / regional page), and that is exactly why the
 * "top 5" list differs depending on which entity you rank by.
 *
 * RECONCILIATION RULE: the pages behind one domain sum EXACTLY to that
 * domain's `liveAds`. The two views of the same advertiser must never disagree
 * — that is the failure mode this whole block exists to avoid.
 *
 * `industry` is the plain FabAds word for the category a page sits in; there is
 * no second taxonomy.
 */
export interface PageRow {
  /** Stable id, `page-<domain>-<n>`. */
  pageId: string;
  /** Display name of the page, e.g. "GlowSkin" / "GlowSkin Shop". */
  pageName: string;
  avatarUrl: string;
  /** The domain its ads point at. */
  domain: string;
  /** Industry / category. Same vocabulary as everywhere else on the page. */
  industry: string;
  liveAds: number;
  /**
   * Ads LAUNCHED in the last 30 days by this page. Same rule as
   * `DomainRowBase.newAds30d` — not ads running now.
   *
   * The pages behind one domain sum EXACTLY to that domain's `newAds30d`, the
   * same reconciliation `liveAds` keeps.
   */
  newAds30d: number;
  /** The 30 days before that. Pages of one domain sum to `newAdsPrev30d`. */
  newAdsPrev30d: number;
  /** Derived from this page's own two counts. Can be negative. */
  newAds30dDeltaPct: number;
  /** Already on your watchlist. The follow action toggles this. */
  followed: boolean;
  /** Days since this page last put out new creative. */
  lastNewCreativeDaysAgo: number;
  firstSeenDaysAgo: number;
  provenance: ProvenanceTier;
}

// ─────────────────────────────────────────────────────────────────────────
// Top industry / category, and which brands hold what share of it
// ─────────────────────────────────────────────────────────────────────────

/**
 * One brand's slice of an industry.
 *
 * `sharePct` is share of LIVE ADS RUNNING — never spend, never budget. We
 * cannot see spend. `isOthers` marks the roll-up bucket, which has no single
 * Discover link (there is no `?domain=` value for "everyone else"), so its
 * `discoverHref` is null.
 */
export interface IndustryShareBrand {
  /** Domain, or the reserved keys `"you"` / `"others"`. */
  key: string;
  /** Brand name where we know it, otherwise the domain. */
  name: string;
  /** `null` for the Others bucket. */
  domain: string | null;
  liveAds: number;
  /** Share of this industry's live ads. Ads running, not money. */
  sharePct: number;
  isYou: boolean;
  isOthers: boolean;
  /** `null` for the Others bucket — a link that lies is worse than no link. */
  discoverHref: string | null;
}

/**
 * One industry, and the brands inside it by share of live ads.
 *
 * The denominator (`liveAds`) is the same figure `FollowedIndustry.indexedAds`
 * carries, and the named brands' counts come from the same derivation the
 * domain table prints — so this block cannot contradict its neighbours.
 */
export interface IndustryShareRow {
  industry: string;
  /** Every live ad indexed in this industry — the denominator. */
  liveAds: number;
  /** Distinct advertisers indexed in it. */
  advertisers: number;
  /** Named brands, share descending, with the Others bucket last. */
  brands: IndustryShareBrand[];
  /** Biggest named brand, or null when the industry has none indexed. */
  topBrand: IndustryShareBrand | null;
  /** Your own brand's slice, or null when you don't advertise here. */
  you: IndustryShareBrand | null;
  /** Plain-words basis. States that this is ads running, not spend. */
  basis: string;
  provenance: ProvenanceTier;
}

// ─────────────────────────────────────────────────────────────────────────
// Nav overview — the module's own surfaces, with a live count each
// ─────────────────────────────────────────────────────────────────────────

/** The six surfaces of the Industry Insights module. */
export type NavSurfaceKey =
  | "my-feeds"
  | "discover"
  | "saved-ads"
  | "competitor"
  | "domain"
  | "trends";

/**
 * One surface in the nav-overview block.
 *
 * Same invariant as `KpiTile`: `count === null` MUST carry an `naReason`. A
 * real zero is `count: 0` and needs none — "you have saved nothing" is a fact,
 * "we haven't looked yet" is not.
 */
export interface NavSurfaceCount {
  key: NavSurfaceKey;
  /** FabAds' own name for the surface, e.g. "Saved Ads". */
  label: string;
  /** One plain line on what lives there. No jargon. */
  description: string;
  href: string;
  count: number | null;
  /** Required whenever `count` is null. */
  naReason?: string;
  /** Display-ready: "1,063", or the `naReason` when there is no count. */
  countLabel: string;
  /** What the count counts, in FabAds words: "industries", "live ads". */
  unitLabel: string;
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
  /**
   * Your angle split.
   *
   * ANGLES ARE THE ANGLE BLOCK'S JOB. `useAngleMix()` prints your share beside
   * the market's; a second block printing its own version is how two parts of
   * one page end up disagreeing. This field survives because the angle block
   * itself is built from it — read it there, not here.
   */
  angleMix: AngleMixEntry[];
  /** One-line reminder of what this comparison does and doesn't cover. */
  scopeNote: string;
  provenance: ProvenanceTier;
}

/**
 * CREATIVE share of voice — share of live creative in an industry. Never
 * spend share: we cannot see spend, and implying we can would be a lie.
 *
 * ── THE YOUR-SIDE / MARKET-SIDE SPLIT ─────────────────────────────────────
 * `leaders` (the market) is populated in EVERY state, including `firstTime`
 * and `empty` — the market is never empty. `you` stays a real, non-null shape
 * (never a bare dash) so a renderer never has to null-check it, but when the
 * workspace has no brand configured `hasYourData` is `false` and `you.pct` /
 * `you.adCount` are the honest zero `0` — a placeholder, not a fact. Check
 * `hasYourData` before treating `you` as a real number; the same convention
 * `AngleMixRow.yourPct === null` and `IndustryShareRow.you === null` use
 * elsewhere on this page, just expressed as a flag instead of a null because
 * `you` here is a nested shape most renderers want to keep non-null.
 */
export interface ShareOfVoiceRow {
  industry: string;
  you: { name: string; pct: number; adCount: number };
  /** False when no brand is configured — `you` above is a `0` placeholder, not a measured fact. */
  hasYourData: boolean;
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
 * The two follow sets, which FabAds keeps in two different tables.
 *
 *  - `items` / `followCount` — BRANDS FOLLOWED (`insight_follows`). Every brand
 *    you follow. `items.length === followCount` — there is no hidden remainder
 *    and there is NO CAP. An earlier version invented a 25-slot limit; no such
 *    limit exists in the product, so nothing here mentions one.
 *  - `trackedCompetitors` — COMPETITORS FOLLOWED (`insight_competitors`). The
 *    followed brands you also track as competitors: a small subset, and the
 *    ONLY set the `tracked` / `followed` flags on domain, page and mover rows
 *    are about. That is why the "Competitors followed" KPI is a small number
 *    and the "Brands followed" KPI is a larger one.
 *
 * `inactiveCount` is the one signal the deleted "Watchlist health" block
 * carried: followed brands that have shipped nothing new in
 * `inactiveThresholdDays`. It renders as a sub-note on the Brands-followed KPI
 * tile, not as a block.
 */
export interface WatchlistHealth {
  items: WatchItem[];
  /** Brands followed. Always equal to `items.length`. */
  followCount: number;
  /** Followed brands with no new creative in `inactiveThresholdDays`+ days. */
  inactiveCount: number;
  /** The threshold behind `inactiveCount`, in days. Print it with the count. */
  inactiveThresholdDays: number;
  /** Competitors followed — a subset of `items`. Drives every `tracked` flag. */
  trackedCompetitors: WatchItem[];
  /** `trackedCompetitors.length`. The "Competitors followed" KPI value. */
  trackedCompetitorCount: number;
  /**
   * Σ `trackedCompetitors[].liveAds` — the "Total competitor ads" KPI value.
   * Ads running NOW from the competitors you follow, and nothing else: it is
   * not the whole indexed market, and each domain's share of it is the same
   * `liveAds` the domain table and the pages list print for that domain.
   */
  trackedCompetitorLiveAds: number;
  activeCount: number;
  rampingCount: number;
  /** Same number as `inactiveCount` — the `quiet` band. Kept for existing readers. */
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

  // ── Fetch health (added with the `loading` state) ────────────────────────

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
  /**
   * Sources that did not answer. Always `[]` now that `error` is gone —
   * nothing in this model fails mid-scan any more, only `pending`. Kept
   * (rather than deleted) because `useDashboardStatus()` is a real,
   * consumed hook and this is part of its stable return shape.
   */
  failedSources: DataSourceStatus[];
  /**
   * Provenance tiers whose source is down. Always `[]` now — see
   * `failedSources`.
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
 * `myBrand` is the one nullable top-level field: it is null in `empty`
 * (nothing configured yet) and in `loading` (nothing resolved yet), and
 * present (a smaller brand) in `firstTime`.
 *
 * ── THE CONTENT RULE: MARKET COLLECTIONS ARE NEVER EMPTY ──────────────────
 * Unlike the OLD `thin` / `zero` fixtures, `movers`, `domains`, `pages`,
 * `industryShare`, `angles`, `signals`, `longRunners`, `cadence` and `trends`
 * are POPULATED in `firstTime` and `empty` too, scoped to a fixed six-industry
 * market preview (`POPULATED_INDUSTRY_NAMES`) rather than to whatever the user
 * happens to follow — because the market these numbers describe exists
 * whether or not the user has followed anything yet. What DOES stay a real
 * zero or an absent `null` in those two states is the user's OWN side:
 * `watchlist` (follows), `boards` (saves), `coverage.followed` (the user's own
 * follow list, as distinct from the market preview), and `myBrand` in `empty`.
 * Per-row/per-view fields already carry which side is which — `tracked` /
 * `followed` booleans, `IndustryShareRow.you`, `AngleMixRow.yourPct`
 * (`null` = absent), and `ShareOfVoiceRow.hasYourData` (`false` = the `you`
 * shape is a placeholder, not a fact). Never render a market collection as
 * empty in `firstTime` / `empty`, and never treat a your-side absence as a
 * market absence.
 *
 * ── Reading emptiness correctly ───────────────────────────────────────────
 * `loading` hands you every collection empty and every KPI null, and that
 * means "not yet" — NOT "none", which is what `firstTime` / `empty` mean for
 * the user's own side (and neither, any more, for the market side, which is
 * always real there). `meta.isLoading` is the only safe discriminator — check
 * it before any `isEmpty` / `length === 0` branch.
 *
 * `error` no longer exists as a state — see `DashboardState`.
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
  /**
   * Advertiser PAGES for the same followed industries. Sums per domain match
   * `domains[].liveAds` exactly — see `PageRow`.
   */
  pages: PageRow[];
  /** Top industries with their brand-share breakdown. */
  industryShare: IndustryShareRow[];
  /** The module's own surfaces, with a count each. Always all six. */
  navSurfaces: NavSurfaceCount[];
  domainTypeCounts: DomainTypeCounts;
  myBrand: MyBrand | null;
  shareOfVoice: ShareOfVoiceRow[];
  watchlist: WatchlistHealth;
  boards: BoardHealth;
  coverage: CoverageInfo;
  checklist: SetupChecklistItem[];
  brief: DailyBrief;
  /** Numbers-only teaser for the Trends newsroom. See `TrendsSummary` below. */
  trends: TrendsSummary;
}

// ─────────────────────────────────────────────────────────────────────────
// Trends teaser — numbers only
// ─────────────────────────────────────────────────────────────────────────
//
// A minimal summary of the Industry Insights Trends newsroom
// (`src/insights-trends`) for a small dashboard block that links out rather
// than repeating any story: counts per source, a total, when it was last
// checked, and nothing else. See `TRENDS_SOURCE_DEFS` in `./fixtures.ts` for
// where the counts come from — they are derived from the same mock arrays
// the Trends page itself renders, never a separately-typed number, so this
// block and that page can never disagree about how many items exist.

/**
 * One row per Trends source. Always the full set, in this fixed order:
 * breaking → news → meta-ads → tiktok-hooks → search → social.
 */
export type TrendsSourceKey =
  | "breaking"
  | "news"
  | "meta-ads"
  | "tiktok-hooks"
  | "search"
  | "social";

export interface TrendsSourceCount {
  key: TrendsSourceKey;
  /** Plain FabAds words, e.g. "Breaking stories". */
  label: string;
  count: number;
  /**
   * Deep link into `/insights/trends` for exactly this source where the page
   * supports one (verified against `useTrendsFilters` + `TrendsPage.tsx`'s
   * per-tab dataset). Where no exact filter exists, this is the closest tab
   * rather than an invented param the page would ignore.
   */
  href: string;
}

/**
 * A numbers-only teaser: how much lives in Trends right now, so the user
 * clicks through instead of reading it here. No stories, no cards.
 *
 * Trends is fed by Google Trends and news/social sources — completely
 * independent of the user's own follows, of the Meta Ad Library, and of
 * StoreLeads. That means its counts are REAL in every state, including
 * `firstTime` and `empty`: a brand new workspace has checked nothing of its
 * own yet, but the market-wide Trends corpus is exactly as real for it as for
 * a `populated` one. Only `newUpdates` (which needs a PRIOR check to diff
 * against) goes to `null` with a reason for a workspace that has never
 * checked before — `totalUpdates` and every `sources[].count` stay real.
 */
export interface TrendsSummary {
  /** Always the full set of sources, even when every count is 0. */
  sources: TrendsSourceCount[];
  /** Sum of every `sources[].count`. Real in every state — see above. */
  totalUpdates: number;
  /** How many are new since the last check. `null` ⇒ `newUpdatesNaReason` required. */
  newUpdates: number | null;
  newUpdatesNaReason?: string;
  /** "Last checked 6h ago" / "Checked just now" / "Checking now…". */
  lastCheckedLabel: string;
  /** `/insights/trends` — the teaser block's own click-through target. */
  href: string;
  /**
   * TRUE ONLY while the fetch is in flight (mirrors `isLoading` — never true
   * merely because a workspace is new). `firstTime` / `empty` are `false`:
   * Trends' own counts are real there.
   */
  isEmpty: boolean;
  /** TRUE ONLY while the fetch is in flight. Render a skeleton, not zeros. */
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// "What to try next" — suggestions block
// ─────────────────────────────────────────────────────────────────────────
//
// A new standalone block on `/insights/overview`, placed directly under the
// hero row (ChangeFeed + AngleMixDonut/YouVsMarket), that turns the page's
// reads into one thing to DO. It is the only block on the page with an
// action. The word "AI" is BANNED here — nothing generates this copy, it is
// assembled from data every other block on this page already shows. See
// `useSuggestions` in `./selectors.ts` for how each kind is built — it reads
// `useAngleMix()`, `useLongRunners()`, `useMovers()` and
// `useMyBrandVsMarket()` rather than recomputing anything, so this block can
// never disagree with the block above it.

/**
 * The four suggestion kinds this block ships, each derivable from data that
 * already exists elsewhere on this page:
 *
 *  - `angle`  — the angle-mix gap between the market and your own creative
 *               (`useAngleMix().biggestGap`).
 *  - `hook`   — a REAL hook string off the longest-running `LongRunnerAd`,
 *               never authored copy. This is the entire reason the kind is
 *               honest: it quotes the corpus instead of inventing a line.
 *  - `format` — the media format the longest-running ads actually use.
 *  - `follow` — a fast-moving domain (`useMovers()`) the user does not yet
 *               follow.
 */
export type SuggestionKind = "angle" | "hook" | "format" | "follow";

/**
 * One action on a suggestion card.
 *
 * INVARIANT, same discipline as `KpiTile.value === null` requiring
 * `naReason`: `caveat` is REQUIRED whenever `works` is `false`. Every
 * builder in `./selectors.ts` that produces a `works: false` action sets
 * one; there is no code path that omits it. (A true discriminated union on
 * a boolean literal was tried and reverted — TypeScript does not narrow a
 * union through a plain truthy check like `action.works ? … : action.caveat`,
 * only through an explicit `=== true` / `=== false` comparison, so a flat
 * shape here is what a normal reader — every consumer on this page —
 * narrows correctly.)
 *
 * Some actions navigate to Genie but drop their payload (Genie reads
 * `?output=` but not `?hook=` / `?angle=` — verified against
 * `StudioBrandAdForm.tsx`), and this page's whole credibility rule is that a
 * button must never look like it works when it doesn't — `works: false`
 * plus its `caveat` is how that gets said out loud instead of silently
 * shipping a dead-looking handoff.
 */
interface SuggestionActionBase {
  key: string;
  /** "Use this angle" */
  label: string;
  intent: "navigate" | "copy" | "save" | "follow";
  /** Present when `intent === "navigate"`. */
  href?: string;
}

/**
 * One action on a suggestion card.
 *
 * A DISCRIMINATED UNION on `works`, not an interface with an optional
 * `caveat` — deliberately stricter than `KpiTile`'s documented-only
 * `value: null ⇒ naReason` invariant, because this is the field that keeps
 * the block from shipping a button that looks like it works. `works: false`
 * cannot be constructed without a `caveat`, so `WhatToTryNext`'s tooltip
 * always has real copy to print and never has to invent the disclosure
 * itself. Every action on this page is honest about doing nothing; this makes
 * that a compile error rather than a review note.
 *
 * `works: true` sets `caveat?: never` so a caveat can't be attached to an
 * action that has nothing to disclose — that combination would read as a
 * warning about a handoff that is actually fine.
 */
export type SuggestionAction =
  | (SuggestionActionBase & {
      /** The payload lands. Nothing to disclose. */
      works: true;
      caveat?: never;
    })
  | (SuggestionActionBase & {
      /** The action navigates/fires but its payload does NOT land. */
      works: false;
      /** What the tooltip prints instead of pretending it works. Required. */
      caveat: string;
    });

/**
 * One suggestion.
 *
 * `quote` / `quoteMeta` are present on the `hook` kind only, and `quote` is
 * always a verbatim `LongRunnerAd.hook` string — never authored copy.
 */
export interface SuggestionCard {
  id: string;
  kind: SuggestionKind;
  /** "Angle" | "Hook" | "Format" | "Follow" — the kind chip's word. */
  kindLabel: string;
  /** The provoking sentence, off observed numbers. */
  claim: string;
  /** One short supporting line. */
  detail?: string;
  /** `hook` kind only: the real corpus hook text, quoted verbatim. */
  quote?: string;
  /** `hook` kind only: "BeautyHQ · running 116 days". */
  quoteMeta?: string;
  provenance: ProvenanceTier;
  /** 1–3 actions, kind-specific. */
  actions: SuggestionAction[];
  /**
   * E.g. the 90-day saturation caveat carried onto a long-running hook —
   * reused verbatim from `LongRunnerAd.caveatNote`, never re-worded, so this
   * block cannot imply "long-running = winning" when the gallery above it
   * already flagged the same ad as possibly saturated. Distinct from a
   * per-action `caveat`: this one is about the CLAIM, not about whether an
   * action's handoff works.
   */
  caveatNote?: string;
}

/** Return shape of `useSuggestions()` in `./selectors.ts`. */
export interface SuggestionsView {
  cards: SuggestionCard[];
  isEmpty: boolean;
  /** Nothing resolved yet — render card skeletons; must not leak any copy. */
  isLoading: boolean;
  /** "From what changed, angle mix and you vs market". */
  sourceNote: string;
}
