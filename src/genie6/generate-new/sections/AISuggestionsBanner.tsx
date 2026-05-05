import { useEffect, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AISuggestionsBanner — minimized, NON-CLICKABLE info banner.
 *
 * A-11.12 redesign per Maalik's UI feedback ("AI suggestions ko show in a
 * minimise version, ye just information hai for user, na ki koi clickable
 * item"):
 *   - Was a collapsible drawer with cards + "Apply" buttons (read as work).
 *   - Now: a slim italic info banner that rotates through 3-5 insights.
 *     User can flip through with arrows, but the suggestions themselves
 *     are NOT applied as actions. They're context, not tasks.
 *   - Sits inline in form body, low visual weight.
 *
 * If real Industry Insights backend lands later, this banner pulls live
 * data filtered by the form's brand / category. For Phase B: 3 mocked
 * suggestions calibrated for Indian D2C ad context.
 */

export interface AISuggestion {
  id: string;
  /** Short headline — competitor pattern observation */
  headline: string;
  /** One-line context — why this might apply to the current generation */
  rationale: string;
  /** Optional source attribution (competitor brand name, category, etc) */
  source?: string;
}

export interface AISuggestionsBannerProps {
  /** The suggestions to render. Caller-provided so each form can fetch its own. */
  suggestions?: AISuggestion[];
  /** Optional context label (e.g. "Skincare · last 14 days"). */
  contextLabel?: string;
  /** Auto-rotate interval in ms. Set 0 to disable rotation. Default: 8000. */
  autoRotateMs?: number;
}

const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  {
    id: "price-mention-3s",
    headline: "5 of your top performers in skincare open with a price stat in the first 3s.",
    rationale: "Try a price-led hook — '₹399 for 60 capsules vs ₹599 elsewhere' — within the first 3 seconds.",
    source: "Industry Insights · Skincare · last 14 days",
  },
  {
    id: "founder-story",
    headline: "Founder-story angle is up 23% CTR this week vs last.",
    rationale: "Mamaearth + Plix recent winners both lead with founder voice-over over the first 5s.",
    source: "Industry Insights · D2C beauty · trending",
  },
  {
    id: "fomo-stock",
    headline: "Limited-stock overlay is converting +18% on Reels.",
    rationale: "Sleepyhead's 'Only 47 left' overlay shows up in 4 of their 5 best-performing recent ads.",
    source: "Industry Insights · Home goods",
  },
];

export function AISuggestionsBanner({
  suggestions = DEFAULT_SUGGESTIONS,
  contextLabel = "from Industry Insights",
  autoRotateMs = 8000,
}: AISuggestionsBannerProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (autoRotateMs <= 0 || suggestions.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % suggestions.length), autoRotateMs);
    return () => clearInterval(t);
  }, [autoRotateMs, suggestions.length]);

  if (suggestions.length === 0) return null;
  const s = suggestions[idx];

  return (
    <aside
      role="note"
      aria-label="AI insights — read-only context"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3",
      )}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            Insight · {contextLabel}
          </span>
        </div>
        <p className="text-sm italic text-foreground leading-snug">{s.headline}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{s.rationale}</p>
        {s.source && (
          <p className="text-[10px] font-mono text-muted-foreground/70 pt-0.5">{s.source}</p>
        )}
      </div>
      {suggestions.length > 1 && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + suggestions.length) % suggestions.length)}
            aria-label="Previous insight"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="font-mono text-[9px] text-muted-foreground/70 tabular-nums px-1">
            {idx + 1}/{suggestions.length}
          </span>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % suggestions.length)}
            aria-label="Next insight"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </aside>
  );
}
