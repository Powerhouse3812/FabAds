import { useDraft } from "../../stores/draftStore";

export function URLInput() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label htmlFor="url-input" className="text-g6-sm font-medium text-g6-text">
        Landing page URL
      </label>
      <input
        id="url-input"
        type="url"
        value={draft.sourceUrl}
        onChange={(e) => dispatch({ type: "SET_SOURCE_URL", sourceUrl: e.target.value })}
        placeholder="https://example.com/your-product"
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
      <p className="text-g6-xs text-g6-text-tertiary">
        AI will read this page and extract product info, claims, and CTA context.
      </p>
    </div>
  );
}
