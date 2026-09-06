import { cn } from "@/lib/utils";
import type { AppField } from "../appTypes";

type SegmentedFieldSpec = Extract<AppField, { kind: "segmented" }>;

interface SegmentedFieldProps {
  field: SegmentedFieldSpec;
  value: string | undefined;
  onChange: (value: string) => void;
}

/**
 * Segmented control — small closed option sets (e.g. Avatar Shots' Presenter /
 * Cinematic tabs). Pill group, one primary choice visible, Hick's-law-friendly
 * (never more than a handful of options by contract).
 */
export function SegmentedField({ field, value, onChange }: SegmentedFieldProps) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-full border border-border bg-muted/40 p-1">
      {field.options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
            )}
          >
            {opt.label}
            {opt.desc && (
              <span className="ml-1.5 hidden font-mono text-[10px] font-normal opacity-70 sm:inline">
                {opt.desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
