/**
 * ChangeFeed — "what changed since last time," pre-computed.
 *
 * We scanned 12 ad-intelligence products for this brief and not one of them
 * opens with this question. Meta Ad Library keeps no baseline, so there is
 * nothing to diff against. Foreplay groups by launch date but only inside a
 * single brand — there's no roll-up across everyone you follow. Meanwhile the
 * documented weekly ritual of a performance marketer is exactly: what's new →
 * what's still running → what disappeared → write a brief. This block is that
 * ritual, done for them. Build it like the hero of the page, not a
 * notification list.
 *
 * Two groups, deliberately not merged:
 *  - `trends` — signals that cleared the recurrence gate (seen 2+ times).
 *    These are the findings; they get the full row treatment and actions.
 *  - `gated` — seen exactly once. A single observation is not a trend (that's
 *    a named anti-pattern in this category), but hiding it entirely loses the
 *    teaching moment: the user should see that we *noticed* it and are
 *    deliberately declining to call it yet. Rendered de-emphasised, no
 *    actions — that visible restraint is the trust-builder, not a bug.
 *
 * `representativeAdId` is null on withdrawal signals — the ad is gone, so
 * there is nothing to link to. Rather than invent a "View ad" affordance
 * this module has no real destination for (Industry Insights has no ad
 * detail route yet), we simply never build UI off that id. A disabled or
 * dead link would be exactly the kind of fake control this codebase has
 * already had to rip out elsewhere.
 *
 * Kinds are never colour-coded — icon + label carries the distinction, per
 * the design system's ban on hue-only meaning. Row actions (Brief it / Watch
 * / Dismiss) are local optimistic state only: no store writes, no Supabase,
 * no network. Dismiss actually drops the row from view, with an Undo toast.
 *
 * ── The brief lives here now ─────────────────────────────────────────────
 * `DailyBrief` used to be its own card directly above this one. A critique
 * found the two answering the same question and restating each other's facts
 * a few hundred pixels apart. They are one block now: the brief's paragraph is
 * this card's lead, and the rows below it are the evidence that paragraph was
 * written from — including, one reveal away, the exact figures. It sits above
 * the "Since Tuesday: …" strip in every state, including the empty and the
 * loading one, because "why there is no summary" and "why there is no feed"
 * are the same answer and belong together rather than in two stacked cards.
 *
 * ── Loading is not empty ─────────────────────────────────────────────────
 * In `loading` every collection is `[]`, so `isEmpty` is true — exactly as it
 * is in `zero`, and meaning the opposite. `isLoading` is therefore checked
 * BEFORE `isEmpty`: "nothing to compare against yet" is a finding, and we have
 * not earned it until the scan answers.
 *
 * ── The read-marker ──────────────────────────────────────────────────────
 * "What changed since you last looked" needs a concept of *looked*, or it is
 * just a list that re-serves the same rows every visit. `seenStore` supplies
 * it. Three consequences here:
 *
 *  1. Unseen trends carry a dot in the gutter, a heavier headline, and no
 *     "SEEN" tag in the footer. Marker + weight + words — never hue, per the
 *     page's rule against colour-only meaning.
 *  2. The summary sentence counts what is new TO THIS USER, not what is new to
 *     the scan. `summaryLine` from the selector is the scan's reading and is
 *     kept for exactly that mode; the per-user counts are derived here so the
 *     selector stays a pure read of the corpus.
 *  3. The window is named rather than implied. "Since Thursday" alone doesn't
 *     say whose Thursday — one segmented control switches between the scan's
 *     window and the user's, and it only appears once the store actually holds
 *     a prior visit. With no baseline there is nothing honest to offer, so the
 *     scan reading is all we show.
 *
 * Reset lives next to "Mark all as seen" because a one-way catch-up would burn
 * the review on the first click — this dashboard gets read by flipping states.
 */
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Binoculars,
  CheckCheck,
  ChevronDown,
  EyeOff,
  Gauge,
  Info,
  Layers,
  Lightbulb,
  Minus,
  NotebookPen,
  Radar,
  RotateCcw,
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
import { DailyBrief } from "@/insights-dashboard/components/DailyBrief";
import { Provenance, PROVENANCE_META } from "@/insights-dashboard/components/Provenance";
import { useChangeFeedSeen } from "@/insights-dashboard/lib/seenStore";
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

/**
 * Singular / plural phrasing per kind, for the per-user summary sentence.
 *
 * Mirrors the selector's own phrase table, which is module-private there — the
 * selector exports finished sentences (`summaryLine`, `summaryParts[].phrase`)
 * with the SCAN's counts already interpolated, and there is no honest way to
 * re-pluralise "6 new angles" down to "1 new angle" by string surgery. Six
 * lines of duplication beats a regex that mangles "offers changed". If the
 * selector's wording changes, change it here too.
 */
const CHANGE_KIND_PHRASE: Readonly<Record<ChangeSignalKind, [string, string]>> = {
  "new-angle": ["new angle", "new angles"],
  "offer-shift": ["offer changed", "offers changed"],
  "format-expansion": ["new format", "new formats"],
  "velocity-change": ["shipping faster", "shipping faster"],
  "landing-page-change": ["page swapped", "pages swapped"],
  withdrawal: ["went quiet", "went quiet"],
};

const CHANGE_KIND_ORDER = Object.keys(CHANGE_KIND_PHRASE) as ChangeSignalKind[];

/**
 * Every other section on this page caps its rows and links out (Long-runners:
 * 6 of 12 + "See all in Discover"; Domains: 5 rows + "Full Competitors view").
 * This block has nowhere honest to link to — Discover indexes ads, not change
 * signals, and this feed IS the full signal set, so a "View all" link here
 * would be exactly the kind of destination-less control this codebase has
 * already had to rip out elsewhere (see the header comment on
 * `representativeAdId`). The in-place "Show all N" toggle below gets the same
 * result — capped by default, nothing lost, the count stays visible — without
 * inventing a page that doesn't exist.
 */
const TREND_ROW_CAP = 5;

/**
 * Cap for the rows BELOW the lead card, once one is showing (no kind filter
 * active). Maalik's spec: "a lead card for the biggest change, plus minimal
 * evidence on the remaining rows" — 2-3 rows, not the full 5. Pinned to the
 * bottom of that range because section height is the metric this pass is
 * judged on (413px baseline, ~460px ceiling once the lead card is added) —
 * "Show all N" is one click away for anyone who wants the third-plus row.
 * When a kind filter is active the lead card steps aside (see `leadSignal`
 * below) and the list reverts to `TREND_ROW_CAP`, unchanged from before this
 * pass.
 */
const REMAINING_ROW_CAP = 2;

const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70";

/**
 * ── Lead card magnitude parsing ────────────────────────────────────────────
 * Maalik's complaint was two-fold: the feed is boring (all text, no marks)
 * and unsourced ("kaha se aa rahi hai, kya hai wo data?"). The lead card fixes
 * both — but its numbers have to be REAL, not decoration invented for the
 * mockup. `ChangeSignal` has no structured `adCount` field; the count lives
 * inside `headline` / `evidence`, the exact strings the selector already
 * assembled (see `SIGNAL_TEMPLATES` in fixtures.ts). This reads that number
 * back out, the same move `DailyBrief`'s `parseMovement` makes on its own
 * fact strings — promoting a number that's already on the page, not minting
 * a new one.
 */
function extractAdCount(signal: ChangeSignal): number | null {
  const text = `${signal.headline} ${signal.evidence.join(" ")}`;
  const match = text.match(/(\d+)\s+(?:new\s+|live\s+)*(?:video\s+|carousel\s+|image\s+)?ads?\b/i);
  return match ? Number(match[1]) : null;
}

/** "in the last N days" / "past N days" — the window the count above covers.
 * Not every kind's evidence states one (see `magnitudeDirection`'s "flat"
 * kinds), so this is honestly nullable rather than guessed. */
function extractWindowDays(signal: ChangeSignal): number | null {
  const text = signal.evidence.join(" ");
  const match = text.match(/(?:last|past|in)\s+(\d+)\s+days?/i);
  return match ? Number(match[1]) : null;
}

type MagnitudeDirection = "up" | "down" | "flat";

/**
 * Which way this kind of change moves ad VOLUME — the axis the lead card's
 * mini bars and every remaining row's trend mark encode. `offer-shift` and
 * `landing-page-change` swap content on the same ads rather than adding or
 * removing any, so they're honestly "flat", not a fabricated up or down.
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

const TREND_MARK_ICON: Readonly<Record<MagnitudeDirection, LucideIcon>> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

const TREND_MARK_LABEL: Readonly<Record<MagnitudeDirection, string>> = {
  up: "Ad volume up",
  down: "Ad volume down",
  flat: "Ad volume unchanged",
};

/** The remaining rows' "small trend mark" — icon shape carries the direction,
 * never colour, matching the page-wide ban on hue-only meaning. */
function TrendMark({ direction }: { direction: MagnitudeDirection }): JSX.Element {
  const Icon = TREND_MARK_ICON[direction];
  return (
    <span
      className="inline-flex shrink-0 items-center text-muted-foreground"
      title={TREND_MARK_LABEL[direction]}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">{TREND_MARK_LABEL[direction]}</span>
    </span>
  );
}

/**
 * The lead card's one small visual: a real before → after ad-count pair as
 * two bars. Per-advertiser weekly cadence isn't reachable from the selector
 * layer (`useLaunchCadence` is an aggregate across every followed advertiser,
 * not this one), so per the brief this falls back to "the signal's own
 * numbers" — still a real measured pair, not a fabricated series.
 */
function LeadMagnitudeBars({ before, after }: { before: number; after: number }): JSX.Element {
  const max = Math.max(before, after, 1);
  const bars: { key: string; letter: string; value: number }[] = [
    { key: "before", letter: "B", value: before },
    { key: "after", letter: "N", value: after },
  ];
  return (
    <div
      className="flex h-9 shrink-0 items-end gap-1.5"
      role="img"
      aria-label={`Ad count moved from ${before} to ${after}`}
    >
      {bars.map((bar) => (
        <div key={bar.key} className="flex flex-col items-center gap-0.5">
          <div
            className="w-3 rounded-sm bg-foreground/70"
            style={{ height: `${Math.max(4, Math.round((bar.value / max) * 22))}px` }}
            aria-hidden="true"
          />
          <span className="font-mono text-[8px] uppercase leading-none tracking-wide text-foreground/70">
            {bar.letter}
          </span>
        </div>
      ))}
    </div>
  );
}

/** "2 minutes ago" is noise; the reader only needs the rough distance. */
function lastVisitLabel(ms: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60_000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function daysAgoLabel(n: number): string {
  if (n <= 0) return "today";
  if (n === 1) return "1d ago";
  return `${n}d ago`;
}

/** "Seen 2d ago" when first/last collapse to the same day, else a range. */
function freshnessLine(signal: ChangeSignal): string {
  if (signal.firstSeenDaysAgo === signal.lastSeenDaysAgo) {
    return `Seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
  }
  return `First seen ${daysAgoLabel(signal.firstSeenDaysAgo)} · last seen ${daysAgoLabel(signal.lastSeenDaysAgo)}`;
}

/** The one-line row's age mark — "Today" / "1d" / "6d". The full range lives
 * in the row's title attribute so nothing is lost, just demoted. */
function shortAge(n: number): string {
  if (n <= 0) return "Today";
  if (n === 1) return "1d";
  return `${n}d`;
}

interface RowActionState {
  briefed: boolean;
  watched: boolean;
  onBrief: () => void;
  onWatch: () => void;
  onDismiss: () => void;
}

/**
 * One line: kind · advertiser · one short evidence fact · trend mark · age.
 * This is deliberately leaner than the full headline sentence it replaced —
 * Maalik's "prose → marks" pass: the kind label + fact + mark carry the same
 * information a full sentence did, just as tokens instead of a clause. The
 * plain-language headline isn't gone, it's a hover away (`title`), the same
 * demotion this file already applies to the freshness range and provenance
 * tier. Everything else that used to sit permanently on the surface is still
 * here, just demoted:
 *
 *  - Evidence lives behind a `Collapsible`, triggered by the chevron. It is
 *    this row's credibility, so the trigger itself stays always-visible,
 *    only the quotes are hidden until asked for.
 *  - The full freshness range and provenance tier live in the age mark's
 *    `title` — a hover away, not gone.
 *  - Actions reveal on hover / focus-within, so a mouse user only sees them
 *    over the row they're looking at, and a keyboard user still reaches them
 *    by Tab (opacity, never `hidden`, keeps them in the tab order).
 *
 * Unseen is still carried by three non-chromatic signals — a filled dot in
 * the gutter, a heavier advertiser name, and the absence of the "Seen" word
 * in the expander — so the distinction survives greyscale and colour-
 * blindness. The dot's slot is always rendered at a fixed width so seen and
 * unseen rows share a left edge; only its fill comes and goes.
 */
function TrendRow({
  signal,
  unseen,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  unseen: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  const hasEvidence = signal.evidence.length > 0;
  const provenanceMeta = PROVENANCE_META[signal.provenance];
  const fact = shortFact(signal);
  const direction = magnitudeDirection(signal);

  return (
    <Collapsible asChild open={open} onOpenChange={onOpenChange}>
      <li className="group/row -mx-1.5 rounded-md px-1.5 hover:bg-muted/30 focus-within:bg-muted/30">
        <div className="flex items-center gap-2 py-1">
          <span className="flex h-4 w-1.5 shrink-0 items-center justify-center">
            {unseen && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                <span className="sr-only">Not seen yet.</span>
              </>
            )}
          </span>

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
            className={cn(
              "max-w-[120px] shrink-0 truncate text-sm leading-snug text-foreground",
              unseen ? "font-semibold" : "font-normal",
            )}
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

          <TrendMark direction={direction} />

          <span
            className="shrink-0 font-mono text-[10px] tabular-nums text-foreground/70"
            title={`${freshnessLine(signal)} · ${provenanceMeta.label} · ${provenanceMeta.source}${!unseen ? " · Seen" : ""}`}
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-100"
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
                actions.watched ? "text-foreground" : "text-muted-foreground",
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
 * The single biggest change of the week, given the surface Maalik asked for:
 * a real plain-language headline, the concrete numbers (ad count + window),
 * the source stated on the surface (not behind a hover), and one mini
 * before → after bar mark beside it. Same row actions as `TrendRow`
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
  unseen,
  open,
  onOpenChange,
  actions,
}: {
  signal: ChangeSignal;
  unseen: boolean;
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
      <div className="rounded-md border border-border bg-muted/20 p-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 flex h-4 w-1.5 shrink-0 items-center justify-center">
            {unseen && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                <span className="sr-only">Not seen yet.</span>
              </>
            )}
          </span>

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
            <p
              className={cn(
                "mt-0.5 text-sm leading-snug text-foreground",
                unseen ? "font-semibold" : "font-medium",
              )}
            >
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

        <div className="mt-1.5 flex items-center justify-between gap-2 pl-[1.375rem]">
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-100"
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
                actions.watched ? "text-foreground" : "text-muted-foreground",
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>

        {hasEvidence && (
          <CollapsibleContent>
            <ul className="mt-1.5 space-y-0.5 pl-[1.375rem]">
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
 * Placeholder that traces the real feed: the summary strip, the kind-chip row,
 * a block shaped like `LeadChangeCard`, then rows shaped like `TrendRow`
 * (chip line → fact → mark → age). Deliberately the same boxes at the same
 * heights — a skeleton that does not match what replaces it just moves the
 * layout jump to the moment the data lands, which is worse than showing
 * nothing.
 */
function ChangeFeedSkeleton(): JSX.Element {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
        <Skeleton className="h-4 w-4 shrink-0 rounded" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {[24, 20, 28, 22].map((w, i) => (
          <Skeleton key={i} className="h-[26px] rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Lead-card-shaped block, matching `LeadChangeCard`'s box height so
          nothing jumps when it lands. */}
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/20 p-2">
        <span className="h-4 w-1.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-9 w-9 shrink-0 rounded" />
      </div>

      {/* One-line rows: dot gutter reserved, icon, fact, mark, age — the same
          shape `TrendRow` renders, so nothing jumps when the feed lands. */}
      <ul className="divide-y divide-border/60">
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
            <span className="h-4 w-1.5 shrink-0" />
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
  const {
    trends,
    gated,
    gatedNote,
    counts,
    trendCount,
    gatedCount,
    sinceLabel,
    summaryLine,
    isEmpty,
    isLoading,
  } = useChangeFeed();

  const {
    seenIds,
    markSeen,
    markAllSeen,
    resetSeen,
    startVisit,
    lastVisitAt,
    hasVisitBaseline,
    hasSeenState,
  } = useChangeFeedSeen();

  const [activeKind, setActiveKind] = useState<ChangeSignalKind | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [briefedIds, setBriefedIds] = useState<Set<string>>(() => new Set());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(() => new Set());
  // Which rows' evidence expander is open. Evidence is a row's credibility —
  // demoted off the surface, not deleted — so this is per-row, not global.
  const [openEvidenceIds, setOpenEvidenceIds] = useState<Set<string>>(() => new Set());
  // Capped at TREND_ROW_CAP until the reader asks for the rest. See the
  // comment on TREND_ROW_CAP for why this is an in-place toggle, not a link.
  const [showAllTrends, setShowAllTrends] = useState(false);
  // The gated group stays visible restraint, not a permanent 100px tax — it
  // opens on request rather than sitting expanded at rest.
  const [gatedOpen, setGatedOpen] = useState(false);
  // Preferred reading of the window. Only honoured once a real prior visit
  // exists — see `windowMode` below.
  const [preferredWindow, setPreferredWindow] = useState<"visit" | "scan">("visit");

  // Stamp the visit AFTER paint, so the baseline the summary reads this render
  // is the PREVIOUS visit, not this one. Idempotent inside the store, so
  // StrictMode's double effect can't collapse the two.
  useEffect(() => {
    startVisit();
  }, [startVisit]);

  function handleBrief(signal: ChangeSignal) {
    if (briefedIds.has(signal.id)) return;
    setBriefedIds((prev) => new Set(prev).add(signal.id));
    // Triaging a row is looking at it.
    markSeen(signal.id);
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
    markSeen(signal.id);
    toast.success(willWatch ? `Watching ${signal.advertiser}` : `Stopped watching ${signal.advertiser}`);
  }

  // Deliberately does NOT mark seen: a dismissed row is already excluded from
  // the unseen counts below, and leaving the marker alone keeps Undo lossless.
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
  // aside), so they can't count as "new to you" either.
  const liveTrends = useMemo(
    () => trends.filter((s) => !dismissedIds.has(s.id)),
    [trends, dismissedIds],
  );

  const visibleTrends = liveTrends.filter((s) => activeKind === null || s.kind === activeKind);

  // The lead card only takes over the unfiltered reading — once a kind chip
  // narrows the list, "the biggest change this week" and "changes of kind X"
  // are two different questions, and showing a lead card whose kind might not
  // even match the active filter would be confusing. Filtered view reverts to
  // the plain list at the original cap, unchanged from before this pass.
  // Dismissing the lead (or anything else) recomputes `liveTrends`, so the
  // next-biggest change is automatically promoted on the next render.
  const leadSignal = activeKind === null ? pickLeadSignal(liveTrends) : null;
  const rowPool = leadSignal ? visibleTrends.filter((s) => s.id !== leadSignal.id) : visibleTrends;
  const rowCap = leadSignal ? REMAINING_ROW_CAP : TREND_ROW_CAP;
  // Newest-first ordering already puts the highest-value rows up front, so
  // capping is just a slice, not a re-sort.
  const shownTrends = showAllTrends ? rowPool : rowPool.slice(0, rowCap);

  // The per-user reading of the summary. Deliberately NOT filtered by
  // `activeKind` — the strip is a claim about the whole feed, and a filter is
  // a way of looking at it, not a change to what arrived.
  const unseen = useMemo(() => {
    const rows = liveTrends.filter((s) => !seenIds.has(s.id));
    const byKind = new Map<ChangeSignalKind, number>();
    for (const s of rows) byKind.set(s.kind, (byKind.get(s.kind) ?? 0) + 1);

    const phrase = CHANGE_KIND_ORDER.filter((kind) => byKind.has(kind))
      .map((kind) => {
        const count = byKind.get(kind) ?? 0;
        const [one, many] = CHANGE_KIND_PHRASE[kind];
        return `${count} ${count === 1 ? one : many}`;
      })
      .join(" · ");

    return { count: rows.length, phrase };
    // `seenIds` is a stable reference from the store until a write, so this
    // memo only recomputes when the feed or the marker actually moves.
  }, [liveTrends, seenIds]);

  // Fall back to the scan's reading whenever the store has no prior visit to
  // diff against. Offering "since your last visit" with no last visit would be
  // the exact dishonesty this block exists to fix.
  const windowMode: "visit" | "scan" = hasVisitBaseline ? preferredWindow : "scan";

  // Short form only: the per-kind breakdown (`unseen.phrase`) is exactly what
  // the filter chips below already show, so saying it twice on the surface
  // would be the same redundancy this pass is removing everywhere else. The
  // breakdown still lives in the tooltip for anyone who wants the sentence
  // version.
  const summarySentence =
    windowMode === "visit"
      ? unseen.count > 0
        ? `${unseen.count} new since your last visit`
        : `Nothing new since your last visit — you're caught up on all ${liveTrends.length} ${liveTrends.length === 1 ? "change" : "changes"}.`
      : summaryLine || "No trend has cleared the recurrence gate yet this week.";

  const windowNote =
    windowMode === "visit"
      ? `Counts only what you haven't marked seen. Last visit ${lastVisitAt === null ? "unknown" : lastVisitLabel(lastVisitAt)}.${unseen.count > 0 ? ` New: ${unseen.phrase}.` : ""}`
      : `Counts every change the scan found between ${sinceLabel} and today — whether or not you've looked at it.`;

  function handleMarkAllSeen() {
    // Pass the whole feed, gated rows included: "all" has to mean all. The
    // replace-not-append semantics also prune ids for signals that have since
    // dropped out of the corpus.
    markAllSeen([...trends.map((s) => s.id), ...gated.map((s) => s.id)]);
    toast.success("Marked as seen", {
      description: "The feed stays put — only the new-to-you emphasis clears.",
    });
  }

  function handleResetSeen() {
    resetSeen();
    setPreferredWindow("visit");
    toast.success("Read state reset", {
      description: "Back to a first-ever visit: nothing seen, no baseline to diff against.",
    });
  }

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
      <header className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">What changed</h2>
        {!isLoading && !isEmpty && (
          <div className="flex items-center gap-1">
            {/* Provenance used to be its own footer line at the bottom of the
                section. Folded into this label's title instead — one fewer
                row, nothing lost, same "hover for the source" pattern every
                other demoted note on this page already uses. */}
            <span
              className={cn("shrink-0", MICRO_LABEL)}
              title="Observed via Meta Ad Library · recurrence and deltas derived by FabAds"
            >
              {trendCount} {trendCount === 1 ? "trend" : "trends"}
              {gatedCount > 0 ? ` · ${gatedCount} watching` : ""}
            </span>
            {/* The header-level "cap + link out" grammar every other section
                uses — Long-runners' "See all N in Discover", Domains' "Full
                Competitors view" — MINUS the link: this feed has no
                Discover-equivalent to send the reader to (see TREND_ROW_CAP
                above, and the header comment on `representativeAdId`), and
                Maalik was explicit that a "View all →" here would point at a
                page that doesn't exist. It expands in place instead. */}
            {rowPool.length > rowCap && (
              <button
                type="button"
                onClick={() => setShowAllTrends((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {showAllTrends ? `Show top ${rowCap}` : `Show all ${rowPool.length}`}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
            {unseen.count > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleMarkAllSeen}
                title="Mark all as seen"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Mark all as seen</span>
              </Button>
            )}
            {/* Reset is the counterweight: without it the first "mark all as
                seen" is one-way and there is no way back to the unseen state
                the block is being reviewed for. */}
            {hasSeenState && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleResetSeen}
                title="Reset what you've seen"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Reset what you&rsquo;ve seen</span>
              </Button>
            )}
          </div>
        )}
      </header>

      {/* The week in prose, then the week in rows. The brief handles its own
          available / unavailable / loading states — it is never a filler
          paragraph. The hairline is the seam between the summary and the
          evidence it was summarised from. */}
      <DailyBrief embedded className="mb-1.5 border-b border-border/60 pb-1.5" />

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
        <div className="space-y-1.5">
          {/* The strip is a claim, so it has to say whose window it is
              measuring — but the explainer sentence moves into a tooltip on
              the info mark instead of sitting on the surface permanently. */}
          <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-0.5">
            <Radar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p
              className="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-foreground"
              aria-live="polite"
              title={summarySentence}
            >
              {summarySentence}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">What this counts</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px]">
                {windowNote}
              </TooltipContent>
            </Tooltip>

            {/* One control, two readings — and it only appears once there IS
                a prior visit to read from. */}
            {hasVisitBaseline && (
              <div
                role="group"
                aria-label="Which window the summary counts"
                className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background p-0.5"
              >
                {([
                  { key: "visit", label: "Your visit" },
                  { key: "scan", label: "Last scan" },
                ] as const).map(({ key, label }) => {
                  const active = windowMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPreferredWindow(key)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        active
                          ? "bg-primary/15 text-primary-text"
                          : "text-foreground/70 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {counts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {counts.map(({ kind, label, count }) => {
                const Icon = CHANGE_KIND_ICONS[kind];
                const active = activeKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveKind((prev) => (prev === kind ? null : kind))}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      active
                        ? "border-primary/30 bg-primary/15 text-primary-text"
                        : "border-border bg-muted/40 text-foreground/70 hover:bg-muted",
                    )}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {label}
                    <span className="tabular-nums">{count}</span>
                  </button>
                );
              })}
              {activeKind !== null && (
                <button
                  type="button"
                  onClick={() => setActiveKind(null)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Clear filter
                </button>
              )}
            </div>
          )}

          {leadSignal && (
            <LeadChangeCard
              signal={leadSignal}
              unseen={!seenIds.has(leadSignal.id)}
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

          {shownTrends.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {shownTrends.map((signal) => (
                <TrendRow
                  key={signal.id}
                  signal={signal}
                  unseen={!seenIds.has(signal.id)}
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
                {trendCount === 0
                  ? "No signal has cleared the recurrence gate yet."
                  : "No trend matches this filter."}
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
