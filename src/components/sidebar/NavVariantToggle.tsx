import { Sidebar, LayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFabAdsNavVariant } from "@/components/sidebar/useFabAdsNavVariant";

/**
 * Single-icon toggle that cycles between FabAds shell nav variants.
 *
 * Behaviour mirrors the dark/light mode toggle (Sun ↔ Moon):
 *   - Renders the icon of the *currently active* variant.
 *   - One click flips to the other variant.
 *   - Tooltip names the *destination* ("Switch to Sections", "Switch to Rail").
 *
 * Sits in SidebarFooter where DarkModeToggleIcon used to live.
 */
export function NavVariantToggle({ compact = false }: { compact?: boolean }) {
  const { variant, cycle } = useFabAdsNavVariant();
  const isRail = variant === "rail";
  const tooltip = isRail ? "Switch to Sections" : "Switch to Rail";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={cycle}
          aria-label={tooltip}
          className={cn(
            "relative flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary transition-colors",
            compact ? "w-10 h-10" : "w-9 h-9"
          )}
        >
          {/* Cross-fade between Sidebar (rail mode) and LayoutGrid (sections mode).
              Uses the same animation grammar as DarkModeToggleIcon (rotate + scale + fade). */}
          <Sidebar
            className={cn(
              "h-5 w-5 absolute transition-all duration-300 ease-in-out",
              isRail ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            )}
          />
          <LayoutGrid
            className={cn(
              "h-5 w-5 absolute transition-all duration-300 ease-in-out",
              isRail ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side={compact ? "right" : "top"} className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
