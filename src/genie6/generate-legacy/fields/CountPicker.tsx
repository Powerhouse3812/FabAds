import { Minus, Plus } from "lucide-react";
import { useDraft } from "../../stores/draftStore";

/**
 * CountPicker — numeric input + stepper (Q-1 fix).
 *
 * Was: fixed 4/8/12/16/24 chip set — felt rigid, no in-between values.
 * Now: number input bound 1..50 with +/- stepper buttons. Default 5.
 * Single value, free-form, immediate cost transparency in the helper.
 */

const MIN = 1;
const MAX = 50;

export function CountPicker() {
  const { draft, dispatch } = useDraft();

  const set = (n: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, Math.round(n) || MIN));
    dispatch({ type: "SET_COUNT", count: clamped });
  };

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">How many?</label>
      <p className="text-g6-xs text-g6-text-tertiary">
        Each variant uses 1 credit · ~2 seconds.
      </p>
      <div className="inline-flex items-center gap-0.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-0.5">
        <button
          type="button"
          onClick={() => set(draft.count - 1)}
          disabled={draft.count <= MIN}
          aria-label="Decrease"
          className="flex h-8 w-8 items-center justify-center rounded-g6-base text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={draft.count}
          onChange={(e) => set(Number(e.target.value))}
          className="h-8 w-14 rounded-g6-base bg-transparent text-center font-g6-mono text-g6-base font-bold tabular-nums text-g6-text focus:outline-none focus:ring-2 focus:ring-g6-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => set(draft.count + 1)}
          disabled={draft.count >= MAX}
          aria-label="Increase"
          className="flex h-8 w-8 items-center justify-center rounded-g6-base text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
