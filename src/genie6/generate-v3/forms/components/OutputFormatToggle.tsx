import { Camera, Video } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OutputFormatToggle — Image / Video segmented control.
 *
 * Studio v3 form-shared component (A-11.21). Same visual as the inline
 * OutputToggle in ProductShootForm but lifted out for reuse across
 * Studio v3 forms (Product-focused Brand Ad first).
 */

export type OutputFormat = "image" | "video";

export interface OutputFormatToggleProps {
  value: OutputFormat;
  onChange: (next: OutputFormat) => void;
}

export function OutputFormatToggle({ value, onChange }: OutputFormatToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Output format"
      className="inline-flex rounded-md border border-border bg-card p-0.5"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "image"}
        onClick={() => onChange("image")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
          value === "image"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Camera className="h-3 w-3" />
        Image
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "video"}
        onClick={() => onChange("video")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
          value === "video"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Video className="h-3 w-3" />
        Video
      </button>
    </div>
  );
}
