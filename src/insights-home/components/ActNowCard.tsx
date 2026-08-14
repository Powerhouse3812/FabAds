/**
 * Industry Insights → Home: ActNowCard — "the single sharpest opportunity".
 *
 * Backed by useActNowSignal() (src/insights-home/lib/homeSelectors.ts), which
 * returns the whole TrendItem so this card can render its intelligence with
 * the SAME language and the SAME display helpers Trends itself uses
 * (src/insights-trends/lib/trendsDisplay.ts STAGE_META / RISK_META) — no
 * parallel copy, no drift between "what Home says" and "what Trends says"
 * about the identical trend.
 *
 * Trends-doc language (Maalik's locked decision) is non-negotiable here:
 *  - Recommended test window is a bounded range + rationale — NEVER a
 *    countdown, NEVER an "N hours left" badge.
 *  - Adaptation risk is a level + its specific reason — NEVER a generic
 *    Safe/Caution verdict.
 *  - No cross-source ranking/combined score is computed or implied; this
 *    card just surfaces the one TrendItem useActNowSignal() already picked.
 *
 * Actions:
 *  - "Open in Trends" → navigate(`/insights/trends?story=<id>`), the exact
 *    `?story=` contract TrendsPage.tsx / TrendStoryOverlay already read.
 *  - "Watch" → watchSignal()/unwatchSignal() from the Home-owned
 *    watchingStore (persisted, feeds WatchingCard) — deliberately NOT the
 *    same in-memory "watch" toggle TrendActionBar uses on Trends cards;
 *    those are two different concepts (Home's durable shortlist vs. a
 *    Trends-card session toggle) and this card owns the former.
 *  - Relevant / Not relevant → reuses TrendActions' existing setRelevance
 *    (module-level store + toast), the same feedback mechanism Trends cards
 *    already use — not a second parallel implementation.
 *
 * Card chrome (Card/CardContent, `space-y-3 p-4`, `text-sm font-semibold
 * text-foreground` heading) matches every other Home block in
 * src/pages/insights/InsightsOverview.tsx.
 */
import { useNavigate } from "react-router-dom";
import { Compass, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useActNowSignal } from "@/insights-home/lib/homeSelectors";
import { useWatchedSignals, watchSignal, unwatchSignal } from "@/insights-home/lib/watchingStore";
import { STAGE_META, RISK_META, SOURCE_META, relativeTime } from "@/insights-trends/lib/trendsDisplay";
import { useTrendActions } from "@/insights-trends/components/TrendActions";

/** Doc guardrail (same as TrendStoryOverlay's TextOrMissing) — an empty
 *  field renders an explicit missing state, never confident filler. */
function FieldText({ value, missing }: { value?: string | null; missing: string }) {
  const text = value?.trim();
  if (!text) return <p className="text-xs italic text-muted-foreground">{missing}</p>;
  return <p className="text-xs leading-relaxed text-foreground/90">{text}</p>;
}

export function ActNowCard(): JSX.Element {
  const navigate = useNavigate();
  const { signal, loading } = useActNowSignal();
  const { signals: watched } = useWatchedSignals();
  const { setRelevance } = useTrendActions();

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Act now</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The single sharpest opportunity from Trends right now.
          </p>
        </div>

        {loading ? (
          <ActNowSkeleton />
        ) : !signal ? (
          <ActNowEmpty onBrowse={() => navigate("/insights/trends")} />
        ) : (
          <ActNowBody
            item={signal}
            isWatched={watched.some((s) => s.id === signal.id)}
            onOpen={() => navigate(`/insights/trends?story=${signal.id}`)}
            onToggleWatch={() =>
              watched.some((s) => s.id === signal.id) ? unwatchSignal(signal.id) : watchSignal(signal)
            }
            onRelevant={() => setRelevance(signal.id, "relevant")}
            onNotRelevant={() => setRelevance(signal.id, "not_relevant")}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ActNowBody(props: {
  item: import("@/insights-trends/types").TrendItem;
  isWatched: boolean;
  onOpen: () => void;
  onToggleWatch: () => void;
  onRelevant: () => void;
  onNotRelevant: () => void;
}) {
  const { item, isWatched, onOpen, onToggleWatch, onRelevant, onNotRelevant } = props;
  const intel = item.intelligence;

  const source = SOURCE_META[item.type];
  const SourceIcon = source.icon;
  const stage = STAGE_META[intel.trendStage];
  const StageIcon = stage.icon;
  const risk = RISK_META[intel.adaptationRisk.level];
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-3">
      {/* Source + freshness */}
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <SourceIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="shrink-0 font-medium text-foreground/80">{source.label}</span>
        <span aria-hidden="true" className="shrink-0">
          ·
        </span>
        <span className="shrink-0">{relativeTime(item.publishedAt)}</span>
      </div>

      {/* Headline + why-it-matters */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-sm text-left text-sm font-semibold leading-snug text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background line-clamp-2"
        >
          {item.title}
        </button>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
      </div>

      {/* Trend stage */}
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          stage.className,
        )}
      >
        <StageIcon className="h-3 w-3" aria-hidden="true" />
        {stage.label}
      </span>

      {/* Recommended test window */}
      <div className="space-y-0.5 rounded-md border border-border/60 bg-muted/40 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recommended test window
        </p>
        <FieldText value={intel.testWindow} missing="No reliable window yet" />
        <FieldText value={intel.testWindowRationale} missing="No rationale available yet." />
      </div>

      {/* Adaptation risk */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Adaptation risk
        </p>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", risk.className)}>
          <RiskIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {risk.label}
        </span>
        <FieldText value={intel.adaptationRisk.reason} missing="No reason on file yet — treat as unverified." />
      </div>

      {/* Suggested first test */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested first test
        </p>
        <FieldText value={intel.suggestedFirstTest} missing="Not enough evidence yet." />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
        <Button size="sm" className="h-7 text-xs" onClick={onOpen}>
          Open in Trends
        </Button>
        <Button
          size="sm"
          variant={isWatched ? "secondary" : "outline"}
          aria-pressed={isWatched}
          className="h-7 text-xs"
          onClick={onToggleWatch}
        >
          {isWatched ? "Watching" : "Watch"}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Relevant"
            className="h-7 w-7"
            onClick={onRelevant}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Not relevant"
            className="h-7 w-7"
            onClick={onNotRelevant}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActNowEmpty({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <Compass className="h-8 w-8 text-muted-foreground/40" aria-hidden />
      <div className="max-w-sm">
        <h3 className="text-sm font-medium text-foreground">No standout opportunity right now</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Trends refreshes regularly — check back soon, or browse everything tracked today.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onBrowse}>
        Browse Trends
      </Button>
    </div>
  );
}

function ActNowSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-14 w-full rounded-md" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  );
}

export default ActNowCard;
