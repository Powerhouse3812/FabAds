/**
 * ActionNode — one component for all four action kinds (markStatus,
 * generateVariation, addToFolder, syncFolderToAccounts).
 *
 * They share identical chrome and differ only by icon, label and summary, all
 * of which come from `NODE_KIND_META` / `describeNode` — so four near-copies
 * would be four places to fix a spacing tweak. The kind-specific bits are a
 * lookup, not a branch.
 *
 * Every action node carries a "simulated" chip, unconditionally. Nothing in
 * this prototype performs a real upload, generation, or bucket change, and the
 * node that claims to act is the honest place to say so.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, FolderInput, Sparkles, Tag, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NODE_KIND_META,
  SYNC_GRANULARITY_META,
  describeNode,
  nodeConfigIssue,
  type SyncGranularity,
  type WorkflowNodeData,
} from "@/automations/model";
import { useNodeRunStatus } from "@/automations/canvas/runStatusContext";

type ActionKind = "markStatus" | "generateVariation" | "addToFolder" | "syncFolderToAccounts";
type ActionData = Extract<WorkflowNodeData, { kind: ActionKind }>;

/** Kept in step with NodePalette's map so the palette and the canvas show the
 *  same icon for the same step. */
const ACTION_ICONS: Record<ActionKind, typeof Tag> = {
  markStatus: Tag,
  generateVariation: Sparkles,
  addToFolder: FolderInput,
  syncFolderToAccounts: UploadCloud,
};

export const ActionNode = memo(function ActionNode({ id, data, selected }: NodeProps) {
  // react-flow types node `data` as a loose record (it must hold every kind's
  // shape). Single narrowing point for this component.
  const nodeData = data as unknown as ActionData;
  const status = useNodeRunStatus(id);
  const meta = NODE_KIND_META[nodeData.kind];
  const summary = describeNode(nodeData);
  const issue = nodeConfigIssue(nodeData);
  const Icon = ACTION_ICONS[nodeData.kind];

  // A sync node ends a chain (CONNECTION_RULES makes it terminal); omitting the
  // source handle makes that visible rather than letting a user drag from a
  // handle whose every connection would be refused.
  const isTerminal = nodeData.kind === "syncFolderToAccounts";

  /**
   * Which granularity a sync node is set to, as a chip.
   *
   * `describeNode` already words the summary per mode, so this is NOT a second
   * copy of that information for its own sake — it's the case the summary line
   * can't cover. That line `truncate`s inside a 210px card (a real folder name
   * plus "→ 3 ad accounts" overflows easily) and, on an unfinished node, is
   * REPLACED wholesale by the config issue. So on exactly the cards where a
   * reader most needs to know which of two jobs this step is, the mode is
   * invisible. One chip in the row that already carries "simulated" fixes that
   * without changing the card's shape.
   *
   * Missing/unrecognised `mode` reads as "folder" — the same fallback the
   * executor and the config panel use, so all three agree about a graph saved
   * before the mode existed.
   */
  const syncMode: SyncGranularity | null =
    nodeData.kind === "syncFolderToAccounts"
      ? nodeData.mode === "creatives"
        ? "creatives"
        : "folder"
      : null;

  // `selected` wins over the running pulse — two differently-coloured `ring-2`
  // utilities would resolve by stylesheet order, not class order.
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
        <Icon className="h-3 w-3" />
        {meta.family}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{meta.label}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground" title={summary}>
        {summary}
      </div>

      {/* `flex-wrap`: a sync node can carry three chips (simulated + mode +
          Needs setup), which is a few pixels past 210px — wrapping to a second
          row is correct, clipping the third chip is not. */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {/* Non-negotiable: an action that cannot really act must say so. */}
        <span className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
          simulated
        </span>
        {syncMode && (
          <span
            className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground"
            title={SYNC_GRANULARITY_META[syncMode].blurb}
          >
            {syncMode}
          </span>
        )}
        {issue && (
          <span
            className="rounded border border-border px-1 font-mono text-[10px] text-warning-text"
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

      <Handle type="target" position={Position.Left} />
      {!isTerminal && <Handle type="source" position={Position.Right} />}
    </div>
  );
});
