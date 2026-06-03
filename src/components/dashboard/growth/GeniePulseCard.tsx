import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { queueBatches } from "@/genie6/studio-v4/mocks/queue-batches";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import { resolveCompleted } from "@/genie6/studio-v4/types/queue";

const ROTATE_MS = 4000;

/**
 * GeniePulseCard — Growth dashboard widget that surfaces the latest Genie
 * activity in a single compact card. Two layers stacked:
 *
 *   1. ACTIVE QUEUE MARQUEE — rotating one-line view of the in-flight
 *      batches (only generating + queued + failed). Same grammar as the
 *      Library queue strip Marquee but dashboard-scaled.
 *
 *   2. RECENT GENERATIONS — horizontal strip of 6 latest output thumbnails
 *      (newest first), each ~48×60. Click → Library detail drawer via
 *      ?ad=<id> on /iq/genie6/library.
 *
 * Header carries a tiny "X in queue · Y done today" stat strip so the
 * card reads as a state-of-the-system glance, not a passive teaser.
 *
 * Compact target: ~140px tall, fits one of the two columns in the
 * Dashboard's "Genie activity" zone alongside GenieQuickStartCard.
 */
export function GeniePulseCard() {
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);

  const active = useMemo(
    () =>
      queueBatches.filter(
        (b) =>
          b.status === "generating" ||
          b.status === "queued" ||
          b.status === "failed",
      ),
    [],
  );

  const completedToday = useMemo(
    () =>
      queueBatches
        .filter((b) => b.status === "ready")
        .reduce((sum, b) => sum + resolveCompleted(b), 0),
    [],
  );

  const recent = useMemo(() => {
    // sampleOutputs is sorted oldest-first; take the last 6 reversed so
    // the dashboard reads "newest leftmost". Filter to ones with thumbnails
    // so the strip doesn't show placeholder boxes.
    return [...sampleOutputs]
      .filter((o) => Boolean(o.thumbnail))
      .slice(-6)
      .reverse();
  }, []);

  // Rotate the marquee through active batches.
  useEffect(() => {
    if (paused || active.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % active.length);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, active.length]);

  useEffect(() => {
    if (index >= active.length) setIndex(0);
  }, [active.length, index]);

  const currentBatch = active[Math.min(index, active.length - 1)];

  return (
    <section
      data-fabads-dash-widget="genie-pulse"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
      aria-label="Genie pulse"
    >
      {/* Header — title + stat strip + open library link */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Genie pulse
          </h3>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {active.length} in queue · {completedToday} done today
          </span>
        </div>
        <Link
          to="/iq/genie6/library"
          className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Library
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Active queue marquee — single rotating chip */}
      {currentBatch ? (
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex h-7 items-center gap-2 rounded-full border border-border/60 bg-background px-2.5"
        >
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            In flight
          </span>
          <span aria-hidden className="h-2.5 w-px bg-border/80" />
          <button
            type="button"
            key={currentBatch.id}
            onClick={() =>
              navigate(
                `/iq/genie6/studio-alpha/configure?queue=v3&batch=${currentBatch.id}`,
              )
            }
            className="group flex min-w-0 flex-1 items-center gap-2 text-left text-[11px]"
          >
            <span aria-hidden className="relative inline-flex h-1.5 w-1.5 shrink-0">
              {currentBatch.status === "generating" && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
              )}
              <span
                className={cn(
                  "relative inline-block h-1.5 w-1.5 rounded-full",
                  currentBatch.status === "generating" && "bg-primary",
                  currentBatch.status === "queued" && "bg-muted-foreground/60",
                  currentBatch.status === "failed" && "bg-destructive",
                )}
              />
            </span>
            <span className="min-w-0 truncate font-medium text-foreground">
              {currentBatch.title}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-foreground/80">
              {resolveCompleted(currentBatch)}/{currentBatch.generationCount}
            </span>
            {currentBatch.status === "generating" && (
              <Loader2
                className="h-2.5 w-2.5 shrink-0 animate-spin text-primary"
                aria-hidden
              />
            )}
          </button>
          {active.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % active.length)}
              aria-label="Next batch"
              className="shrink-0 rounded px-1 font-mono text-[9px] tabular-nums text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {(index % active.length) + 1}/{active.length}
            </button>
          )}
        </div>
      ) : (
        <div className="flex h-7 items-center gap-2 rounded-full border border-dashed border-border/60 px-2.5 text-[11px] text-muted-foreground">
          <Play className="h-3 w-3" />
          <span>Queue is clear</span>
        </div>
      )}

      {/* Recent generations — 6 thumbs */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent generations
        </p>
        <div className="flex gap-1.5">
          {recent.map((o) => (
            <Link
              key={o.id}
              to={`/iq/genie6/library?ad=${encodeURIComponent(o.id)}`}
              title={o.headline ?? o.brand?.name ?? "Generation"}
              className={cn(
                "group relative block h-14 w-12 shrink-0 overflow-hidden rounded-md bg-muted",
                "ring-1 ring-inset ring-border transition-all",
                "hover:-translate-y-px hover:ring-primary/40",
              )}
            >
              <img
                src={o.thumbnail}
                alt={o.headline ?? "Generation"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 flex items-end p-1",
                  "bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                <span className="font-mono text-[8px] uppercase tracking-wider text-white/90">
                  {o.brand?.name?.slice(0, 8) ?? "Ad"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
