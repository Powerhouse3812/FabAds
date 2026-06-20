/**
 * TemplatesLibrary — Audience & Placement templates management surface.
 *
 * Layout: Single view (no tabs) — two-panel (card list left | 320px preview rail right).
 * Design: FabFunnel v1.2 — lime #8FB821, bg #FAFAF7 light / #18181B dark,
 * rounded-2xl cards, Geist Mono for metadata/numbers/badges.
 *
 * Data: localStorage-backed via `templatesService`. Rename + Delete supported.
 * "Use in launch" is a placeholder CTA — wiring to launch flow is a separate step.
 */

import { useCallback, useEffect, useRef, useState, useId } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { templatesService } from "../../templates/service";
import type {
  AudiencePlacementTemplate,
  AudiencePlacementPayload,
  APLocation,
  APInterest,
} from "../../templates/types";

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function relativeTime(ts: number): string {
  const raw = formatDistanceToNow(new Date(ts), { addSuffix: true });
  return raw.replace(/^about /, "");
}

function formatAbsolute(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function genderLabel(g: "all" | "men" | "women"): string {
  return g === "all" ? "All" : g === "men" ? "Men" : "Women";
}

function placementModeLabel(mode: "advantage" | "manual"): string {
  return mode === "advantage" ? "Advantage+" : "Manual";
}

function goalLabel(goal: string): string {
  const map: Record<string, string> = {
    OFFSITE_CONVERSIONS: "Conversions",
    LINK_CLICKS: "Link Clicks",
    REACH: "Reach",
    VALUE: "Value",
    IMPRESSIONS: "Impressions",
    LANDING_PAGE_VIEWS: "Landing Page Views",
    VIDEO_VIEWS: "Video Views",
    POST_ENGAGEMENT: "Post Engagement",
    APP_INSTALLS: "App Installs",
  };
  return map[goal] ?? goal;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Main export                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function TemplatesLibrary() {
  const [templates, setTemplates] = useState<AudiencePlacementTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const refresh = useCallback(() => {
    setTemplates(templatesService.listAudiencePlacement());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTemplates = search.trim()
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : templates;

  const selectedTemplate =
    selectedId != null ? templates.find((t) => t.id === selectedId) ?? null : null;

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    templatesService.removeAudiencePlacement(deleteTarget.id);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
    setDeleteConfirmed(false);
    refresh();
  };

  /* ── Full-page empty state ── */
  if (templates.length === 0 && search.trim().length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#FAFAF7] dark:bg-[#18181B]">
        <PageHeader count={0} search={search} onSearch={setSearch} />
        <FullEmptyState />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FAFAF7] dark:bg-[#18181B]">
      <PageHeader count={templates.length} search={search} onSearch={setSearch} />

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: card list */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Cards scroll region */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            {filteredTemplates.length === 0 ? (
              <ListEmptyState isFiltered={search.trim().length > 0} />
            ) : (
              <ul className="flex flex-col gap-2">
                {filteredTemplates.map((tpl, i) => (
                  <APTemplateCard
                    key={tpl.id}
                    template={tpl}
                    isSelected={selectedId === tpl.id}
                    animationDelay={i * 30}
                    onClick={() =>
                      setSelectedId((prev) => (prev === tpl.id ? null : tpl.id))
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: preview rail (320px) */}
        <div className="w-[320px] flex-shrink-0 overflow-y-auto border-l border-[#e7e5dc] bg-[#FAFAF7] dark:border-[#2a2a2a] dark:bg-[#18181B]">
          {selectedTemplate ? (
            <APPreviewRail
              template={selectedTemplate}
              deleteConfirmed={deleteConfirmed}
              onDeleteRequest={() => {
                setDeleteConfirmed(false);
                setDeleteTarget({ id: selectedTemplate.id });
              }}
              onRefresh={refresh}
            />
          ) : (
            <RailZeroState />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DeleteDialog
        target={deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteConfirmed(false);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page header                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function PageHeader({
  count,
  search,
  onSearch,
}: {
  count: number;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <header className="px-8 pb-4 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-bold leading-[27px] tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
            Audience Templates
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            Saved adset-level targeting configs — apply from the launch flow.
          </p>
        </div>
        {count > 0 && (
          <span className="mt-1 flex-shrink-0 rounded-full bg-[rgba(143,184,33,0.12)] px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[#5B7611] dark:bg-[rgba(195,225,101,0.12)] dark:text-[#C3E165]">
            {count}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative mt-4 max-w-[420px]">
        <SearchIcon className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
        <input
          type="text"
          placeholder="Search audience templates…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className={cn(
            "h-9 w-full rounded-full border border-[#e7e5dc] bg-white pl-9 pr-4",
            "font-mono text-[13px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.45)]",
            "transition-all focus:border-[#8FB821] focus:outline-none focus:ring-0",
            "focus:shadow-[0_0_0_4px_rgba(143,184,33,0.18)]",
            "dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:text-[rgba(255,255,255,0.92)]",
            "dark:placeholder:text-[rgba(255,255,255,0.45)] dark:focus:border-[#90BA24]",
          )}
        />
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* AP Template card                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function APTemplateCard({
  template,
  isSelected,
  animationDelay,
  onClick,
}: {
  template: AudiencePlacementTemplate;
  isSelected: boolean;
  animationDelay: number;
  onClick: () => void;
}) {
  const { payload } = template;
  const visibleLocations = payload.locations.slice(0, 3);
  const moreCount = Math.max(0, payload.locations.length - 3);
  const isManual = payload.placementMode === "manual";

  return (
    <li
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 cursor-pointer rounded-2xl border p-4 transition-all duration-[220ms]",
        "hover:-translate-y-0.5",
        isSelected
          ? "border-[#8FB821] bg-[#F5FBE2] shadow-sm dark:border-[#90BA24] dark:bg-[#1D2A09]"
          : "border-[#e7e5dc] bg-white hover:border-[rgba(143,184,33,0.4)] hover:shadow-md dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:hover:border-[rgba(144,186,36,0.3)]",
      )}
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[21px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          {template.name}
        </p>
        {/* Placement mode chip */}
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
            isManual
              ? "bg-[rgba(22,119,255,0.1)] text-[#1677ff] dark:bg-[rgba(22,119,255,0.15)] dark:text-[#4096ff]"
              : "bg-[rgba(143,184,33,0.12)] text-[#5B7611] dark:bg-[rgba(195,225,101,0.12)] dark:text-[#C3E165]",
          )}
        >
          {isManual ? "Manual" : "Auto"}
        </span>
      </div>

      {/* Location chips */}
      {payload.locations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleLocations.map((loc: APLocation) => (
            <span
              key={loc.key}
              className="rounded-full border border-[#efeee7] bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] text-[rgba(15,15,12,0.62)] dark:border-[#1f1f1f] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)]"
            >
              {loc.name}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="rounded-full border border-[#efeee7] bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:border-[#1f1f1f] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.45)]">
              +{moreCount} more
            </span>
          )}
        </div>
      )}

      {/* Metadata row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {/* Age range */}
        <span className="font-mono text-[11px] font-semibold tabular-nums text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
          {payload.ageMin}–{payload.ageMax}
        </span>
        <span className="text-[rgba(15,15,12,0.22)] dark:text-[rgba(255,255,255,0.22)]">·</span>
        {/* Gender */}
        <span className="rounded-full border border-[#efeee7] bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] font-semibold text-[rgba(15,15,12,0.62)] dark:border-[#1f1f1f] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)]">
          {genderLabel(payload.gender)}
        </span>
        <span className="text-[rgba(15,15,12,0.22)] dark:text-[rgba(255,255,255,0.22)]">·</span>
        {/* Optimization goal */}
        <span className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
          {goalLabel(payload.optimizationGoal)}
        </span>
      </div>

      {/* Footer */}
      <p className="mt-2.5 font-mono text-[10px] leading-[15px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
        Updated {relativeTime(template.updatedAt)}
      </p>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Preview rail                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/* ── Manual placement keys in display order ── */
const MANUAL_PLACEMENT_KEYS: Array<keyof AudiencePlacementPayload["manualPlacements"]> = [
  "fbFeed", "fbStories", "fbReels", "fbMarketplace",
  "igFeed", "igStories", "igReels", "igExplore",
  "anNative", "anRewarded",
  "msInbox", "msStories",
];

function APPreviewRail({
  template,
  deleteConfirmed: _deleteConfirmed,
  onDeleteRequest,
  onRefresh,
}: {
  template: AudiencePlacementTemplate;
  deleteConfirmed: boolean;
  onDeleteRequest: () => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AudiencePlacementPayload | null>(null);
  const [draftName, setDraftName] = useState("");
  const [locInput, setLocInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const { payload } = template;

  /* ── Enter / exit edit mode ── */
  const enterEdit = () => {
    setDraft({ ...payload });
    setDraftName(template.name);
    setLocInput("");
    setInterestInput("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setDraftName("");
  };

  const saveEdit = () => {
    if (!draft) return;
    templatesService.updateAudiencePlacement(template.id, draft);
    if (draftName.trim() && draftName.trim() !== template.name) {
      templatesService.renameAudiencePlacement(template.id, draftName.trim());
    }
    onRefresh();
    setEditing(false);
    setDraft(null);
    setDraftName("");
  };

  /* ── Draft helpers ── */
  const patchDraft = (patch: Partial<AudiencePlacementPayload>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const removeLoc = (key: string) => {
    setDraft((prev) =>
      prev ? { ...prev, locations: prev.locations.filter((l) => l.key !== key) } : prev
    );
  };

  const addLoc = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const key = trimmed.toUpperCase().replace(/\s+/g, "_");
      if (prev.locations.some((l) => l.key === key)) return prev;
      return {
        ...prev,
        locations: [...prev.locations, { key, name: trimmed, type: "country" as const }],
      };
    });
  };

  const removeInterest = (id: string) => {
    setDraft((prev) =>
      prev ? { ...prev, detailedTargeting: prev.detailedTargeting.filter((i) => i.id !== id) } : prev
    );
  };

  const addInterest = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        detailedTargeting: [
          ...prev.detailedTargeting,
          { id: Date.now().toString(), name: trimmed, type: "interest" as const },
        ],
      };
    });
  };

  const toggleManualPlacement = (key: keyof AudiencePlacementPayload["manualPlacements"]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        manualPlacements: { ...prev.manualPlacements, [key]: !prev.manualPlacements[key] },
      };
    });
  };

  /* ── Shared input class ── */
  const inputCls = cn(
    "h-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a]",
    "bg-white dark:bg-[#1E1E23] text-[13px] px-3 font-mono",
    "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]",
    "outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20",
  );

  const selectCls = cn(inputCls, "appearance-none pr-7 cursor-pointer");

  /* ── Read-only view ── */
  if (!editing || !draft) {
    const activeManualPlacements = payload.placementMode === "manual"
      ? Object.entries(payload.manualPlacements).filter(([, v]) => v).map(([k]) => k)
      : [];

    return (
      <div className="flex h-full flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              Audience Template
            </span>
            <h2 className="mt-1.5 text-[15px] font-bold leading-[23px] tracking-[-0.01em] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
              {template.name}
            </h2>
          </div>
          {/* Edit pencil button */}
          <button
            onClick={enterEdit}
            title="Edit template"
            className={cn(
              "mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
              "border border-[#e7e5dc] bg-transparent transition-all",
              "hover:border-[#8FB821] hover:bg-[rgba(143,184,33,0.08)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]",
              "dark:border-[#2a2a2a] dark:hover:border-[#8FB821]",
            )}
          >
            <PencilIcon className="h-3 w-3 text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]" />
          </button>
        </div>

        {/* Meta row */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {formatAbsolute(template.createdAt)}
          </span>
        </div>

        <div className="my-4 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Section: Audience ── */}
        <RailSection icon={<UsersIcon className="h-3.5 w-3.5" />} title="Audience">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <RailPill label={`${payload.ageMin}–${payload.ageMax}`} mono />
              <RailPill label={genderLabel(payload.gender)} />
              {payload.advantageAudience && (
                <RailPill label="Adv+ Audience" lime />
              )}
            </div>
            {payload.locations.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  Locations
                </p>
                <div className="flex flex-wrap gap-1">
                  {payload.locations.map((loc: APLocation) => (
                    <RailPill key={loc.key} label={loc.name} />
                  ))}
                </div>
              </div>
            )}
            {payload.detailedTargeting.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  Targeting
                </p>
                <div className="flex flex-wrap gap-1">
                  {payload.detailedTargeting.slice(0, 5).map((item: APInterest) => (
                    <RailPill key={item.id} label={item.name} />
                  ))}
                  {payload.detailedTargeting.length > 5 && (
                    <RailPill label={`+${payload.detailedTargeting.length - 5} more`} muted />
                  )}
                </div>
              </div>
            )}
            {payload.customAudiences.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  Custom Audiences
                </p>
                <div className="flex flex-wrap gap-1">
                  {payload.customAudiences.map((ca) => (
                    <RailPill key={ca.id} label={ca.name} />
                  ))}
                </div>
              </div>
            )}
            {payload.languages.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  Lang:
                </span>
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                  {payload.languages.join(", ").toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </RailSection>

        <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Section: Placement ── */}
        <RailSection icon={<GridIcon className="h-3.5 w-3.5" />} title="Placement">
          {payload.placementMode === "advantage" ? (
            <RailPill label="Advantage+ Placement" lime />
          ) : (
            <div className="space-y-1.5">
              <RailPill label="Manual" />
              {activeManualPlacements.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {activeManualPlacements.map((p) => (
                    <RailPill key={p} label={friendlyPlacementName(p)} />
                  ))}
                </div>
              ) : (
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  No placements selected
                </span>
              )}
            </div>
          )}
        </RailSection>

        <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Section: Optimization ── */}
        <RailSection icon={<TargetIcon className="h-3.5 w-3.5" />} title="Optimization">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RailPill label={goalLabel(payload.optimizationGoal)} lime />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  Click window
                </p>
                <p className="font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                  {payload.attributionClickWindow}d
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                  View window
                </p>
                <p className="font-mono text-[11px] tabular-nums text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                  {payload.attributionViewWindow}d
                </p>
              </div>
            </div>
            {payload.specialAdCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {payload.specialAdCategories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-[rgba(250,173,20,0.1)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#874d00] dark:text-[#d89614]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </RailSection>

        {/* ── Notes ── */}
        {payload.notes && (
          <>
            <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />
            <RailSection icon={<NoteIcon className="h-3.5 w-3.5" />} title="Notes">
              <p className="font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                {payload.notes}
              </p>
            </RailSection>
          </>
        )}

        <div className="flex-1" />

        <div className="mt-6 flex flex-col gap-2">
          <button
            className={cn(
              "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
              "bg-[#8FB821] text-[#121212]",
              "hover:bg-[#AACF32] shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-2",
            )}
          >
            Use in launch
          </button>

          <button
            onClick={onDeleteRequest}
            className={cn(
              "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
              "border border-transparent bg-transparent text-[#cf1322]",
              "hover:border-[#ffccc7] hover:bg-[rgba(207,19,34,0.06)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf1322]",
              "dark:text-[#f37370] dark:hover:border-[rgba(243,115,112,0.25)] dark:hover:bg-[rgba(243,115,112,0.06)]",
            )}
          >
            Delete template
          </button>
        </div>

        <p className="mt-4 font-mono text-[10px] leading-[15px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
          Apply from Step 2 in the launch flow — select a saved audience template at the adset stage.
        </p>
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div className="flex h-full flex-col p-5">
      {/* Edit header with lime bottom border accent */}
      <div className="border-b-2 border-[#8FB821] pb-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B7611] dark:text-[#C3E165]">
          Editing Template
        </span>
        {/* Editable name */}
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className={cn(
            "mt-1.5 w-full border-b border-[#e7e5dc] bg-transparent pb-0.5",
            "text-[15px] font-bold leading-[23px] tracking-[-0.01em]",
            "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]",
            "outline-none focus:border-[#8FB821]",
            "dark:border-[#2a2a2a]",
          )}
          placeholder="Template name"
        />
      </div>

      <div className="my-4 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

      {/* ── EDIT: Audience ── */}
      <RailSection icon={<UsersIcon className="h-3.5 w-3.5" />} title="Audience">
        <div className="space-y-3">
          {/* Age range */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
              Age Range
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={13}
                max={65}
                value={draft.ageMin}
                onChange={(e) => patchDraft({ ageMin: parseInt(e.target.value, 10) || 18 })}
                className={cn(inputCls, "w-14 text-center tabular-nums")}
              />
              <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">–</span>
              <input
                type="number"
                min={13}
                max={65}
                value={draft.ageMax}
                onChange={(e) => patchDraft({ ageMax: parseInt(e.target.value, 10) || 65 })}
                className={cn(inputCls, "w-14 text-center tabular-nums")}
              />
            </div>
          </div>

          {/* Gender pills */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
              Gender
            </p>
            <div className="flex gap-1.5">
              {(["all", "men", "women"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => patchDraft({ gender: g })}
                  className={cn(
                    "rounded-full px-3 py-0.5 font-mono text-[11px] font-semibold transition-all",
                    draft.gender === g
                      ? "bg-[#8FB821] text-[#121212]"
                      : "border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] hover:border-[#8FB821] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)]",
                  )}
                >
                  {genderLabel(g)}
                </button>
              ))}
            </div>
          </div>

          {/* Locations chips + input */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
              Locations
            </p>
            {draft.locations.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {draft.locations.map((loc) => (
                  <span
                    key={loc.key}
                    className="flex items-center gap-1 rounded-full bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] dark:bg-[#1B1B1F]"
                  >
                    {loc.name}
                    <button
                      onClick={() => removeLoc(loc.key)}
                      className="leading-none text-[rgba(15,15,12,0.45)] hover:text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.45)] dark:hover:text-[rgba(255,255,255,0.92)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLoc(locInput);
                  setLocInput("");
                }
              }}
              placeholder="Add location…"
              className={cn(inputCls, "w-full")}
            />
          </div>

          {/* Interests chips + input */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
              Detailed Targeting
            </p>
            {draft.detailedTargeting.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {draft.detailedTargeting.map((item) => (
                  <span
                    key={item.id}
                    className="flex items-center gap-1 rounded-full bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] dark:bg-[#1B1B1F]"
                  >
                    {item.name}
                    <button
                      onClick={() => removeInterest(item.id)}
                      className="leading-none text-[rgba(15,15,12,0.45)] hover:text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.45)] dark:hover:text-[rgba(255,255,255,0.92)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest(interestInput);
                  setInterestInput("");
                }
              }}
              placeholder="Add interest…"
              className={cn(inputCls, "w-full")}
            />
          </div>

          {/* Advantage+ Audience toggle */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
              Advantage+ Audience
            </span>
            <button
              role="switch"
              aria-checked={draft.advantageAudience}
              onClick={() => patchDraft({ advantageAudience: !draft.advantageAudience })}
              className={cn(
                "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                draft.advantageAudience ? "bg-[#8FB821]" : "bg-[#e7e5dc] dark:bg-[#2a2a2a]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-1",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  draft.advantageAudience ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      </RailSection>

      <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

      {/* ── EDIT: Placement ── */}
      <RailSection icon={<GridIcon className="h-3.5 w-3.5" />} title="Placement">
        <div className="space-y-2.5">
          {/* Mode toggle */}
          <div className="flex gap-1.5">
            {(["advantage", "manual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => patchDraft({ placementMode: mode })}
                className={cn(
                  "rounded-full px-3 py-0.5 font-mono text-[11px] font-semibold transition-all",
                  draft.placementMode === mode
                    ? "bg-[#8FB821] text-[#121212]"
                    : "border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] hover:border-[#8FB821] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)]",
                )}
              >
                {placementModeLabel(mode)}
              </button>
            ))}
          </div>

          {/* Manual placement checklist */}
          {draft.placementMode === "manual" && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {MANUAL_PLACEMENT_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <input
                    type="checkbox"
                    checked={draft.manualPlacements[key]}
                    onChange={() => toggleManualPlacement(key)}
                    className="accent-[#8FB821] h-3.5 w-3.5"
                  />
                  <span className="font-mono text-[11px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                    {friendlyPlacementName(key)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </RailSection>

      <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

      {/* ── EDIT: Optimization ── */}
      <RailSection icon={<TargetIcon className="h-3.5 w-3.5" />} title="Optimization">
        <div className="space-y-2.5">
          {/* Optimization goal */}
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
              Goal
            </p>
            <div className="relative">
              <select
                value={draft.optimizationGoal}
                onChange={(e) => patchDraft({ optimizationGoal: e.target.value })}
                className={cn(selectCls, "w-full")}
              >
                {[
                  "OFFSITE_CONVERSIONS",
                  "LINK_CLICKS",
                  "REACH",
                  "IMPRESSIONS",
                  "LANDING_PAGE_VIEWS",
                  "VALUE",
                  "LEAD_GENERATION",
                  "APP_INSTALLS",
                  "VIDEO_VIEWS",
                ].map((g) => (
                  <option key={g} value={g}>
                    {goalLabel(g)}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
            </div>
          </div>

          {/* Attribution windows */}
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                Click
              </p>
              <div className="relative">
                <select
                  value={draft.attributionClickWindow}
                  onChange={(e) => patchDraft({ attributionClickWindow: parseInt(e.target.value, 10) })}
                  className={cn(selectCls, "w-full")}
                >
                  {[1, 7, 28].map((d) => (
                    <option key={d} value={d}>{d}d</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
                View
              </p>
              <div className="relative">
                <select
                  value={draft.attributionViewWindow}
                  onChange={(e) => patchDraft({ attributionViewWindow: parseInt(e.target.value, 10) })}
                  className={cn(selectCls, "w-full")}
                >
                  {[0, 1].map((d) => (
                    <option key={d} value={d}>{d}d</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
              </div>
            </div>
          </div>
        </div>
      </RailSection>

      <div className="my-3.5 h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

      {/* ── EDIT: Notes ── */}
      <RailSection icon={<NoteIcon className="h-3.5 w-3.5" />} title="Notes">
        <textarea
          rows={4}
          value={draft.notes ?? ""}
          onChange={(e) => patchDraft({ notes: e.target.value })}
          placeholder="Add notes about this template..."
          className={cn(
            "w-full rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a]",
            "bg-white dark:bg-[#1E1E23] px-3 py-2 font-mono text-[11px]",
            "text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]",
            "placeholder:text-[rgba(15,15,12,0.38)] dark:placeholder:text-[rgba(255,255,255,0.38)]",
            "outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20",
            "resize-none",
          )}
        />
      </RailSection>

      <div className="flex-1" />

      {/* ── Edit mode footer actions ── */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={saveEdit}
          className={cn(
            "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
            "bg-[#8FB821] text-[#121212]",
            "hover:bg-[#AACF32] shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-2",
          )}
        >
          Save changes
        </button>

        <button
          onClick={cancelEdit}
          className={cn(
            "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
            "border border-[#e7e5dc] bg-transparent text-[rgba(15,15,12,0.72)]",
            "hover:border-[#c8c5ba] hover:bg-[#F0F0EC]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]",
            "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.72)] dark:hover:border-[#3a3a3a] dark:hover:bg-[#1B1B1F]",
          )}
        >
          Cancel
        </button>

        <button
          onClick={onDeleteRequest}
          className={cn(
            "h-9 w-full rounded-full px-4 text-[13px] font-medium transition-all",
            "border border-transparent bg-transparent text-[#cf1322]",
            "hover:border-[#ffccc7] hover:bg-[rgba(207,19,34,0.06)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf1322]",
            "dark:text-[#f37370] dark:hover:border-[rgba(243,115,112,0.25)] dark:hover:bg-[rgba(243,115,112,0.06)]",
          )}
        >
          Delete template
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Preview sub-components                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function RailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        {icon}
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function RailPill({
  label,
  lime,
  mono,
  muted,
}: {
  label: string;
  lime?: boolean;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
        lime
          ? "bg-[rgba(143,184,33,0.12)] text-[#5B7611] dark:bg-[rgba(195,225,101,0.12)] dark:text-[#C3E165]"
          : muted
            ? "border border-[#efeee7] bg-transparent text-[rgba(15,15,12,0.38)] dark:border-[#1f1f1f] dark:text-[rgba(255,255,255,0.38)]"
            : "border border-[#efeee7] bg-[#F0F0EC] text-[rgba(15,15,12,0.62)] dark:border-[#1f1f1f] dark:bg-[#1B1B1F] dark:text-[rgba(255,255,255,0.62)]",
        mono && "tabular-nums",
      )}
    >
      {label}
    </span>
  );
}

function friendlyPlacementName(key: string): string {
  const map: Record<string, string> = {
    fbFeed: "FB Feed", fbStories: "FB Stories", fbReels: "FB Reels",
    fbMarketplace: "FB Marketplace", fbRightColumn: "FB Right Col",
    fbVideoFeeds: "FB Video", fbSearch: "FB Search",
    igFeed: "IG Feed", igStories: "IG Stories", igReels: "IG Reels",
    igExplore: "IG Explore", igSearch: "IG Search",
    anNative: "AN Native", anRewarded: "AN Rewarded",
    msInbox: "MS Inbox", msStories: "MS Stories",
  };
  return map[key] ?? key;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Zero states                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function RailZeroState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 rounded-xl border-[1.5px] border-[#e7e5dc] dark:border-[#2a2a2a]" />
        <div className="absolute inset-[6px] rounded-lg border-[1.5px] border-[#c8c5ba] dark:border-[#3a3a3a]" />
        <UsersIcon className="relative z-10 h-4 w-4 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]" />
      </div>
      <p className="text-[13px] font-medium text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        Select a template to preview
      </p>
      <p className="mt-1 font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
        Click any card on the left
      </p>
    </div>
  );
}

function ListEmptyState({ isFiltered }: { isFiltered: boolean }) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e7e5dc] bg-[#F0F0EC]/50 px-6 py-12 text-center dark:border-[#2a2a2a] dark:bg-[#1B1B1F]/50">
        <p className="text-[13px] font-medium text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
          No match
        </p>
        <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
          Try a different search term
        </p>
      </div>
    );
  }
  return null;
}

function FullEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
      {/* Geometric motif */}
      <div className="relative mb-6 h-16 w-16">
        <div className="absolute inset-0 rounded-2xl border-[1.5px] border-[#e7e5dc] bg-white dark:border-[#2a2a2a] dark:bg-[#1E1E23]" />
        <div className="absolute inset-[7px] rounded-xl border-[1.5px] border-[#c8c5ba] bg-[#F0F0EC] dark:border-[#3a3a3a] dark:bg-[#1B1B1F]" />
        <div className="absolute inset-[14px] flex items-center justify-center">
          <MapPinIcon className="h-5 w-5 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]" />
        </div>
      </div>

      <h2 className="text-[15px] font-bold leading-[23px] tracking-[-0.01em] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
        No audience templates yet
      </h2>
      <p className="mt-2 max-w-[340px] font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        Audience & Placement templates are saved from the launch flow. Open Step 2 and configure your adset targeting, then save as a template.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Rename dialog                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function RenameDialog({
  target,
  onClose,
  onSubmit,
}: {
  target: { id: string; name: string } | null;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}) {
  const open = target !== null;
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (target) {
      setName(target.name);
      setTimeout(() => inputRef.current?.select(), 60);
    }
  }, [target]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== target?.name;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); if (canSave) onSubmit(trimmed); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em]">
            Rename template
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px]">
            Update the template's display name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label
            htmlFor="rename-tpl-name"
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
          >
            Template name
          </Label>
          <input
            ref={inputRef}
            id="rename-tpl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-9 w-full rounded-[28px] border border-[#e7e5dc] bg-white px-4",
              "font-mono text-[13px] text-[rgba(15,15,12,0.92)] placeholder:text-[rgba(15,15,12,0.38)]",
              "transition-all focus:border-[#8FB821] focus:outline-none",
              "focus:shadow-[0_0_0_4px_rgba(143,184,33,0.18)]",
              "dark:border-[#2a2a2a] dark:bg-[#1E1E23] dark:text-[rgba(255,255,255,0.92)]",
            )}
          />
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "border border-[#e7e5dc] text-[rgba(15,15,12,0.72)] hover:bg-[#F0F0EC]",
              "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.72)] dark:hover:bg-[#1B1B1F]",
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSubmit(trimmed)}
            disabled={!canSave}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "bg-[#8FB821] text-[#121212]",
              "hover:bg-[#AACF32] disabled:cursor-not-allowed disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-2",
            )}
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Delete confirmation dialog                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function DeleteDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: { id: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = target !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em]">
            Delete template?
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] leading-[19px]">
            This action cannot be undone. The template will be permanently removed from your saved templates.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            onClick={onClose}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "border border-[#e7e5dc] text-[rgba(15,15,12,0.72)] hover:bg-[#F0F0EC]",
              "dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.72)] dark:hover:bg-[#1B1B1F]",
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium transition-all",
              "bg-[#cf1322] text-white hover:bg-[#a8101b]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cf1322] focus-visible:ring-offset-2",
            )}
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Inline SVG icons                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 13.5C1.5 11.015 3.515 9 6 9s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 7C11.88 7 13 5.88 13 4.5S11.88 2 10.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 13.5c0-1.71-.81-3.23-2.07-4.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2V4M8 12V14M2 8H4M12 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5H10.5M5.5 8H10.5M5.5 10.5H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 2C7.24 2 5 4.24 5 7c0 4.24 5 11 5 11s5-6.76 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14H2v-2.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.333 4l2.667 2.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
