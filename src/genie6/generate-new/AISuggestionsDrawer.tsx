import { useState } from "react";
import { ChevronDown, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AISuggestionsDrawer — collapsible block surfacing competitor patterns from
 * Industry Insights (A-11.3).
 *
 * Per Form Specs §0.3: "AI Suggestions drawer (collapsible, not sticky)" —
 * lives in form body, NOT in the PromptBar. Distinct from the PromptBar's
 * inline ghost suggestions:
 *   - PromptBar ghost chips → modify the prompt textarea
 *   - This drawer → "winning angle" cards from Industry Insights, click to
 *     apply as an angle / hook / format hint
 *
 * For Phase B build: 3-5 mocked suggestion cards. Real Industry Insights
 * integration lands when the backend is wired.
 *
 * TODO (backport):
 *   - Real Industry Insights query filtered by current brand/category
 *   - "Apply" action that pushes suggestion data into the form's draft state
 *   - Dismiss tracking → trains user preference
 */

export interface AISuggestion {
  id: string;
  /** Short headline — competitor pattern observation */
  headline: string;
  /** One-line context — why this might apply to the current generation */
  rationale: string;
  /** Optional source attribution (competitor brand name) */
  source?: string;
  /** Optional click-handler — defaults to no-op (UI-only Phase B) */
  onApply?: () => void;
}

export interface AISuggestionsDrawerProps {
  /** Optional initial-open state. Default: false */
  defaultOpen?: boolean;
  /** The suggestions to render. Caller-provided so each form can fetch its own. */
  suggestions?: AISuggestion[];
  /** Optional context label (e.g. "from Industry Insights · Skincare category") */
  contextLabel?: string;
}

/**
 * Default mocked suggestions — caller can override via props.
 * 5 examples calibrated for Indian D2C ad context.
 */
const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  {
    id: "price-mention-3s",
    headline: "Lead with price in the first 3 seconds",
    rationale: "5 of your top performers in the same category open with a price stat. Try the same hook structure.",
    source: "Industry Insights · Skincare",
  },
  {
    id: "founder-story",
    headline: "Founder-story angle outperforms in current week",
    rationale: "Mamaearth + Plix winners this week both lead with a founder voice-over. Trending up 23% CTR.",
    source: "Industry Insights · D2C beauty",
  },
  {
    id: "fomo-stock",
    headline: "FOMO + Limited-stock badge",
    rationale: "Sleepyhead's recent Reels use 'Only 47 left' overlay. Conversion bump observed in Performance reports.",
    source: "Industry Insights · Home goods",
  },
];

export function AISuggestionsDrawer({
  defaultOpen = false,
  suggestions = DEFAULT_SUGGESTIONS,
  contextLabel = "from Industry Insights",
}: AISuggestionsDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!suggestions.length) return null;

  return (
    <section className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="ai-suggestions-body"
        className={cn(
          "flex w-full items-center gap-2 px-3.5 py-2.5",
          "text-left transition-colors",
          "hover:bg-muted/40",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-md",
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">AI suggestions</span>
        <span className="text-[10px] text-muted-foreground">· {contextLabel}</span>
        <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
          {suggestions.length}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          id="ai-suggestions-body"
          className="border-t border-border p-3 space-y-2"
        >
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function SuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  return (
    <article className="rounded-md border border-border/60 bg-background p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground leading-snug">
          {suggestion.headline}
        </h3>
        {suggestion.onApply && (
          <button
            type="button"
            onClick={suggestion.onApply}
            className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.rationale}</p>
      {suggestion.source && (
        <p className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80">
          <ExternalLink className="h-2.5 w-2.5" />
          {suggestion.source}
        </p>
      )}
    </article>
  );
}
