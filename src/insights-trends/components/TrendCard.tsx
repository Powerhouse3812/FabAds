/**
 * Industry Insights → Trends: TrendCard.
 *
 * Source-appropriate anatomy per doc §7.5: media lead -> source/type ->
 * headline/hook -> native metric + timeframe -> freshness -> one relevance
 * cue -> actions. Four visual "anatomies" cover the seven TrendSourceType
 * values:
 *  - editorial   (news, report, podcast)   — landscape/list media, source
 *                                             name, excerpt as sub-line.
 *  - adCreative  (meta, tiktok)             — portrait creative bleed (same
 *                                             treatment as IndustryInsights-
 *                                             AdsCard's media block), the
 *                                             ad headline / hook as a quoted
 *                                             sub-line.
 *  - searchDemand (google_trend)            — no photographic media; the
 *                                             0-100 relative-interest index
 *                                             is the visual, always paired
 *                                             with region + timeframe + the
 *                                             "not search volume" method
 *                                             note (doc correction B).
 *  - social      (instagram, youtube,       — square media, handle/channel
 *                 linkedin, x)                identity.
 *
 * Token vocabulary is copied 1:1 from src/components/insights-v2/
 * IndustryInsightsAdsCard.tsx (bg-card / bg-muted / border-border / the
 * -mx-4 media-bleed trick / the bg-background/85 backdrop-blur chip / the
 * bg-black/45 video-play overlay) and src/insights-trends/lib/
 * trendsDisplay.ts (STAGE_META, SOURCE_META, nativeMetric, relativeTime).
 * No new colour tokens, no platform-brand tinting — platform identity is
 * SOURCE_META's icon + label only. No state is colour-only: the trend-stage
 * "relevance cue" always pairs its colour with STAGE_META's icon + label.
 *
 * ACCESSIBILITY CONTRACT: the card root is a plain container (no role,
 * no tabIndex, no onClick) — it never behaves like a big fake link. The
 * headline is the ONLY focusable/keyboard-reachable "open" control (a
 * <button> inside an <h3>). A stretched-link overlay (`aria-hidden`, not in
 * tab order) sits underneath the content in stacking order so a mouse click
 * anywhere on the card still opens it, but the headline button and the
 * TrendActionBar are each promoted above the overlay (position + z-index)
 * so their own buttons keep receiving clicks directly and stay independently
 * focusable — the overlay never swallows them.
 */
import { Play, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendItem, TrendSourceType } from "@/insights-trends/types";
import { STAGE_META, SOURCE_META, nativeMetric, relativeTime } from "@/insights-trends/lib/trendsDisplay";
import { TrendActionBar } from "@/insights-trends/components/TrendActions";

type CardVariant = "standard" | "compact" | "lead";
type Anatomy = "editorial" | "adCreative" | "searchDemand" | "social";

function anatomyFor(type: TrendSourceType): Anatomy {
  switch (type) {
    case "news":
    case "report":
    case "podcast":
      return "editorial";
    case "meta":
    case "tiktok":
      return "adCreative";
    case "google_trend":
      return "searchDemand";
    default:
      // instagram / youtube / linkedin / x
      return "social";
  }
}

function getIdentity(item: TrendItem): string | undefined {
  switch (item.type) {
    case "news":
    case "report":
      return item.source;
    case "podcast":
      return item.channel ?? item.author;
    case "meta":
      return item.advertiser;
    case "tiktok":
      return item.creator;
    case "instagram":
    case "youtube":
    case "linkedin":
    case "x":
      return item.handle ?? item.channel ?? item.author;
    default:
      return undefined;
  }
}

/** The literal hook/ad-copy quote — only meta and tiktok carry one. Every
 *  other source falls back to `item.excerpt` at the call site. */
function getHookLine(item: TrendItem): string | undefined {
  if (item.type === "tiktok" && item.hook) return item.hook;
  if (item.type === "meta" && item.headline) {
    return item.ctaText ? `${item.headline} — ${item.ctaText}` : item.headline;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Decorative sparkline — text only carries the data (index value +  */
/*  method note in SearchDemandPanel); this is a visual accent only,  */
/*  so it's aria-hidden and never the sole carrier of information.    */
/* ------------------------------------------------------------------ */
function Sparkline({ data }: { data: number[] }) {
  const w = 100;
  const h = 22;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const points = data
    .map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * w : 0;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-full text-primary/70" aria-hidden="true" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Source/type row — icon + label ONLY carry platform identity, never  */
/*  a brand colour (per hard rule). Identity (advertiser/creator/handle/ */
/*  source) truncates so long names never break the card layout.       */
/* ------------------------------------------------------------------ */
function IdentityRow({ item }: { item: TrendItem }) {
  const meta = SOURCE_META[item.type];
  const Icon: LucideIcon = meta.icon;
  const identity = getIdentity(item);
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="shrink-0 font-medium text-foreground/80">{meta.label}</span>
      {identity && (
        <>
          <span aria-hidden="true" className="shrink-0">
            ·
          </span>
          <span className="min-w-0 truncate">{identity}</span>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Native metric row (doc §E) — each source's own unit/timeframe,     */
/*  never mixed into a combined score. `context` is skipped when it    */
/*  would just repeat the identity string already shown above it.     */
/* ------------------------------------------------------------------ */
function MetricRow({ item, identity }: { item: TrendItem; identity?: string }) {
  const metric = nativeMetric(item);
  if (!metric) return null;
  const showContext = Boolean(metric.context) && metric.context !== identity;
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] text-foreground">
        <span className="text-muted-foreground">{metric.label}</span>
        <span aria-hidden="true"> · </span>
        <span className="font-semibold">{metric.value}</span>
      </p>
      {showContext && <p className="truncate text-[11px] text-muted-foreground">{metric.context}</p>}
    </div>
  );
}

/** Correction B — the search-demand visual: index value + sparkline accent,
 *  with region + timeframe + the "not search volume" method note (all
 *  carried in `nativeMetric`'s context, one source of truth) always
 *  printed as text underneath. Never a raw "volume" figure. */
function SearchDemandPanel({ item }: { item: TrendItem }) {
  const metric = nativeMetric(item);
  if (!metric) return null;
  return (
    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/60 px-3 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{metric.value}</span>
        <span className="text-[11px] text-muted-foreground">{metric.label}</span>
      </div>
      {item.sparkData && item.sparkData.length > 1 && <Sparkline data={item.sparkData} />}
      <p className="text-[11px] leading-snug text-muted-foreground">{metric.context}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Freshness + the one relevance cue (trend stage — icon + label,     */
/*  colour never carries the meaning alone).                          */
/* ------------------------------------------------------------------ */
function MetaFooter({ item }: { item: TrendItem }) {
  const stage = STAGE_META[item.intelligence.trendStage];
  const StageIcon = stage.icon;
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(item.publishedAt)}</span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          stage.className,
        )}
      >
        <StageIcon className="h-3 w-3" aria-hidden="true" />
        {stage.label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Media blocks — one per anatomy. "bleed" variants copy the -mx-4    */
/*  edge-to-edge trick from IndustryInsightsAdsCard; "row" is the      */
/*  small fixed-size thumbnail used by the compact list layout.       */
/* ------------------------------------------------------------------ */
function EditorialMedia({ item, size }: { item: TrendItem; size: "row" | "standard" | "lead" }) {
  if (size === "row") {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("-mx-4 -mt-4 mb-3 overflow-hidden bg-muted", size === "lead" ? "aspect-[16/9]" : "aspect-[16/10]")}>
      <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

function AdCreativeMedia({ item, size }: { item: TrendItem; size: "row" | "standard" | "lead" }) {
  const chip = item.type === "tiktok" ? item.duration : item.format;
  if (size === "row") {
    return (
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="-mx-4 -mt-4 mb-3 relative overflow-hidden bg-muted"
      style={{ aspectRatio: size === "lead" ? "4/3" : "3/4" }}
    >
      <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      {item.type === "tiktok" && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <Play className="h-4 w-4 text-white" fill="currentColor" stroke="currentColor" strokeWidth={1} />
          </span>
        </span>
      )}
      {chip && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-full border border-border/60 bg-background/85 px-2 py-0.5 text-[10px] text-foreground backdrop-blur-sm"
        >
          {chip}
        </span>
      )}
    </div>
  );
}

function SocialMedia({ item, size }: { item: TrendItem; size: "row" | "standard" | "lead" }) {
  if (size === "row") {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="-mx-4 -mt-4 mb-3 aspect-square overflow-hidden bg-muted">
      <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

function RowMedia({ anatomy, item }: { anatomy: Anatomy; item: TrendItem }) {
  if (anatomy === "editorial") return <EditorialMedia item={item} size="row" />;
  if (anatomy === "adCreative") return <AdCreativeMedia item={item} size="row" />;
  if (anatomy === "social") return <SocialMedia item={item} size="row" />;
  return null; // searchDemand has no photographic media, in any variant
}

function BleedMedia({ anatomy, item, size }: { anatomy: Anatomy; item: TrendItem; size: "standard" | "lead" }) {
  if (anatomy === "editorial") return <EditorialMedia item={item} size={size} />;
  if (anatomy === "adCreative") return <AdCreativeMedia item={item} size={size} />;
  if (anatomy === "social") return <SocialMedia item={item} size={size} />;
  return null;
}

/* ------------------------------------------------------------------ */
/*  Headline — the single interactive open affordance. A heading       */
/*  wrapping a button styled as a heading link; promoted above the     */
/*  stretched-link overlay via position + z-index so it stays its own  */
/*  independently focusable control.                                  */
/* ------------------------------------------------------------------ */
function Headline({
  item,
  onOpen,
  size,
}: {
  item: TrendItem;
  onOpen: (id: string) => void;
  size: "row" | "standard" | "lead";
}) {
  return (
    <h3 className="relative z-20 leading-snug">
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className={cn(
          "rounded-sm text-left font-semibold text-foreground underline-offset-2 hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          size === "lead" && "text-lg line-clamp-3",
          size === "standard" && "text-sm line-clamp-2",
          size === "row" && "text-[13px] line-clamp-2",
        )}
      >
        {item.title}
      </button>
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */
export function TrendCard(props: {
  item: TrendItem;
  variant?: CardVariant;
  onOpen: (id: string) => void;
}): JSX.Element {
  const { item, variant = "standard", onOpen } = props;
  const anatomy = anatomyFor(item.type);
  const identity = getIdentity(item);
  const hookLine = getHookLine(item);

  // Stretched-link overlay: aria-hidden, no tabIndex, so it never enters
  // the accessibility tree or tab order. It sits at z-10 in the card's
  // stacking context; the headline (z-20) and the action bar (z-20) are
  // each given their own position + z-index so they paint above it and
  // keep receiving pointer events directly.
  const overlay = (
    <span aria-hidden="true" onClick={() => onOpen(item.id)} className="absolute inset-0 z-10 cursor-pointer" />
  );

  if (variant === "compact") {
    return (
      <div className="group relative flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40">
        {overlay}
        <RowMedia anatomy={anatomy} item={item} />
        <div className="min-w-0 flex-1 space-y-1">
          <IdentityRow item={item} />
          <Headline item={item} onOpen={onOpen} size="row" />
          {anatomy === "searchDemand" ? null : hookLine ? (
            <p className="line-clamp-1 text-[11px] italic text-muted-foreground">&ldquo;{hookLine}&rdquo;</p>
          ) : (
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.excerpt}</p>
          )}
          <MetricRow item={item} identity={identity} />
          <MetaFooter item={item} />
        </div>
        <div className="relative z-20 shrink-0 self-center">
          <TrendActionBar item={item} variant="card" />
        </div>
      </div>
    );
  }

  const isLead = variant === "lead";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card transition-shadow",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
      )}
    >
      {overlay}
      <div className="space-y-3 p-4">
        <BleedMedia anatomy={anatomy} item={item} size={isLead ? "lead" : "standard"} />

        <IdentityRow item={item} />

        <Headline item={item} onOpen={onOpen} size={isLead ? "lead" : "standard"} />

        {hookLine ? (
          <p className={cn("italic text-muted-foreground", isLead ? "line-clamp-2 text-sm" : "line-clamp-2 text-xs")}>
            &ldquo;{hookLine}&rdquo;
          </p>
        ) : (
          <p className={cn("text-muted-foreground", isLead ? "line-clamp-3 text-sm" : "line-clamp-2 text-xs")}>
            {item.excerpt}
          </p>
        )}

        {anatomy === "searchDemand" ? (
          <SearchDemandPanel item={item} />
        ) : (
          <MetricRow item={item} identity={identity} />
        )}

        <MetaFooter item={item} />

        <div className="relative z-20 border-t border-border pt-2">
          <TrendActionBar item={item} variant="card" />
        </div>
      </div>
    </div>
  );
}
