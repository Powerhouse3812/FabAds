/**
 * runViz — shared run-status visuals so Home rows, Launch Detail and Activity
 * render the SAME status pill + the SAME created/failed/pending progress bar.
 * Status fills use the FabFunnel status tokens (success / warning / error).
 */
import { cn } from "@/lib/utils";
import type { LaunchRun, LaunchRunStatus } from "../types";

const OK = "#52c41a";
const WARN = "#faad14";
const ERR = "#ff4d4f";

interface StatusMeta {
  label: string;
  color: string;
  /** subtle tinted bg for the pill */
  bg: string;
  pulse?: boolean;
}

export function statusMeta(status: LaunchRunStatus): StatusMeta {
  switch (status) {
    case "launching":
      return { label: "Launching", color: "#5B7611", bg: "rgba(143,184,33,0.14)", pulse: true };
    case "completed":
      return { label: "Completed", color: OK, bg: "rgba(82,196,26,0.12)" };
    case "partial":
      return { label: "Partial", color: WARN, bg: "rgba(250,173,20,0.14)" };
    case "failed":
      return { label: "Failed", color: ERR, bg: "rgba(255,77,79,0.12)" };
    case "scheduled":
      return { label: "Scheduled", color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" };
    case "queued":
    default:
      return { label: "Queued", color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" };
  }
}

export function StatusPill({ status, className }: { status: LaunchRunStatus; className?: string }) {
  const m = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        className,
      )}
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", m.pulse && "animate-pulse")}
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}

/** Tri-segment bar: created (green) · failed (red) · pending (muted). */
export function RunProgressBar({
  run,
  showCounts = true,
  className,
}: {
  run: Pick<LaunchRun, "requested" | "created" | "failed" | "pending">;
  showCounts?: boolean;
  className?: string;
}) {
  const total = Math.max(run.requested, 1);
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <div style={{ width: pct(run.created), backgroundColor: OK }} />
        <div style={{ width: pct(run.failed), backgroundColor: ERR }} />
      </div>
      {showCounts && (
        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
          <span style={{ color: OK }}>{run.created} created</span>
          {run.failed > 0 && <span style={{ color: ERR }}>{run.failed} failed</span>}
          {run.pending > 0 && <span>{run.pending} pending</span>}
          <span className="text-foreground/40">of {run.requested}</span>
        </div>
      )}
    </div>
  );
}
