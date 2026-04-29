import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { FORMATS } from "../modeConfigs";

export function FormatPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Format</label>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((fmt) => {
          const active = draft.format === fmt;
          return (
            <button
              key={fmt}
              type="button"
              onClick={() => dispatch({ type: "SET_FORMAT", format: fmt })}
              className={cn(
                "rounded-g6-pill border px-4 py-1.5 font-g6-mono text-g6-sm font-medium transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
              )}
            >
              {fmt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
