import { useDraft } from "../../stores/draftStore";

export function PromptOverride() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label htmlFor="prompt-override" className="text-g6-sm font-medium text-g6-text">
        Prompt override{" "}
        <span className="text-g6-text-tertiary">(optional)</span>
      </label>
      <textarea
        id="prompt-override"
        rows={3}
        value={draft.prompt}
        onChange={(e) => dispatch({ type: "SET_PROMPT", prompt: e.target.value })}
        placeholder="Add extra instructions, style notes, or context to override AI defaults…"
        className="w-full resize-none rounded-g6-base border border-g6-border bg-g6-bg-container px-3 py-2 font-g6-mono text-g6-sm text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
    </div>
  );
}
