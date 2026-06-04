import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutGrid, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewAdsFetchedTile } from "@/components/dashboard/ai-plan/NewAdsFetchedTile";
import { IndustryInsightsTile } from "@/components/dashboard/ai-plan/IndustryInsightsTile";
import { usePinnedInsightBoards } from "@/components/insights/use-pinned-insight-boards";
import { useInsightBoards } from "@/hooks/use-insight-boards";

/**
 * IndustryInsightsSection — Growth dashboard section that replaces the
 * legacy IndustryInsightsWidget. Composed of AI-plan tiles reused
 * verbatim plus a small pinned-boards strip footer:
 *
 *   1. NewAdsFetchedTile      — brand-grouped fresh-ad list (AI-plan hero)
 *   2. IndustryInsightsTile   — donut + trending keywords (AI-plan col-5)
 *   3. Pinned boards strip    — quick-jump chips, same source as the
 *                                sub-nav addon (usePinnedInsightBoards)
 *
 * Same no-card-in-card pattern as GenieSection: each child tile carries
 * its own rounded-2xl border; the section wrapper is a header bar +
 * vertical stack. The pinned-boards strip is a thin footer row inside
 * its own card so the visual rhythm matches the two AI-plan tiles above.
 *
 * Replaces (in Dashboard.tsx) the existing IndustryInsightsWidget mount
 * in the right column — the new section carries everything the old
 * widget did plus the latest Insights work (pinned boards, fresh-fetch
 * brand list, trending keywords).
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
      aria-label="Industry Insights"
      className="flex min-w-0 flex-col gap-3"
    >
      {/* Section header — bar, not a card. Mirrors GenieSection so the
          two surfaces feel like peers on the dashboard. */}
      <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Telescope className="h-4 w-4 text-foreground" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Industry Insights
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            · what the market shipped
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
        <NewAdsFetchedTile />
        <IndustryInsightsTile />

        {/* Pinned boards — thin card, matches the donut tile's chrome
            so the section reads as 3 ranked cards under one header.
            Hidden when zero pins so the section ends cleanly. */}
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
