/**
 * SourceNode — the trigger node ("Creative Report").
 *
 * Exactly one of these exists per graph (`canAddKind` in model.ts enforces
 * it). It has no input — a trigger starts a workflow, it never receives one —
 * so it renders a single source handle on its right edge only.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Radio, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_KIND_META, describeNode, type WorkflowNodeData } from "@/automations/model";
import { useNodeRunStatus } from "@/automations/canvas/runStatusContext";

export const SourceNode = memo(function SourceNode({ id, data, selected }: NodeProps) {
  // react-flow's node `data` is a loose Record<string, unknown> by design (it
  // has to hold every node kind's shape). This is the single narrowing point
  // for this component — everything below trusts `nodeData` as a real
  // `source` payload.
  const nodeData = data as unknown as Extract<WorkflowNodeData, { kind: "source" }>;
  const status = useNodeRunStatus(id);
  const meta = NODE_KIND_META.source;
  const summary = describeNode(nodeData);

  // Ring colour precedence: `selected` always wins over the running pulse (a
  // node the user has selected must read as selected even mid-run), so only
  // one `ring-*` colour class is ever present at a time — stacking two
  // differently-coloured `ring-2` utilities relies on stylesheet order, not
  // class order, and is not something to depend on for a status signal.
  const ringClass = selected
    ? "ring-2 ring-ring"
    : status === "running"
      ? "ring-2 ring-primary/40 animate-pulse"
      : "";

  return (
    <div
      className={cn(
        "relative w-[210px] rounded-lg border bg-card px-3 py-2.5 text-xs text-card-foreground shadow-sm",
        status === "running" ? "border-primary" : "border-border",
        status === "skipped" && "opacity-60",
        ringClass,
      )}
    >
      {status === "done" && (
        <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card">
          <Check className="h-3.5 w-3.5 text-primary-text" strokeWidth={2.5} />
        </div>
      )}

      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Radio className="h-3 w-3" />
        {meta.family}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{meta.label}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground" title={summary}>
        {summary}
      </div>

      {status === "skipped" && (
        <div className="mt-1.5 flex">
          <span className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
            Skipped
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
});
