import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LibraryAssetTab = "ads" | "scripts" | "concepts" | "storyboards" | "hooks";

export interface LibraryAssetTabDef {
  key: LibraryAssetTab;
  label: string;
  Icon: LucideIcon;
  count: number;
}

/**
 * LibraryAssetTabBar — segmented pill switching the Library body between
 * Ads (the existing `GeneratedOutputsTab` view) and the new Script / Concept
 * / Storyboard tabs (owner: "in Library we also has to add different tabs,
 * for Showing generated scripts, concepts and other assets too").
 *
 * Visual grammar mirrors `MasonryGroupToggle` (the Library's other segmented
 * pill, one level up in `LibraryTopBar`) rather than importing it — that
 * component is a 2-option VIEW toggle scoped to the Ads tab only (Masonry /
 * By angle / By batch), a different axis from "which asset type", and it
 * lives in `components/`, outside this agent's ownership. Same tokens, a
 * separate control.
 *
 * Ads stays the default landing tab (per spec) — its key is omitted from the
 * URL, same delete-on-default convention every other Library filter here
 * already follows.
 */
export function LibraryAssetTabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: LibraryAssetTabDef[];
  active: LibraryAssetTab;
  onChange: (next: LibraryAssetTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Library asset type"
      className="inline-flex flex-wrap items-center gap-0.5 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5 self-start"
    >
      {tabs.map(({ key, label, Icon, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-g6-pill px-3 transition-colors",
              isActive
                ? "bg-g6-primary text-g6-text-on-accent shadow-g6-sm"
                : "text-g6-text-secondary hover:text-g6-text",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-g6-sans text-g6-xs font-medium">{label}</span>
            <span
              className={cn(
                "font-g6-mono text-[10px] tabular-nums",
                isActive ? "text-g6-text-on-accent/80" : "text-g6-text-tertiary",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
