/**
 * Industry Insights → Trends: full trend story overlay (doc §8).
 *
 * Built on the app's Dialog primitive (src/components/ui/dialog.tsx), which
 * already blocks onPointerDownOutside/onInteractOutside per the house
 * no-outside-click-dismiss rule — this overlay never closes on a backdrop
 * click, unlike the reference prototype. Exits are Escape (Radix default)
 * and an explicit Back control. Radix's DialogPrimitive.Content already
 * traps focus inside the panel while open and restores focus to the
 * triggering element on close; onOpenAutoFocus below makes the "moves focus
 * into the panel on open" behaviour explicit and deterministic (focuses the
 * Back button) rather than relying on Radix's implicit first-tabbable pick.
 *
 * Reading View is always the default on every open (doc §8.1) — the view
 * choice is intentionally NOT persisted across itemId changes or re-opens.
 *
 * Token vocabulary matches src/insights-trends/lib/trendsDisplay.ts and
 * src/components/insights-v2/*: bg-card / bg-muted / text-muted-foreground /
 * text-foreground / border-border / bg-primary/text-primary / destructive.
 * No new colour tokens, no platform brand tinting — platform identity is
 * icon + label only (SOURCE_META).
 */
import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  LayoutList,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TrendItem } from "@/insights-trends/types";
import { getTrendById } from "@/insights-trends/mocks/trendsData";
import {
  STAGE_META,
  CONFIDENCE_META,
  RISK_META,
  OPPORTUNITY_META,
  CLAIM_META,
  SOURCE_META,
  relativeTime,
} from "@/insights-trends/lib/trendsDisplay";
import { TrendActionBar } from "@/insights-trends/components/TrendActions";

type ViewMode = "reading" | "intelligence";

/* ------------------------------------------------------------------ */
/*  Small local helpers                                                */
/* ------------------------------------------------------------------ */

/** Absolute date alongside the relative one — neither on its own is enough
 *  for a "published"/"refreshed" byline that people actually trust. */
function absoluteDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function byline(iso: string): string {
  const abs = absoluteDate(iso);
  const rel = relativeTime(iso);
  return abs ? `${abs} (${rel})` : rel;
}

/** Doc §8.3 guardrail — an empty/missing field renders an explicit missing
 *  state, never confident filler. */
function TextOrMissing(props: { value?: string | null; missing?: string }): JSX.Element {
  const text = props.value?.trim();
  if (!text) {
    return <p className="text-sm italic text-muted-foreground">{props.missing ?? "Not enough evidence"}</p>;
  }
  return <p className="text-sm leading-relaxed text-foreground">{text}</p>;
}

/* ------------------------------------------------------------------ */
/*  Rail field shell — "01 Label" heading + content, fixed order.      */
/* ------------------------------------------------------------------ */
function RailField(props: { number: string; label: string; children: React.ReactNode }): JSX.Element {
  return (
    <section aria-labelledby={`trend-rail-${props.number}`} className="space-y-1.5">
      <h3
        id={`trend-rail-${props.number}`}
        className="flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <span className="tabular-nums text-muted-foreground/70">{props.number}</span>
        {props.label}
      </h3>
      {props.children}
    </section>
  );
}

function MetaPill(props: { icon: LucideIcon; label: string; className?: string }): JSX.Element {
  const Icon = props.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground",
        props.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {props.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero media — real alt text, source-type fallback when missing.     */
/* ------------------------------------------------------------------ */
function HeroMedia(props: { item: TrendItem }): JSX.Element {
  const { item } = props;
  const source = SOURCE_META[item.type];
  const Icon = source.icon;

  if (!item.thumbnail) {
    return (
      <div
        role="img"
        aria-label={`No image available for this ${source.label} item`}
        className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-muted"
      >
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={item.thumbnail}
      alt={item.title}
      className="w-full rounded-lg border border-border object-cover"
      style={{ maxHeight: "22rem" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Reading View                                                       */
/* ------------------------------------------------------------------ */
function ReadingView(props: { item: TrendItem }): JSX.Element {
  const { item } = props;
  const source = SOURCE_META[item.type];
  const SourceIcon = source.icon;
  const bylineSource = item.source ?? item.advertiser ?? item.creator ?? item.author ?? item.handle ?? source.label;

  return (
    <article className="space-y-5">
      <TrendActionBar item={item} variant="story" />

      <HeroMedia item={item} />

      <div className="space-y-2">
        <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <SourceIcon className="h-3.5 w-3.5" />
            {bylineSource}
          </span>
          <span aria-hidden="true">·</span>
          <span>Published {byline(item.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>Refreshed {byline(item.intelligence.confidence.refreshedAt)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {item.bodyBlocks.map((block, i) =>
          block.kind === "h3" ? (
            <h3 key={i} className="text-base font-semibold text-foreground">
              {block.text}
            </h3>
          ) : (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              {block.text}
            </p>
          ),
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Intelligence rail — 10 numbered fields, fixed order.                */
/* ------------------------------------------------------------------ */
function IntelligenceRail(props: { item: TrendItem }): JSX.Element {
  const { item } = props;
  const intel = item.intelligence;

  const stage = STAGE_META[intel.trendStage];
  const StageIcon = stage.icon;

  const confidence = CONFIDENCE_META[intel.confidence.level];

  const risk = RISK_META[intel.adaptationRisk.level];
  const RiskIcon = risk.icon;

  const opportunity = OPPORTUNITY_META[intel.opportunityRead];
  const OpportunityIcon = opportunity.icon;

  return (
    <aside
      aria-label="Trend intelligence"
      className="space-y-5 rounded-lg border border-border bg-card p-4"
    >
      <RailField number="01" label="Trend stage">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", stage.className)}>
          <StageIcon className="h-3.5 w-3.5" />
          {stage.label}
        </span>
      </RailField>

      <Separator />

      <RailField number="02" label="Recommended test window">
        <TextOrMissing value={intel.testWindow} missing="No reliable window yet" />
        <TextOrMissing value={intel.testWindowRationale} missing="No rationale available yet." />
      </RailField>

      <Separator />

      <RailField number="03" label="Confidence & freshness">
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", confidence.className)}>
          {confidence.label}
        </span>
        <p className="text-sm text-foreground/90">
          {intel.confidence.evidenceCount} {intel.confidence.evidenceCount === 1 ? "source" : "sources"} ·{" "}
          {intel.confidence.evidenceType}
        </p>
        <p className="text-xs text-muted-foreground">Refreshed {byline(intel.confidence.refreshedAt)}</p>
      </RailField>

      <Separator />

      <RailField number="04" label="Adaptation risk">
        <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", risk.className)}>
          <RiskIcon className="h-4 w-4" />
          {risk.label}
        </span>
        <TextOrMissing value={intel.adaptationRisk.reason} missing="No reason on file yet — treat as unverified." />
      </RailField>

      <Separator />

      <RailField number="05" label="Best fit">
        <TextOrMissing value={intel.bestFit} />
      </RailField>

      <Separator />

      <RailField number="06" label="Opportunity vs saturation">
        <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", opportunity.className)}>
          <OpportunityIcon className="h-4 w-4" />
          {opportunity.label}
        </span>
        <TextOrMissing value={intel.opportunityNote} />
      </RailField>

      <Separator />

      <RailField number="07" label="Creative whitespace">
        <TextOrMissing value={intel.creativeWhitespace} />
      </RailField>

      <Separator />

      <RailField number="08" label="Suggested first test">
        <TextOrMissing value={intel.suggestedFirstTest} />
      </RailField>

      <Separator />

      <RailField number="09" label="What not to copy">
        <TextOrMissing value={intel.whatNotToCopy} />
      </RailField>

      <Separator />

      <RailField number="10" label="Evidence & sources">
        {intel.evidence.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Not enough evidence</p>
        ) : (
          <ul className="space-y-2.5">
            {intel.evidence.map((ev, i) => {
              const claim = CLAIM_META[ev.level];
              return (
                <li key={i} className="space-y-1">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px]", claim.className)}>
                    {claim.label}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">{ev.text}</p>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      View source
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </RailField>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Header — Back, source eyebrow, view toggle, stage badge.           */
/* ------------------------------------------------------------------ */
function OverlayHeader(props: {
  item: TrendItem;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  onClose: () => void;
  backRef: React.RefObject<HTMLButtonElement>;
}): JSX.Element {
  const { item, viewMode, onViewModeChange, onClose, backRef } = props;
  const source = SOURCE_META[item.type];
  const stage = STAGE_META[item.intelligence.trendStage];
  const StageIcon = stage.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <Button
          ref={backRef}
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={onClose}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <MetaPill icon={source.icon} label={source.label} />
      </div>

      <div className="flex items-center gap-3">
        <div role="group" aria-label="Story view" className="inline-flex rounded-md border border-border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={viewMode === "reading"}
            className={cn(
              "gap-1.5 rounded-sm px-2.5",
              viewMode === "reading" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
            )}
            onClick={() => onViewModeChange("reading")}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Reading View
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={viewMode === "intelligence"}
            className={cn(
              "gap-1.5 rounded-sm px-2.5",
              viewMode === "intelligence" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground",
            )}
            onClick={() => onViewModeChange("intelligence")}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Intelligence View
          </Button>
        </div>

        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", stage.className)}>
          <StageIcon className="h-3.5 w-3.5" />
          {stage.label}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */
export function TrendStoryOverlay(props: { itemId: string | null; onClose: () => void }): JSX.Element | null {
  const { itemId, onClose } = props;
  const item = itemId ? getTrendById(itemId) : undefined;

  // Reading View is always the default on every open — never remembered
  // across a change of itemId (doc §8.1). Re-derived synchronously on every
  // itemId change rather than persisted, so re-opening the same or a
  // different trend always lands back on Reading View.
  const [viewMode, setViewMode] = React.useState<ViewMode>("reading");
  const lastItemId = React.useRef<string | null>(null);
  if (itemId !== lastItemId.current) {
    lastItemId.current = itemId;
    if (viewMode !== "reading") setViewMode("reading");
  }

  const backRef = React.useRef<HTMLButtonElement>(null);

  const open = itemId !== null;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  // itemId set but not found in mock data — closeable, no confident filler.
  if (!item) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Trend not found</DialogTitle>
          <DialogDescription>
            This trend could not be loaded. It may have been removed from this feed.
          </DialogDescription>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="left-1/2 top-1/2 flex h-[92vh] w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0 sm:rounded-xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          backRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Trend story and intelligence detail for {item.title}.
        </DialogDescription>

        <div className="px-6 pt-6">
          <OverlayHeader
            item={item}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onClose={onClose}
            backRef={backRef}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className={cn("flex flex-col gap-6", viewMode === "intelligence" && "lg:flex-row lg:items-start")}>
            <div className={cn(viewMode === "intelligence" ? "lg:flex-1 lg:min-w-0" : "mx-auto w-full max-w-3xl")}>
              <ReadingView item={item} />
            </div>

            {viewMode === "intelligence" && (
              <div className="w-full lg:w-[360px] lg:shrink-0">
                <IntelligenceRail item={item} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrendStoryOverlay;
