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
/*  Elements 2.0 — script, frames, audio, audience-fit, richer tags     */
/*  (iter-2 W3 — component decomposition goes deeper than §8.3)         */
/* ------------------------------------------------------------------ */

/** The actual ad copy broken into sections — distinct from the `hook`/`cta`
 *  TAGS above (which classify style); these are the literal lines. */
export interface ScriptSections {
  hookLine: string;
  body: string;
  ctaLine: string;
}

/** Copywriting frameworks we track — did the creative follow one, and (via
 *  the selector layer) is that framework still working for this account? */
export const FRAMEWORKS = ["PAS", "AIDA", "BAB", "FAB", "Star-Story-Solution"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export interface CreativeScript {
  sections: ScriptSections;
  framework: Framework;
}

/** One tagged frame of a video creative (frame-level element, Hawky-style). */
export interface FrameTag {
  /** 1-based position in the video. */
  index: number;
  label: string;
  /** True on the frame our generator marks as the likely retention drop —
   *  only ever set for fatiguing/losing archetypes (drop-attribution, W3). */
  dropoff?: boolean;
}

export const AUDIO_KINDS = ["trending", "original", "voiceover"] as const;
export type AudioKind = (typeof AUDIO_KINDS)[number];

export interface AudioTag {
  kind: AudioKind;
  label: string;
}

export type AudienceFitLevel = "strong" | "moderate" | "weak";

/** Hypothesis-framed creative↔audience match signal (never a verdict). */
export interface AudienceFitSignal {
  level: AudienceFitLevel;
  bestSegment: string;
  note: string;
}

export interface CreativeElements {
  /** Video only — empty for static/carousel (mirrors the hook/hold N/A rule). */
  frames: FrameTag[];
  /** Video only — null for static/carousel. */
  audio: AudioTag | null;
  audienceFit: AudienceFitSignal;
}

/** Richer AI auto-tag dimensions (Motion ~8-dim / Segwise element-tag pattern). */
export interface CreativeTags {
  messagingAngle: string;
  hookTactic: string;
  offerType: string;
  visualFormat: string;
  emotion: string;
}

/** Which element the data likely attributes a fatigue/loss drop to — only
 *  set for declining archetypes; a hypothesis surfaced in the drawer, never
 *  a diagnosis (§7 honesty rules extend to element-level signals too). */
export type DropElement = ComponentKind | "frame" | "audio";

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

  /* --- iter-2 W1: Catalogue link (Brand → Product → Category drill) --- */
  /** Real Catalogue brand id (@/mocks/shared/brands) this creative sells for. */
  brandId?: string;
  /** Real Catalogue product id — set only when a plausible real SKU exists;
   *  absent is honest (not every fictional product has a Catalogue match). */
  productId?: string;
  /** Real Catalogue category id — set when the brand has a matching real
   *  Category row (a couple of brands tag categories that don't exist as
   *  entities in @/mocks/shared/categories; left unset rather than faked). */
  categoryId?: string;

  /* --- iter-2 W3: elements 2.0 --- */
  script: CreativeScript;
  elements: CreativeElements;
  tags: CreativeTags;
  /** Only set for fatiguing/losing archetypes — see DropElement. */
  likelyDropElement?: DropElement;
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
