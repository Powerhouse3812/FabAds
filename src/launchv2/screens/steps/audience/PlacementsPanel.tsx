/**
 * PlacementsPanel — "Placements" tab of the Edit Targeting modal.
 *
 * Layout (Figma node 14579-33064 expanded / 14579-32665 collapsed):
 *   One bordered card containing:
 *     1. "Advanced placement" label + switch (OFF = Advantage+/automatic placements)
 *     2. When ON: a platform-grouped checkbox accordion tree
 *        (Facebook, Instagram, Audience network, Messenger, Threads)
 *        each row = chevron + platform name + "checked/total" badge.
 *
 * Writes to: plan.placementMode ("advantage" | "manual") and plan.placements
 * (PlacementSelection — Meta parity, see types.ts). This component is a
 * controlled leaf — TargetingTemplateModal owns the draft/save-cancel logic.
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlacementSelection } from "../../../types";

export interface PlacementsPanelProps {
  placementMode: "advantage" | "manual";
  onChangeMode: (mode: "advantage" | "manual") => void;
  placements: PlacementSelection;
  onChangePlacements: (next: PlacementSelection) => void;
  /**
   * When true, render WITHOUT the outer rounded-2xl border/bg wrapper so the
   * panel can sit inside a parent surface (children + dividers only).
   */
  bare?: boolean;
  /** Heading text shown next to the switch (default "Advanced placement"). */
  title?: string;
  /** Hide the heading text (the switch stays in place). */
  hideTitle?: boolean;
}

type Platform = keyof PlacementSelection;

interface PlatformGroup {
  platform: Platform;
  label: string;
  items: { key: string; label: string }[];
}

const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    platform: "facebook",
    label: "Facebook",
    items: [
      { key: "feeds", label: "Feed" },
      { key: "rightColumn", label: "Right hand column" },
      { key: "marketplace", label: "Marketplace" },
      { key: "videoFeeds", label: "Video feeds" },
      { key: "stories", label: "Story" },
      { key: "searchResults", label: "Search" },
      { key: "inStreamVideos", label: "Instream video" },
      { key: "reels", label: "Facebook reels" },
      { key: "profileFeed", label: "Profile feed" },
      { key: "businessExplore", label: "Business explore" },
      { key: "notifications", label: "Notifications" },
    ],
  },
  {
    platform: "instagram",
    label: "Instagram",
    items: [
      { key: "feed", label: "Feed" },
      { key: "profileFeed", label: "Profile feed" },
      { key: "explore", label: "Explore" },
      { key: "exploreHome", label: "Explore home" },
      { key: "stories", label: "Story" },
      { key: "reels", label: "Reels" },
      { key: "searchResults", label: "Search" },
    ],
  },
  {
    platform: "audienceNetwork",
    label: "Audience network",
    items: [
      { key: "nativeBannerInterstitial", label: "Native, banner & interstitial" },
      { key: "rewardedVideos", label: "Rewarded videos" },
    ],
  },
  {
    platform: "messenger",
    label: "Messenger",
    items: [
      { key: "inbox", label: "Inbox" },
      { key: "stories", label: "Story" },
      { key: "sponsoredMessages", label: "Sponsored messages" },
    ],
  },
  {
    platform: "threads",
    label: "Threads",
    items: [{ key: "feed", label: "Feed" }],
  },
];

/* ── Small local switch — matches the accessible switch pattern used elsewhere
   (e.g. Step2Setup's "Regulated category?" toggle). ─────────────────────── */
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors focus:outline-none focus:ring-4 focus:ring-[#8FB821]/30",
        checked ? "border-[#8FB821] bg-[#8FB821] dark:border-[#90BA24] dark:bg-[#90BA24]" : "border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#F0F0EC] dark:bg-[#1B1B1F]"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[19px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function CheckboxRow({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer py-0.5">
      <span
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] transition-colors",
          checked ? "border-[#8FB821] bg-[#8FB821] dark:border-[#90BA24] dark:bg-[#90BA24]" : "border-[#e7e5dc] dark:border-[#2a2a2a]"
        )}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L2.8 5L7 1" stroke="#121212" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
    </label>
  );
}

function PlatformRow({
  group,
  placements,
  open,
  onToggleOpen,
  onChange,
}: {
  group: PlatformGroup;
  placements: PlacementSelection;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (next: PlacementSelection) => void;
}) {
  const vals = placements[group.platform] as unknown as Record<string, boolean>;
  const checkedCount = group.items.filter((it) => vals[it.key]).length;

  function toggleOne(key: string) {
    const nextPlatform = { ...vals, [key]: !vals[key] };
    onChange({ ...placements, [group.platform]: nextPlatform } as PlacementSelection);
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-1.5 text-left"
      >
        <ChevronRight className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="flex-1 text-[13px] text-foreground">{group.label}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {checkedCount}/{group.items.length}
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-x-5 gap-y-1 py-1 pl-5">
          {group.items.map((it) => (
            <CheckboxRow key={it.key} checked={!!vals[it.key]} label={it.label} onToggle={() => toggleOne(it.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlacementsPanel({
  placementMode,
  onChangeMode,
  placements,
  onChangePlacements,
  bare = false,
  title = "Advanced placement",
  hideTitle = false,
}: PlacementsPanelProps) {
  const [openPlatform, setOpenPlatform] = useState<Platform | null>("facebook");
  const manual = placementMode === "manual";

  const content = (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {!hideTitle && <p className="text-[13px] font-medium text-foreground">{title}</p>}
        <Switch checked={manual} onChange={(v) => onChangeMode(v ? "manual" : "advantage")} />
      </div>

      {!manual && (
        <div className="border-t border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-4">
          <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
            Meta automatically shows your ads across placements likely to perform best (Advantage+ placements).
            Turn on Advanced placement to choose exactly where your ads appear.
          </p>
        </div>
      )}

      {manual && (
        <div className="border-t border-[#e7e5dc] dark:border-[#2a2a2a] px-4 py-2 divide-y divide-[#e7e5dc] dark:divide-[#2a2a2a]">
          {PLATFORM_GROUPS.map((group) => (
            <PlatformRow
              key={group.platform}
              group={group}
              placements={placements}
              open={openPlatform === group.platform}
              onToggleOpen={() => setOpenPlatform((p) => (p === group.platform ? null : group.platform))}
              onChange={onChangePlacements}
            />
          ))}
        </div>
      )}
    </>
  );

  if (bare) return content;

  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] overflow-hidden">
      {content}
    </div>
  );
}
