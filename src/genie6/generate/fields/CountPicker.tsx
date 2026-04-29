import { useDraft } from "../../stores/draftStore";
import { COUNTS } from "../modeConfigs";

export function CountPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label htmlFor="count-picker" className="text-g6-sm font-medium text-g6-text">
        Count
      </label>
      <select
        id="count-picker"
        value={draft.count}
        onChange={(e) => dispatch({ type: "SET_COUNT", count: Number(e.target.value) })}
        className="h-g6-lg w-32 rounded-g6-base border border-g6-border bg-g6-bg-container px-3 font-g6-mono text-g6-base text-g6-text focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      >
        {COUNTS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
