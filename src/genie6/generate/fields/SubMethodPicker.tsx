import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { getModeConfig } from "../modeConfigs";

export function SubMethodPicker() {
  const { draft, dispatch } = useDraft();
  if (!draft.mode) return null;

  const config = getModeConfig(draft.mode);
  if (!config.subMethods?.length) return null;

  const active = draft.subMethod ?? config.defaultSubMethod ?? config.subMethods[0].id;

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Sub-method</label>
      <div className="flex flex-wrap gap-2">
        {config.subMethods.map((sm) => {
          const isActive = active === sm.id;
          return (
            <button
              key={sm.id}
              type="button"
              onClick={() => dispatch({ type: "SET_SUBMETHOD", subMethod: sm.id })}
              className={cn(
                "rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
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
