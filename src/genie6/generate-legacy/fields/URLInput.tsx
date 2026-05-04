import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useDraft } from "../../stores/draftStore";
import { BrandFetchModal } from "../../components/BrandFetchModal";

/**
 * URLInput — landing-page / product URL input. Iter-5 P-1: the URL is also a
 * brand-fetch entry point. When the input has a valid URL AND no brand is
 * selected yet, a "Fetch brand from this URL" affordance appears that opens
 * the BrandFetchModal pre-filled — so the user gets brand+products auto-
 * detected without leaving the form.
 */
export function URLInput() {
  const { draft, dispatch } = useDraft();
  const [fetchOpen, setFetchOpen] = useState(false);
  const valid = /^https?:\/\/[^\s]+$/.test(draft.sourceUrl.trim());
  const showFetch = valid && !draft.brandId;

  return (
    <div className="space-y-2">
      <label htmlFor="url-input" className="text-g6-sm font-medium text-g6-text">
        Landing page or product URL
      </label>
      <input
        id="url-input"
        type="url"
        value={draft.sourceUrl}
        onChange={(e) =>
          dispatch({ type: "SET_SOURCE_URL", sourceUrl: e.target.value })
        }
        placeholder="https://example.com/your-product"
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 font-g6-mono text-g6-base text-g6-text placeholder:text-g6-text-disabled focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      />
      {showFetch ? (
        <button
          type="button"
          onClick={() => setFetchOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-g6-pill border border-g6-primary-border bg-g6-primary-bg px-2.5 py-1 text-g6-xs font-medium text-g6-primary-active hover:bg-g6-primary-bg-hover"
        >
          <Sparkles className="h-3 w-3" />
          Fetch brand from this URL
        </button>
      ) : (
        <p className="text-g6-xs text-g6-text-tertiary">
          AI will read this page and extract product info, claims, and CTA context.
        </p>
      )}

      <BrandFetchModal
        open={fetchOpen}
        onOpenChange={setFetchOpen}
        initialUrl={draft.sourceUrl}
        onSaved={(brandId) => dispatch({ type: "SET_BRAND", brandId })}
      />
    </div>
  );
}
