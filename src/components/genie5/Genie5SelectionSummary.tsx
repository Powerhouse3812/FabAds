import { ChevronRight } from "lucide-react";

interface SelectionItem {
  label: string;
  value: string;
}

interface Props {
  items: SelectionItem[];
}

export function Genie5SelectionSummary({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="bg-muted/30 border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 flex-wrap">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}:</span>
            <span className="text-[11px] font-semibold text-foreground">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
