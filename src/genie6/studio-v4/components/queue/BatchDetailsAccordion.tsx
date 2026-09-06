import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Clock, Layers, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { batchStatus, type RunBatch } from "@/genie6/lib/genieRunTypes";
import { QueueStatusPill } from "./QueueStatusPill";
import { QueueProgressBar } from "./QueueProgressBar";
import { approachLabel, groupItemsByConcept, modelLabel } from "./batchDisplay";

interface BatchDetailsAccordionProps {
  batch: RunBatch;
}

/**
 * BatchDetailsAccordion — collapsible config strip pinned ABOVE the results
 * in the V3 right pane (and below BatchActionsBar in V1/V2). Closed-by-default:
 * chevron toggle + title + status pill + tiny meta row visible at rest;
 * expanded reveals the config snapshot (§10: "Library detail can explain how
 * it was made") + concept breakdown + submission timestamp.
 *
 * §10 — Batch ID = Job ID, ONE identifier, "displayed above the batch": the
 * closed header always shows `batch.batchId` in mono, not just on expand.
 *
 * Why an accordion vs. a sticky strip:
 *   - Per-batch config differs (different prompts, concept counts, status).
 *     A sticky strip would eat permanent vertical space even when the user
 *     just wants to triage results.
 *   - Closed state keeps the right pane breathing-room-rich while preserving
 *     the most important signals (title + status + Batch ID).
 *
 * State (A-12.186): open/closed lives in the URL as `?details=open` so
 * refresh, deep-links, and back/forward all preserve the expanded view.
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

  const submitted = new Date(batch.createdAt);
  const submittedLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  }).format(submitted);

  const conceptGroups = groupItemsByConcept(batch.items);
  const c = batch.config;

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
              {batch.label}
            </h2>
            <QueueStatusPill status={batchStatus(batch)} />
          </div>
          {/* §10 — Batch ID displayed above the batch, mono, always visible
              (not gated behind expand). */}
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
            <span>{batch.batchId}</span>
            <span aria-hidden>·</span>
            {conceptGroups.length > 1 && (
              <>
                <span>{conceptGroups.length} concepts</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{submittedLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* Inline progress bar in the closed header — gives the user
              an at-a-glance N/M signal without expanding. */}
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
          {c?.promptSnippet && (
            <div className="sm:col-span-2">
              <DetailLabel icon={Wand2}>Prompt</DetailLabel>
              <p className="mt-1 rounded-md border border-border/40 bg-background px-3 py-2 font-sans text-[12px] leading-relaxed text-foreground/85">
                {c.promptSnippet}
              </p>
            </div>
          )}

          {/* Config snapshot — §10: "Library detail can explain how it was
              made". Shows exactly the fields RunBatch.config carries. */}
          {c && (
            <div>
              <DetailLabel icon={Sparkles}>How this was made</DetailLabel>
              <dl className="mt-1.5 space-y-1 font-sans text-[12px] text-foreground/85">
                {c.brandName && <ConfigRow term="Brand" value={c.brandName} />}
                {c.productName && <ConfigRow term="Product" value={c.productName} />}
                {c.format && (
                  <ConfigRow term="Format" value={c.format === "video" ? "Video" : "Image"} />
                )}
                {c.approach && <ConfigRow term="Approach" value={approachLabel(c.approach) ?? c.approach} />}
                {c.model && <ConfigRow term="Model" value={modelLabel(c.model) ?? c.model} />}
                {c.angle && <ConfigRow term="Angle" value={c.angle} />}
                {c.language && <ConfigRow term="Language" value={c.language} />}
                {c.aspectRatio && <ConfigRow term="Aspect ratio" value={c.aspectRatio} />}
              </dl>
            </div>
          )}

          {/* Concepts breakdown — which concept rows this batch produced
              and how many items per concept. */}
          {conceptGroups.length > 1 && (
            <div>
              <DetailLabel icon={Layers}>Concepts</DetailLabel>
              <ul className="mt-1.5 space-y-1">
                {conceptGroups.map((g) => (
                  <li
                    key={g.label}
                    className="flex items-center justify-between font-sans text-[12px] text-foreground/85"
                  >
                    <span>{g.label}</span>
                    <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                      {g.items.length} output{g.items.length === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submission meta — full timestamp + Batch ID again for anyone
              who expanded straight past the closed header. */}
          <div className="sm:col-span-2">
            <DetailLabel icon={Clock}>Submitted</DetailLabel>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] tabular-nums text-foreground/80">
              <span>
                {submitted.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="text-muted-foreground">batch id · {batch.batchId}</span>
              <span className="text-muted-foreground">{batch.credits} credits charged</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ConfigRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
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
