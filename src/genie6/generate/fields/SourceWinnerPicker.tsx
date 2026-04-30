import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { concepts } from "../../mocks/library";

/**
 * SourceWinnerPicker — horizontal-scroll strip (iter-5 O-5). Was a vertical
 * stack of full-width rows that pushed the form long. Now: snap-to-card row
 * with concept name + angle/tone meta + generation count. Required field —
 * shown when mode = Variants.
 */
export function SourceWinnerPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">
        Source winner <span className="text-g6-text-tertiary">(required)</span>
      </label>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {concepts.map((c) => {
          const active = draft.conceptId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                dispatch({ type: "SET_CONCEPT", conceptId: active ? null : c.id })
              }
              className={cn(
                "flex w-[200px] shrink-0 snap-start flex-col gap-1 rounded-g6-base border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary-bg"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-g6-sm font-medium text-g6-text">
                  {c.name}
                </span>
                <span className="font-g6-mono shrink-0 text-[10px] text-g6-text-tertiary">
                  {c.generationCount} gens
                </span>
              </div>
              <span className="truncate text-g6-xs text-g6-text-secondary">
                {c.angle} · {c.tone}
              </span>
              <span className="font-g6-mono text-[10px] text-g6-text-tertiary">
                {c.format}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
