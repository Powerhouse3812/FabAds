import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { COUNTS } from "../modeConfigs";

/**
 * CountPicker — chip row (iter-5 P-4 + relabel).
 *
 * Was: dropdown — recall not recognition, hidden options, no immediate cost
 * read. Now: 5 chips, each a credit-cost preview implicit (cost = count, ~2s
 * each). One click decision.
 */
export function CountPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">How many?</label>
      <p className="text-g6-xs text-g6-text-tertiary">
        Each variant uses 1 credit · ~2 seconds.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {COUNTS.map((n) => {
          const active = draft.count === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => dispatch({ type: "SET_COUNT", count: n })}
              className={cn(
                "h-9 min-w-[44px] rounded-g6-pill border px-3 font-g6-mono text-g6-sm font-bold tabular-nums transition-colors",
                active
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
