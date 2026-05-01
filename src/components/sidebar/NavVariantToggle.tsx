import { Sidebar, LayoutGrid, ListTree } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  useFabAdsNavVariant,
  getNextVariant,
  type FabAdsNavVariant,
} from "@/components/sidebar/useFabAdsNavVariant";

/**
 * Single-icon toggle that cycles through FabAds shell nav variants.
 *
 * Behaviour mirrors the dark/light mode toggle (Sun ↔ Moon), extended to 3
 * states with a cross-fade between icons:
 *
 *   rail      → <Sidebar />     (two-tier rail metaphor)
 *   sections  → <LayoutGrid />  (sectioned single-pane metaphor)
 *   focus     → <ListTree />    (drill-in hierarchy metaphor)
 *
 * One click cycles to the next variant in order. Tooltip names the
 * destination ("Switch to Sections", "Switch to Focus", "Switch to Rail").
 *
 * Sits in SidebarFooter where DarkModeToggleIcon used to live.
 */

const VARIANT_LABEL: Record<FabAdsNavVariant, string> = {
  rail: "Rail",
  sections: "Sections",
  focus: "Focus",
};

export function NavVariantToggle({ compact = false }: { compact?: boolean }) {
  const { variant, cycle } = useFabAdsNavVariant();
  const next = getNextVariant(variant);
  const tooltip = `Switch to ${VARIANT_LABEL[next]}`;

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
          {/* Cross-fade between three variant icons. Same animation grammar as
              DarkModeToggleIcon (rotate + scale + fade) — only the active
              variant's icon is visible at any moment. */}
          <Sidebar
            className={cn(
              "h-5 w-5 absolute transition-all duration-300 ease-in-out",
              variant === "rail"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-0"
            )}
          />
          <LayoutGrid
            className={cn(
              "h-5 w-5 absolute transition-all duration-300 ease-in-out",
              variant === "sections"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 rotate-90 scale-0"
            )}
          />
          <ListTree
            className={cn(
              "h-5 w-5 absolute transition-all duration-300 ease-in-out",
              variant === "focus"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-0"
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
