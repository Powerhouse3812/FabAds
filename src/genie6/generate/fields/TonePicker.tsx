import { useDraft } from "../../stores/draftStore";
import { TONES } from "../modeConfigs";

export function TonePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label htmlFor="tone-picker" className="text-g6-sm font-medium text-g6-text">
        Tone
      </label>
      <select
        id="tone-picker"
        value={draft.tone ?? ""}
        onChange={(e) => dispatch({ type: "SET_TONE", tone: e.target.value })}
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-base text-g6-text focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      >
        {TONES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
