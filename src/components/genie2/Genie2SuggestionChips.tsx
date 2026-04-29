import { cn } from "@/lib/utils";
import { Lightbulb, ArrowRight } from "lucide-react";
import { PRODUCT_SUGGESTIONS, POST_GEN_SUGGESTIONS } from "@/lib/genie2-dummy-data";

interface Props {
  category: string;
  hasGenerated: boolean;
  onChipClick: (snippet: string) => void;
}

export function Genie2SuggestionChips({ category, hasGenerated, onChipClick }: Props) {
  const baseSuggestions = PRODUCT_SUGGESTIONS[category] || PRODUCT_SUGGESTIONS["General"];
  const allChips = baseSuggestions.slice(0, 6);
  const refineSuggestions = POST_GEN_SUGGESTIONS.slice(0, 4);

  return (
    <div className="space-y-2">
      {/* Base suggestions — simple chip row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground mr-1">Try:</span>
        {allChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onChipClick(chip.promptSnippet)}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Refine chips — only after generation */}
      {hasGenerated && (
        <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in-0 duration-200">
          <span className="text-[11px] text-muted-foreground mr-1">Refine:</span>
          {refineSuggestions.map((chip) => (
            <button
              key={chip.label}
              onClick={() => onChipClick(chip.promptSnippet)}
              className="rounded-full border border-primary/20 px-2.5 py-1 text-[11px] text-primary/80 hover:text-primary hover:border-primary/40 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
