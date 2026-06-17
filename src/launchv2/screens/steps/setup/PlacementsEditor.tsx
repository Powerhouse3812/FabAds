/**
 * PlacementsEditor — full Meta placement checkbox tree grouped by platform.
 * Decision 9: all placement positions, collapsible groups, select-all per group.
 * Writes to plan.placements (PlacementSelection type).
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlacementSelection } from "../../../types";

/* ---- placement data ---- */

type PlacementGroup = {
  platform: keyof PlacementSelection;
  label: string;
  placements: { key: string; label: string }[];
};

const PLACEMENT_GROUPS: PlacementGroup[] = [
  {
    platform: "facebook",
    label: "Facebook",
    placements: [
      { key: "feeds", label: "Facebook Feed" },
      { key: "inStreamVideos", label: "Facebook In-stream Video" },
      { key: "stories", label: "Facebook Stories" },
      { key: "reels", label: "Facebook Reels" },
      { key: "searchResults", label: "Facebook Search Results" },
      { key: "marketplace", label: "Facebook Marketplace" },
    ],
  },
  {
    platform: "instagram",
    label: "Instagram",
    placements: [
      { key: "feed", label: "Instagram Feed" },
      { key: "profileFeed", label: "Instagram Explore Home" },
      { key: "stories", label: "Instagram Stories" },
      { key: "reels", label: "Instagram Reels" },
      { key: "explore", label: "Instagram Explore" },
    ],
  },
  {
    platform: "audienceNetwork",
    label: "Audience Network",
    placements: [
      { key: "nativeBannerInterstitial", label: "Audience Network Native / Banner / Interstitial" },
      { key: "rewardedVideos", label: "Audience Network Rewarded Video" },
    ],
  },
  {
    platform: "messenger",
    label: "Messenger",
    placements: [
      { key: "inbox", label: "Messenger Inbox" },
      { key: "stories", label: "Messenger Stories" },
    ],
  },
];

/* ---- internal helper types ---- */

type PlatformState = {
  [K in keyof PlacementSelection]: Record<string, boolean>;
};

function getPlatformState(placements: PlacementSelection, platform: keyof PlacementSelection): Record<string, boolean> {
  return placements[platform] as unknown as Record<string, boolean>;
}

/* ---- PlatformGroup ---- */

function PlatformGroup({
  group,
  placements,
  onChange,
}: {
  group: PlacementGroup;
  placements: PlacementSelection;
  onChange: (next: PlacementSelection) => void;
}) {
  const [open, setOpen] = useState(true);
  const platformVals = getPlatformState(placements, group.platform);
  const checkedCount = group.placements.filter((p) => platformVals[p.key]).length;
  const allChecked = checkedCount === group.placements.length;

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = { ...placements };
    const updatedPlatform = { ...platformVals };
    group.placements.forEach((p) => {
      (updatedPlatform as Record<string, boolean>)[p.key] = !allChecked;
    });
    (next as PlatformState)[group.platform] = updatedPlatform as PlacementSelection[typeof group.platform];
    onChange(next);
  };

  const toggleOne = (key: string) => {
    const next = { ...placements };
    const updatedPlatform = { ...platformVals, [key]: !platformVals[key] };
    (next as PlatformState)[group.platform] = updatedPlatform as PlacementSelection[typeof group.platform];
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {group.label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {checkedCount}/{group.placements.length}
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            "ml-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
            allChecked
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          {allChecked ? "Deselect all" : "Select all"}
        </button>
      </button>

      {/* Placement rows */}
      {open && (
        <div className="divide-y divide-border/30 border-t border-border/50">
          {group.placements.map((p) => {
            const checked = !!platformVals[p.key];
            return (
              <label
                key={p.key}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-[7px] hover:bg-muted/20 transition-colors"
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all",
                    checked ? "border-primary bg-primary" : "border-border",
                  )}
                >
                  {checked && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path
                        d="M1 3L2.8 5L7 1"
                        stroke="#121212"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-foreground">{p.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOne(p.key)}
                  className="sr-only"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Main export ---- */

export default function PlacementsEditor({
  placements,
  onChange,
}: {
  placements: PlacementSelection;
  onChange: (next: PlacementSelection) => void;
}) {
  return (
    <div className="space-y-2">
      {PLACEMENT_GROUPS.map((group) => (
        <PlatformGroup
          key={group.platform}
          group={group}
          placements={placements}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
