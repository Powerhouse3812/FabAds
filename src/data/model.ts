/**
 * Creative Report 2.0 — entity model (handoff §4 / product-plan §8.1).
 *
 * The reporting hierarchy:
 *   Concept → Angle → Creative → Variant → AdInstance → daily[] rows
 *
 * HARD RULE: aggregates are NEVER stored on entities. AdInstance.daily[] is the
 * only place metrics live; every ratio the UI shows (CTR, CPA, ROAS, hook rate…)
 * is folded up from summed daily rows by the selector layer. This makes the
 * classic "averaged ratio" bug structurally impossible.
 */
import type {
  AdStatus,
  CreativeFormat,
  Platform,
} from "@/creative-report/lib/paramSchema";

export type { AdStatus, CreativeFormat, Platform };

/* ------------------------------------------------------------------ */
/*  Component dimensions (the differentiator — §8.3)                    */
/* ------------------------------------------------------------------ */

/** The creative components we decompose + report on. */
export type ComponentKind =
  | "hook"
  | "headline"
  | "primary-text"
  | "cta"
  | "visual-style";

/** A tagged component value carried by a creative (one value per kind). */
export interface CreativeComponents {
  /** Hook style/opening line (video only in spirit, but tagged for all). */
  hook: string;
  headline: string;
  /** Primary text angle/theme label (not the full body copy). */
  primaryText: string;
  cta: string;
  visualStyle: string;
}

/* ------------------------------------------------------------------ */
/*  Archetypes — drive the generator's distributions (§4 realism)      */
/* ------------------------------------------------------------------ */

/**
 * Assigned per creative before daily rows are generated, so the dataset always
 * contains the required mix: real winners, tiny-spend fake winners (to demo
 * spend-weighting), fatiguing creatives (CTR decay + rising frequency), brand-
 * new low-n creatives, clear losers, and steady mid-pack.
 */
export type Archetype =
  | "winner"
  | "fake-winner"
  | "fatiguing"
  | "scaling"
  | "new"
  | "loser"
  | "steady";

/* ------------------------------------------------------------------ */
/*  Entities                                                           */
/* ------------------------------------------------------------------ */

export interface Concept {
  id: string;
  name: string;
  /** One-line thesis — the parent idea. */
  thesis: string;
}

export interface Angle {
  id: string;
  conceptId: string;
  name: string;
}

export interface Creative {
  id: string;
  angleId: string;
  /** Clean ad-level convention name (parseable — §8.2). */
  name: string;
  format: CreativeFormat;
  /** Seed for the deterministic picsum thumbnail. */
  thumbKey: string;
  /** ISO date the creative was first launched. */
  createdAt: string;
  archetype: Archetype;
  components: CreativeComponents;
  /** Product this creative sells (drives naming + thumbnail variety). */
  product: string;
  /**
   * Present when this creative is a near-duplicate of another (same asset,
   * different crop). Both members of the pair share this id — the selector
   * surfaces "Possibly the same creative (92% match)" + merge/split.
   */
  dedupGroupId?: string;
  /** Similarity score for the dedup pair, e.g. 0.92. */
  dedupMatch?: number;
}

export type VariantKind = "crop" | "text" | "cta" | "length";

export interface Variant {
  id: string;
  creativeId: string;
  kind: VariantKind;
  label: string;
}

export interface DailyRow {
  /** yyyy-MM-dd */
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  outboundClicks: number;
  purchases: number;
  revenue: number;
  /** Video 3s views — null for static/image ads (→ "N/A — no video"). */
  video3s: number | null;
  /** Thruplays (video hold) — null for static/image ads. */
  thruplays: number | null;
  /** Ad-set frequency snapshot for the day. */
  frequency: number;
}

export interface AdInstance {
  id: string;
  variantId: string;
  creativeId: string;
  platform: Platform;
  accountId: string;
  /** Messy, human-authored campaign string (§8.2) — NOT parseable. */
  campaignName: string;
  /** Messy ad-set string. */
  adsetName: string;
  placement: string;
  geo: string;
  device: string;
  objective: string;
  age: string;
  gender: string;
  status: AdStatus;
  daily: DailyRow[];
}

/** The whole generated dataset, flat arrays keyed by id where useful. */
export interface Dataset {
  concepts: Concept[];
  angles: Angle[];
  creatives: Creative[];
  variants: Variant[];
  adInstances: AdInstance[];
  conceptById: Record<string, Concept>;
  angleById: Record<string, Angle>;
  creativeById: Record<string, Creative>;
  variantsByCreative: Record<string, Variant[]>;
  instancesByCreative: Record<string, AdInstance[]>;
  instancesByVariant: Record<string, AdInstance[]>;
}
