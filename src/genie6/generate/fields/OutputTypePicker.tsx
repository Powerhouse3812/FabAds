import { Image as ImageIcon, Video, Layers, Sparkles, FileText, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../modeConfigs";
import { OUTPUT_TYPE_LABELS, type OutputType } from "../../types/output";

/**
 * OutputTypePicker — animated mini-preview tiles (iter-5 enhancement).
 *
 * Was: text pills. Output type is the most consequential decision in the
 * form — it determines whether the result is a still, motion, multi-frame
 * or pure copy. Now: each allowed type renders a tile with a tiny visual
 * preview that animates on hover, so the user picks by what the deliverable
 * WILL BE, not by reading a label. Pattern: Pika / Runway model picker,
 * Krea modality switcher.
 */

interface OutputTypeVisual {
  Icon: React.ComponentType<{ className?: string }>;
  /** One-line description of what this type ships. */
  hint: string;
  /** The animated preview itself. */
  Preview: React.FC<{ active: boolean }>;
}

const VISUALS: Record<OutputType, OutputTypeVisual> = {
  image: {
    Icon: ImageIcon,
    hint: "Single static",
    Preview: ({ active }) => (
      <div
        className={cn(
          "h-10 w-10 rounded border-[1.5px]",
          active
            ? "border-g6-primary bg-g6-primary/15"
            : "border-g6-border bg-g6-bg-spotlight/60"
        )}
      />
    ),
  },
  video: {
    Icon: Video,
    hint: "Full motion",
    Preview: ({ active }) => (
      <div
        className={cn(
          "relative flex h-10 w-14 items-center justify-center rounded border-[1.5px]",
          active
            ? "border-g6-primary bg-g6-primary/15"
            : "border-g6-border bg-g6-bg-spotlight/60"
        )}
      >
        <div
          className={cn(
            "g6-out-play h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent",
            active ? "border-l-g6-primary" : "border-l-g6-text-secondary"
          )}
        />
      </div>
    ),
  },
  carousel: {
    Icon: Layers,
    hint: "Multi-frame",
    Preview: ({ active }) => (
      <div className="relative h-10 w-12">
        <div
          className={cn(
            "absolute inset-y-1 right-0 w-9 rounded border-[1.5px]",
            active
              ? "border-g6-primary bg-g6-primary/10"
              : "border-g6-border-secondary bg-g6-bg-spotlight/40"
          )}
        />
        <div
          className={cn(
            "g6-out-carousel absolute inset-y-0 left-0 w-9 rounded border-[1.5px]",
            active
              ? "border-g6-primary bg-g6-primary/20"
              : "border-g6-border bg-g6-bg-spotlight/70"
          )}
        />
      </div>
    ),
  },
  "motion-static": {
    Icon: Sparkles,
    hint: "Subtle motion",
    Preview: ({ active }) => (
      <div
        className={cn(
          "relative h-10 w-10 rounded border-[1.5px]",
          active
            ? "border-g6-primary bg-g6-primary/15"
            : "border-g6-border bg-g6-bg-spotlight/60"
        )}
      >
        <div
          className={cn(
            "g6-out-motion absolute right-1 top-1 h-2 w-2 rounded-full",
            active ? "bg-g6-primary" : "bg-g6-text-secondary"
          )}
        />
      </div>
    ),
  },
  adcopy: {
    Icon: FileText,
    hint: "Text + visual",
    Preview: ({ active }) => (
      <div className="flex h-10 w-14 items-center gap-1 rounded border-[1.5px] border-g6-border-secondary bg-g6-bg-spotlight/40 p-1">
        <div
          className={cn(
            "h-full w-4 shrink-0 rounded-sm",
            active ? "bg-g6-primary/40" : "bg-g6-bg-base"
          )}
        />
        <div className="flex h-full flex-1 flex-col justify-center gap-1">
          <div
            className={cn(
              "g6-out-line h-0.5 rounded-full",
              active ? "bg-g6-primary" : "bg-g6-text-tertiary"
            )}
            style={{ ['--w-from' as string]: '70%', ['--w-to' as string]: '100%' }}
          />
          <div
            className={cn(
              "h-0.5 w-1/2 rounded-full",
              active ? "bg-g6-primary/60" : "bg-g6-text-tertiary/50"
            )}
          />
        </div>
      </div>
    ),
  },
  "text-only": {
    Icon: Type,
    hint: "Pure copy",
    Preview: ({ active }) => (
      <div className="flex h-10 w-14 flex-col justify-center gap-1 rounded border-[1.5px] border-g6-border-secondary bg-g6-bg-spotlight/40 px-1.5">
        <div
          className={cn(
            "g6-out-line h-0.5 rounded-full",
            active ? "bg-g6-primary" : "bg-g6-text-tertiary"
          )}
          style={{ ['--w-from' as string]: '60%', ['--w-to' as string]: '100%' }}
        />
        <div className={cn("h-0.5 w-3/4 rounded-full", active ? "bg-g6-primary/70" : "bg-g6-text-tertiary/60")} />
        <div className="flex items-center gap-0.5">
          <div className={cn("h-0.5 w-1/2 rounded-full", active ? "bg-g6-primary/50" : "bg-g6-text-tertiary/40")} />
          <span className={cn("g6-out-cursor inline-block h-1.5 w-px", active ? "bg-g6-primary" : "bg-g6-text-secondary")} />
        </div>
      </div>
    ),
  },
};

export function OutputTypePicker() {
  const { draft, dispatch } = useDraft();
  if (!draft.mode) return null;

  const config = getModeConfig(draft.mode);
  const allowed = config.outputTypes;

  if (allowed.length === 0) {
    return (
      <div className="space-y-1">
        <label className="text-g6-sm font-medium text-g6-text">Output type</label>
        <p className="text-g6-xs text-g6-text-tertiary">
          Inherits from the parent winner — no separate selection needed.
        </p>
      </div>
    );
  }

  const active = draft.outputType ?? config.defaultOutputType;

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">Output type</label>
      <div className="grid grid-cols-3 gap-2">
        {allowed.map((t) => {
          const isActive = active === t;
          const v = VISUALS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => dispatch({ type: "SET_OUTPUT_TYPE", outputType: t as OutputType })}
              className={cn(
                "group g6-lift flex items-center gap-3 rounded-g6-base border px-3 py-2.5 text-left transition-all",
                isActive
                  ? "g6-out-active border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div className="flex h-10 shrink-0 items-center justify-center">
                <v.Preview active={isActive} />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "text-g6-sm font-semibold leading-none",
                    isActive ? "text-g6-primary" : "text-g6-text"
                  )}
                >
                  {OUTPUT_TYPE_LABELS[t]}
                </p>
                <p className="text-[10px] text-g6-text-tertiary leading-tight">{v.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
      {allowed.length === 1 && (
        <p className="text-g6-xs text-g6-text-tertiary">
          This mode only produces {OUTPUT_TYPE_LABELS[allowed[0]]}.
        </p>
      )}
    </div>
  );
}
