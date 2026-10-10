import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SortControlProps<T extends string> {
  value: T;
  /** key → label, in display order (use the `*_SORT_LABEL` maps from types.ts). */
  options: Record<T, string>;
  onChange: (next: T) => void;
  label?: string;
  className?: string;
}

/** "Sort" + select. Options are whatever the page allows — the kit adds none. */
export function SortControl<T extends string>({ value, options, onChange, label = "Sort", className }: SortControlProps<T>) {
  const id = useId();
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span id={id} className="text-xs text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger aria-labelledby={id} className="h-8 min-w-[150px] gap-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(options) as T[]).map((k) => (
            <SelectItem key={k} value={k} className="text-xs">
              {options[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
