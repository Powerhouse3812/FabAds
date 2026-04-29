import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ENRICHMENT_OPTIONS = [
  { id: "reddit", label: "Reddit Pain Points", emoji: "🔴" },
  { id: "articles", label: "Trending Articles", emoji: "📰" },
  { id: "market", label: "Market Signals", emoji: "📊" },
  { id: "competitor", label: "Competitor Angles", emoji: "🎯" },
];

interface Props {
  selected: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function Genie5EnrichmentSection({ selected, onSelectionChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggleChip = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-1.5 group cursor-pointer">
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 shrink-0",
          open && "rotate-180"
        )} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Research Enrichment
        </span>
        {selected.size > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
            {selected.size}
          </Badge>
        )}
        {selected.size === 0 && !open && (
          <span className="text-[9px] text-muted-foreground/60 italic">optional</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
        <div className="flex flex-wrap gap-2 pt-2">
          {ENRICHMENT_OPTIONS.map((opt) => {
            const active = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleChip(opt.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 border border-primary/40 text-foreground shadow-sm"
                    : "border border-border/50 text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                )}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
