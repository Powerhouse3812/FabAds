/**
 * MarketMovers — "Who's scaling, who's pulling back."
 *
 * Right-rail follow-set comparison: each row is one advertiser's 30-day
 * change in *live creative volume* measured against the 30 days before it —
 * never spend, never a proxy for it (see `windowLabel` / `summaryLine` from
 * `useMovers()`, which state the window plainly rather than promising
 * "trending" or "hot").
 *
 * Direction must never rely on colour alone: every row carries a lucide
 * direction icon (Up / Down / Minus) *and* the explicitly signed percentage
 * text. `text-primary-text` / `text-destructive` are layered on as a
 * secondary cue only, per the block brief — strip them and the row still
 * reads correctly from icon + sign alone.
 *
 * Track / Track all are LOCAL OPTIMISTIC UI ONLY — a `useState` map plus a
 * `sonner` toast. Nothing here writes to a shared store, Supabase, or the
 * network. A previous session's "Track all" mutated four real domains into
 * the demo workspace by skipping this distinction; this component reads
 * `useMovers()` and never calls anything that could persist.
 *
 * DOORWAY: every domain — in a row and in the "scaling fastest / pulled back
 * most" sentence — is a real `Link` to `/insights/discover?domain=<domain>`.
 * Track / Track all stay exactly what the file header above says: local
 * state and a toast, never a route.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDelta } from "@/creative-report-v2/lib/format";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { useMovers, type Mover } from "@/insights-dashboard/lib/selectors";

/** `/insights/discover?domain=<domain>`. */
function domainHref(domain: string): string {
  return `/insights/discover?domain=${encodeURIComponent(domain)}`;
}

function directionMeta(deltaPct: number) {
  if (deltaPct > 0) return { Icon: TrendingUp, tone: "up" as const };
  if (deltaPct < 0) return { Icon: TrendingDown, tone: "down" as const };
  return { Icon: Minus, tone: "flat" as const };
}

/** Signed delta + direction icon. Colour is layered on, never load-bearing. */
function DeltaTag({ deltaPct }: { deltaPct: number }) {
  const { Icon, tone } = directionMeta(deltaPct);
  const delta = fmtDelta(deltaPct);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums",
        tone === "up" && "text-primary-text",
        tone === "down" && "text-destructive",
        tone === "flat" && "text-muted-foreground",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      {delta.label}
    </span>
  );
}

function MoverRow({
  mover,
  maxAbsDeltaPct,
  tracked,
  onTrack,
}: {
  mover: Mover;
  maxAbsDeltaPct: number;
  tracked: boolean;
  onTrack: (domain: string) => void;
}) {
  const { tone } = directionMeta(mover.deltaPct);
  const barPct =
    maxAbsDeltaPct > 0
      ? Math.max(4, Math.round((Math.abs(mover.deltaPct) / maxAbsDeltaPct) * 100))
      : 0;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={domainHref(mover.domain)}
            title={`${mover.domain} — open in Discover`}
            className="min-w-0 truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            {mover.domain}
          </Link>
          <DeltaTag deltaPct={mover.deltaPct} />
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span title={mover.industry} className="truncate text-xs text-muted-foreground">
            {mover.industry}
          </span>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {mover.adCount30d.toLocaleString()} vs {mover.adCountPrev30d.toLocaleString()}
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className={cn(
              "h-full rounded-full",
              tone === "up" && "bg-primary-text/60",
              tone === "down" && "bg-destructive/60",
              tone === "flat" && "bg-muted-foreground/40",
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div className="w-[72px] shrink-0 text-right">
        {tracked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
            Tracked
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[11px]"
            onClick={() => onTrack(mover.domain)}
          >
            + Track
          </Button>
        )}
      </div>
    </li>
  );
}

export function MarketMovers({ className }: { className?: string }): JSX.Element {
  const {
    climbers, fallers, flat, top, bottom, maxAbsDeltaPct, summaryLine, windowLabel, isEmpty, isLoading,
  } = useMovers();

  // Local optimistic tracking only — never persisted, never a store write.
  const [trackedOverrides, setTrackedOverrides] = useState<Record<string, boolean>>({});

  // CHECK isLoading BEFORE `isEmpty`. `all` is `[]` in both `loading` and
  // "not enough history to compare yet" — a row-shaped skeleton keeps first
  // paint from claiming there's nothing to compare while we're still scanning.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Market movers</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Who's scaling, who's pulling back.</p>
          </div>
        </header>
        <ul className="divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="mt-1.5 h-1 w-full rounded-full" />
              </div>
              <Skeleton className="h-6 w-[72px] shrink-0" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const rows = [...climbers, ...fallers, ...flat];
  const isTracked = (mover: Mover) => mover.tracked || Boolean(trackedOverrides[mover.domain]);
  const untracked = rows.filter((mover) => !isTracked(mover));

  function handleTrack(domain: string) {
    setTrackedOverrides((prev) => (prev[domain] ? prev : { ...prev, [domain]: true }));
    toast.success(`Tracking ${domain}`, {
      description: "Added for this session only — nothing written to your workspace.",
    });
  }

  function handleTrackAll() {
    if (untracked.length === 0) return;
    const domains = untracked.map((mover) => mover.domain);
    setTrackedOverrides((prev) => {
      const next = { ...prev };
      for (const domain of domains) next[domain] = true;
      return next;
    });
    toast.success(`Tracking ${domains.length} ${domains.length === 1 ? "domain" : "domains"}`, {
      description: "Added for this session only — nothing written to your workspace.",
    });
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Market movers</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Who's scaling, who's pulling back.</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Provenance tier="derived" compact />
          {!isEmpty && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              disabled={untracked.length === 0}
              onClick={handleTrackAll}
            >
              Track all
            </Button>
          )}
        </div>
      </header>

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={TrendingUp}
          title="Not enough history to compare yet"
          description={`We measure change over two 30-day windows before ranking anyone here — that's different from saying nothing moved, it just means we haven't scanned twice a month apart yet. (${windowLabel}.)`}
        />
      ) : (
        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            {summaryLine} · {windowLabel}
          </p>
          {top && bottom && top.domain !== bottom.domain && (
            <p className="mb-2 text-xs text-muted-foreground">
              <Link
                to={domainHref(top.domain)}
                className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              >
                {top.domain}
              </Link>{" "}
              is scaling fastest at {fmtDelta(top.deltaPct).label};{" "}
              <Link
                to={domainHref(bottom.domain)}
                className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              >
                {bottom.domain}
              </Link>{" "}
              pulled back the most at {fmtDelta(bottom.deltaPct).label}.
            </p>
          )}

          <ul className="divide-y divide-border/60">
            {rows.map((mover) => (
              <MoverRow
                key={mover.domain}
                mover={mover}
                maxAbsDeltaPct={maxAbsDeltaPct}
                tracked={isTracked(mover)}
                onTrack={handleTrack}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
