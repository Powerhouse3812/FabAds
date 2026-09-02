/**
 * WhereToGo — "what you can do here", scannable.
 *
 * A table of contents for the module's six surfaces (My Feeds, Discover,
 * Saved Ads, Competitor, Domain, Trends), each as one row: label ·
 * description · count · link. Every count here is a figure another block on
 * this page already shows — this is navigation, not a second data source.
 *
 * Descriptions come from `NavSurfaceCount.description` (fixture
 * `NAV_SURFACE_META`) — Maalik's own words, one source of truth. Don't
 * hardcode a parallel copy map here; edit the fixture instead.
 *
 * `/insights/saved` is a `ComingSoonPage` stub in this repo today. Its count
 * is real (ads people have actually saved), so the row is not hidden or
 * faked — the link just currently lands on a placeholder page.
 */
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavOverview } from "@/insights-dashboard/lib/selectors";

const SECTION_LABEL =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70";

export function WhereToGo({ className }: { className?: string }): JSX.Element {
  const { surfaces, isLoading } = useNavOverview();

  // CHECK isLoading BEFORE reading counts — every surface's `count` reads
  // `null` while nothing has resolved yet, which is indistinguishable from a
  // real "we haven't scanned this yet" naReason. A skeleton keeps a cold load
  // from asserting six unearned "—" rows.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2">
          <h2 className={SECTION_LABEL}>Where to go</h2>
        </header>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1.5">
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="h-3.5 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-2">
        <h2 className={SECTION_LABEL}>Where to go</h2>
      </header>

      <div className="divide-y divide-border/60">
        {surfaces.map((surface) => {
          const description = surface.description;
          return (
            <Link
              key={surface.key}
              to={surface.href}
              title={`${description} — ${surface.count === null ? surface.naReason ?? surface.countLabel : `${surface.countLabel} ${surface.unitLabel}`}`}
              className="group flex items-center justify-between gap-3 rounded-sm py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <p className="min-w-0 truncate text-sm leading-tight">
                <span className="font-medium text-foreground">{surface.label}</span>
                <span className="text-foreground/70"> · {description}</span>
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums leading-tight",
                    surface.count === null ? "text-foreground/70" : "text-foreground",
                  )}
                >
                  {surface.countLabel}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
