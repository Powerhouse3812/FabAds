import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Check, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopMovers, type TopMover } from "@/insights-home/lib/homeSelectors";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { markCompetitorAdded } from "@/lib/insights-setup";
import { toast } from "sonner";

/**
 * TopMoversCard — "This week"'s five domains with the biggest 30-day
 * ad-volume swing, each a labelled bar (domain + industry + signed %).
 *
 * Rising vs falling is NEVER colour-alone: every row pairs an
 * ArrowUpRight/ArrowDownRight icon with an explicit sign, mirroring the
 * same growing/declining pairing STAGE_META already uses in
 * src/insights-trends/lib/trendsDisplay.ts (bg-primary/10 text-primary for
 * the rising read, bg-muted text-muted-foreground for the falling read) —
 * reused here as plain class strings rather than a second lookup table,
 * since TopMover's signed changePct isn't a TrendStage.
 *
 * This block exists to convert a followed industry into a tracked
 * competitor, so the foot action is the prominent element: "Track all
 * movers to benchmark them" adds every untracked mover as a domain
 * competitor in one batch (existing addCompetitor mutation +
 * markCompetitorAdded from the setup checklist), then toasts a summary.
 * A mover already tracked gets a quiet "Tracked" tag on its row instead of
 * being included in that batch, and if every mover is already tracked the
 * foot action itself is replaced by a quiet confirmation — never a
 * disabled button.
 */
export function TopMoversCard(): JSX.Element {
  const { movers, loading } = useTopMovers(5);
  const { addCompetitor } = useInsightCompetitors();
  const [submitting, setSubmitting] = useState(false);

  const untracked = movers.filter((m) => !m.tracked);
  const maxAbs = Math.max(1, ...movers.map((m) => Math.abs(m.changePct)));

  async function handleTrackAll() {
    if (!untracked.length || submitting) return;
    setSubmitting(true);
    let succeeded = 0;
    for (const mover of untracked) {
      try {
        await addCompetitor.mutateAsync({
          name: mover.domain,
          competitor_type: "domain",
          identifier: mover.domain,
        });
        succeeded++;
      } catch {
        // Keep going through the rest of the batch — the toast below
        // reports the partial count so the user knows what still needs a
        // retry rather than silently losing the remainder.
      }
    }
    setSubmitting(false);
    if (succeeded > 0) markCompetitorAdded();

    if (succeeded === untracked.length) {
      toast.success(`Added ${succeeded} mover${succeeded === 1 ? "" : "s"} to Competitors`);
    } else if (succeeded > 0) {
      toast.warning(
        `Added ${succeeded} of ${untracked.length} movers — retry the rest from Competitors`,
      );
    } else {
      toast.error("Failed to add movers");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Top movers</h2>
          <p className="text-xs text-muted-foreground">30-day ad-volume change</p>
        </div>

        {loading ? (
          <TopMoversSkeleton />
        ) : movers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <LineChart className="h-8 w-8 text-muted-foreground/40" aria-hidden />
            <div className="max-w-sm">
              <h3 className="text-sm font-medium text-foreground">No movers yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Ad-volume changes will show up here once your followed industries have activity
                to compare.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              {movers.map((mover) => (
                <MoverRow key={mover.id} mover={mover} maxAbs={maxAbs} />
              ))}
            </ul>

            {untracked.length > 0 ? (
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  {untracked.length} of {movers.length} movers aren't tracked yet.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleTrackAll}
                  disabled={submitting}
                >
                  {submitting ? "Adding…" : "Track all movers to benchmark them"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" aria-hidden />
                All top movers are already tracked
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MoverRow({ mover, maxAbs }: { mover: TopMover; maxAbs: number }) {
  const rising = mover.changePct >= 0;
  const magnitude = Math.abs(mover.changePct);
  const widthPct = Math.max(6, Math.round((magnitude / maxAbs) * 100));

  return (
    <li className="rounded-md border border-border/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{mover.domain}</p>
          <p className="truncate text-xs text-muted-foreground">{mover.industry}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-xs font-semibold",
              rising ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {rising ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3 w-3" aria-hidden />
            )}
            {rising ? "+" : "-"}
            {magnitude}%
          </span>
          {mover.tracked && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Tracked
            </span>
          )}
        </div>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
        role="img"
        aria-label={`${mover.domain} ${rising ? "up" : "down"} ${magnitude}%`}
      >
        <div
          className={cn("h-full rounded-full", rising ? "bg-primary" : "bg-muted-foreground/50")}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </li>
  );
}

function TopMoversSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border/60 px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default TopMoversCard;
