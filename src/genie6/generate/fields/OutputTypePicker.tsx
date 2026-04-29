import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../modeConfigs";
import { OUTPUT_TYPE_LABELS, type OutputType } from "../../types/output";

/**
 * Universal output-type picker (Track 4.2).
 *
 * Shows only the output types ALLOWED for the current mode (per-mode allowlist
 * from modeConfigs.ts → outputTypes[]). Each mode has a different subset:
 *   Brand Ad / Product Ad: all 6
 *   Affiliate Ad: 5 (no motion-static)
 *   UGC Video: 2 (Video + Adcopy)
 *   Variants (forge): 0 (inherits from parent winner — picker hidden)
 *   Image to Ad: 4 (Image / Motion-static / Video / Adcopy)
 *
 * Disabled state: when only 1 type is allowed, the chip is locked + shows a hint.
 */
export function OutputTypePicker() {
  const { draft, dispatch } = useDraft();
  if (!draft.mode) return null;

  const config = getModeConfig(draft.mode);
  const allowed = config.outputTypes;

  // Variants mode inherits from parent — don't render
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
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Output type</label>
      <div className="flex flex-wrap gap-2">
        {allowed.map((t) => {
          const isActive = active === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => dispatch({ type: "SET_OUTPUT_TYPE", outputType: t as OutputType })}
              className={cn(
                "rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
                isActive
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
              )}
            >
              {OUTPUT_TYPE_LABELS[t]}
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
