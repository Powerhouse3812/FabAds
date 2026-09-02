/**
 * TrendsSummary — the numbers-only teaser for `/insights/trends`.
 *
 * Maalik's ask, verbatim: "Trends ke only numbers dikha de, ki news me itni
 * updates, etc etc, and total new updates, last checked, etc value show kre,
 * so that user usko click krke jaye." No story cards, no headlines, no media
 * — counts per source, a total, a "new since last visit" figure, when it was
 * last checked, and a way in. The entire job of this block is to make the
 * user click through to Trends; it is a teaser, not a second copy of that
 * module's content.
 *
 * Three ways in, on purpose: the header link, each per-source count, and the
 * whole footer line all route to `href` (the per-source ones use their own
 * `href`, which is Trends filtered to that source). Nothing here duplicates
 * Trends' own reading experience — no excerpt, no thumbnail, no claim level.
 *
 * `newUpdates === null` always renders `newUpdatesNaReason` — never a bare
 * "—". A dash with no explanation reads as "broken", not "not tracked".
 */
import { Fragment } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import { useTrendsSummary } from "@/insights-dashboard/lib/selectors";

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";
const SOURCE_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-foreground/70";

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function TrendsSummary({ className }: { className?: string }): JSX.Element {
  const {
    sources,
    totalUpdates,
    newUpdates,
    newUpdatesNaReason,
    lastCheckedLabel,
    href,
    isLoading,
  } = useTrendsSummary();

  // `isLoading` is the only branch this block needs: per the data contract,
  // `isEmpty` is now `false` in every real state (Trends is market-wide —
  // Google Trends + news — and independent of what this user follows, so
  // its counts are real even in `firstTime`/`empty`). A dead `if (isEmpty)`
  // branch was removed rather than kept for show: the render below already
  // handles a genuine all-zero count set honestly (real numbers, including
  // "0", never a blank shell), so there's nothing left for that branch to
  // protect against. Loading still gets checked first and stays a skeleton
  // — loading and a real zero render identically otherwise and mean
  // opposite things.
  if (isLoading) {
    return (
      <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className={SECTION_LABEL}>Trends</h2>
        </header>
        <div className="mb-2 flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-12" />
          ))}
        </div>
        <div className="flex items-baseline gap-5">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-14" />
        </div>
        <Skeleton className="mt-2 h-3 w-1/2" />
      </section>
    );
  }

  return (
    <section className={cn("self-start rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2 className={SECTION_LABEL}>Trends</h2>
          <InfoTip tip="block.trends-summary" />
        </div>
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        >
          View all →
        </Link>
      </header>

      {/* Per-source counts — compact context, not the payoff. One row,
          literally: the full source set (6, fixed order) is wider than a
          4-col slot at real label lengths, so this scrolls horizontally
          instead of wrapping to a second line — a wrapped grid is what
          blew this block's height past its ~160px budget. Each count links
          straight to that source's Trends view. */}
      <div className="mb-2 flex items-center gap-4 overflow-x-auto">
        {sources.map((source, index) => {
          const link = (
            <Link
              to={source.href}
              className="shrink-0 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <p className="text-sm font-semibold leading-none tabular-nums text-foreground hover:underline">
                {formatInt(source.count)}
              </p>
              <p className={cn(SOURCE_LABEL, "mt-0.5 whitespace-nowrap")}>{source.label}</p>
            </Link>
          );
          // One tip explains the source-row concept for all six — not six
          // separate tips on six identical-shaped counts. Carried by the
          // first source's own link (an action control, so it IS the
          // trigger — no added glyph) rather than a duplicated caption.
          if (index === 0) {
            return (
              <InfoTip key={source.key} tip="metric.trends-source-count" asChild>
                {link}
              </InfoTip>
            );
          }
          return <Fragment key={source.key}>{link}</Fragment>;
        })}
      </div>

      {/* The headline pair — heavier than the source row above, because this
          is the reason to click, not the source breakdown. */}
      <div className="flex items-baseline gap-5">
        <div>
          <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
            {formatInt(totalUpdates)}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <p className={SECTION_LABEL}>Total updates</p>
            <InfoTip tip="metric.trends-total-updates" />
          </div>
        </div>
        <div>
          {newUpdates === null ? (
            <p className="max-w-[180px] text-xs font-medium leading-tight text-foreground/70">
              {newUpdatesNaReason}
            </p>
          ) : (
            <p className="text-xl font-semibold leading-none tabular-nums text-foreground">
              {formatInt(newUpdates)}
            </p>
          )}
          <div className="mt-0.5 flex items-center gap-1">
            <p className={SECTION_LABEL}>New updates</p>
            <InfoTip tip="metric.trends-new-updates" />
          </div>
        </div>
      </div>

      <p className="mt-2 border-t border-border pt-1.5 text-[11px] leading-snug text-foreground/70">
        {lastCheckedLabel}
      </p>
    </section>
  );
}
