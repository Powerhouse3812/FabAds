import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutGrid, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsHeroInsightsRow } from "@/components/dashboard/ai-plan/AnalyticsHero";
import { IndustryInsightsTile } from "@/components/dashboard/ai-plan/IndustryInsightsTile";
import { usePinnedInsightBoards } from "@/components/insights/use-pinned-insight-boards";
import { useInsightBoards } from "@/hooks/use-insight-boards";

/**
 * IndustryInsightsSection — Growth dashboard section replacing the legacy
 * IndustryInsightsWidget. Composed of AI-plan tiles reused verbatim,
 * led by numeric analytics (Maalik A-12.195 — "numeric analytics are
 * the more important data than recent new ads").
 *
 * Order is deliberate (most-important → least):
 *
 *   1. AnalyticsHeroInsightsRow — 4 KPI cards (Brands followed /
 *      Competitors / Total ads / Categories tracked). At-a-glance
 *      state of the Industry Insights side of the business.
 *
 *   2. IndustryInsightsTile — donut breakdown (Creatives vs Videos)
 *      + trending keywords. Numeric depth + signal of the market.
 *
 *   3. Pinned boards strip — quick-jump chips. Hidden when zero pins.
 *
 * Dropped from the previous version:
 *   - NewAdsFetchedTile (browse-y, the brand list is signal but it's
 *     a "what arrived" feed; the KPI row carries the totals).
 *
 * No card-in-card: each child carries its own rounded-2xl chrome.
 */
export function IndustryInsightsSection() {
  const { pinnedIds } = usePinnedInsightBoards();
  const { boards } = useInsightBoards();

  const pinnedBoards = useMemo(() => {
    if (!boards) return [];
    return pinnedIds
      .map((id) => boards.find((b: any) => b.id === id))
      .filter((b: any): b is { id: string; name: string } => Boolean(b))
      .slice(0, 5);
  }, [pinnedIds, boards]);

  return (
    <section
      data-fabads-dash-section="industry-insights"
      aria-label="Industry Insights analytics"
      className="flex min-w-0 flex-col gap-3"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Telescope className="h-4 w-4 text-foreground" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Industry Insights
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            · market at a glance
          </span>
        </div>
        <Link
          to="/insights-v2/feed"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open feed
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="flex flex-col gap-3">
        <AnalyticsHeroInsightsRow />
        <IndustryInsightsTile />

        {pinnedBoards.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <header className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                Pinned boards
              </span>
              <Link
                to="/insights/boards"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                All boards
              </Link>
            </header>
            <div className="flex flex-wrap gap-1.5">
              {pinnedBoards.map((b) => (
                <Link
                  key={b.id}
                  to={`/insights/boards/${b.id}`}
                  className={cn(
                    "group inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5",
                    "text-[11.5px] font-medium text-foreground transition-all",
                    "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
                  )}
                >
                  <LayoutGrid
                    className="h-3 w-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="max-w-[140px] truncate">{b.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
