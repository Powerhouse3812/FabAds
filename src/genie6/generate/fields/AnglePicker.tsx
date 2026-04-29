import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { ANGLES } from "../modeConfigs";

export function AnglePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Angle</label>
      <div className="flex flex-wrap gap-2">
        {ANGLES.map((angle) => {
          const active = draft.angle === angle;
          return (
            <button
              key={angle}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_ANGLE", angle: active ? null : angle })
              }
              className={cn(
                "rounded-g6-pill border px-3 py-1 text-g6-sm font-medium transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text"
              )}
            >
              {angle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
