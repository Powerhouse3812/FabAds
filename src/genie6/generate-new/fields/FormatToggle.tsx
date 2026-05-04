import { cn } from "@/lib/utils";
import type { ImageFormat } from "../types";

/**
 * FormatToggle — top-sticky contextual format chips.
 *
 * Per Form Specs §1, §2, §3: "Format toggle — when Output=Image: Static · …"
 * Different Types expose different format options; some are conditionally
 * greyed (e.g. Catalogue/Collection greyed if <2 products selected on
 * Product Ad).
 */

export interface FormatOption {
  id: ImageFormat;
  label: string;
  /** Optional disabled flag with reason tooltip */
  disabled?: boolean;
  disabledReason?: string;
}

export interface FormatToggleProps {
  value: ImageFormat;
  onChange: (next: ImageFormat) => void;
  options: FormatOption[];
}

export function FormatToggle({ value, onChange, options }: FormatToggleProps) {
  return (
    <div role="radiogroup" aria-label="Format" className="flex items-center gap-1 overflow-x-auto">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            title={opt.disabled ? opt.disabledReason : undefined}
            onClick={() => !opt.disabled && onChange(opt.id)}
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-1 text-[11px] transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
              active
                ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                : opt.disabled
                  ? "border-border bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
