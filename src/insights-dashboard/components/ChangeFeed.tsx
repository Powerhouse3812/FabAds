/**
 * ChangeFeed — "what changed since last time," pre-computed.
 *
 * We scanned 12 ad-intelligence products for this brief and not one of them
 * opens with this question. Meta Ad Library keeps no baseline, so there is
 * nothing to diff against. Foreplay groups by launch date but only inside a
 * single brand — there's no roll-up across everyone you follow. Meanwhile the
 * documented weekly ritual of a performance marketer is exactly: what's new →
 * what's still running → what disappeared → write a brief. This block is that
 * ritual, done for them.
 *
 * ── Rebuilt to Maalik's verdict (KISS pass) ─────────────────────────────────
 * The previous version stacked seven separate horizontal bands — a kind-filter
 * chip row, a "your visit / last scan" toggle, a seen/unseen marker system, an
 * all-caps attribution line — and Maalik's read was blunt: no hierarchy, no
 * plain labels, "are random lines and cards." All of that is gone. This is now
 * exactly three zones, always, no per-user state:
 *
 *  1. Header — one line: `WHAT CHANGED` + the window and count. Nothing else.
 *  2. Lead — the single biggest change, headline + real numbers + the source
 *     line ON the surface (never a tooltip — that was the fix for "kaha se aa
 *     rahi hai, kya hai wo data?").
 *  3. Every remaining change, one line each, inside a fixed-height scroller.
 *     No cap, no "Show all N" toggle — scrolling is the affordance.
 *
 * There is no filtering UI, no read/unread concept, and no per-visit state.
 * The block answers exactly one question — what changed since the last scan —
 * the same way for everyone, every time. `seenStore.ts` still exists on disk
 * for whichever surface still wants it; this file no longer imports it.
 *
 * Two groups, deliberately not merged:
 *  - `trends` — signals that cleared the recurrence gate (seen 2+ times).
 *    These are the findings; they get the full row treatment and actions.
 *  - `gated` — seen exactly once. A single observation is not a trend (that's
 *    a named anti-pattern in this category), but hiding it entirely loses the
 *    teaching moment: the user should see that we *noticed* it and are
 *    deliberately declining to call it yet. Rendered de-emphasised, collapsed,
 *    no actions — that visible restraint is the trust-builder, not a bug.
 *
 * `representativeAdId` is null on withdrawal signals — the ad is gone, so
 * there is nothing to link to. Rather than invent a "View ad" affordance
 * this module has no real destination for (Industry Insights has no ad
 * detail route yet), we simply never build UI off that id.
 *
 * Kinds are never colour-coded — icon + label carries the distinction, per
 * the design system's ban on hue-only meaning. Row actions (Brief it / Watch
 * / Dismiss) are local optimistic state only: no store writes, no Supabase,
 * no network. Dismiss actually drops the row from view, with an Undo toast.
 *
 * ── The brief moved out ──────────────────────────────────────────────────
 * `DailyBrief` used to be embedded at the top of this card. Maalik: "^ new
 * what ????" — the chips read as an unlabeled mystery bolted onto a feed. This
 * card now contains only changes; `DailyBrief` is not rendered here at all.
 * It still works standalone (unchanged, in its own file) for whichever page
 * mounts it later.
 *
 * ── Loading is not empty ─────────────────────────────────────────────────
 * In `loading` every collection is `[]`, so `isEmpty` is true — exactly as it
 * is in `zero`, and meaning the opposite. `isLoading` is therefore checked
 * BEFORE `isEmpty`: "nothing to compare against yet" is a finding, and we have
 * not earned it until the scan answers.
 */
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Bell,
  Binoculars,
  ChevronDown,
  EyeOff,
  Gauge,
  Info,
  Layers,
  Lightbulb,
  NotebookPen,
  Radar,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance, PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import {
  CHANGE_KIND_LABELS,
  useChangeFeed,
  type ChangeSignal,
  type ChangeSignalKind,
} from "@/insights-dashboard/lib/selectors";

const CHANGE_KIND_ICONS: Readonly<Record<ChangeSignalKind, LucideIcon>> = {
  "new-angle": Lightbulb,
  "offer-shift": Tag,
  "format-expansion": Layers,
  "velocity-change": Gauge,
  "landing-page-change": ArrowRightLeft,
  withdrawal: EyeOff,
};

const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/** How tall the remaining-changes list gets before it scrolls internally,
 * per Maalik: "fixed height with inside scroll." This is a max, not a fixed
 * box — a short list is shorter, a long one scrolls, but the card never
 * grows past this to fit more rows. */
const LIST_MAX_HEIGHT = "max-h-[264px]";

/**
 * ── Lead card magnitude parsing ────────────────────────────────────────────
 * Maalik's complaint was two-fold: the feed is boring (all text, no marks)
 * and unsourced ("kaha se aa rahi hai, kya hai wo data?"). The lead card fixes
 * both — but its numbers have to be REAL, not decoration invented for the
 * mockup. `ChangeSignal` has no structured `adCount` field; the count lives
 * inside `headline` / `evidence`, the exact strings the selector already
 * assembled (see `SIGNAL_TEMPLATES` in fixtures.ts). This reads that number
 * back out rather than minting a new one.
 */
function extractAdCount(signal: ChangeSignal): number | null {
  const text = `${signal.headline} ${signal.evidence.join(" ")}`;
  const match = text.match(/(\d+)\s+(?:new\s+|live\s+)*(?:video\s+|carousel\s+|image\s+)?ads?\b/i);
  return match ? Number(match[1]) : null;
}

/** "in the last N days" / "past N days" — the window the count above covers.
 * Not every kind's evidence states one, so this is honestly nullable rather
 * than guessed. */
function extractWindowDays(signal: ChangeSignal): number | null {
  const text = signal.evidence.join(" ");
  const match = text.match(/(?:last|past|in)\s+(\d+)\s+days?/i);
  return match ? Number(match[1]) : null;
}

type MagnitudeDirection = "up" | "down" | "flat";

/**
 * Which way this kind of change moves ad VOLUME — the axis the lead card's
 * mini bars encode. `offer-shift` and `landing-page-change` swap content on
 * the same ads rather than adding or removing any, so they're honestly
 * "flat", not a fabricated up or down.
 */
function magnitudeDirection(signal: ChangeSignal): MagnitudeDirection {
  if (signal.kind === "withdrawal") return "down";
  if (
    signal.kind === "new-angle" ||
    signal.kind === "format-expansion" ||
    signal.kind === "velocity-change"
  ) {
    return "up";
  }
  return "flat";
}

/**
 * Before → after ad-count pair for the lead card's two-bar mark. Every number
 * here is grounded in the signal's own text: `after` is `extractAdCount`;
 * `before` is either explicitly stated ("12-week average of N" on a
 * velocity-change) or honestly zero where the evidence itself says so ("none
 * did … before", "static-only before") or unchanged where the evidence says
 * the ad count didn't move (offer/page swaps). Nothing here is invented for
 * the chart.
 */
function leadMagnitude(signal: ChangeSignal): { before: number; after: number } {
  const after = extractAdCount(signal) ?? signal.observationCount;
  const direction = magnitudeDirection(signal);
  if (direction === "down") return { before: after, after: 0 };
  if (direction === "flat") return { before: after, after };
  const avgMatch = signal.evidence.join(" ").match(/average of (\d+)/i);
  return { before: avgMatch ? Number(avgMatch[1]) : 0, after };
}

/** One short, real fact for a remaining row — e.g. "3 ads changed" — never
 * the full quoted evidence (that stays behind the row's expander). Null when
 * this signal's text doesn't carry a countable number; the row falls back to
 * the plain headline in that case. */
function shortFact(signal: ChangeSignal): string | null {
  const n = extractAdCount(signal);
  if (n === null) return null;
  switch (signal.kind) {
    case "withdrawal":
      return `${n} ads pulled`;
    case "new-angle":
      return `${n} ads on new angle`;
    case "offer-shift":
      return `${n} ads changed`;
    case "format-expansion":
      return `${n} new-format ads`;
    case "velocity-change":
      return `${n} ads this week`;
    case "landing-page-change":
      return `${n} ads redirected`;
    default:
      return null;
  }
}

/** The single biggest change of the week: most ads moved (falling back to
 * `observationCount` when no count parses), ties broken by most recent. */
function pickLeadSignal(trends: readonly ChangeSignal[]): ChangeSignal | null {
  if (trends.length === 0) return null;
  return [...trends].sort((a, b) => {
    const aMag = extractAdCount(a) ?? a.observationCount;
    const bMag = extractAdCount(b) ?? b.observationCount;
    if (bMag !== aMag) return bMag - aMag;
    return a.lastSeenDaysAgo - b.lastSeenDaysAgo;
  })[0];
}

/**
 * The lead card's one small visual: a real before → after ad-count pair as
 * two labelled bars. Labelled `Before` / `Now` per Maalik — the previous `B`
 * / `N` shorthand was cryptic. Per-advertiser weekly cadence isn't reachable
 * from the selector layer, so this falls back to the signal's own numbers —
 * still a real measured pair, not a fabricated series.
 */
function LeadMagnitudeBars({ before, after }: { before: number; after: number }): JSX.Element {
  const max = Math.max(before, after, 1);
  const bars: { key: string; label: string; value: number }[] = [
    { key: "before", label: "Before", value: before },
    { key: "after", label: "Now", value: after },
  ];
  return (
    <div
      className="flex h-10 shrink-0 items-end gap-2"
      role="img"
      aria-label={`Ad count moved from ${before} to ${after}`}
    >
      {bars.map((bar) => (
        <div key={bar.key} className="flex w-10 flex-col items-center gap-0.5">
          <div
            className="w-3 rounded-sm bg-foreground/70"
            style={{ height: `${Math.max(4, Math.round((bar.value / max) * 22))}px` }}
            aria-hidden="true"
          />
          <span className="font-mono text-[8px] uppercase leading-none tracking-wide text-foreground/70">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function daysAgoLabel(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d ago";
  return `${n}d ago`;
}

/** The one-line row's age mark — "today" / "1d" / "6d". The full range lives
 * in the row's title attribute so nothing is lost, just demoted. */
function shortAge(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d";
  return `${n}d`;
}

/** "Seen 2d ago" when first/last collapse to the same day, else a range. */
function freshnessLine(signal: ChangeSignal): string {
  if (signal.firstSeenDaysAgo === signal.lastSeenDaysAgo) {
    return `Seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
  }
  return `First seen ${daysAgoLabel(signal.firstSeenDaysAgo)} · last seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
}

interface RowActionState {
  briefed: boolean;
  watched: boolean;
  onBrief: () => void;
  onWatch: () => void;
  onDismiss: () => void;
}

/**
 * One line: kind icon + kind label · advertiser · one short fact · age.
 * Everything beyond that surface is a hover/click away, not gone:
 *
 *  - Evidence lives behind a `Collapsible`, triggered by the chevron. It is
 *    this row's credibility, so the trigger itself stays always-visible,
 *    only the quotes are hidden until asked for.
 *  - The full freshness range and provenance tier live in the age mark's
 *    `title` — a hover away, not gone.
 *  - Actions reveal on hover / focus-within, so a mouse user only sees them
 *    over the row they're looking at, and a keyboard user still reaches them
 *    by Tab (opacity, never `hidden`, keeps them in the tab order).
 */
function TrendRow({
  signal,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const hasEvidence = signal.evidence.length > 0;
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const fact = shortFact(signal);

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange}>
      <li className="group/row -mx-1.5 rounded-md px-1.5 hover:bg-muted/30 focus-within:bg-muted/30">
        <div className="flex items-center gap-2 py-1.5">
          <span
            className="inline-flex shrink-0 items-center gap-1"
            title={signal.headline}
          >
            <KindIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="hidden text-xs text-foreground/70 sm:inline">
              {CHANGE_KIND_LABELS[signal.kind]}
            </span>
          </span>

          <span
            className="max-w-[120px] shrink-0 truncate text-sm font-medium leading-snug text-foreground"
            title={signal.advertiser}
          >
            {signal.advertiser}
          </span>

          <span
            className="min-w-0 flex-1 truncate text-xs text-foreground/70"
            title={signal.headline}
          >
            {fact ?? signal.headline}
          </span>

          <span
            className="shrink-0 font-mono text-[10px] tabular-nums text-foreground/70"
            title={`${freshnessLine(signal)} · ${provenanceMeta.label} · ${provenanceMeta.source}`}
          >
            {shortAge(signal.lastSeenDaysAgo)}
          </span>

          {signal.provenance === "estimated" && <Provenance tier="estimated" compact />}

          {hasEvidence ? (
            <CollapsibleTrigger
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
              aria-label={open ? "Hide evidence" : "Show evidence"}
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          ) : (
            <span className="w-6 shrink-0" aria-hidden="true" />
          )}

          <div
            className={cn(
              "flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity",
              "group-hover/row:opacity-100 group-focus-within/row:opacity-100",
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={actions.briefed}
              onClick={actions.onBrief}
              title={actions.briefed ? "Queued for the weekly brief" : "Brief it"}
              className="h-6 w-6 text-foreground/70 hover:text-foreground disabled:opacity-100"
            >
              <NotebookPen className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{actions.briefed ? "Queued" : "Brief it"}</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={actions.onWatch}
              aria-pressed={actions.watched}
              title={actions.watched ? "Watching" : "Watch"}
              className={cn(
                "h-6 w-6 hover:text-foreground",
                actions.watched ? "text-foreground" : "text-foreground/70",
              )}
            >
              <Bell className={cn("h-3 w-3", actions.watched && "fill-current")} aria-hidden="true" />
              <span className="sr-only">{actions.watched ? "Watching" : "Watch"}</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={actions.onDismiss}
              title="Dismiss"
              className="h-6 w-6 text-foreground/70 hover:text-foreground"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {hasEvidence && (
          <CollapsibleContent>
            <ul className="space-y-0.5 py-1 pb-2 pl-[3.75rem] pr-2">
              {signal.evidence.map((fact, idx) => (
                <li key={idx} className="text-xs leading-snug text-foreground/70">
                  &ldquo;{fact}&rdquo;
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </li>
    </Collapsible>
  );
}

function GatedRow({ signal }: { signal: ChangeSignal }) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  return (
    <li className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs text-foreground/70">
      <span className="inline-flex shrink-0 items-center gap-1 pt-0.5">
        <KindIcon className="h-3 w-3" aria-hidden="true" />
        {CHANGE_KIND_LABELS[signal.kind]}
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="font-medium text-foreground/80">{signal.advertiser}</span>
        {" — "}
        {signal.headline}
        <span className="whitespace-nowrap"> · {freshnessLine(signal)}</span>
      </span>
      <Provenance tier={signal.provenance} compact />
    </li>
  );
}

/**
 * The single biggest change of the week: a real plain-language headline, the
 * concrete numbers (ad count + window), the source stated on the surface —
 * never behind a hover, that's the exact fix for "kaha se aa rahi hai" — and
 * one mini before → now bar mark beside it. Same row actions as `TrendRow`
 * (Brief it / Watch / Dismiss) — dismissing the lead just promotes the next
 * biggest change on the next render, since `pickLeadSignal` reads off the
 * live (non-dismissed) trend list every time.
 *
 * Actions here render always-visible rather than hover-gated: this is the
 * hero row, not a dense list line, so there's no "which row am I over"
 * ambiguity hover-gating exists to solve on `TrendRow`.
 */
function LeadChangeCard({
  signal,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const hasEvidence = signal.evidence.length > 0;
  const adCount = extractAdCount(signal) ?? signal.observationCount;
  const windowDays = extractWindowDays(signal);
  const windowLabel =
    windowDays !== null ? `over ${windowDays}d` : `since ${daysAgoLabel(signal.firstSeenDaysAgo)}`;
  // The exact fix for "kaha se aa rahi hai" — source, freshness and scan
  // count stated on the surface, not left to a hover.
  const sourceLine = `${provenanceMeta.source} · first seen ${daysAgoLabel(signal.firstSeenDaysAgo)} · ${signal.observationCount} ${signal.observationCount === 1 ? "scan" : "scans"} compared`;
  const { before, after } = leadMagnitude(signal);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="rounded-md border border-border bg-muted/20 p-2.5">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={MICRO_LABEL}>Biggest change this week</span>
              <span
                className="inline-flex shrink-0 items-center"
                title={CHANGE_KIND_LABELS[signal.kind]}
              >
                <KindIcon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">{CHANGE_KIND_LABELS[signal.kind]}</span>
              </span>
            </div>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
              {signal.headline}
            </p>
            <p className="mt-0.5 text-sm tabular-nums text-foreground">
              {adCount} {adCount === 1 ? "ad" : "ads"} · {windowLabel}
            </p>
            <p className={cn(MICRO_LABEL, "mt-0.5")} title={sourceLine}>
              {sourceLine}
            </p>
          </div>

          <LeadMagnitudeBars before={before} after={after} />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          {hasEvidence ? (
            <CollapsibleTrigger
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium text-foreground/70",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              {open ? "Hide evidence" : "Show evidence"}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          ) : (
            <span aria-hidden="true" />
          )}

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={actions.briefed}
              onClick={actions.onBrief}
              title={actions.briefed ? "Queued for the weekly brief" : "Brief it"}
              className="h-6 w-6 text-foreground/70 hover:text-foreground disabled:opacity-100"
            >
              <NotebookPen className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">{actions.briefed ? "Queued" : "Brief it"}</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={actions.onWatch}
              aria-pressed={actions.watched}
              title={actions.watched ? "Watching" : "Watch"}
              className={cn(
                "h-6 w-6 hover:text-foreground",
                actions.watched ? "text-foreground" : "text-foreground/70",
              )}
            >
              <Bell className={cn("h-3 w-3", actions.watched && "fill-current")} aria-hidden="true" />
              <span className="sr-only">{actions.watched ? "Watching" : "Watch"}</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={actions.onDismiss}
              title="Dismiss"
              className="h-6 w-6 text-foreground/70 hover:text-foreground"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {hasEvidence && (
          <CollapsibleContent>
            <ul className="mt-1.5 space-y-0.5">
              {signal.evidence.map((fact, idx) => (
                <li key={idx} className="text-xs leading-snug text-foreground/70">
                  &ldquo;{fact}&rdquo;
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

/**
 * Placeholder that traces the real feed: the header line, a block shaped
 * like `LeadChangeCard`, then rows shaped like `TrendRow`. Deliberately the
 * same boxes at the same heights — a skeleton that does not match what
 * replaces it just moves the layout jump to the moment the data lands, which
 * is worse than showing nothing.
 */
function ChangeFeedSkeleton(): JSX.Element {
  return (
    <div className="space-y-2" aria-hidden="true">
      {/* Lead-card-shaped block, matching `LeadChangeCard`'s box height so
          nothing jumps when it lands. */}
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/20 p-2.5">
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded" />
      </div>

      {/* One-line rows: icon, fact, age — the same shape `TrendRow` renders,
          so nothing jumps when the feed lands. */}
      <ul className="divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-3 w-20 shrink-0 sm:block" />
            <Skeleton className="h-3 w-5 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChangeFeed({ className }: { className?: string }): JSX.Element {
  const { trends, gated, gatedNote, sinceLabel, isEmpty, isLoading } = useChangeFeed();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [briefedIds, setBriefedIds] = useState<Set<string>>(() => new Set());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(() => new Set());
  // Which rows' evidence expander is open. Evidence is a row's credibility —
  // demoted off the surface, not deleted — so this is per-row, not global.
  const [openEvidenceIds, setOpenEvidenceIds] = useState<Set<string>>(() => new Set());
  // The gated group stays visible restraint, not a permanent tax on the
  // card's height — it opens on request rather than sitting expanded at rest.
  const [gatedOpen, setGatedOpen] = useState(false);

  function handleBrief(signal: ChangeSignal) {
    if (briefedIds.has(signal.id)) return;
    setBriefedIds((prev) => new Set(prev).add(signal.id));
    toast.success("Queued for the weekly brief", { description: signal.headline });
  }

  function handleWatch(signal: ChangeSignal) {
    const willWatch = !watchedIds.has(signal.id);
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (willWatch) next.add(signal.id);
      else next.delete(signal.id);
      return next;
    });
    toast.success(willWatch ? `Watching ${signal.advertiser}` : `Stopped watching ${signal.advertiser}`);
  }

  // Deliberately does NOT write anywhere else: a dismissed row is just gone
  // from view, and Undo puts it right back, lossless.
  function handleDismiss(signal: ChangeSignal) {
    setDismissedIds((prev) => new Set(prev).add(signal.id));
    toast.success("Dismissed from this feed", {
      description: signal.headline,
      action: {
        label: "Undo",
        onClick: () =>
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(signal.id);
            return next;
          }),
      },
    });
  }

  // Everything still in the feed. Dismissed rows are gone for good (Undo
  // aside).
  const liveTrends = useMemo(
    () => trends.filter((s) => !dismissedIds.has(s.id)),
    [trends, dismissedIds],
  );

  // Zone 2. Dismissing the lead recomputes `liveTrends`, so the next-biggest
  // change is automatically promoted on the next render.
  const leadSignal = pickLeadSignal(liveTrends);
  // Zone 3: every remaining change, no cap — the scroller (see
  // `LIST_MAX_HEIGHT`) is the affordance, not a "Show all N" link.
  const remainingTrends = leadSignal
    ? liveTrends.filter((s) => s.id !== leadSignal.id)
    : liveTrends;

  function setEvidenceOpen(id: string, open: boolean) {
    setOpenEvidenceIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {/* Zone 1 — one line, nothing else. Attribution rides in the title
          rather than as its own all-caps row on the surface. */}
      <header
        className="mb-2 flex flex-wrap items-baseline gap-x-2"
        title="Observed via Meta Ad Library · recurrence and deltas derived by FabAds"
      >
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          What changed
        </h2>
        {!isLoading && !isEmpty && (
          <span className="text-xs text-foreground/70">
            Since {sinceLabel} · {liveTrends.length} {liveTrends.length === 1 ? "change" : "changes"}
          </span>
        )}
      </header>

      {/* isLoading FIRST: in `loading`, `isEmpty` is true and means "we
          haven't looked yet", not "there is nothing". */}
      {isLoading ? (
        <ChangeFeedSkeleton />
      ) : isEmpty ? (
        <InsightsV2EmptyState
          icon={Radar}
          title="Nothing to compare against yet"
          description="We need at least two scans of the same advertiser before we can call anything a change. That's nothing to compare against yet — not proof that nothing is happening."
        />
      ) : (
        <div className="space-y-2">
          {/* Zone 2 — the lead. */}
          {leadSignal && (
            <LeadChangeCard
              signal={leadSignal}
              open={openEvidenceIds.has(leadSignal.id)}
              onOpenChange={(open) => setEvidenceOpen(leadSignal.id, open)}
              actions={{
                briefed: briefedIds.has(leadSignal.id),
                watched: watchedIds.has(leadSignal.id),
                onBrief: () => handleBrief(leadSignal),
                onWatch: () => handleWatch(leadSignal),
                onDismiss: () => handleDismiss(leadSignal),
              }}
            />
          )}

          {/* Zone 3 — every remaining change, fixed-height, inside scroll. */}
          {remainingTrends.length > 0 ? (
            <ul className={cn(LIST_MAX_HEIGHT, "divide-y divide-border/60 overflow-y-auto")}>
              {remainingTrends.map((signal) => (
                <TrendRow
                  key={signal.id}
                  signal={signal}
                  open={openEvidenceIds.has(signal.id)}
                  onOpenChange={(open) => setEvidenceOpen(signal.id, open)}
                  actions={{
                    briefed: briefedIds.has(signal.id),
                    watched: watchedIds.has(signal.id),
                    onBrief: () => handleBrief(signal),
                    onWatch: () => handleWatch(signal),
                    onDismiss: () => handleDismiss(signal),
                  }}
                />
              ))}
            </ul>
          ) : (
            !leadSignal && (
              <p className="py-2 text-xs text-foreground/70">
                No signal has cleared the recurrence gate yet.
              </p>
            )
          )}

          {gated.length > 0 && (
            <Collapsible
              open={gatedOpen}
              onOpenChange={setGatedOpen}
              className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-1"
            >
              <div className="flex items-center gap-1">
                {/* The restraint itself — "we noticed but won't call it a
                    trend yet" — stays visible at rest as a one-line summary.
                    Only the individual observations collapse; opening this is
                    optional, seeing that we're being careful is not. */}
                <CollapsibleTrigger
                  className={cn(
                    "flex flex-1 items-center gap-1.5 rounded py-0.5 text-left text-xs font-medium text-foreground/70",
                    "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  )}
                >
                  <Binoculars className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Watching — not yet a trend</span>
                  <span className="tabular-nums text-foreground/70">{gated.length}</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                      gatedOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </CollapsibleTrigger>
                {gatedNote && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex shrink-0 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <Info className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">Why these aren&rsquo;t trends yet</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px]">
                      {gatedNote}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <CollapsibleContent>
                <ul className="mt-2 space-y-2 pb-1">
                  {gated.map((signal) => (
                    <GatedRow key={signal.id} signal={signal} />
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </section>
  );
}
