import { useNavigate, Link } from "react-router-dom";
import {
  Check,
  Circle,
  Compass,
  Rss,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightsSetupState } from "@/lib/insights-setup";
import { useInsightsDigest, type InsightsDigestRow } from "@/lib/insights-digest";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightBoards } from "@/hooks/use-insight-boards";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";

/**
 * InsightsOverview — the Industry Insights module's own landing page.
 * Routed at /insights/overview (App.tsx) and the FIRST sub-item of the
 * Industry Insights sub-nav (src/components/sidebar/modules.ts).
 *
 * Three permanent sections:
 *   1. Setup checklist — only while !setup.complete. Same 3 items/routes as
 *      the Dashboard's InsightsJourneyCard (src/components/dashboard/growth/
 *      InsightsJourneyCard.tsx) so the two surfaces never disagree about
 *      what "done" means.
 *   2. "This week" digest — permanent. Post-setup this card is the page's
 *      hero; pre-setup (zero-data) it shows an invitation empty state.
 *   3. Stats strip — competitors / boards / industries / brands, all
 *      zero-safe reads off hooks already fetched above (no extra queries).
 *
 * Mock-first: no new Supabase reads. useInsightsSetupState/useInsightsDigest
 * already wrap the existing use-insight-* hooks read-only; this page adds
 * no new writes at all.
 */

// Keep in sync with InsightsJourneyCard's DIGEST_ICONS — same kind → icon
// mapping so a row reads the same whether it's seen on the Dashboard teaser
// or here on the full page.
const DIGEST_ICONS: Record<InsightsDigestRow["kind"], LucideIcon> = {
  competitor: Users,
  trend: TrendingUp,
  feed: Rss,
  "top-ad": Star,
};

type ChecklistRow = {
  key: string;
  done: boolean;
  label: string;
  ctaLabel: string;
  to: string;
};

export default function InsightsOverview() {
  const navigate = useNavigate();
  const setup = useInsightsSetupState();
  const { rows: digestRows, loading: digestLoading } = useInsightsDigest(8);
  const { competitors, isLoading: competitorsLoading } = useInsightCompetitors();
  const { boards, isLoading: boardsLoading } = useInsightBoards();
  const { preferences, isLoading: prefsLoading, followedBrands } = useInsightPreferences();

  const showChecklist = !setup.loading && !setup.complete;

  return (
    <div className="v3-page-mesh space-y-4 p-3">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your Industry Insights snapshot — competitors, trends, and what's new this week.
        </p>
      </div>

      {setup.loading ? (
        <SetupChecklistSkeleton />
      ) : showChecklist ? (
        <SetupChecklistCard state={setup} navigate={navigate} />
      ) : null}

      <DigestCard rows={digestRows} loading={digestLoading} navigate={navigate} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Industries selected"
          value={prefsLoading ? null : (preferences?.industries?.length ?? 0)}
        />
        <StatTile
          label="Competitors tracked"
          value={competitorsLoading ? null : competitors.length}
        />
        <StatTile label="Boards" value={boardsLoading ? null : boards.length} />
        <StatTile
          label="Brands followed"
          value={prefsLoading ? null : followedBrands.length}
        />
      </div>
    </div>
  );
}

// ── Setup checklist ─────────────────────────────────────────────────

function SetupChecklistCard({
  state,
  navigate,
}: {
  state: ReturnType<typeof useInsightsSetupState>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const progressPct = Math.round((state.doneCount / state.total) * 100);

  const rows: ChecklistRow[] = [
    {
      key: "prefs",
      done: state.prefsSet,
      label: "Pick your industries",
      ctaLabel: "Pick",
      to: "/insights-v2/feed?modal=prefs",
    },
    {
      key: "competitor",
      done: state.competitorAdded,
      label: "Track a competitor",
      ctaLabel: "Track",
      to: "/insights/competitors?modal=add",
    },
    {
      key: "ad",
      done: state.adSaved,
      label: "Save an ad to a board",
      ctaLabel: "Save",
      to: "/insights-v2/feed",
    },
  ];

  return (
    <Card className="border-primary/30 bg-primary/[0.02]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Finish setting up</h2>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold text-foreground">{state.doneCount}</span> of{" "}
            {state.total} ready
          </span>
        </div>

        <div
          className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Industry Insights setup progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              {row.done ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} aria-hidden />
                </span>
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-foreground/30" strokeWidth={1.75} aria-hidden />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  row.done ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {row.label}
              </span>
              {!row.done && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 text-xs"
                  onClick={() => navigate(row.to)}
                  // Visible label lives in the sibling span — name the task
                  // for screen readers rather than announcing bare "Pick".
                  aria-label={`${row.ctaLabel} — ${row.label}`}
                >
                  {row.ctaLabel}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SetupChecklistSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-[3px] w-full rounded-full" />
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              <Skeleton className="h-3 flex-1 rounded" />
              <Skeleton className="h-7 w-12 shrink-0 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── "This week" digest — permanent hero once setup is done ─────────

function DigestCard({
  rows,
  loading,
  navigate,
}: {
  rows: InsightsDigestRow[];
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">This week</h2>

        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] w-full rounded-md" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Compass className="h-8 w-8 text-muted-foreground/40" aria-hidden />
            <div className="max-w-sm">
              <h3 className="text-sm font-medium text-foreground">Set your feed preferences</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Tell us which industries and brands you care about and we'll surface what's new
                here every week.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/insights-v2/feed?modal=prefs")}>
              Set preferences
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((row) => {
              const Icon = DIGEST_ICONS[row.kind];
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{row.title}</p>
                    {row.meta && (
                      <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
                    )}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 text-xs"
                  >
                    <Link to={row.to}>{row.actionLabel}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stats strip ──────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {value === null ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
