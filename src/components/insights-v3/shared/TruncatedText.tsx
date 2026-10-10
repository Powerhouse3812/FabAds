import { useState, type ElementType, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useOverflow } from "./useOverflow";

export interface TruncatedTextProps {
  text: string;
  /** Max lines before truncating. 1 = single-line ellipsis. */
  lines?: number;
  as?: ElementType;
  className?: string;
  /** Tooltip content; defaults to `text`. */
  tooltip?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Clipped text is a tab stop by default so keyboard users can read the tooltip.
   * Set false inside an interactive parent (button/link) — never nest focusables.
   */
  focusable?: boolean;
}

/**
 * Truncates with an ellipsis and shows a tooltip ONLY when the text is really
 * clipped. Clipped text becomes a tab stop so keyboard users can read it too.
 */
export function TruncatedText({ text, lines = 1, as, className, tooltip, side = "top", focusable = true }: TruncatedTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const { ref, overflowing } = useOverflow<HTMLElement>(`${text}|${lines}`);
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open && overflowing} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Tag
            ref={ref}
            tabIndex={focusable && overflowing ? 0 : undefined}
            className={cn(
              // px-px/-mx-px: overflow:hidden at a fractional x clips the first glyph's left edge ("‿anding").
              "min-w-0 rounded-sm px-px -mx-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              lines === 1 ? "block truncate" : "block overflow-hidden",
              className,
            )}
            style={
              lines > 1
                ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" }
                : undefined
            }
          >
            {text}
          </Tag>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[320px] break-words text-xs">
          {tooltip ?? text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
