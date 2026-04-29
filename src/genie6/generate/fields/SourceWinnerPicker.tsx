import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { concepts } from "../../mocks/library";

export function SourceWinnerPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">
        Source winner <span className="text-g6-text-tertiary">(required)</span>
      </label>
      <div className="flex flex-col gap-2">
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
                "flex items-start gap-3 rounded-g6-base border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary-bg"
                  : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-g6-sm font-medium text-g6-text">{c.name}</span>
                <span className="text-g6-xs text-g6-text-secondary truncate">
                  {c.angle} · {c.tone} · {c.format}
                </span>
              </div>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary shrink-0">
                {c.generationCount} gens
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
