import { useDraft } from "../../stores/draftStore";
import { audiences } from "../../mocks/library";
import { cn } from "@/lib/utils";

/**
 * AudiencePicker — preset chips + freeform input (iter-5 P-4).
 *
 * Was: select dropdown + freeform input. Drop-downs are recall-not-recognition;
 * presets get hidden until clicked. Now: brand-relevant audience chips
 * scrollable inline (click to fill input) + same freeform input below.
 * Faster pick + same flexibility.
 */
export function AudiencePicker() {
  const { draft, dispatch } = useDraft();

  const relevant = draft.brandId
    ? audiences.filter((a) => !a.brandId || a.brandId === draft.brandId)
    : audiences;

  return (
    <div className="space-y-2">
      <label htmlFor="audience-picker" className="text-g6-sm font-medium text-g6-text">
        Audience
      </label>
      <p className="text-g6-xs text-g6-text-tertiary">Who's the ad for? Pick a saved segment or type your own.</p>

      {relevant.length > 0 && (
        <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1">
          {relevant.map((a) => {
            const active = draft.audienceFreeform === a.segment;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_AUDIENCE",
                    audienceFreeform: active ? "" : a.segment,
                  })
                }
                className={cn(
                  "shrink-0 snap-start rounded-g6-pill border px-3 py-1 text-g6-xs font-medium transition-colors",
                  active
                    ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                    : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:text-g6-text"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      )}

      <input
        id="audience-picker"
        type="text"
        placeholder="or describe in your own words — e.g. Urban women 28-40, in-market for hair fall solutions"
        value={draft.audienceFreeform}
        onChange={(e) =>
          dispatch({ type: "SET_AUDIENCE", audienceFreeform: e.target.value })
        }
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-sm text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
    </div>
  );
}
