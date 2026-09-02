/**
 * MarketMovers — "Who's scaling, who's pulling back."
 *
 * Right-rail follow-set comparison: each row is one advertiser's 30-day
 * change in *live creative volume* measured against the 30 days before it —
 * never spend, never a proxy for it. The window is stated once via
 * `windowLabel` (mono-caps micro-line) so the period is never ambiguous.
 *
 * Scannable pass: one line per row — domain · proportional bar · signed % ·
 * +Track. The raw counts (`adCount30d` vs `adCountPrev30d`) that keep the
 * percentage from being a vanity number are NOT printed on the surface
 * anymore; they're a tooltip on the delta so they stay reachable without
 * costing a second line.
 *
 * Direction must never rely on colour alone: every row carries a lucide
 * direction icon (Up / Down / Minus) *and* the explicitly signed percentage
 * text. `text-primary-text` / `text-destructive` are layered on as a
 * secondary cue only — strip them and the row still reads correctly from
 * icon + sign alone.
 *
 * Track / Track all are LOCAL OPTIMISTIC UI ONLY — a `useState` map plus a
 * `sonner` toast. Nothing here writes to a shared store, Supabase, or the
 * network. A previous session's "Track all" mutated four real domains into
 * the demo workspace by skipping this distinction; this component reads
 * `useMovers()` and never calls anything that could persist.
 *
 * DOORWAY: every domain is a real `Link` to `/insights/discover?domain=<domain>`.
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

/** Rows shown on the dashboard teaser. Climbers first, then steepest fallers. */
const TEASER_ROW_CAP = 5;

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
function DeltaTag({ mover }: { mover: Mover }) {
  const { Icon, tone } = directionMeta(mover.deltaPct);
  const delta = fmtDelta(mover.deltaPct);
  return (
    <span
      title={`${mover.adCount30d.toLocaleString()} vs ${mover.adCountPrev30d.toLocaleString()} live ads (30d vs prior 30d)`}
      className={cn(
        "inline-flex w-14 shrink-0 items-center justify-end gap-1 font-mono text-xs font-semibold tabular-nums",
        tone === "up" && "text-primary-text",
        tone === "down" && "text-foreground",
        tone === "flat" && "text-foreground",
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
      ? Math.max(6, Math.round((Math.abs(mover.deltaPct) / maxAbsDeltaPct) * 100))
      : 0;

  return (
    <li className="flex items-center gap-2.5 py-1">
      <Link
        to={domainHref(mover.domain)}
        title={`${mover.domain} — ${mover.industry} — open in Discover`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
      >
        {mover.domain}
      </Link>

      <div className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
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

      <DeltaTag mover={mover} />

      <div className="w-16 shrink-0 text-right">
        {tracked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70">
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
  const { climbers, fallers, maxAbsDeltaPct, windowLabel, isEmpty, isLoading } = useMovers();

  // Local optimistic tracking only — never persisted, never a store write.
  const [trackedOverrides, setTrackedOverrides] = useState<Record<string, boolean>>({});

  // CHECK isLoading BEFORE `isEmpty`. `all` is `[]` in both `loading` and
  // "not enough history to compare yet" — a row-shaped skeleton keeps first
  // paint from claiming there's nothing to compare while we're still scanning.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Market movers
          </h2>
        </header>
        <ul className="divide-y divide-border/60">
          {Array.from({ length: TEASER_ROW_CAP }).map((_, i) => (
            <li key={i} className="flex items-center gap-2.5 py-1">
              <Skeleton className="h-3.5 min-w-0 flex-1" />
              <Skeleton className="h-1 w-12 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-14 shrink-0" />
              <Skeleton className="h-6 w-16 shrink-0" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const rows = [...climbers, ...fallers].slice(0, TEASER_ROW_CAP);
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
      <header className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          Market movers
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          <Provenance tier="derived" compact />
          {!isEmpty && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              disabled={untracked.length === 0}
              onClick={handleTrackAll}
            >
              Track all
            </Button>
          )}
        </div>
      </header>

      {isEmpty ? (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/70">
            {windowLabel}
          </p>
          <InsightsV2EmptyState
            icon={TrendingUp}
            title="Not enough history to compare yet"
            description="We measure change over two 30-day windows before ranking anyone here — we haven't scanned twice a month apart yet."
          />
        </>
      ) : (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/70">
            {windowLabel}
          </p>
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
