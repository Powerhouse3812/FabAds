import { Image, Video, FileText, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputType } from "../types";

/**
 * OutputChip — top-sticky output choice picker.
 *
 * Per Form Specs §1, §2, §3: "Output chip — Image · Video · Whole Adcopy"
 * Product Ad adds a 4th option: "Product Shoot/Staging" (preset).
 *
 * Visual: lime two-tone pill on active (matching the mode-chip pattern from
 * the audit fix A-10.16, WCAG-1.4.1 safe).
 */

const ICON_MAP: Record<OutputType, typeof Image> = {
  image: Image,
  video: Video,
  "whole-adcopy": FileText,
  "product-shoot": Camera,
};

const LABEL_MAP: Record<OutputType, string> = {
  image: "Image",
  video: "Video",
  "whole-adcopy": "Whole Adcopy",
  "product-shoot": "Product Shoot",
};

export interface OutputChipProps {
  value: OutputType;
  onChange: (next: OutputType) => void;
  /** The set of allowed Output choices for the current Type. */
  options: OutputType[];
}

export function OutputChip({ value, onChange, options }: OutputChipProps) {
  return (
    <div role="radiogroup" aria-label="Output type" className="flex items-center gap-1.5 overflow-x-auto">
      {options.map((opt) => {
        const Icon = ICON_MAP[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
              active
                ? "bg-primary text-primary-foreground ring-[1.5px] ring-primary ring-offset-2 ring-offset-background shadow-sm font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {LABEL_MAP[opt]}
          </button>
        );
      })}
    </div>
  );
}
