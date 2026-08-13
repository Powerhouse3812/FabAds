import { MoreHorizontal, Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * MobileReportsHeader — the sticky h-12 title row at the top of mobile Reports.
 *
 * Reports needs its own header rather than leaning on the shell's MobileTopBar
 * because the level segments / search / filter row scroll away beneath it.
 * Keeping the level title here means the user always knows which entity level
 * they are looking at even after scrolling past the segments.
 *
 * (This used to also sit above a persistent account/page "scope bar" pinned
 * at `top-12`. That bar was cut as a product decision — see
 * `MobileReportsShell.tsx` — so this header is now the only sticky layer.)
 *
 * Export and Session-changes live in an overflow menu rather than as visible
 * buttons: at 375px the header's width belongs to the title, and neither is a
 * primary action on a phone.
 */
export interface MobileReportsHeaderProps {
  /** e.g. "Ad accounts" — what the current route actually renders. */
  title: string;
  onExport?: () => void;
  onOpenSessionChanges?: () => void;
  /** Count of simulated writes this session; shown as a dot on the menu. */
  sessionChangeCount?: number;
  className?: string;
}

export function MobileReportsHeader({
  title,
  onExport,
  onOpenSessionChanges,
  sessionChangeCount = 0,
  className,
}: MobileReportsHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3",
        className,
      )}
    >
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
        {title}
      </h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 shrink-0"
            aria-label="More report actions"
          >
            <MoreHorizontal className="h-5 w-5" />
            {sessionChangeCount > 0 && (
              // Makes the volatility of the demo store visible and countable
              // rather than something the user discovers on reload.
              <span
                aria-hidden
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {onExport && (
            <DropdownMenuItem onClick={onExport} className="min-h-11">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
          )}
          {onOpenSessionChanges && (
            <DropdownMenuItem onClick={onOpenSessionChanges} className="min-h-11">
              <History className="mr-2 h-4 w-4" />
              Session changes
              {sessionChangeCount > 0 && (
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {sessionChangeCount}
                </span>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default MobileReportsHeader;
