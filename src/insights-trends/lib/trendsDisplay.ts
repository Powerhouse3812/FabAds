/**
 * Industry Insights → Trends display metadata.
 *
 * DESIGN SYSTEM PRIMACY: every className below is composed ONLY of the
 * app's existing Tailwind/shadcn tokens (bg-muted, text-muted-foreground,
 * text-foreground, border-border, bg-primary/text-primary, destructive).
 * No hex values, no new CSS variables, no platform brand colours — platform
 * identity is carried by the lucide icon + text label in SOURCE_META, never
 * by tinting. Every stage/claim/risk pairs colour (if any) with an icon AND
 * a label so no state is colour-only.
 */
import {
  type LucideIcon,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Rocket,
  CircleDot,
  HelpCircle,
  Newspaper,
  FileText,
  Podcast,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Music2,
  Search,
  X as XIcon,
} from "lucide-react";
import type {
  TrendSourceType,
  TrendStage,
  ConfidenceLevel,
  AdaptationRiskLevel,
  OpportunityRead,
  ClaimLevel,
  TrendItem,
} from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Relative time — real Date.now(), recomputed on every call.        */
/* ------------------------------------------------------------------ */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

/* ------------------------------------------------------------------ */
/*  Trend stage — lifecycle read on a trend. Emerging/growing/peaking/ */
/*  declining differentiated primarily by icon + label; colour only   */
/*  as a light existing-token accent, never alone.                    */
/* ------------------------------------------------------------------ */
export const STAGE_META: Record<TrendStage, { label: string; icon: LucideIcon; className: string }> = {
  emerging: {
    label: "Emerging",
    icon: Sparkles,
    className: "bg-muted text-foreground",
  },
  growing: {
    label: "Growing",
    icon: TrendingUp,
    className: "bg-primary/10 text-primary",
  },
  peaking: {
    label: "Peaking",
    icon: Flame,
    className: "bg-primary/15 text-primary font-semibold",
  },
  declining: {
    label: "Declining",
    icon: TrendingDown,
    className: "bg-muted text-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Confidence — NEVER a percentage. Always paired (by the consumer)  */
/*  with evidence count + type + last-refreshed. Label + weight only. */
/* ------------------------------------------------------------------ */
export const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; className: string }> = {
  low: {
    label: "Low confidence",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium confidence",
    className: "bg-muted text-foreground",
  },
  high: {
    label: "High confidence",
    className: "bg-primary/10 text-primary font-semibold",
  },
  insufficient: {
    label: "Not enough evidence",
    className: "border border-dashed border-border text-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Adaptation risk — ALWAYS shown with its specific reason by the     */
/*  consumer. No universal Safe/Caution badge; destructive reserved   */
/*  for the "high" tier only, and always paired with an icon + label. */
/* ------------------------------------------------------------------ */
export const RISK_META: Record<AdaptationRiskLevel, { label: string; icon: LucideIcon; className: string }> = {
  low: {
    label: "Low risk",
    icon: ShieldCheck,
    className: "text-muted-foreground",
  },
  medium: {
    label: "Medium risk",
    icon: ShieldAlert,
    className: "text-foreground",
  },
  high: {
    label: "High risk",
    icon: ShieldAlert,
    className: "text-destructive",
  },
  review: {
    label: "Requires review",
    icon: ShieldQuestion,
    className: "text-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Opportunity read — how crowded/open the whitespace looks.         */
/* ------------------------------------------------------------------ */
export const OPPORTUNITY_META: Record<OpportunityRead, { label: string; icon: LucideIcon; className: string }> = {
  opportunity: {
    label: "Opportunity",
    icon: Rocket,
    className: "text-primary font-semibold",
  },
  growing: {
    label: "Growing",
    icon: TrendingUp,
    className: "text-primary/80",
  },
  saturated: {
    label: "Saturated",
    icon: CircleDot,
    className: "text-muted-foreground",
  },
  unclear: {
    label: "Unclear",
    icon: HelpCircle,
    className: "text-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Claim labels — fixed set. Strength differentiated by label +      */
/*  weight/style, not colour hue.                                     */
/* ------------------------------------------------------------------ */
export const CLAIM_META: Record<ClaimLevel, { label: string; className: string }> = {
  observed: {
    label: "Observed",
    className: "bg-muted text-foreground font-semibold",
  },
  corroborated: {
    label: "Corroborated",
    className: "bg-muted text-foreground",
  },
  inferred: {
    label: "Inferred",
    className: "bg-muted text-muted-foreground",
  },
  suggested: {
    label: "Suggested",
    className: "text-muted-foreground italic",
  },
  forecast: {
    label: "Forecast",
    className: "border border-dashed border-border text-muted-foreground",
  },
};

/* ------------------------------------------------------------------ */
/*  Source metadata — platform identity comes from icon + label ONLY. */
/*  Never tint with a brand colour; callers colour these with         */
/*  text-muted-foreground / text-foreground like any other icon.      */
/* ------------------------------------------------------------------ */
export const SOURCE_META: Record<TrendSourceType, { label: string; icon: LucideIcon }> = {
  news: { label: "News", icon: Newspaper },
  report: { label: "Report", icon: FileText },
  podcast: { label: "Podcast", icon: Podcast },
  meta: { label: "Meta Ad Library", icon: Facebook },
  tiktok: { label: "TikTok", icon: Music2 },
  google_trend: { label: "Google Trends", icon: Search },
  instagram: { label: "Instagram", icon: Instagram },
  youtube: { label: "YouTube", icon: Youtube },
  linkedin: { label: "LinkedIn", icon: Linkedin },
  x: { label: "X", icon: XIcon },
};

/* ------------------------------------------------------------------ */
/*  Native metric — each source keeps its own unit/timeframe. NEVER   */
/*  combine sources into one score or leaderboard (doc §E). Google     */
/*  Trends is always the 0-100 relative-interest index with region +  */
/*  timeframe, and the method note that it is not search volume.      */
/* ------------------------------------------------------------------ */
export function nativeMetric(item: TrendItem): { label: string; value: string; context: string } | null {
  switch (item.type) {
    case "google_trend": {
      if (item.interestIndex == null) return null;
      return {
        label: "Relative interest",
        value: `${item.interestIndex}/100`,
        context: `${item.region ?? "Worldwide"} · ${item.timeframe ?? "Past 12 months"} · relative interest, not search volume`,
      };
    }
    case "meta": {
      if (item.activeDays == null && item.isActive == null && !item.advertiser) return null;
      return {
        label: item.isActive ? "Active" : "Inactive",
        value: item.activeDays != null ? `${item.activeDays}d running` : "—",
        context: item.advertiser ? `${item.advertiser} · Meta Ad Library` : "Meta Ad Library",
      };
    }
    case "tiktok":
    case "instagram":
    case "youtube": {
      if (!item.stats) return null;
      return {
        label: "Views",
        value: item.stats.views,
        context: `${item.stats.likes} likes · ${item.stats.shares} shares`,
      };
    }
    case "x":
    case "linkedin": {
      if (!item.metric1 && !item.metric2) return null;
      return {
        label: "Engagement",
        value: item.metric1 ?? "—",
        context: item.metric2 ?? item.handle ?? item.author ?? "",
      };
    }
    case "news":
    case "report": {
      if (!item.readTime && !item.source && !item.author) return null;
      return {
        label: "Read time",
        value: item.readTime ?? "—",
        context: item.source ?? item.author ?? "",
      };
    }
    case "podcast": {
      if (!item.duration && !item.channel && !item.author) return null;
      return {
        label: "Duration",
        value: item.duration ?? "—",
        context: item.channel ?? item.author ?? "",
      };
    }
    default:
      return null;
  }
}
