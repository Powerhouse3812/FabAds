/**
 * ConditionNode — filters creatives flowing through the chain.
 *
 * Sits between a source/condition upstream and an action/condition
 * downstream, so it carries both a target handle (left) and a source handle
 * (right) — unlike SourceNode (no target) or a terminal ActionNode (no
 * source).
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NODE_KIND_META,
  describeNode,
  nodeConfigIssue,
  type WorkflowNodeData,
} from "@/automations/model";
import { useNodeRunStatus } from "@/automations/canvas/runStatusContext";

export const ConditionNode = memo(function ConditionNode({ id, data, selected }: NodeProps) {
  // react-flow's node `data` is a loose Record<string, unknown> by design.
  // This is the single narrowing point for this component.
  const nodeData = data as unknown as Extract<WorkflowNodeData, { kind: "condition" }>;
  const status = useNodeRunStatus(id);
  const meta = NODE_KIND_META.condition;
  const summary = describeNode(nodeData);
  const issue = nodeConfigIssue(nodeData);

  // See SourceNode for why `selected` always picks the ring colour over the
  // running pulse rather than letting two `ring-2` classes fight it out.
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
        <Filter className="h-3 w-3" />
        {meta.family}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{meta.label}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground" title={summary}>
        {summary}
      </div>

      {(issue || status === "skipped") && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {issue && (
            <span
              className="rounded border border-warning-text/30 px-1 font-mono text-[10px] text-warning-text"
              title={issue}
            >
              Needs setup
            </span>
          )}
          {status === "skipped" && (
            <span className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
              Skipped
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
