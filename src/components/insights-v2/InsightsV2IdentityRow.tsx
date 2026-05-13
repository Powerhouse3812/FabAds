import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  InsightsSearchPopover,
  type InsightsSearchScope,
} from "./InsightsSearchPopover";

interface InsightsV2IdentityRowProps {
  sectionLabel: string;
  adCount: number;
  searchValue: string;
  onSearchChange: (next: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchFocus?: () => void;
  searchScope?: InsightsSearchScope;
  searchPopoverOpen: boolean;
  onSearchPopoverOpenChange: (next: boolean) => void;
  onApplyHere: (q: string) => void;
  className?: string;
}

/**
 * ROW 1 — Identity row. Foreplay-style page-identity band:
 *   [Section label]  [Ad count chip]   ........   [Big search w/ ⌘K hint]
 *
 * Sits ABOVE the toolbar. Always visible — does NOT collapse on scroll. The
 * row is short (py-2.5) and breathy. Search lives here permanently so it
 * stays reachable even when the toolbar collapses to compact.
 */
export function InsightsV2IdentityRow({
  sectionLabel,
  adCount,
  searchValue,
  onSearchChange,
  searchInputRef,
  onSearchFocus,
  searchScope = "feed",
  searchPopoverOpen,
  onSearchPopoverOpenChange,
  onApplyHere,
  className,
}: InsightsV2IdentityRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-2.5 border-b border-border/40 bg-background",
        className,
      )}
    >
      {/* Left: section label + ad count chip */}
      <div className="flex items-center min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {sectionLabel}
        </span>
        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground font-semibold">
            {adCount.toLocaleString()}
          </span>{" "}
          ads
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: big search bar with ⌘K hint */}
      <div className="relative w-full max-w-[460px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          placeholder="Search ads, brands, headlines…"
          className="h-9 pl-9 pr-14 text-[13px]"
          aria-label="Search feed"
        />
        <kbd
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground"
          aria-hidden
        >
          ⌘K
        </kbd>
        <InsightsSearchPopover
          query={searchValue}
          open={searchPopoverOpen}
          onOpenChange={onSearchPopoverOpenChange}
          onApplyHere={onApplyHere}
          anchorRef={searchInputRef as React.RefObject<HTMLInputElement>}
          currentScope={searchScope}
        />
      </div>
    </div>
  );
}
