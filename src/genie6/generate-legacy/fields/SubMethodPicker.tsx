import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../modeConfigs";

/**
 * SubMethodPicker — starting-point chips (iter-5 P-4 + P-5 relabel).
 *
 * Sub-method = "what kind of [mode] are we generating?" — not a technical
 * branch, a starting point. Relabel to "Starting point" + 1-line hint so
 * the user immediately knows what they're picking. Same chip behaviour.
 */
export function SubMethodPicker() {
  const { draft, dispatch } = useDraft();
  if (!draft.mode) return null;

  const config = getModeConfig(draft.mode);
  if (!config.subMethods?.length) return null;

  const active = draft.subMethod ?? config.defaultSubMethod ?? config.subMethods[0].id;

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Starting point</label>
      <p className="text-g6-xs text-g6-text-tertiary">
        Pick the kind of {config.label.toLowerCase()} you want — sets defaults across the form.
      </p>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1">
        {config.subMethods.map((sm) => {
          const isActive = active === sm.id;
          return (
            <button
              key={sm.id}
              type="button"
              onClick={() => dispatch({ type: "SET_SUBMETHOD", subMethod: sm.id })}
              className={cn(
                "shrink-0 snap-start rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
                isActive
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
              )}
            >
              {sm.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
