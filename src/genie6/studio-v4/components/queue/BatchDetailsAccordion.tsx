import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Clock, Layers, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueBatch } from "../../types/queue";
import { QueueStatusPill } from "./QueueStatusPill";
import { QueueProgressBar } from "./QueueProgressBar";

interface BatchDetailsAccordionProps {
  batch: QueueBatch;
}

/**
 * BatchDetailsAccordion — collapsible config strip pinned ABOVE the results
 * in the V3 right pane. Closed-by-default: chevron toggle + title + status
 * pill + tiny meta row visible at rest; expanded reveals prompt + per-concept
 * breakdown + tag chips + submission timestamp.
 *
 * Why an accordion vs. a sticky strip:
 *   - Per-batch config differs (different prompts, concept counts, status).
 *     A sticky strip would eat permanent vertical space even when the user
 *     just wants to triage results.
 *   - Closed state keeps the right pane breathing-room-rich while preserving
 *     the most important signals (title + status).
 *
 * State (A-12.186): open/closed lives in the URL as `?details=open` so
 * refresh, deep-links, and back/forward all preserve the expanded view.
 * Single global flag — only one accordion renders at a time (the active
 * batch's), so when the user switches batches the state carries over.
 * Toggle uses `{ replace: true }` so back-button doesn't unwind through
 * every open/close.
 */
export function BatchDetailsAccordion({ batch }: BatchDetailsAccordionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("details") === "open";

  const toggleOpen = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (open) sp.delete("details");
        else sp.set("details", "open");
        return sp;
      },
      { replace: true },
    );
  }, [open, setSearchParams]);

  const submitted = batch.submittedAt;
  const submittedLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  }).format(submitted);

  return (
    <section
      className="border-b border-border/60 bg-background"
      aria-label="Batch details"
    >
      {/* Header row — always visible. Click anywhere on the row toggles. */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="batch-details-body"
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
          "hover:bg-muted/30",
        )}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-sans text-[15px] font-semibold leading-tight text-foreground">
              {batch.title}
            </h2>
            <QueueStatusPill status={batch.status} />
          </div>
          {/* At-rest meta row: concept count + time. The generation count
              moved into the progress bar below — keeps the meta row from
              competing with the live N/M signal. */}
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
            {batch.concepts && batch.concepts.length > 0 && (
              <>
                <span>{batch.concepts.length} concepts</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{submittedLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* Inline progress bar in the closed header — gives the user
              an at-a-glance N/M signal without expanding. Hide-count
              false so the "10/50"-style chip is the primary visual. */}
          <div className="w-[140px]">
            <QueueProgressBar batch={batch} size="inline" hideSpinner />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {open ? "Hide" : "Show"} details
          </span>
        </div>
      </button>

      {/* Expanded body — config grid */}
      {open && (
        <div
          id="batch-details-body"
          className="grid gap-4 border-t border-border/40 bg-muted/20 px-5 py-4 sm:grid-cols-2"
        >
          {/* Prompt block — full-width when prompt is long; primary
              context for what this batch was asking for. */}
          {batch.prompt && (
            <div className="sm:col-span-2">
              <DetailLabel icon={Wand2}>Prompt</DetailLabel>
              <p className="mt-1 rounded-md border border-border/40 bg-background px-3 py-2 font-sans text-[12px] leading-relaxed text-foreground/85">
                {batch.prompt}
              </p>
            </div>
          )}

          {/* Concepts breakdown — which concept rows this batch produced
              and how many variations per concept. */}
          {batch.concepts && batch.concepts.length > 0 && (
            <div>
              <DetailLabel icon={Layers}>Concepts</DetailLabel>
              <ul className="mt-1.5 space-y-1">
                {batch.concepts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between font-sans text-[12px] text-foreground/85"
                  >
                    <span>{c.label}</span>
                    <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                      {c.variationCount} variation{c.variationCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {batch.tags.length > 0 && (
            <div>
              <DetailLabel icon={Sparkles}>Tags</DetailLabel>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {batch.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-[18px] items-center rounded-full bg-background px-2 font-sans text-[10.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submission meta — full timestamp, status, id. Two columns
              when there's room, stacks on narrow. */}
          <div className="sm:col-span-2">
            <DetailLabel icon={Clock}>Submitted</DetailLabel>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] tabular-nums text-foreground/80">
              <span>
                {submitted.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="text-muted-foreground">
                batch id · {batch.id}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DetailLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
