/**
 * NodePalette — the draggable step palette on the left of the builder.
 *
 * Drag uses NATIVE HTML5 DnD, not dnd-kit (which is installed and used
 * elsewhere in this repo for sortable lists). react-flow's drop handling is
 * built around native drag events, and mixing dnd-kit's pointer capture with
 * react-flow's own pointer handling means fighting two libraries for the same
 * events.
 *
 * KNOWN LIMITATION, stated rather than faked: native HTML5 drag is
 * pointer-only, so there is no keyboard path to add a step in this prototype.
 * A keyboard "Add step" affordance is the follow-up. A fake `onKeyDown` that
 * looked operable but dropped nodes at an arbitrary position would be worse
 * than an honest gap.
 */
import {
  FolderInput,
  Filter,
  Radio,
  Sparkles,
  StickyNote,
  Tag,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NODE_KIND_META,
  WORKFLOW_NODE_KINDS,
  canAddKind,
  type WorkflowNode,
  type WorkflowNodeKind,
} from "@/automations/model";

/**
 * Custom MIME type rather than "text/plain" so the canvas's `onDrop` can tell
 * a palette drag from arbitrary text dragged in from another app (which would
 * otherwise deserialise into a bogus node kind).
 */
export const PALETTE_DND_MIME = "application/fabads-workflow-node";

/** Mirrors ActionNode/SourceNode's icons so a step looks the same in the
 *  palette as it does once dropped. */
const KIND_ICONS: Record<WorkflowNodeKind, typeof Tag> = {
  source: Radio,
  condition: Filter,
  markStatus: Tag,
  generateVariation: Sparkles,
  addToFolder: FolderInput,
  syncFolderToAccounts: UploadCloud,
  note: StickyNote,
};

/** Group order top-to-bottom. Derived from NODE_KIND_META.family so there is
 *  no second kind→group mapping to keep in sync. */
const FAMILY_ORDER = ["trigger", "condition", "action", "annotation"] as const;

const FAMILY_HEADINGS: Record<(typeof FAMILY_ORDER)[number], string> = {
  trigger: "Trigger",
  condition: "Condition",
  action: "Actions",
  annotation: "Annotation",
};

export function NodePalette({ nodes }: { nodes: WorkflowNode[] }) {
  return (
    <aside className="w-56 shrink-0 space-y-4 overflow-y-auto border-r border-border bg-background p-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">Steps</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Drag a step onto the canvas.</p>
      </div>

      {FAMILY_ORDER.map((family) => {
        const kinds = WORKFLOW_NODE_KINDS.filter((k) => NODE_KIND_META[k].family === family);
        if (kinds.length === 0) return null;

        return (
          <div key={family} className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {FAMILY_HEADINGS[family]}
            </p>

            {kinds.map((kind) => {
              const meta = NODE_KIND_META[kind];
              const Icon = KIND_ICONS[kind];
              const enabled = canAddKind(kind, nodes);

              return (
                <div
                  key={kind}
                  draggable={enabled}
                  aria-disabled={!enabled}
                  title={
                    enabled
                      ? meta.blurb
                      : "A workflow has one trigger — it's already on the canvas."
                  }
                  onDragStart={(e) => {
                    e.dataTransfer.setData(PALETTE_DND_MIME, kind);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "rounded-md border border-border bg-card px-2.5 py-2 transition-colors",
                    enabled
                      ? "cursor-grab hover:border-primary-text active:cursor-grabbing"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{meta.label}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {meta.blurb}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
