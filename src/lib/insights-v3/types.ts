/**
 * Industry Insights v3 — shared contracts.
 *
 * OWNER: orchestrator. Phase-1/2 agents import from here and never edit it.
 * If a contract is wrong or missing, the agent stops that piece and reports;
 * the orchestrator changes this file and re-broadcasts.
 *
 * Source of truth: docs/industry-insights/01-prd-and-ia.md + 02-page-specs.md.
 * Field names follow reference/advault-A where a concept exists there, but no
 * source / spy-tool field (fetched_via, source_fields, vx_source…) is modelled:
 * Non-negotiable #10 — those names never reach the UI or user-visible data.
 *
 * Module: "Industry Insights V2" — a FRESH module beside the old Industry
 * Insights (which stays untouched). Code lives under `insights-v3` folders
 * because `insights-v2` is already taken by the old feed; the UI label is V2.
 * Decisions Q1–Q16 (Maalik, 2026-10-10) are recorded in BUILD-LOG.md.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Taxonomy + scope                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/** Slug ids, e.g. "lead-gen", "auto-insurance". Labels come from the data layer. */
export type IndustryId = string;
export type CategoryId = string;

export interface Industry {
  id: IndustryId;
  label: string;
}

/** A–Z category list. Global — the dropdown shows ALL of them in every industry; 0-count = disabled (Q2). */
export interface Category {
  id: CategoryId;
  label: string;
}

/** Q3. Default "all". */
export type PeriodKey = "7d" | "14d" | "30d" | "90d" | "180d" | "365d" | "all";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 6 months", days: 180 },
  { key: "365d", label: "Last 12 months", days: 365 },
  { key: "all", label: "All time", days: null },
];

export const ALL = "all" as const;

/** The scope bar: Industry › Category › Period. Every number on a page follows it. */
export interface Scope {
  industry: IndustryId | typeof ALL;
  category: CategoryId | typeof ALL;
  period: PeriodKey;
  /** Discover only: "My preferences only" toggle. Off by default. */
  myPrefsOnly: boolean;
}

export const DEFAULT_SCOPE: Scope = {
  industry: ALL,
  category: ALL,
  period: "all",
  myPrefsOnly: false,
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Creative elements                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** The four Creative Element Insights tabs. */
export type ElementType = "framework" | "hook" | "angle" | "concept";

/**
 * One entry of an element vocabulary.
 * - framework: closed list (PAS, AIDA, BAB, … reference A §4.7)
 * - hook:      hook STYLE (curiosity question, shock stat, …); verbatim hook lines live on the ad (Q9)
 * - angle:     grouped short angle ("save money on auto insurance")
 * - concept:   AdVault "creative format" renamed (video formats + image styles)
 */
export interface CreativeElement {
  id: string;
  type: ElementType;
  label: string;
  /** One-line plain-English description, shown in the detail overlay header. */
  description?: string;
}

/** Framework-element keys (reference A §4.7, closed list of 25). */
export type FrameworkElementKey =
  | "hook" | "lead" | "context" | "pain" | "agitation" | "fear" | "curiosity_loop"
  | "story" | "mechanism" | "solution" | "product" | "benefits" | "demonstration"
  | "social_proof" | "authority" | "comparison" | "objection" | "guarantee"
  | "offer" | "price" | "bonus" | "urgency" | "scarcity" | "cta" | "disclaimer";

/** One beat of the merged script / storyboard / timeline view. */
export interface ScriptBeat {
  element: FrameworkElementKey;
  /** What is said or written in this beat. */
  text: string;
  /** What is on screen. Null for image ads with no visual note. */
  visual: string | null;
  /** Seconds, video only. */
  start: number | null;
  end: number | null;
}

/**
 * AI analysis. Shown by default on every ad (no analysed/not-analysed state).
 * Any field may be null → that section renders disabled with a tooltip.
 */
export interface AdAnalysis {
  framework: string | null;          // CreativeElement.id (type framework)
  frameworkConfidence: number | null; // 0–1
  hookStyle: string | null;          // CreativeElement.id (type hook)
  hookText: string | null;           // verbatim opening line, ≤220 chars
  angle: string | null;              // CreativeElement.id (type angle)
  angleText: string | null;          // the ad's own angle sentence (<12 words)
  concept: string | null;            // CreativeElement.id (type concept)
  frameworkElements: FrameworkElementKey[];
  /** Topic / keyword tags, lowercase, 4–8. Drive the "Keyword / topic" group. */
  keywords: string[];
  ctaText: string | null;
  /** 2-sentence "how this ad sells". */
  summary: string | null;
  /** Merged script + storyboard + timeline. Null = no script data. */
  beats: ScriptBeat[] | null;
  transcript: string | null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Landing pages, offers, funnels                                            */
/* ────────────────────────────────────────────────────────────────────────── */

export type FunnelType = "quiz" | "advertorial" | "direct-vsl" | "lead-form" | "product-page";

export const FUNNEL_TYPE_LABEL: Record<FunnelType, string> = {
  quiz: "Quiz funnel",
  advertorial: "Advertorial pre-sell",
  "direct-vsl": "Direct VSL",
  "lead-form": "Lead form",
  "product-page": "Product page",
};

/** One row of the LP & Offers tab = one landing page. */
export interface LandingPage {
  id: string;
  url: string;
  domain: string;
  finalUrl: string | null;
  title: string | null;
  httpStatus: number | null;
  wordCount: number | null;
  /** Searchable page text. Null = not captured. */
  pageText: string | null;
  screenshotUrl: string | null;
  /** Offer domain the page sends to. Null → UI shows "Not traced". */
  offerDomain: string | null;
  offerUrl: string | null;
  funnelType: FunnelType | null;
  /** Hop URLs from ad click to offer, tracker hops already removed. */
  redirectPath: string[];
  capturedAt: string | null; // ISO
  firstSeenAt: string;       // ISO — drives "New landing pages"
}

/* ────────────────────────────────────────────────────────────────────────── */
/* AI score                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export type AiScoreTier = "elite" | "strong" | "average" | "weak";

/** Elite ≥80, Strong ≥60, Average ≥40, Weak <40. */
export const AI_SCORE_TIER_MIN: Record<Exclude<AiScoreTier, "weak">, number> = {
  elite: 80,
  strong: 60,
  average: 40,
};

/** Parts per reference A §3, model kept as-is incl. likes/social; missing → "Not reported" (Q6). */
export type AiScorePartKey = "longevity" | "likes" | "social" | "clones" | "craft" | "branded-penalty";

export interface AiScorePart {
  key: AiScorePartKey;
  label: string;
  /** Points earned (negative for the penalty). */
  value: number;
  /** Max after missing-data redistribution; 0 when not available. */
  max: number;
  available: boolean;
  /** Short reason, e.g. "94 days live", "likes not reported". */
  reason: string;
  /** Concrete evidence from this ad, e.g. a quoted hook line. */
  examples: string[];
}

export interface AiScore {
  total: number; // 1–100
  tier: AiScoreTier;
  parts: AiScorePart[];
  /** 1–2 sentence plain-English explanation of the score. */
  explanation: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Ads                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/** "Active" = seen live in the last ACTIVE_WINDOW_DAYS. Label it "Seen live", not a platform status. No "paused" (Q5). */
export type AdStatus = "active" | "inactive";

export const ACTIVE_WINDOW_DAYS = 14;

/**
 * Winner rule (Q4). Never uses likes.
 * Winner = status active AND daysLive ≥ minDaysLive AND clones ≥ minClones.
 * Extra engagement mark = a Winner whose engagement is reported AND sits in the
 * top `engagementTopShare` of ads-with-engagement in the current scope.
 */
export const WINNER_RULE = {
  minDaysLive: 14,
  minClones: 2,
  engagementTopShare: 0.1,
} as const;

/**
 * Trend / Rising / Scaling (Q7).
 * - Trend % = new ads launched in the period vs the previous equal period.
 *   Period "all" compares the last ALL_PERIOD_COMPARE_DAYS vs the ones before.
 *   Previous = 0 → changePct null → UI "New this period". No minimum base.
 * - Rising = top by trend %.
 * - Scaling = active-ad count up vs previous period AND ≥1 winner.
 */
export const ALL_PERIOD_COMPARE_DAYS = 30;

/**
 * New since last visit (Q8). Last-visit is read once per browser session and
 * then set to now. First-ever visit seeds it to FIRST_VISIT_SEED_DAYS ago.
 */
export const FIRST_VISIT_SEED_DAYS = 2;

export type MediaKind = "image" | "video" | "carousel";

export type Platform =
  | "Facebook & Instagram" | "TikTok" | "YouTube" | "LinkedIn"
  | "Snapchat" | "Pinterest" | "Reddit" | "X";

/** Reported on ~20% of ads. Null = "Not reported". Not a filter. Sortable ONLY on My Feeds (FeedAdSort), always with a "not every ad reports this" warning. */
export interface Engagement {
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

/** Kept from today's drawer (stats grid, demographics, location). Pre-formatted display strings. */
export interface AdDeliveryStats {
  spendTillNow: string | null;
  estAudienceSize: string | null;
  impressions: string | null;
  totalReach: string | null;
  brReach: string | null;
  euReach: string | null;
}

export interface AdDemographic {
  ageGroup: string;
  gender: string;
  percentage: number;
}

export interface AdLocation {
  name: string;
  type: string;
  includeExclude: "include" | "exclude";
}

export interface Ad {
  id: string;
  /** Display ad id (copyable in the drawer meta row). */
  externalId: string;

  /* advertiser */
  pageAdvertiserId: string;          // Advertiser.id (kind page) — Brand = Page
  domainAdvertiserId: string | null; // Advertiser.id (kind domain); null when no lander
  pageName: string;
  pageDisplayId: string;             // the copyable page id
  pageAvatarUrl: string | null;

  /* taxonomy */
  industryId: IndustryId;
  categoryId: CategoryId;

  /* creative */
  mediaKind: MediaKind;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  /** CSS aspect-ratio, e.g. "1/1", "9/16". */
  aspectRatio: string;
  headline: string;
  primaryText: string;
  ctaLabel: string | null;
  platforms: Platform[];
  languages: string[];

  /* run + winner inputs */
  /** First date the ad ran. Null → UI shows "Start date unknown", never an invented number. */
  startedAt: string | null;
  /** When it entered our index. Drives "New since last visit" and Newest/Oldest. */
  firstSeenAt: string;
  lastSeenAt: string;
  /** startedAt → lastSeenAt in days. Null when startedAt is null. */
  daysLive: number | null;
  status: AdStatus;
  /** Copies of this creative seen across advertisers, excluding this one. 0 = original only. */
  clones: number;
  similarAdIds: string[];

  /** ISO-2 codes. Empty array = country missing (known gap; Country counts won't sum to total). */
  countries: string[];

  engagement: Engagement;
  aiScore: AiScore;
  analysis: AdAnalysis;
  landingPageId: string | null;

  /* kept-from-drawer extras */
  delivery: AdDeliveryStats;
  demographics: AdDemographic[];
  locations: AdLocation[];
  transparencyRegions: string[];
  lastSyncedAt: string | null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Advertisers                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Advertiser tabs: Domain · Page (Brand = Page). LPs are their own entity. */
export type AdvertiserKind = "domain" | "page";

export interface Advertiser {
  id: string;
  kind: AdvertiserKind;
  /** Domain ("napchief.com") or page name ("Napchief"). Can exceed 60 chars — truncate + tooltip. */
  name: string;
  avatarUrl: string | null;
  firstSeenAt: string; // drives "New advertisers"
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Trends + KPIs                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export type TrendBucket = "day" | "week" | "month";

/** Every bar/trend chart carries a unit label + per-bar tooltip (date + count). */
export interface TrendSeries {
  /** e.g. "ads per week", "new ads per day". */
  unit: string;
  bucket: TrendBucket;
  points: { start: string; count: number }[]; // start = ISO date of bucket
  /** Change vs previous equal period, %. Null when previous period is 0 → UI "New this period" (Q7). */
  changePct: number | null;
}

export interface Kpi {
  key: string;
  label: string;
  value: number | null;
  /** Formatted value ("1.5K", "40 days"). */
  display: string;
  /** Secondary line ("+117 this period", "64% of total"). */
  sub?: string;
  tooltip: string;
  /** When set, the tile renders disabled with this as its tooltip. */
  disabledReason?: string;
}

/** Any overview / summary / analysis block. Non-negotiable #8. */
export interface BasedOn {
  ads: number;
}

export interface AiSummary extends BasedOn {
  /** Must never present "most common" as "best" (non-negotiable #9). */
  text: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Top-10 tag groups (union filter)                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export type TagGroupKey =
  | "hookStyle" | "angle" | "framework" | "frameworkElement" | "concept"
  | "keyword" | "cta" | "advertiser" | "landingPage" | "country" | "category"
  | "funnelType" | "offerDomain";

export interface TagOption {
  id: string;
  label: string;
  /** Count for the current scope. Independent of what else is selected. */
  count: number;
}

export interface TopTenGroup {
  key: TagGroupKey;
  label: string;
  /** Full list, count desc. UI shows the first 10 and "View more" for the rest. 0-count options stay (disabled). */
  options: TagOption[];
  /**
   * Scoped ads with NO value for this group (e.g. country missing). When > 0
   * the UI discloses it ("108 ads have no country"), so counts that don't add
   * up to the total are explained, not hidden (02 › States).
   */
  missing?: number;
}

/** Selected tags per group. Union within AND across groups (non-negotiable #3). */
export type SelectedTags = Partial<Record<TagGroupKey, string[]>>;

/* ────────────────────────────────────────────────────────────────────────── */
/* Sort options (spec tables; no likes/comments/shares anywhere)             */
/* ────────────────────────────────────────────────────────────────────────── */

export type AdSort = "newest" | "oldest" | "longest-running" | "most-cloned" | "ai-score";
/** My Feeds adds the three engagement sorts. Ads that do not report the metric are listed LAST, never hidden. */
export type FeedAdSort = AdSort | "most-liked" | "most-commented" | "most-shared";
export type AdvertiserSort = "most-ads" | "most-active" | "most-winners" | "longest-run";
export type LandingPageSort = "most-ads" | "most-active" | "most-advertisers" | "longest-running" | "fastest-rising";
export type ElementSort = "most-used" | "most-winners" | "fastest-rising" | "longest-running";

export const AD_SORT_LABEL: Record<AdSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "longest-running": "Longest running",
  "most-cloned": "Most cloned",
  "ai-score": "AI score",
};
export const FEED_AD_SORT_LABEL: Record<FeedAdSort, string> = {
  ...AD_SORT_LABEL,
  "most-liked": "Most liked",
  "most-commented": "Most commented",
  "most-shared": "Most shared",
};
/** Which Engagement field each engagement sort ranks on. */
export const ENGAGEMENT_SORT_FIELD = {
  "most-liked": "likes",
  "most-commented": "comments",
  "most-shared": "shares",
} as const satisfies Partial<Record<FeedAdSort, keyof Engagement>>;
export const ADVERTISER_SORT_LABEL: Record<AdvertiserSort, string> = {
  "most-ads": "Most ads",
  "most-active": "Most active / scaling",
  "most-winners": "Most winners",
  "longest-run": "Longest run",
};
export const LANDING_PAGE_SORT_LABEL: Record<LandingPageSort, string> = {
  "most-ads": "Most ads",
  "most-active": "Most active",
  "most-advertisers": "Most competitors",
  "longest-running": "Longest running",
  "fastest-rising": "Fastest rising",
};
export const ELEMENT_SORT_LABEL: Record<ElementSort, string> = {
  "most-used": "Most used",
  "most-winners": "Most winners",
  "fastest-rising": "Fastest rising",
  "longest-running": "Longest running",
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Saving, boards, detail targets                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Everything that can go to a board (non-negotiable #11 + Q9: domain, page,
 * landing page and offer are elements too). Saved Ads lists `ad` only.
 * Actions apply "accordingly" — see ELEMENT_ACTIONS.
 */
export type SavableType = "ad" | ElementType | "domain" | "page" | "landing-page" | "offer";

export const SAVABLE_LABEL: Record<SavableType, string> = {
  ad: "Ad",
  framework: "Framework",
  hook: "Hook",
  angle: "Angle",
  concept: "Concept",
  domain: "Domain",
  page: "Page",
  "landing-page": "Landing page",
  offer: "Offer",
};

/** Which actions each type gets. Use in Genie only where Genie has a matching flow action (Q11). */
export const ELEMENT_ACTIONS: Record<SavableType, { save: true; download: true; useInGenie: boolean; follow: boolean; markCompetitor: boolean }> = {
  ad:             { save: true, download: true, useInGenie: true,  follow: false, markCompetitor: false },
  framework:      { save: true, download: true, useInGenie: true,  follow: false, markCompetitor: false },
  hook:           { save: true, download: true, useInGenie: true,  follow: false, markCompetitor: false },
  angle:          { save: true, download: true, useInGenie: true,  follow: false, markCompetitor: false },
  concept:        { save: true, download: true, useInGenie: true,  follow: false, markCompetitor: false },
  domain:         { save: true, download: true, useInGenie: false, follow: false, markCompetitor: true },
  page:           { save: true, download: true, useInGenie: false, follow: true,  markCompetitor: true },
  "landing-page": { save: true, download: true, useInGenie: false, follow: false, markCompetitor: false },
  offer:          { save: true, download: true, useInGenie: false, follow: false, markCompetitor: false },
};

/** What a detail overlay or drawer can show. Also the board-item "opens as" target. */
export type DetailTarget =
  | { kind: "ad"; id: string }
  | { kind: "advertiser"; advertiserKind: AdvertiserKind; id: string }
  | { kind: "element"; elementType: ElementType; id: string }
  | { kind: "landing-page"; id: string }
  | { kind: "offer"; id: string }; // id = offer domain

export interface SavedItemRef {
  type: SavableType;
  id: string;
}

/** Enough to render a board item without re-resolving it (data may be missing later). */
export interface BoardItemSnapshot {
  title: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
}

export interface BoardItem {
  ref: SavedItemRef;
  addedAt: string; // ISO
  note?: string;
  snapshot: BoardItemSnapshot;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  items: BoardItem[];
}

/**
 * A client-side download. Built by the data layer (`buildDownload(ref)`),
 * triggered by the shared DownloadButton. Q16 formats:
 *  - ad: creative media (url) + a .txt of copy and analysis
 *  - framework/hook/angle/concept/domain/page/offer: Markdown one-pager
 *  - landing-page: screenshot (url) + page text
 */
export type DownloadFile =
  | { kind: "text"; filename: string; mime: "text/plain" | "text/markdown"; content: string }
  | { kind: "url"; filename: string; url: string };

/* ────────────────────────────────────────────────────────────────────────── */
/* URL contract — every page, filter, tab, drawer, overlay and modal         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Own namespace — the old module's /insights/* and /insights-v2/* routes are untouched. */
export const INSIGHTS_ROUTES = {
  root: "/industry-insights",
  myFeeds: "/industry-insights/feeds",
  discover: "/industry-insights/discover",
  advertiser: "/industry-insights/advertisers",
  elements: "/industry-insights/elements",
  savedAds: "/industry-insights/saved",
  boards: "/industry-insights/boards",
  boardDetail: "/industry-insights/boards/:id",
} as const;

/**
 * Query-param names. One owner per concern so agents never collide.
 *  - scope:   industry, category, period, mine=1
 *  - tabs:    tab (advertiser: domain|page|lp; elements: framework|hook|angle|concept)
 *  - list:    sort
 *  - tags:    f_<TagGroupKey>=id,id   (e.g. f_hookStyle=curiosity-question,shock-stat)
 *  - view-more modal: more=<TagGroupKey>
 *  - ad drawer: ad=<adId>   (layers ABOVE any open detail overlay; closing it returns to the overlay)
 *  - detail overlay stack (nested drill-down, back chip pops): detail=<token>~<token>
 *      token = domain:<id> | page:<id> | framework:<id> | hook:<id> | angle:<id> | concept:<id> | lp:<id> | offer:<domain>
 *  - save modal: modal=save&target=<SavableType>:<id>
 *  - dev only: state=loading|empty
 */
export const QP = {
  industry: "industry",
  category: "category",
  period: "period",
  mine: "mine",
  tab: "tab",
  sort: "sort",
  tagPrefix: "f_",
  more: "more",
  ad: "ad",
  detail: "detail",
  modal: "modal",
  target: "target",
  state: "state",
} as const;

export const DETAIL_STACK_SEPARATOR = "~";
