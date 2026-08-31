import { Link } from "react-router-dom";
import { Compass, TrendingUp, Eye, Bookmark, Layers, ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightBoards, useSavedAdIds } from "@/hooks/use-insight-boards";
import { ALL_TRENDS } from "@/insights-trends/mocks/trendsData";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";

/**
 * ModuleRouterCard — "What you can do here".
 *
 * Maalik's #1 requested block for the Industry Insights home page
 * (src/pages/insights/InsightsOverview.tsx). One row per Industry Insights
 * surface; each row names the QUESTION that surface answers (not a feature
 * description), a live count, and navigates on click/Enter.
 *
 * Deliberately excludes Domains — Domains lives inside Competitor, and the
 * Trends doc bans a Domains nav dependency.
 *
 * Counts are read-only off data that already exists elsewhere in the app:
 *   - Trends    → ALL_TRENDS.length (src/insights-trends/mocks/trendsData.ts)
 *   - Discover  → DUMMY_ADS.length (src/lib/insights-dummy-data.ts)
 *   - Competitor→ useInsightCompetitors() — same hook InsightsOverview uses
 *   - Saved Ads → useSavedAdIds() — the Map already powering the bookmark
 *     icon on ad cards in Discover/Feed/CompetitorAdsTab; its size is the
 *     count of distinct ads saved to any board.
 *   - Board     → useInsightBoards() — same hook InsightsOverview uses
 *
 * A zero count reads as an invitation (muted colour, no error styling) —
 * never a warning. Each row is a single focusable Link (no nested button),
 * so Tab reaches it once with a visible focus ring.
 */

type ModuleRow = {
  key: string;
  label: string;
  question: string;
  to: string;
  icon: LucideIcon;
  count: number | null;
};

export function ModuleRouterCard(): JSX.Element {
  const { competitors, isLoading: competitorsLoading } = useInsightCompetitors();
  const { boards, isLoading: boardsLoading } = useInsightBoards();
  const { data: savedAdIds, isLoading: savedLoading } = useSavedAdIds();

  const rows: ModuleRow[] = [
    {
      key: "trends",
      label: "Trends",
      question:
        "What's about to happen — breakouts, format waves and policy shifts, with a window to act.",
      to: "/insights/trends",
      icon: TrendingUp,
      count: ALL_TRENDS.length,
    },
    {
      key: "discover",
      label: "Discover",
      question: "Every live ad in your industries. Filter by angle, format, longevity.",
      to: "/insights/discover",
      icon: Compass,
      count: DUMMY_ADS.length,
    },
    {
      key: "competitor",
      label: "Competitor",
      question: "Full analysis of one advertiser — ad history, angle mix, landing pages.",
      to: "/insights/competitors",
      icon: Eye,
      count: competitorsLoading ? null : competitors.length,
    },
    {
      key: "saved",
      label: "Saved Ads",
      question: "Anything you bookmarked, ready to reference or brief.",
      to: "/insights/saved",
      icon: Bookmark,
      count: savedLoading ? null : (savedAdIds instanceof Map ? savedAdIds.size : 0),
    },
    {
      key: "board",
      label: "Board",
      question: "Group creatives into a swipe file and hand it to a designer.",
      to: "/insights/boards",
      icon: Layers,
      count: boardsLoading ? null : boards.length,
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">What you can do here</h2>

        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <ModuleRouterRow key={row.key} row={row} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ModuleRouterRow({ row }: { row: ModuleRow }) {
  const Icon = row.icon;
  const isZero = row.count === 0;

  return (
    <li>
      <Link
        to={row.to}
        className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{row.label}</p>
          <p className="truncate text-xs text-muted-foreground">{row.question}</p>
        </div>
        {row.count === null ? (
          <Skeleton className="h-5 w-8 shrink-0 rounded" />
        ) : (
          <span
            className={
              isZero
                ? "shrink-0 font-mono text-xs text-muted-foreground/70"
                : "shrink-0 font-mono text-xs font-medium text-foreground"
            }
          >
            {row.count}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
      </Link>
    </li>
  );
}

export default ModuleRouterCard;
