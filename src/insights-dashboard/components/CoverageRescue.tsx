/**
 * CoverageRescue — the most important block on the page in `thin` / `zero`.
 *
 * In `thin`, the user follows exactly one industry ("Credit Repair") and we
 * have 0 ads indexed for it. In `zero` they follow nothing. This block
 * replaces the gallery, the change feed, the charts and the domains table in
 * those states — it is what a new user actually sees, and most products
 * would render an empty grid here and let the user conclude the product is
 * broken.
 *
 * THE DISTINCTION THIS BLOCK EXISTS TO MAKE: 0 indexed ads in a followed
 * industry is a gap on OUR side (we have not scanned it yet) — never proof
 * that the market itself is empty. `gapNote` states that in words; `adjacent`
 * proves it with real counts from neighbouring industries we HAVE indexed,
 * each with a stated `reason`. The numbers are the argument.
 *
 * Never rendered as an apology, never blaming the market.
 */
import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  CircleDashed,
  Loader2,
  type LucideIcon,
  Radar,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  SCAN_STATE_LABELS,
  useCoverage,
  type AdjacentIndustry,
  type FollowedIndustry,
} from "@/insights-dashboard/lib/selectors";

/** `FollowedIndustry["scanState"]` isn't re-exported on its own — derive it. */
type ScanState = FollowedIndustry["scanState"];

function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}

const SCAN_STATE_ICON: Readonly<Record<ScanState, LucideIcon>> = {
  indexed: CheckCircle2,
  scanning: Loader2,
  "not-started": CircleDashed,
};

/**
 * A pending scan must read as a visible, meaningful state — never as missing
 * data, or correct backend behaviour looks like a bug. Icon + label only, no
 * colour-coding (design system rule): all three render on the same neutral
 * `bg-muted` pill.
 */
function ScanStateBadge({ state }: { state: ScanState }) {
  const Icon = SCAN_STATE_ICON[state];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
      <Icon className={cn("h-2.5 w-2.5", state === "scanning" && "animate-spin")} aria-hidden="true" />
      {SCAN_STATE_LABELS[state]}
    </span>
  );
}

function FollowedRow({ item }: { item: FollowedIndustry }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">{item.industry}</span>
        <ScanStateBadge state={item.scanState} />
      </div>
      <div className="grid grid-cols-3 gap-x-4 tabular-nums sm:flex sm:items-baseline sm:gap-4">
        <div className="flex flex-col sm:items-end">
          <span className="text-sm font-semibold text-foreground">{formatInt(item.indexedAds)}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70">
            Indexed ads
          </span>
        </div>
        <div className="flex flex-col sm:items-end">
          <span className="text-sm font-semibold text-foreground">{formatInt(item.advertisers)}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70">
            Advertisers
          </span>
        </div>
        <div className="flex flex-col sm:items-end">
          <span className="text-sm font-semibold text-foreground">
            {item.lastScanDaysAgo === null ? "Never" : `${item.lastScanDaysAgo}d ago`}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70">
            Last scan
          </span>
        </div>
      </div>
    </div>
  );
}

function AdjacentRow({
  item,
  isFollowing,
  onFollow,
}: {
  item: AdjacentIndustry;
  isFollowing: boolean;
  onFollow: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.industry}</p>
        <p className="text-xs text-foreground/70">{item.reason}</p>
      </div>
      <div className="flex items-center gap-4 sm:shrink-0">
        <div className="flex items-baseline gap-4 tabular-nums">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">{formatInt(item.liveAds)}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70">
              Live ads
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">{formatInt(item.advertisers)}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/70">
              Advertisers
            </span>
          </div>
        </div>
        {isFollowing ? (
          <Button size="sm" variant="secondary" disabled className="shrink-0 gap-1.5">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Following
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="shrink-0" onClick={onFollow}>
            Follow
          </Button>
        )}
      </div>
    </div>
  );
}

export function CoverageRescue({ className }: { className?: string }): JSX.Element {
  const coverage = useCoverage();
  const [followingSet, setFollowingSet] = useState<ReadonlySet<string>>(() => new Set());

  function handleFollow(item: AdjacentIndustry) {
    if (followingSet.has(item.industry)) return;
    setFollowingSet((prev) => new Set(prev).add(item.industry));
    toast.success(`Following ${item.industry}`, {
      description: `${formatInt(item.liveAds)} live ads already indexed — nothing to wait on.`,
    });
  }

  // CHECK isLoading BEFORE `hasGap`. `coverage.adjacent` is `[]` and
  // `gapNote` is `null` in `loading` — falling through to the `!hasGap`
  // branch below would print "0 of 105 industries followed" as if that were
  // a known fact, when it's really "we haven't asked yet." Suggestions are
  // only credible with real counts attached, so this renders a skeleton
  // rather than an empty rescue list.
  if (coverage.isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Coverage</h2>
        </header>
        <Skeleton className="mb-4 h-10 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-40" />
          <div className="divide-y divide-border/60 rounded-md border border-border/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3">
          <Skeleton className="h-1.5 flex-1 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </section>
    );
  }

  // populated (or any state where coverage is healthy): the page won't mount
  // this block, but stay safe and quiet if it does — no gap note, no rescue
  // list, just the coverage line so the card never looks broken if it lands
  // in a layout slot.
  if (!coverage.hasGap) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Coverage</h2>
          <Provenance tier="observed" compact />
        </header>
        <div className="flex items-center gap-3">
          <Progress value={coverage.coveragePct} className="h-1.5 flex-1" />
          <span className="shrink-0 text-xs text-foreground/70">{coverage.coverageLabel}</span>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Coverage</h2>
        <Provenance tier="observed" compact />
      </header>

      {/* The honest headline — stated plainly, never an apology, never
          blaming the market. */}
      {coverage.gapNote && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-muted/40 p-3">
          <Radar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium leading-snug text-foreground">{coverage.gapNote}</p>
        </div>
      )}

      {/* What you follow — omitted entirely in zero, where there's nothing
          followed yet. */}
      {coverage.followed.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            What you follow
          </h3>
          <div className="space-y-2">
            {coverage.followed.map((item) => (
              <FollowedRow key={item.industry} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Adjacent industries — the rescue itself. Real counts prove the
          suggestion; Follow takes effect immediately, no scan required. */}
      <div className="space-y-2">
        <h3 className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
          {coverage.adjacentHeading}
        </h3>
        <div className="divide-y divide-border/60 rounded-md border border-border/60">
          {coverage.adjacent.map((item) => (
            <AdjacentRow
              key={item.industry}
              item={item}
              isFollowing={followingSet.has(item.industry)}
              onFollow={() => handleFollow(item)}
            />
          ))}
        </div>
      </div>

      {/* Coverage summary. */}
      <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3">
        <Progress value={coverage.coveragePct} className="h-1.5 flex-1" />
        <span className="shrink-0 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70 tabular-nums">
          {coverage.coverageLabel}
        </span>
      </div>
    </section>
  );
}
