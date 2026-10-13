import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface HintProps {
  /** Tooltip body. Falsy → children render with no tooltip. */
  content?: ReactNode;
  /** Must be a single element that forwards a ref (a `span`, `button`, …). */
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/** The one tooltip wrapper for the kit (200ms delay, same as the old module's InfoTip). */
export function Hint({ content, children, side = "top", className }: HintProps) {
  if (!content) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={cn("max-w-[260px] text-xs leading-snug", className)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface InfoGlyphProps {
  /** What the tooltip says. Also used as the accessible name. */
  tip: string;
  side?: HintProps["side"];
  className?: string;
}

/** Small focusable (i) glyph; tooltip opens on hover AND keyboard focus. */
export function InfoGlyph({ tip, side = "top", className }: InfoGlyphProps) {
  return (
    <Hint content={tip} side={side}>
      <span
        tabIndex={0}
        role="img"
        aria-label={tip}
        className={cn(
          "inline-flex shrink-0 cursor-help items-center rounded-sm text-muted-foreground",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Info className="h-3 w-3" aria-hidden="true" />
      </span>
    </Hint>
  );
}
