/**
 * Industry Insights → Home: WatchingCard — compact rail of the user's
 * personal shortlist, backed by useWatchedSignals() (src/insights-home/lib/
 * watchingStore.ts).
 *
 * Each WatchedSignal carries the BOUNDED test-window text the trend already
 * had at save time (never a countdown, never a freshly-computed deadline —
 * Trends-doc language, Maalik's locked decision) plus when it was saved.
 * Clicking a row opens the same story it was saved from, via the exact
 * `?story=<id>` contract TrendsPage.tsx / TrendStoryOverlay already read —
 * so "Watch" here and "Open in Trends" on ActNowCard land in the same place.
 *
 * Card chrome (Card/CardContent, `space-y-3 p-4`, `text-sm font-semibold
 * text-foreground` heading) matches every other Home block in
 * src/pages/insights/InsightsOverview.tsx.
 */
import { useNavigate } from "react-router-dom";
import { Radar, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchedSignals, unwatchSignal, type WatchedSignal } from "@/insights-home/lib/watchingStore";
import { relativeTime } from "@/insights-trends/lib/trendsDisplay";

export function WatchingCard(): JSX.Element {
  const navigate = useNavigate();
  const { signals, loading } = useWatchedSignals();

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Watching</h2>
          {!loading && (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="font-semibold text-foreground">{signals.length}</span>{" "}
              {signals.length === 1 ? "story" : "stories"}
            </span>
          )}
        </div>

        {loading ? (
          <WatchingSkeleton />
        ) : signals.length === 0 ? (
          <WatchingEmpty />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {signals.map((signal) => (
              <WatchingRow
                key={signal.id}
                signal={signal}
                onOpen={() => navigate(`/insights/trends?story=${signal.id}`)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function WatchingRow({ signal, onOpen }: { signal: WatchedSignal; onOpen: () => void }) {
  return (
    <li className="group relative rounded-md border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40">
      {/* Stretched-link overlay opens the row; the headline button and the
          unwatch control are each promoted above it (z-index) so they keep
          receiving clicks directly and stay independently focusable — same
          pattern as TrendCard's stretched-link overlay. */}
      <span aria-hidden="true" onClick={onOpen} className="absolute inset-0 z-0 cursor-pointer" />

      <div className="flex items-start gap-3">
        <Radar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <button
            type="button"
            onClick={onOpen}
            className="relative z-10 truncate rounded-sm text-left text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {signal.title}
          </button>
          <p className="truncate text-xs text-muted-foreground">
            {signal.testWindow}
            <span aria-hidden="true"> · </span>
            Saved {relativeTime(signal.savedAt)}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={`Stop watching ${signal.title}`}
          className="relative z-10 h-7 w-7 shrink-0 opacity-60 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            unwatchSignal(signal.id);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function WatchingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Radar className="h-8 w-8 text-muted-foreground/40" aria-hidden />
      <p className="max-w-[220px] text-xs text-muted-foreground">
        Nothing saved yet — when a story has a test window worth tracking, watch it here.
      </p>
    </div>
  );
}

function WatchingSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default WatchingCard;
