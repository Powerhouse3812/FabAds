import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VideoAdvancedFields,
  type VideoAdvancedValues,
} from "./VideoAdvancedFields";

/**
 * VideoAdvancedSection — collapsible Advanced for video output (A-11.21).
 *
 * Closed by default per Maalik: "advance will come only in case of video
 * output selected." Host form should mount this only when output === "video".
 *
 * Header: "Advanced (video)" + chevron. Click toggles open/closed.
 */

export interface VideoAdvancedSectionProps {
  values: VideoAdvancedValues;
  onChange: (next: Partial<VideoAdvancedValues>) => void;
  /** Force initial open state. Default closed. */
  defaultOpen?: boolean;
}

export function VideoAdvancedSection({
  values,
  onChange,
  defaultOpen = false,
}: VideoAdvancedSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
          "hover:bg-muted/40",
        )}
      >
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex-1">
          Advanced
          <span className="ml-1 normal-case font-normal text-[10px]">· video</span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/40 px-3 py-3">
          <VideoAdvancedFields values={values} onChange={onChange} />
        </div>
      )}
    </section>
  );
}
