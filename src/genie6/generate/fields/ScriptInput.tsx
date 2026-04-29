import { useDraft } from "../../stores/draftStore";

export function ScriptInput() {
  const { draft, dispatch } = useDraft();

  // Image-to-Ad with "Brief to Ad" sub-method → user enters a brief, not a script.
  // UGC modes → user enters an avatar script.
  const isBrief = draft.mode === "image-to-ad" && draft.subMethod === "brief-to-ad";
  const label = isBrief ? "Brief" : "Script";
  const placeholder = isBrief
    ? "Describe what you want to say — tone, key benefits, CTA direction…"
    : "Enter the avatar script or leave blank for AI generation…";

  const value = isBrief ? draft.briefText : draft.script;
  const onChange = (v: string) =>
    isBrief
      ? dispatch({ type: "SET_BRIEF", briefText: v })
      : dispatch({ type: "SET_SCRIPT", script: v });

  return (
    <div className="space-y-2">
      <label htmlFor="script-input" className="text-g6-sm font-medium text-g6-text">
        {label}
      </label>
      <textarea
        id="script-input"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-g6-base border border-g6-border bg-g6-bg-container px-3 py-2 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
    </div>
  );
}
