import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DispatchResult } from "@/launch2/types";

/**
 * Presentational launch-progress surface. Owns NO state — Step5Review drives it.
 *
 * The whole point of this component is to make the **failed ≠ launched**
 * accounting impossible to misread: the ring fills with `created` only, failed
 * items are explicitly labelled "not counted", and pending is muted. The
 * results list is fully attributable (metaId on success, reason on failure)
 * so every failure stays retryable.
 */
export interface LaunchProgressProps {
  total: number;
  created: number;
  failed: number;
  pending: number;
  results: DispatchResult[];
  running: boolean;
  onRetry?: () => void;
  onViewDetail?: () => void;
  onClose?: () => void;
}

const RING_SIZE = 132;
const RING_STROKE = 10;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function LaunchProgress({
  total,
  created,
  failed,
  pending,
  results,
  running,
  onRetry,
  onViewDetail,
  onClose,
}: LaunchProgressProps) {
  const safeTotal = Math.max(1, total);
  const createdPct = Math.min(1, created / safeTotal);
  const failedPct = Math.min(1 - createdPct, failed / safeTotal);
  const done = !running && pending <= 0;
  const allOk = done && failed === 0 && created === total;

  return (
    <div className="font-g6-sans">
      {/* Ring + counters */}
      <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Progress ring (created/total) */}
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-muted"
            />
            {/* failed arc (red) sits after the created arc */}
            {failed > 0 && (
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={RING_STROKE}
                stroke="#ff4d4f"
                strokeLinecap="butt"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - createdPct - failedPct)}
                style={{ transition: "stroke-dashoffset 300ms ease" }}
              />
            )}
            {/* created arc (green) */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              stroke="#52c41a"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - createdPct)}
              style={{ transition: "stroke-dashoffset 300ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {running ? (
              <Loader2 className="mb-1 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
            <span className="font-g6-mono text-2xl font-bold tabular-nums text-foreground">
              {created}
              <span className="text-base text-muted-foreground">/{total}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">live ads</span>
          </div>
        </div>

        {/* Counters + headline */}
        <div className="w-full">
          <p className="text-sm font-semibold text-foreground">
            {running
              ? "Launching… creating ads in batches"
              : allOk
              ? "All ads created"
              : failed > 0
              ? "Launch finished with failures"
              : "Launch finished"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Only ads that returned a Meta ID are live. Failures are <span className="font-medium text-foreground">not counted</span> and stay retryable — re-dispatch never double-creates.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CounterTile label="Created" value={created} tone="success" sub="live" />
            <CounterTile label="Failed" value={failed} tone="error" sub="not counted" />
            <CounterTile label="Pending" value={pending} tone="muted" sub="in queue" />
          </div>
        </div>
      </div>

      {/* Results log */}
      <div className="mt-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dispatch log
          </span>
          <span className="font-g6-mono text-[10px] text-muted-foreground">
            {results.length} of {total} processed
          </span>
        </div>
        {results.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Waiting for the first batch…
          </div>
        ) : (
          <ul className="max-h-64 overflow-y-auto divide-y divide-border/60">
            {results.map((r, i) => (
              <li key={`${r.id}-${i}`} className="flex items-center gap-2 px-3 py-2 text-xs">
                {r.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#52c41a]" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-[#ff4d4f]" />
                )}
                <span className="truncate font-medium text-foreground">{r.id}</span>
                {r.ok ? (
                  <span className="ml-auto shrink-0 font-g6-mono text-[10px] text-muted-foreground">
                    {r.metaId}
                  </span>
                ) : (
                  <span className="ml-auto shrink-0 text-right text-[hsl(var(--error-text))]">
                    {r.error ?? "Failed"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!done && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Working… actions unlock when the batch settles.
          </span>
        )}
        {done && failed > 0 && onRetry && (
          <Button onClick={onRetry} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <AlertTriangle className="h-4 w-4" />
            Retry {failed} failed only
          </Button>
        )}
        {done && onViewDetail && (
          <Button variant="outline" onClick={onViewDetail}>
            View launch detail
          </Button>
        )}
        {done && onClose && (
          <Button
            variant={failed > 0 ? "ghost" : "default"}
            onClick={onClose}
            className={cn(failed === 0 && "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            Done
          </Button>
        )}
      </div>

      {done && failed > 0 && (
        <p className="mt-3 text-xs text-[hsl(var(--warning-text))]">
          {failed} {failed === 1 ? "ad" : "ads"} did not launch. Retry re-runs only the failed items with the same idempotency key — the {created} live ads are untouched.
        </p>
      )}
    </div>
  );
}

function CounterTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "success" | "error" | "muted";
}) {
  const toneText =
    tone === "success"
      ? "text-[hsl(var(--success-text))]"
      : tone === "error"
      ? "text-[hsl(var(--error-text))]"
      : "text-muted-foreground";
  const dot =
    tone === "success" ? "bg-[#52c41a]" : tone === "error" ? "bg-[#ff4d4f]" : "bg-muted-foreground/50";
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <div className={cn("mt-1 font-g6-mono text-xl font-bold tabular-nums", toneText)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
