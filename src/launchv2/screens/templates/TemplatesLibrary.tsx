/**
 * TemplatesLibrary — Audience & Placement templates.
 *
 * Layout:
 *   Grid mode  — 2-col card grid (left flex) + 320px sticky preview rail (right)
 *   Edit mode  — 300px card strip (left) + full-width APTemplateEditor (right)
 *
 * Design: FabFunnel v1.2
 *   Lime #8FB821 for Advantage+ accent / blue #3B82F6 for Manual
 *   Age range as hero number · left accent bar on cards
 *   setSubNavCollapsed wired on edit open / close / unmount
 */

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { templatesService } from "../../templates/service";
import type {
  AudiencePlacementPayload,
  AudiencePlacementTemplate,
  APLocation,
  APInterest,
} from "../../templates/types";
import { setSubNavCollapsed } from "@/components/shell/useSubNavCollapsed";

/* ─────────────────────────────────────────────────────────────────── */
/* Helpers                                                             */
/* ─────────────────────────────────────────────────────────────────── */

function relativeTime(ts?: number): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

type PlacementFilter = "all" | "advantage" | "manual";
type SortKey = "recent" | "name" | "placement";

/* ─────────────────────────────────────────────────────────────────── */
/* Static mock data                                                    */
/* ─────────────────────────────────────────────────────────────────── */

const SAMPLE_LOCATIONS: APLocation[] = [
  { key: "IN", name: "India", type: "country" },
  { key: "US", name: "United States", type: "country" },
  { key: "GB", name: "United Kingdom", type: "country" },
  { key: "AU", name: "Australia", type: "country" },
  { key: "CA", name: "Canada", type: "country" },
  { key: "SG", name: "Singapore", type: "country" },
  { key: "AE", name: "UAE", type: "country" },
  { key: "IN:Delhi", name: "Delhi", type: "city" },
  { key: "IN:Mumbai", name: "Mumbai", type: "city" },
  { key: "IN:Bangalore", name: "Bangalore", type: "city" },
  { key: "IN:Chennai", name: "Chennai", type: "city" },
  { key: "IN:Hyderabad", name: "Hyderabad", type: "city" },
  { key: "IN:Pune", name: "Pune", type: "city" },
  { key: "IN:Ahmedabad", name: "Ahmedabad", type: "city" },
  { key: "IN:Jaipur", name: "Jaipur", type: "city" },
  { key: "US:NY", name: "New York", type: "city" },
  { key: "US:LA", name: "Los Angeles", type: "city" },
];

const SAMPLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
];

const SAMPLE_INTERESTS: APInterest[] = [
  { id: "i_fashion", name: "Fashion", type: "interest" },
  { id: "i_beauty", name: "Beauty & Cosmetics", type: "interest" },
  { id: "i_tech", name: "Consumer Electronics", type: "interest" },
  { id: "i_ecomm", name: "Online Shopping", type: "behavior" },
  { id: "i_engaged", name: "Engaged Shoppers", type: "behavior" },
  { id: "i_fitness", name: "Health & Fitness", type: "interest" },
  { id: "i_travel", name: "Travel", type: "interest" },
  { id: "i_food", name: "Food & Dining", type: "interest" },
  { id: "i_parenting", name: "Parenting", type: "interest" },
  { id: "i_edu", name: "Education", type: "demographic" },
  { id: "i_biz", name: "Small Business Owners", type: "demographic" },
  { id: "i_skincare", name: "Skincare", type: "interest" },
  { id: "i_gaming", name: "Gaming", type: "interest" },
  { id: "i_auto", name: "Automotive", type: "interest" },
];

const OPTIMIZATION_GOALS = [
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "REACH", label: "Reach" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "VALUE", label: "Purchase Value" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "VIDEO_VIEWS", label: "Video Views" },
  { value: "POST_ENGAGEMENT", label: "Post Engagement" },
  { value: "LEAD_GENERATION", label: "Lead Generation" },
];

const PLACEMENT_GROUPS: Array<{
  label: string;
  keys: Array<{ key: keyof AudiencePlacementPayload["manualPlacements"]; label: string }>;
}> = [
  {
    label: "Facebook",
    keys: [
      { key: "fbFeed", label: "Feed" },
      { key: "fbStories", label: "Stories" },
      { key: "fbReels", label: "Reels" },
      { key: "fbMarketplace", label: "Marketplace" },
      { key: "fbRightColumn", label: "Right Column" },
      { key: "fbVideoFeeds", label: "Video Feeds" },
      { key: "fbSearch", label: "Search" },
    ],
  },
  {
    label: "Instagram",
    keys: [
      { key: "igFeed", label: "Feed" },
      { key: "igStories", label: "Stories" },
      { key: "igReels", label: "Reels" },
      { key: "igExplore", label: "Explore" },
      { key: "igSearch", label: "Search" },
    ],
  },
  {
    label: "Audience Network",
    keys: [
      { key: "anNative", label: "Native" },
      { key: "anRewarded", label: "Rewarded" },
    ],
  },
  {
    label: "Messenger",
    keys: [
      { key: "msInbox", label: "Inbox" },
      { key: "msStories", label: "Stories" },
    ],
  },
];

function emptyManualPlacements(): AudiencePlacementPayload["manualPlacements"] {
  return {
    fbFeed: false, fbStories: false, fbReels: false, fbMarketplace: false,
    fbRightColumn: false, fbVideoFeeds: false, fbSearch: false,
    igFeed: false, igStories: false, igReels: false, igExplore: false, igSearch: false,
    anNative: false, anRewarded: false,
    msInbox: false, msStories: false,
  };
}

const DEFAULT_PAYLOAD: AudiencePlacementPayload = {
  ageMin: 18, ageMax: 65, gender: "all",
  locations: [], languages: [],
  detailedTargeting: [], customAudiences: [], exclusions: [],
  advantageAudience: true,
  placementMode: "advantage",
  manualPlacements: emptyManualPlacements(),
  optimizationGoal: "OFFSITE_CONVERSIONS",
  attributionClickWindow: 7,
  attributionViewWindow: 1,
  specialAdCategories: [],
};

function goalLabel(val: string): string {
  return OPTIMIZATION_GOALS.find((g) => g.value === val)?.label ?? val;
}

function langName(code: string): string {
  return SAMPLE_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

/* ─────────────────────────────────────────────────────────────────── */
/* SearchItem — normalised item for the chip-search dropdown           */
/* ─────────────────────────────────────────────────────────────────── */

interface SearchItem {
  id: string;
  name: string;
  meta?: string;
}

function ChipSearchInput({
  label,
  placeholder,
  options,
  selected,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  options: SearchItem[];
  selected: SearchItem[];
  onAdd: (item: SearchItem) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map((s) => s.id));
  const filtered = options.filter(
    (item) =>
      !selectedIds.has(item.id) &&
      item.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        {label}
      </span>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-0.5">
          {selected.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:bg-[#e7e5dc] dark:hover:bg-[#323232] transition-colors"
            >
              {item.name}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
        </div>
      )}
      <div ref={wrapRef} className="relative">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(15,15,12,0.38)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full h-9 pl-8 pr-3 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] font-mono text-[12px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.38)] dark:placeholder:text-[rgba(255,255,255,0.38)] outline-none focus:border-[#8FB821] focus:ring-1 focus:ring-[#8FB821]/20 transition-all"
          />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1E1E23] border border-[#e7e5dc] dark:border-[#2a2a2a] rounded-xl shadow-md z-20 overflow-hidden max-h-[180px] overflow-y-auto">
            {filtered.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onAdd(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left flex items-center justify-between px-4 py-2 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors"
              >
                <span className="text-[12px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  {item.name}
                </span>
                {item.meta && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                    {item.meta}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* APTemplateCard                                                      */
/* ─────────────────────────────────────────────────────────────────── */

function APTemplateCard({
  template,
  selected,
  onClick,
}: {
  template: AudiencePlacementTemplate;
  selected: boolean;
  onClick: () => void;
}) {
  const p = template.payload;
  const accentColor = p.placementMode === "advantage" ? "#8FB821" : "#3B82F6";
  const shownLocs = p.locations.slice(0, 3);
  const extraLocs = p.locations.length - 3;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative w-full text-left rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden",
        "pl-7 pr-4 pt-4 pb-3 min-h-[140px]",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-2",
        selected
          ? "border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09] shadow-sm"
          : "border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B] hover:border-[#8FB821]/40",
      ].join(" ")}
    >
      {/* Left accent bar */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Name + placement chip */}
      <div className="flex items-start justify-between gap-2 mb-2 pr-1">
        <span className="text-[13px] font-semibold leading-snug text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] line-clamp-2 flex-1 min-w-0">
          {template.name}
        </span>
        <span
          className={[
            "flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full leading-none mt-0.5",
            p.placementMode === "advantage"
              ? "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165]"
              : "bg-[#EFF6FF] dark:bg-[#1E2A4A] text-[#1D4ED8] dark:text-[#93C5FD]",
          ].join(" ")}
        >
          {p.placementMode === "advantage" ? "Auto" : "Manual"}
        </span>
      </div>

      {/* Age hero */}
      <p className="font-mono text-[18px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight mb-0.5">
        {p.ageMin}–{p.ageMax}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none mb-3">
        age range
      </p>

      {/* Divider */}
      <div className="border-b border-[#e7e5dc]/60 dark:border-[#2a2a2a]/60 mb-2.5" />

      {/* Goal + gender chips */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full leading-none bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
          {goalLabel(p.optimizationGoal)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full leading-none bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
          {p.gender === "all" ? "All" : p.gender === "men" ? "Men" : "Women"}
        </span>
      </div>

      {/* Location chips — max 3 */}
      {p.locations.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {shownLocs.map((loc) => (
            <span
              key={loc.key}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-[#efeee7] dark:border-[#2a2a2a] bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
            >
              {loc.name}
            </span>
          ))}
          {extraLocs > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-[#efeee7] dark:border-[#2a2a2a] bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
              +{extraLocs}
            </span>
          )}
        </div>
      )}

      {/* Footer timestamp */}
      <div className="font-mono text-[10px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] tabular-nums">
        {relativeTime(template.updatedAt)}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Rail helpers                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function RailSection({ label }: { label: string }) {
  return (
    <div className="pb-2 mb-3 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        {label}
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] flex-shrink-0">
        {label}
      </span>
      <span className="text-[12px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] text-right" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* APPreviewRail                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function APPreviewRail({
  template,
  onClose,
  onRefresh,
  onEdit,
}: {
  template: AudiencePlacementTemplate | null;
  onClose: () => void;
  onRefresh: () => void;
  onEdit: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [duplicated, setDuplicated] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRenaming(false);
    setDuplicated(false);
    setDeleteConfirm(false);
    if (template) setRenameValue(template.name);
  }, [template?.id]);

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #8FB821 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] flex items-center justify-center mb-4 mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8FB821" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] mb-1" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
            Select a template to preview
          </p>
          <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] leading-snug">
            Audience, placement & optimisation
            <br />details appear here
          </p>
        </div>
      </div>
    );
  }

  const p = template.payload;

  const activeManualPlacements = p.placementMode === "manual"
    ? (Object.entries(p.manualPlacements) as Array<[string, boolean]>)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== template!.name) {
      templatesService.renameAudiencePlacement(template!.id, trimmed);
      onRefresh();
    }
    setRenaming(false);
  }

  function handleRenameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") setRenaming(false);
  }

  function handleDuplicate() {
    templatesService.saveAudiencePlacement(`${template!.name} (copy)`, { ...template!.payload });
    onRefresh();
    setDuplicated(true);
    setTimeout(() => setDuplicated(false), 2500);
  }

  function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    templatesService.removeAudiencePlacement(template!.id);
    onRefresh();
    onClose();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a] flex-shrink-0">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKey}
              className="w-full text-[13px] font-semibold bg-transparent border-0 border-b-2 border-[#8FB821] outline-none text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] pb-0.5"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            />
          ) : (
            <h2
              className="text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-snug line-clamp-2"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              {template.name}
            </h2>
          )}
          <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mt-0.5 tabular-nums">
            {relativeTime(template.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit(template.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
            aria-label="Edit template"
            title="Edit template"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
            aria-label="Close preview"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Audience */}
        <RailSection label="Audience" />
        <div className="mb-4">
          <MetaRow label="Age" value={`${p.ageMin}–${p.ageMax}`} />
          <MetaRow label="Gender" value={p.gender === "all" ? "All genders" : p.gender === "men" ? "Men" : "Women"} />
          {p.advantageAudience && (
            <div className="flex items-start justify-between gap-3 py-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] flex-shrink-0">
                Audience+
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165]">
                On
              </span>
            </div>
          )}
        </div>

        {p.locations.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-2">
              Locations
            </p>
            <div className="flex flex-wrap gap-1">
              {p.locations.map((loc) => (
                <span key={loc.key} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  {loc.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {p.languages.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-2">
              Languages
            </p>
            <div className="flex flex-wrap gap-1">
              {p.languages.map((code) => (
                <span key={code} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  {langName(code)}
                </span>
              ))}
            </div>
          </div>
        )}

        {p.detailedTargeting.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-2">
              Interests
            </p>
            <div className="flex flex-wrap gap-1">
              {p.detailedTargeting.slice(0, 5).map((interest) => (
                <span key={interest.id} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  {interest.name}
                </span>
              ))}
              {p.detailedTargeting.length > 5 && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  +{p.detailedTargeting.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Placement */}
        <RailSection label="Placement" />
        <div className="mb-4">
          <span
            className={[
              "font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full leading-none",
              p.placementMode === "advantage"
                ? "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165]"
                : "bg-[#EFF6FF] dark:bg-[#1E2A4A] text-[#1D4ED8] dark:text-[#93C5FD]",
            ].join(" ")}
          >
            {p.placementMode === "advantage" ? "Advantage+ Auto" : "Manual"}
          </span>
          {p.placementMode === "manual" && activeManualPlacements.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeManualPlacements.slice(0, 4).map((k) => (
                <span key={k} className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  {k}
                </span>
              ))}
              {activeManualPlacements.length > 4 && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  +{activeManualPlacements.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Optimization */}
        <RailSection label="Optimization" />
        <div className="mb-4">
          <MetaRow label="Goal" value={goalLabel(p.optimizationGoal)} />
          <MetaRow label="Click" value={`${p.attributionClickWindow}d`} />
          <MetaRow label="View" value={`${p.attributionViewWindow}d`} />
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-[#e7e5dc] dark:border-[#2a2a2a] space-y-2">
        <button
          type="button"
          className="w-full h-9 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors shadow-sm"
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
          Use in launch
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex-1 h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            {duplicated ? (
              <span className="text-[#5B7611] dark:text-[#C3E165] font-semibold">Copied!</span>
            ) : "Duplicate"}
          </button>
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="flex-1 h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            Rename
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          onBlur={() => setTimeout(() => setDeleteConfirm(false), 200)}
          className={[
            "w-full h-9 rounded-full border text-[13px] font-medium transition-colors",
            deleteConfirm
              ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
              : "border-[#e7e5dc] dark:border-[#2a2a2a] text-red-500 dark:text-red-400 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950",
          ].join(" ")}
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
          {deleteConfirm ? "Confirm delete" : "Delete"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* APTemplateEditor — full-width 3-tab editor                          */
/* ─────────────────────────────────────────────────────────────────── */

type EditorTab = "demographics" | "placements" | "optimization";

function APTemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: AudiencePlacementTemplate;
  onSave: (name: string, payload: AudiencePlacementPayload) => void;
  onCancel: () => void;
}) {
  const [tab, setTab] = useState<EditorTab>("demographics");
  const [name, setName] = useState(template.name);
  const [p, setP] = useState<AudiencePlacementPayload>(template.payload);

  useEffect(() => {
    setName(template.name);
    setP(template.payload);
    setTab("demographics");
  }, [template.id]);

  function patch(partial: Partial<AudiencePlacementPayload>) {
    setP((prev) => ({ ...prev, ...partial }));
  }

  function patchManual(key: keyof AudiencePlacementPayload["manualPlacements"], val: boolean) {
    setP((prev) => ({
      ...prev,
      manualPlacements: { ...prev.manualPlacements, [key]: val },
    }));
  }

  /* Location helpers */
  function addLocation(loc: APLocation) {
    if (!p.locations.find((l) => l.key === loc.key)) {
      patch({ locations: [...p.locations, loc] });
    }
  }
  function removeLocation(key: string) {
    patch({ locations: p.locations.filter((l) => l.key !== key) });
  }

  /* Exclusion helpers */
  function addExclusion(key: string) {
    if (!p.exclusions.includes(key)) {
      patch({ exclusions: [...p.exclusions, key] });
    }
  }
  function removeExclusion(key: string) {
    patch({ exclusions: p.exclusions.filter((k) => k !== key) });
  }

  /* Language helpers */
  function addLang(code: string) {
    if (!p.languages.includes(code)) {
      patch({ languages: [...p.languages, code] });
    }
  }
  function removeLang(code: string) {
    patch({ languages: p.languages.filter((l) => l !== code) });
  }

  /* Interest helpers */
  function addInterest(interest: APInterest) {
    if (!p.detailedTargeting.find((i) => i.id === interest.id)) {
      patch({ detailedTargeting: [...p.detailedTargeting, interest] });
    }
  }
  function removeInterest(id: string) {
    patch({ detailedTargeting: p.detailedTargeting.filter((i) => i.id !== id) });
  }

  /* Normalise to SearchItem */
  const locationOptions: SearchItem[] = SAMPLE_LOCATIONS
    .filter((loc) => !p.exclusions.includes(loc.key))
    .map((loc) => ({ id: loc.key, name: loc.name, meta: loc.type }));

  const selectedLocItems: SearchItem[] = p.locations.map((l) => ({ id: l.key, name: l.name }));

  const exclusionOptions: SearchItem[] = SAMPLE_LOCATIONS
    .filter((loc) => !p.locations.find((l) => l.key === loc.key))
    .map((loc) => ({ id: loc.key, name: loc.name, meta: loc.type }));

  const selectedExclItems: SearchItem[] = p.exclusions.map((key) => {
    const found = SAMPLE_LOCATIONS.find((l) => l.key === key);
    return { id: key, name: found?.name ?? key };
  });

  const langOptions: SearchItem[] = SAMPLE_LANGUAGES
    .filter((l) => !p.languages.includes(l.code))
    .map((l) => ({ id: l.code, name: l.name }));

  const selectedLangItems: SearchItem[] = p.languages.map((code) => ({
    id: code,
    name: langName(code),
  }));

  const interestOptions: SearchItem[] = SAMPLE_INTERESTS
    .filter((i) => !p.detailedTargeting.find((d) => d.id === i.id))
    .map((i) => ({ id: i.id, name: i.name, meta: i.type }));

  const selectedInterestItems: SearchItem[] = p.detailedTargeting.map((i) => ({
    id: i.id,
    name: i.name,
    meta: i.type,
  }));

  const tabs: { id: EditorTab; label: string }[] = [
    { id: "demographics", label: "Demographics" },
    { id: "placements", label: "Placements" },
    { id: "optimization", label: "Optimization" },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1E1E23] overflow-hidden">
      {/* Editor header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="flex-1 min-w-0 text-[19px] font-bold bg-transparent border-0 border-b-2 border-[#8FB821] outline-none text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] pb-1"
            style={{ fontFamily: "Geist, system-ui, sans-serif", letterSpacing: "-0.01em" }}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="h-8 px-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[12px] font-medium text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:border-[#8FB821]/50 hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(name, p)}
              className="h-8 px-4 rounded-full bg-[#8FB821] hover:bg-[#AACF32] text-[#121212] text-[12px] font-semibold transition-colors"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              Save changes
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "font-mono text-[11px] uppercase tracking-[0.06em] font-semibold px-4 py-2 border-b-2 transition-colors -mb-px",
                tab === t.id
                  ? "border-[#8FB821] text-[#5B7611] dark:text-[#C3E165]"
                  : "border-transparent text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] hover:text-[rgba(15,15,12,0.72)] dark:hover:text-[rgba(255,255,255,0.72)]",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* ── Demographics ── */}
        {tab === "demographics" && (
          <div className="flex flex-col gap-6 max-w-[640px]">
            {/* Static reach bar */}
            <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] p-4">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                  Estimated Reach
                </span>
                <span className="font-mono text-[17px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
                  ~15.3M
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] overflow-hidden">
                <div className="h-full w-[62%] rounded-full bg-[#8FB821] opacity-70" />
              </div>
              <p className="font-mono text-[10px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] mt-2">
                Based on current targeting settings
              </p>
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                  Age Range
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={13}
                    max={64}
                    value={p.ageMin}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      patch({ ageMin: Math.max(13, Math.min(Number(e.target.value), p.ageMax - 1)) })
                    }
                    className="w-[72px] h-10 text-center rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#18181B] font-mono text-[15px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-1 focus:ring-[#8FB821]/20 transition-all"
                  />
                  <span className="font-mono text-[14px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">–</span>
                  <input
                    type="number"
                    min={14}
                    max={65}
                    value={p.ageMax}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      patch({ ageMax: Math.max(p.ageMin + 1, Math.min(65, Number(e.target.value))) })
                    }
                    className="w-[72px] h-10 text-center rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#18181B] font-mono text-[15px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-1 focus:ring-[#8FB821]/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                  Gender
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "men", "women"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => patch({ gender: g })}
                      className={[
                        "h-9 px-3 rounded-full text-[12px] font-semibold transition-colors capitalize",
                        p.gender === g
                          ? "bg-[#8FB821] text-[#121212]"
                          : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
                      ].join(" ")}
                      style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                    >
                      {g === "all" ? "All" : g === "men" ? "Men" : "Women"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ChipSearchInput
              label="Including Location"
              placeholder="Search countries, cities…"
              options={locationOptions}
              selected={selectedLocItems}
              onAdd={(item) => {
                const found = SAMPLE_LOCATIONS.find((l) => l.key === item.id);
                if (found) addLocation(found);
              }}
              onRemove={removeLocation}
            />

            <ChipSearchInput
              label="Excluding Location"
              placeholder="Search locations to exclude…"
              options={exclusionOptions}
              selected={selectedExclItems}
              onAdd={(item) => addExclusion(item.id)}
              onRemove={removeExclusion}
            />

            <ChipSearchInput
              label="Languages"
              placeholder="Search languages…"
              options={langOptions}
              selected={selectedLangItems}
              onAdd={(item) => addLang(item.id)}
              onRemove={removeLang}
            />

            <ChipSearchInput
              label="Detailed Targeting"
              placeholder="Search interests, behaviors…"
              options={interestOptions}
              selected={selectedInterestItems}
              onAdd={(item) => {
                const found = SAMPLE_INTERESTS.find((i) => i.id === item.id);
                if (found) addInterest(found);
              }}
              onRemove={removeInterest}
            />
          </div>
        )}

        {/* ── Placements ── */}
        {tab === "placements" && (
          <div className="flex flex-col gap-6 max-w-[640px]">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Placement Mode
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patch({ placementMode: "advantage" })}
                  className={[
                    "h-9 px-4 rounded-full text-[12px] font-semibold transition-colors",
                    p.placementMode === "advantage"
                      ? "bg-[#8FB821] text-[#121212]"
                      : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
                  ].join(" ")}
                  style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                >
                  Advantage+ (Auto)
                </button>
                <button
                  type="button"
                  onClick={() => patch({ placementMode: "manual" })}
                  className={[
                    "h-9 px-4 rounded-full text-[12px] font-semibold transition-colors",
                    p.placementMode === "manual"
                      ? "bg-[#3B82F6] text-white"
                      : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#3B82F6]/50",
                  ].join(" ")}
                  style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                >
                  Manual
                </button>
              </div>
            </div>

            {p.placementMode === "advantage" ? (
              <div className="rounded-2xl border border-[#8FB821]/30 p-5 bg-[#F5FBE2] dark:bg-[#1D2A09]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#8FB821]/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B7611" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#5B7611] dark:text-[#C3E165] mb-1" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                      Advantage+ Placements
                    </p>
                    <p className="font-mono text-[11px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] leading-relaxed">
                      Meta will automatically place your ads across all eligible placements to maximise performance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {PLACEMENT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-2">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.keys.map(({ key, label }) => {
                        const checked = p.manualPlacements[key];
                        return (
                          <label
                            key={key}
                            className={[
                              "flex items-center gap-2.5 h-9 px-3 rounded-xl border cursor-pointer transition-all select-none",
                              checked
                                ? "border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09]"
                                : "border-[#e7e5dc] dark:border-[#2a2a2a] hover:border-[#8FB821]/40 bg-white dark:bg-[#18181B]",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                patchManual(key, e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded accent-[#8FB821] flex-shrink-0"
                            />
                            <span className="font-mono text-[11px] font-semibold text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Optimization ── */}
        {tab === "optimization" && (
          <div className="flex flex-col gap-6 max-w-[480px]">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Performance Goal
              </span>
              <div className="relative">
                <select
                  value={p.optimizationGoal}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    patch({ optimizationGoal: e.target.value })
                  }
                  className="w-full h-11 pl-4 pr-10 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#18181B] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-1 focus:ring-[#8FB821]/20 appearance-none cursor-pointer transition-all"
                  style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                >
                  {OPTIMIZATION_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] p-4 flex flex-col gap-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Attribution Window
              </p>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  Click
                </span>
                <div className="flex gap-1.5">
                  {([1, 7, 28] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => patch({ attributionClickWindow: d })}
                      className={[
                        "h-9 px-4 rounded-full font-mono text-[12px] font-semibold transition-colors",
                        p.attributionClickWindow === d
                          ? "bg-[#8FB821] text-[#121212]"
                          : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
                      ].join(" ")}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  View
                </span>
                <div className="flex gap-1.5">
                  {([0, 1] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => patch({ attributionViewWindow: d })}
                      className={[
                        "h-9 px-4 rounded-full font-mono text-[12px] font-semibold transition-colors",
                        p.attributionViewWindow === d
                          ? "bg-[#8FB821] text-[#121212]"
                          : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
                      ].join(" ")}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* ZeroState                                                           */
/* ─────────────────────────────────────────────────────────────────── */

function ZeroState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8FB821 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] flex items-center justify-center mb-5 mx-auto ring-1 ring-[#8FB821]/20">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8FB821" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3
          className="text-[15px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] mb-1"
          style={{ fontFamily: "Geist, system-ui, sans-serif", letterSpacing: "-0.01em" }}
        >
          No templates saved yet
        </h3>
        <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-relaxed max-w-[260px] mb-6">
          Save audience, placement & optimisation settings as reusable templates for faster launches.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors shadow-sm"
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New template
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* TemplatesLibrary — main export                                      */
/* ─────────────────────────────────────────────────────────────────── */

export function TemplatesLibrary() {
  const [templates, setTemplates] = useState<AudiencePlacementTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState<PlacementFilter>("all");

  const refresh = () => setTemplates(templatesService.listAudiencePlacement());

  useEffect(() => { refresh(); }, []);

  function openEditor(id: string) {
    setSelectedId(id);
    setEditingId(id);
    setSubNavCollapsed(true);
  }

  function closeEditor() {
    setEditingId(null);
    setSubNavCollapsed(false);
  }

  useEffect(() => {
    return () => setSubNavCollapsed(false);
  }, []);

  /* Clean up stale selection/edit after delete */
  useEffect(() => {
    if (selectedId && !templates.find((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
    if (editingId && !templates.find((t) => t.id === editingId)) {
      closeEditor();
    }
  }, [templates]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayList = templates
    .filter((t) => {
      if (filter === "advantage") return t.payload.placementMode === "advantage";
      if (filter === "manual") return t.payload.placementMode === "manual";
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "placement")
        return (a.payload.placementMode === "advantage" ? 0 : 1) - (b.payload.placementMode === "advantage" ? 0 : 1);
      return b.updatedAt - a.updatedAt;
    });

  const selected = selectedId ? templates.find((t) => t.id === selectedId) ?? null : null;
  const editing = editingId ? templates.find((t) => t.id === editingId) ?? null : null;
  const showRail = selectedId !== null && editingId === null;

  function handleCreate() {
    const blank = templatesService.saveAudiencePlacement("Untitled template", { ...DEFAULT_PAYLOAD });
    refresh();
    openEditor(blank.id);
  }

  function handleEditorSave(name: string, payload: AudiencePlacementPayload) {
    if (!editingId) return;
    templatesService.updateAudiencePlacement(editingId, payload);
    templatesService.renameAudiencePlacement(editingId, name);
    refresh();
    closeEditor();
  }

  const filterChips: { id: PlacementFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "advantage", label: "Advantage+" },
    { id: "manual", label: "Manual" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFAF7] dark:bg-[#18181B] min-h-[100dvh]">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1
              className="text-[29px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
              style={{ fontFamily: "Geist, system-ui, sans-serif", letterSpacing: "-0.01em" }}
            >
              Templates
            </h1>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165] tabular-nums">
              {templates.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select
                value={sort}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortKey)}
                className="h-9 pl-3 pr-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] font-mono text-[12px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 appearance-none cursor-pointer transition-all"
              >
                <option value="recent">Recently updated</option>
                <option value="name">Name</option>
                <option value="placement">Placement mode</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {/* New template */}
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#8FB821] hover:bg-[#AACF32] text-[#121212] text-[12px] font-semibold transition-colors"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New template
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5">
          {filterChips.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-[0.06em] font-semibold transition-colors leading-none",
                filter === id
                  ? "bg-[#8FB821] text-[#121212]"
                  : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      {editing ? (
        /* Edit mode: 300px card strip + full-width editor */
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[300px] flex-shrink-0 border-r border-[#e7e5dc] dark:border-[#2a2a2a] overflow-y-auto px-4 py-4 space-y-3">
            {templates.map((t) => (
              <APTemplateCard
                key={t.id}
                template={t}
                selected={editingId === t.id}
                onClick={() => openEditor(t.id)}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <APTemplateEditor
              key={editingId ?? "editor"}
              template={editing}
              onSave={handleEditorSave}
              onCancel={closeEditor}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Card grid */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {templates.length === 0 ? (
              <ZeroState onCreate={handleCreate} />
            ) : displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] mb-1" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  No templates match
                </p>
                <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-4">
                  Try a different filter
                </p>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="h-8 px-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50 transition-colors"
                  style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                >
                  Show all
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayList.map((t) => (
                  <APTemplateCard
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Preview rail */}
          {showRail && (
            <div className="flex-shrink-0 w-[320px] border-l border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] overflow-hidden flex flex-col">
              <APPreviewRail
                template={selected}
                onClose={() => setSelectedId(null)}
                onRefresh={refresh}
                onEdit={openEditor}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
