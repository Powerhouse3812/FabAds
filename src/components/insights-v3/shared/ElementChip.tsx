import { useState, type MouseEvent } from "react";
import { SAVABLE_LABEL, type SavableType } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOverflow } from "./useOverflow";
import { TYPE_ICON } from "./typeMeta";
import { savedRefToDetailTarget, useAdDrawer, useDetailStack } from "./url";

export interface ElementChipProps {
  type: SavableType;
  id: string;
  label: string;
  /** Override the default (push onto the detail stack; `ad` opens the drawer). */
  onClick?: () => void;
  className?: string;
  /** Optional trailing count (e.g. ads using it). */
  count?: number;
}

/**
 * Clickable chip for framework / hook / angle / concept / domain / page / landing-page / offer.
 * Truncates with a tooltip; opens that item's detail overlay (a back chip appears when nested).
 */
export function ElementChip({ type, id, label, onClick, className, count }: ElementChipProps) {
  const detail = useDetailStack();
  const drawer = useAdDrawer();
  const Icon = TYPE_ICON[type];
  const { ref, overflowing } = useOverflow<HTMLSpanElement>(label);
  const [tip, setTip] = useState(false);

  const handle = (e: MouseEvent) => {
    e.stopPropagation(); // chips live inside clickable cards
    if (onClick) return onClick();
    const t = savedRefToDetailTarget({ type, id });
    if (t.kind === "ad") drawer.open(t.id);
    else detail.push(t);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={tip && overflowing} onOpenChange={setTip}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handle}
            aria-label={`${SAVABLE_LABEL[type]}: ${label}. Open details`}
            className={cn(
              "inline-flex h-6 max-w-full items-center gap-1 rounded-full border border-border bg-card px-2 text-xs text-foreground transition-colors",
              "hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <Icon className="h-3 w-3 shrink-0 text-primary-text" aria-hidden="true" />
            <span ref={ref} className="min-w-0 max-w-[180px] truncate">
              {label}
            </span>
            {typeof count === "number" && (
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[320px] break-words text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
