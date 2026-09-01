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
  ArrowRightLeft,
  Bell,
  Binoculars,
  CheckCheck,
  EyeOff,
  Gauge,
  Layers,
  Lightbulb,
  NotebookPen,
  Radar,
  RotateCcw,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { DailyBrief } from "@/insights-dashboard/components/DailyBrief";
import { Provenance } from "@/insights-dashboard/components/Provenance";
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

const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground";

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

interface RowActionState {
  briefed: boolean;
  watched: boolean;
  onBrief: () => void;
  onWatch: () => void;
  onDismiss: () => void;
}

/**
 * Unseen is carried by THREE non-chromatic signals at once — a filled dot in
 * the gutter, a heavier headline, and the absence of the footer's "seen" tag —
 * so the distinction survives greyscale, low contrast, and a colour-blind
 * reader. The dot's slot is always rendered at a fixed width so seen and
 * unseen rows stay on the same left edge; only its fill comes and goes.
 */
function TrendRow({
  signal,
  unseen,
  actions,
}: {
  signal: ChangeSignal;
  unseen: boolean;
  actions: RowActionState;
}) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-5 w-1.5 shrink-0 items-center justify-center">
          {unseen && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
              <span className="sr-only">Not seen yet.</span>
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          <KindIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
          {CHANGE_KIND_LABELS[signal.kind]}
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{signal.advertiser}</span> · {signal.domain}
        </span>
        <Provenance tier={signal.provenance} compact />
      </div>

      <p
        className={cn(
          "mt-1.5 pl-3.5 text-sm leading-snug text-foreground",
          unseen ? "font-semibold" : "font-normal",
        )}
      >
        {signal.headline}
      </p>

      {signal.evidence.length > 0 && (
        <ul className="mt-1 space-y-0.5 pl-3.5">
          {signal.evidence.map((fact, idx) => (
            <li key={idx} className="text-xs leading-snug text-muted-foreground">
              &ldquo;{fact}&rdquo;
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-3.5">
        <span className={MICRO_LABEL}>
          {freshnessLine(signal)}
          {!unseen && " · Seen"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={actions.briefed}
            onClick={actions.onBrief}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-100"
          >
            <NotebookPen className="h-3 w-3" aria-hidden="true" />
            {actions.briefed ? "Queued" : "Brief it"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={actions.onWatch}
            aria-pressed={actions.watched}
            className={cn(
              "h-7 gap-1 px-2 text-xs hover:text-foreground",
              actions.watched ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Bell className={cn("h-3 w-3", actions.watched && "fill-current")} aria-hidden="true" />
            {actions.watched ? "Watching" : "Watch"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={actions.onDismiss}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Dismiss
          </Button>
        </div>
      </div>
    </li>
  );
}

function GatedRow({ signal }: { signal: ChangeSignal }) {
  const KindIcon = CHANGE_KIND_ICONS[signal.kind];
  return (
    <li className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs text-muted-foreground">
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
 * Placeholder that traces the real feed: the summary strip, the kind-chip row,
 * then three rows shaped like `TrendRow` (chip line → headline → evidence →
 * footer). Deliberately the same boxes at the same heights — a skeleton that
 * does not match what replaces it just moves the layout jump to the moment the
 * data lands, which is worse than showing nothing.
 */
function ChangeFeedSkeleton(): JSX.Element {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="rounded-md bg-muted/30 px-3 py-2">
        <div className="flex items-start gap-2">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* The window note + its reading toggle. */}
        <div className="mt-1.5 flex items-center justify-between gap-3 pl-6">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-52 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {[24, 20, 28, 22].map((w, i) => (
          <Skeleton key={i} className="h-[26px] rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      <ul className="divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-2 py-3 first:pt-0 last:pb-0">
            {/* The 1.5px dot gutter is reserved here too, so the rows don't
                shift left when the real feed lands. */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-5 w-1.5 shrink-0" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="ml-3.5 h-4 w-11/12" />
            <Skeleton className="ml-3.5 h-3 w-3/4" />
            <div className="flex items-center justify-between gap-2 pt-1 pl-3.5">
              <Skeleton className="h-3 w-32" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </div>
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

  const summarySentence =
    windowMode === "visit"
      ? unseen.count > 0
        ? `New to you since your last visit: ${unseen.phrase}`
        : `Nothing new since your last visit — you're caught up on all ${liveTrends.length} ${liveTrends.length === 1 ? "change" : "changes"}.`
      : summaryLine || "No trend has cleared the recurrence gate yet this week.";

  const windowNote =
    windowMode === "visit"
      ? `Counts only what you haven't marked seen. Last visit ${lastVisitAt === null ? "unknown" : lastVisitLabel(lastVisitAt)}.`
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

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-sm font-semibold text-foreground">What changed</h2>
        {!isLoading && !isEmpty && (
          <div className="flex items-center gap-1">
            <span className={cn("shrink-0", MICRO_LABEL)}>
              {trendCount} {trendCount === 1 ? "trend" : "trends"}
              {gatedCount > 0 ? ` · ${gatedCount} watching` : ""}
            </span>
            {unseen.count > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleMarkAllSeen}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" aria-hidden="true" />
                Mark all as seen
              </Button>
            )}
            {/* Reset is the counterweight: without it the first "mark all as
                seen" is one-way and there is no way back to the unseen state
                the block is being reviewed for. */}
            {hasSeenState && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResetSeen}
                title="Reset what you've seen"
                className="h-7 w-7 px-0 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
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
      <DailyBrief embedded className="mb-4 border-b border-border/60 pb-4" />

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
        <div className="space-y-4">
          {/* The strip is a claim, so it has to say whose window it is
              measuring. The sentence is the claim; the line under it names the
              window and what the number counts. */}
          <div className="rounded-md bg-muted/30 px-3 py-2">
            <div className="flex items-start gap-2">
              <Radar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p
                className="text-sm font-medium leading-snug text-foreground"
                aria-live="polite"
              >
                {summarySentence}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pl-6">
              <p className="text-xs leading-snug text-muted-foreground">{windowNote}</p>

              {/* One control, two readings — and it only appears once there IS
                  a prior visit to read from. */}
              {hasVisitBaseline && (
                <div
                  role="group"
                  aria-label="Which window the summary counts"
                  className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-background p-0.5"
                >
                  {([
                    { key: "visit", label: "Since your last visit" },
                    { key: "scan", label: "Since the last scan" },
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
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
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
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Clear filter
                </button>
              )}
            </div>
          )}

          {visibleTrends.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {visibleTrends.map((signal) => (
                <TrendRow
                  key={signal.id}
                  signal={signal}
                  unseen={!seenIds.has(signal.id)}
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
            <p className="py-2 text-xs text-muted-foreground">
              {trendCount === 0
                ? "No signal has cleared the recurrence gate yet."
                : "No trend matches this filter."}
            </p>
          )}

          {gated.length > 0 && (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Binoculars className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Watching — not yet a trend
              </p>
              {gatedNote && <p className="mb-2 text-xs leading-snug text-muted-foreground">{gatedNote}</p>}
              <ul className="space-y-2">
                {gated.map((signal) => (
                  <GatedRow key={signal.id} signal={signal} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
