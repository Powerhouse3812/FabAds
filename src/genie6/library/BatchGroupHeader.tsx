import { useState } from "react";
import { Check, Copy, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RunBatch, RetryScope } from "../lib/genieRunTypes";
import { batchStatus, batchDoneCount } from "../lib/genieRunTypes";
import { retry, creditsForRetry } from "../lib/genieRunStore";
import { formatCredits, creditsLabel } from "../lib/credits";
import { originLabel } from "./originLabels";
import { formatRelativeTime } from "./relativeTime";

const PROVENANCE_LABEL: Record<RunBatch["provenance"], string> = {
  "fabfunnel-seeded": "FabFunnel-seeded",
  "client-created": "Client-created",
};

/**
 * DS R2: "colorError / colorWarning / colorSuccess are FILL only. For text use
 * the `-text` variants. Base status as standalone text on light bg fails AA."
 *
 * These pills used the fill colours as their label colour — measured 2.17:1
 * for Done against a 4.5:1 floor, which is the exact number the design system
 * warns about. The fills and borders keep the g6 status tokens (they're
 * correct there); only the text moves to the WCAG-checked `-text` variants.
 * Those live in the shadcn-mapped layer rather than g6, and there is no
 * `g6-*-text` equivalent — using the existing accessible token beats adding a
 * parallel token family for one component.
 */
const STATUS_STYLES: Record<string, string> = {
  done: "bg-g6-success/10 border-g6-success/30 text-success-text",
  partial: "bg-g6-warning/10 border-g6-warning/30 text-warning-text",
  failed: "bg-g6-error/10 border-g6-error/30 text-error-text",
  cancelled: "bg-g6-bg-spotlight border-g6-border-secondary text-g6-text-secondary",
};

const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  partial: "Partial",
  failed: "Failed",
  cancelled: "Cancelled",
};

/**
 * BatchGroupHeader — §10 batch header for a TERMINAL batch (done / failed /
 * partial / cancelled). Running batches use the progress agent's
 * `BatchProgressHeader` instead (see BatchGroupedView) — §18: one pattern,
 * two systems must not exist, so this component never re-implements
 * progress UI, only the "here's what happened" summary once it's over.
 *
 * §10 fields: Batch ID (= Job ID, mono uppercase, above the batch), label,
 * relative date, output count, credits, source module, Created By,
 * provenance.
 * §21.3: retry granularity + "button copy states the credit consequence".
 */
export function BatchGroupHeader({ batch }: { batch: RunBatch }) {
  const status = batchStatus(batch);
  const [copied, setCopied] = useState(false);

  const copyBatchId = async () => {
    try {
      await navigator.clipboard.writeText(batch.batchId);
      setCopied(true);
      toast.success("Batch ID copied");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API can fail in insecure contexts — non-fatal.
    }
  };

  const doRetry = (scope: RetryScope) => {
    const credits = creditsForRetry(batch.batchId, scope);
    retry(batch.batchId, scope);
    toast.success(`Retrying — ${creditsLabel(credits)}`);
  };

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-g6-lg border border-g6-border-secondary bg-g6-bg-container px-4 py-3">
      <button
        type="button"
        onClick={copyBatchId}
        title="Copy Batch ID"
        className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-spotlight px-2.5 py-1 font-g6-mono text-[11px] font-bold uppercase tracking-[0.06em] text-g6-text transition-colors hover:border-g6-border"
      >
        {batch.batchId}
        {/* R2: status colours are fill-only. An ICON still needs 3:1, and lime-green
            on this ground doesn't reach it — the `-text` variant does. */}
        {copied ? <Check className="h-3 w-3 text-success-text" /> : <Copy className="h-3 w-3 text-g6-text-secondary" />}
      </button>

      <span
        className={cn(
          "inline-flex items-center rounded-g6-pill border px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em]",
          STATUS_STYLES[status],
        )}
      >
        {STATUS_LABEL[status]}
        {(status === "partial") && ` · ${batchDoneCount(batch)}`}
      </span>

      <span className="min-w-0 truncate font-g6-sans text-g6-sm font-semibold text-g6-text">{batch.label}</span>

      <span className="font-g6-mono text-[11px] text-g6-text-tertiary">{formatRelativeTime(batch.createdAt)}</span>

      <span aria-hidden className="h-3.5 w-px bg-g6-border-secondary" />

      <span className="font-g6-mono text-[11px] text-g6-text-secondary">
        {batch.items.length} {batch.items.length === 1 ? "output" : "outputs"}
      </span>
      <span className="font-g6-mono text-[11px] tabular-nums text-g6-text-secondary">
        {creditsLabel(batch.credits)}
      </span>

      <span aria-hidden className="h-3.5 w-px bg-g6-border-secondary" />

      <span className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-bg-spotlight px-2 py-0.5 font-g6-mono text-[10px] uppercase tracking-[0.05em] text-g6-text-secondary">
        {originLabel(batch.origin)}
      </span>
      <span className="inline-flex items-center gap-1 font-g6-mono text-[11px] text-g6-text-secondary">
        <User className="h-3 w-3" /> {batch.createdBy}
      </span>
      {/* text-tertiary measured 4.19:1 here — DS R9 says tertiary passes AA
          on bg-base, but this sits on a card ground, not bg-base. Secondary
          clears the floor and still reads as metadata. */}
      <span className="font-g6-mono text-[10px] uppercase tracking-[0.05em] text-g6-text-secondary">
        {PROVENANCE_LABEL[batch.provenance]}
      </span>

      {(status === "partial" || status === "failed" || status === "cancelled") && (
        <span className="ml-auto flex items-center gap-2">
          <RetryBtn label={`Retry all failed (${creditsLabel(creditsForRetry(batch.batchId, "all-failed"))})`} onClick={() => doRetry("all-failed")} />
          <RetryBtn label={`Retry whole batch (${creditsLabel(creditsForRetry(batch.batchId, "whole-batch"))})`} onClick={() => doRetry("whole-batch")} />
        </span>
      )}
    </header>
  );
}

function RetryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-2.5 font-g6-sans text-[11px] font-medium text-g6-text transition-colors hover:border-g6-border hover:bg-g6-bg-spotlight"
    >
      <RefreshCw className="h-3 w-3" />
      {label}
    </button>
  );
}
