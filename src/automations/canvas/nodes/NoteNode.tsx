/**
 * NoteNode — an on-canvas sticky. Never executes, never connects.
 *
 * Deliberately styled UNLIKE the executable nodes (dashed border, muted fill,
 * no handles) so it reads as an annotation at a glance rather than a step
 * someone forgot to wire up. `CONNECTION_RULES` gives it no legal connections
 * in either direction, and the run engine excludes notes from runs entirely.
 */
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_KIND_META, nodeConfigIssue, type WorkflowNodeData } from "@/automations/model";

type NoteData = Extract<WorkflowNodeData, { kind: "note" }>;

export const NoteNode = memo(function NoteNode({ data, selected }: NodeProps) {
  // react-flow types node `data` loosely; single narrowing point.
  const nodeData = data as unknown as NoteData;
  const issue = nodeConfigIssue(nodeData);
  const meta = NODE_KIND_META.note;

  // No `useNodeRunStatus` call here at all. Notes are excluded from runs, so a
  // status for one would mean a bug in the engine — and rendering it as "done"
  // would be a lie about work that never happened. Better to have no channel
  // for that lie than to read the value and ignore it.
  return (
    <div
      className={cn(
        "w-[210px] rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2.5 text-xs",
        selected && "ring-2 ring-ring",
      )}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <StickyNote className="h-3 w-3" />
        {meta.family}
      </div>

      {issue ? (
        <p className="mt-1 italic text-muted-foreground">{issue}</p>
      ) : (
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-foreground">{nodeData.text}</p>
      )}
    </div>
  );
});
