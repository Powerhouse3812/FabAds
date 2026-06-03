import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LayoutGrid, Telescope, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePinnedInsightBoards } from "@/components/insights/use-pinned-insight-boards";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";

/**
 * InsightsPulseCard — Growth dashboard widget that surfaces the latest
 * Industry Insights signal in a single compact card. Sits alongside the
 * existing IndustryInsightsWidget (kept per Maalik) so the two together
 * cover both ad-trend and team-activity views of Insights.
 *
 * Two stacked layers:
 *
 *   1. PINNED BOARDS — up to 5 quick-jump chips, same source as the
 *      sub-nav addon (usePinnedInsightBoards + useInsightBoards). Click
 *      a chip → /insights/boards/<id>. Empty state shows a single
 *      "Pin boards to surface here" hint.
 *
 *   2. FOLLOW ACTIVITY — "X new ads from followed brands today" line
 *      with a CTA → /insights-v2/feed. Number is derived deterministically
 *      from DUMMY_ADS so the demo carries a meaningful count even
 *      without backend writes.
 *
 * Compact target: ~140px tall, fits the right column alongside the
 * existing IndustryInsightsWidget.
 */
export function InsightsPulseCard() {
  const { pinnedIds } = usePinnedInsightBoards();
  const { boards } = useInsightBoards();

  // Resolve pinned board IDs against the live list. Silent prune of
  // stale ids (board deleted) so the strip never points at nothing.
  const pinnedBoards = useMemo(() => {
    if (!boards) return [];
    return pinnedIds
      .map((id) => boards.find((b: any) => b.id === id))
      .filter((b: any): b is { id: string; name: string } => Boolean(b))
      .slice(0, 5);
  }, [pinnedIds, boards]);

  // Synthetic "new ads today" count — derived from DUMMY_ADS so the
  // dashboard always shows a meaningful number. In prod this would
  // come from a /insight-follows recent-activity query.
  const newAdsToday = useMemo(() => {
    // 1.5-3% of the dummy pool feels like "today's activity" relative
    // to a brand's overall presence. Deterministic so refresh is stable.
    return Math.floor(DUMMY_ADS.length * 0.022);
  }, []);

  return (
    <section
      data-fabads-dash-widget="insights-pulse"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
      aria-label="Industry Insights pulse"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Telescope className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Insights pulse
          </h3>
        </div>
        <Link
          to="/insights/boards"
          className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Boards
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Pinned boards strip */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pinned boards
        </p>
        {pinnedBoards.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-[11px] italic text-muted-foreground">
            Pin boards from the Insights sub-nav to surface them here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {pinnedBoards.map((b) => (
              <Link
                key={b.id}
                to={`/insights/boards/${b.id}`}
                className={cn(
                  "group inline-flex h-6 items-center gap-1.5 rounded-full border border-border/60 bg-background px-2",
                  "text-[11px] text-foreground transition-all",
                  "hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.04]",
                )}
              >
                <LayoutGrid
                  className="h-2.5 w-2.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="max-w-[120px] truncate font-medium">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Follow activity footer — quality signal */}
      <Link
        to="/insights-v2/feed"
        className={cn(
          "group -mx-1 -mb-1 mt-auto flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
          "border-t border-dashed border-border/60 hover:bg-muted/40",
        )}
      >
        <Users
          className="h-3 w-3 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">
            {newAdsToday}
          </span>{" "}
          new ads from followed brands today
        </span>
        <ArrowUpRight
          className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:-translate-y-px"
          aria-hidden
        />
      </Link>
    </section>
  );
}
