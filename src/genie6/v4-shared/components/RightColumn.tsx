import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ActiveColumnInput } from "../types";

/**
 * RightColumn — persistent right-side chassis used by both v4 shells.
 *
 * Wizard variant: `showTabs={false}`. The column auto-renders whichever
 * pane is appropriate (overview when nothing active, input when one is).
 *
 * Flow variant: `showTabs`. Adds an Overview / Editing tab switcher so
 * the user can flip back to the recipe view without committing the
 * active input.
 *
 * Layout follows the A-11.25 PickerColumn fix: `flex flex-col h-full
 * min-h-0 overflow-hidden`, body scrolls independently with `flex-1
 * min-h-0 overflow-y-auto`.
 */

export interface RightColumnProps {
  activeInput: ActiveColumnInput;
  onClose: () => void;
  showTabs?: boolean;
  overview: ReactNode;
  inputContent: ReactNode | null;
}

const INPUT_LABELS: Record<Exclude<ActiveColumnInput, null>, string> = {
  audience: "Audience",
  angle: "Angle",
  concept: "Concept",
  pinterest: "Pinterest",
  library: "Library",
};

export function RightColumn({
  activeInput,
  onClose,
  showTabs = false,
  overview,
  inputContent,
}: RightColumnProps) {
  // Flow variant tracks which tab is active. When the user switches
  // back to Overview we keep the active input alive so they can resume.
  // Wizard skips this entirely — `activeInput` itself drives the view.
  const showInput = activeInput !== null && inputContent !== null;
  const editingLabel = activeInput ? INPUT_LABELS[activeInput] : null;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-transparent",
        "border-l border-border",
      )}
    >
      {showTabs && (
        <div
          role="tablist"
          aria-label="Right column"
          className="shrink-0 flex items-center gap-1 border-b border-border px-3 py-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!showInput}
            onClick={() => {
              if (showInput) onClose();
            }}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-2.5 text-[11px] font-medium transition-colors",
              !showInput
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={showInput}
            disabled={!editingLabel}
            className={cn(
              "inline-flex h-7 items-center rounded-md px-2.5 text-[11px] font-medium transition-colors",
              showInput
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground",
              !editingLabel && "opacity-50 cursor-not-allowed",
            )}
          >
            {editingLabel ? `Editing: ${editingLabel}` : "Editing"}
          </button>
        </div>
      )}

      {/* Body — scrolls independently from the form column. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {showInput ? inputContent : overview}
      </div>
    </section>
  );
}
