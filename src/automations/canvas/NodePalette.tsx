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
 *
 * TWO LAYOUTS, ONE COMPONENT. From `2xl` up this is a static 224px column, as
 * it always was. Below `2xl` it is an absolute overlay ON TOP of the canvas,
 * opened by the canvas's own "Steps" button — because a `shrink-0` column at
 * that width leaves the canvas nothing (see `WorkflowCanvas.tsx` header note
 * 3, which owns the reasoning). `open` is therefore meaningful ONLY below
 * `2xl`: the responsive classes below keep the column visible above it no
 * matter what `open` says, so the wide layout can never be closed away.
 */
import {
  FolderInput,
  Filter,
  Radio,
  Sparkles,
  StickyNote,
  Tag,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function NodePalette({
  nodes,
  open = true,
  onClose,
}: {
  nodes: WorkflowNode[];
  /** Overlay open state. Read only below `2xl` — see the file header. */
  open?: boolean;
  /** Closes the overlay. Rendered `2xl:hidden`, since the wide layout has
   *  nothing to close. */
  onClose?: () => void;
}) {
  return (
    <aside
      className={cn(
        "w-56 shrink-0 space-y-4 overflow-y-auto border-r border-border bg-background p-3",
        // Overlay below `2xl`, in-flow column from `2xl` up. `bg-background` is
        // already opaque, so floating over the canvas needs only the shadow to
        // read as a layer above it.
        "absolute inset-y-0 left-0 z-20 shadow-lg 2xl:static 2xl:z-auto 2xl:shadow-none",
        open ? "block" : "hidden 2xl:block",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-foreground">Steps</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Drag a step onto the canvas.</p>
        </div>
        {/* Explicit close only — this repo's overlays never dismiss on an
            outside click, and here that rule earns its keep twice over: the
            "outside" is a canvas you drag onto, so a dismiss-on-click would
            fire mid-drag. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground 2xl:hidden"
          onClick={onClose}
          aria-label="Close the step palette"
        >
          <X className="h-4 w-4" />
        </Button>
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
