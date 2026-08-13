/**
 * Industry Insights — Trends module types.
 *
 * Doc-mandated corrections baked into the shape of this contract (see
 * project brief for the full rationale):
 *  A. Confidence is never a percentage — always level + evidence + freshness.
 *  B. Google Trends is a 0-100 relative interest index, never volume.
 *  C. No universal urgency countdown — a bounded, rationale-backed window.
 *  D. No universal Safe/Caution badge — adaptation risk always states why.
 *  E. Each source keeps its own native metric; no mixed-source ranking.
 *  F. News & Intelligence renders as an editorial lead + list (UI concern,
 *     not encoded here, but NEWS_ITEMS in the mock data assumes it).
 *  G. Claim labels are a fixed vocabulary (see ClaimLevel).
 */

export type TrendSourceType =
  | "news"
  | "report"
  | "podcast"
  | "meta"
  | "tiktok"
  | "google_trend"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "x";

export type TrendStage = "emerging" | "growing" | "peaking" | "declining";

export type ConfidenceLevel = "low" | "medium" | "high" | "insufficient";

export type AdaptationRiskLevel = "low" | "medium" | "high" | "review";

export type OpportunityRead = "opportunity" | "growing" | "saturated" | "unclear";

export type ClaimLevel = "observed" | "corroborated" | "inferred" | "suggested" | "forecast";

export type TrendsTabKey = "overview" | "news" | "social" | "search";

export interface TrendEvidence {
  level: ClaimLevel;
  text: string;
  url?: string;
}

export interface TrendIntelligence {
  trendStage: TrendStage;
  /** Short bounded label, e.g. "Next 7-14 days" or "No reliable window yet". Never a countdown. */
  testWindow: string;
  /** Why that window (or lack of one) applies — always paired with testWindow. */
  testWindowRationale: string;
  confidence: {
    level: ConfidenceLevel;
    evidenceCount: number;
    evidenceType: string;
    refreshedAt: string;
  };
  adaptationRisk: {
    level: AdaptationRiskLevel;
    reason: string;
  };
  bestFit: string;
  opportunityRead: OpportunityRead;
  opportunityNote: string;
  creativeWhitespace: string;
  suggestedFirstTest: string;
  whatNotToCopy: string;
  /** At least 2 entries, varied ClaimLevels, per doc guardrail. */
  evidence: TrendEvidence[];
}

export interface TrendItem {
  id: string;
  type: TrendSourceType;
  title: string;
  excerpt: string;
  thumbnail: string;
  publishedAt: string;
  industries: string[];
  topics: string[];
  bodyBlocks: Array<{ kind: "p" | "h3"; text: string }>;
  intelligence: TrendIntelligence;

  // News / report / podcast
  source?: string;
  readTime?: string;

  // Meta ads
  advertiser?: string;
  isActive?: boolean;
  activeDays?: number;
  platforms?: string[];
  format?: string;
  headline?: string;
  ctaText?: string;

  // TikTok hooks
  creator?: string;
  followerCount?: string;
  hook?: string;
  duration?: string;
  stats?: { views: string; likes: string; shares: string };

  // Google Trends (search demand)
  term?: string;
  interestIndex?: number;
  region?: string;
  timeframe?: string;
  relatedQueries?: string[];
  sparkData?: number[];

  // Other social (Instagram / YouTube / LinkedIn / X)
  handle?: string;
  channel?: string;
  author?: string;
  metric1?: string;
  metric2?: string;
}
