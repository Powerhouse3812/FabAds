/**
 * TemplatePanelView — 2-pane panel view for the Audience Templates screen.
 *
 * Left 260px: search + placement-mode quick-filter chips + filter button + scrollable list.
 * Right flex: summary card + full template detail (read-only + edit mode) below.
 *
 * Design: FabFunnel v1.2 — lime #8FB821, Geist Mono for numerics/metadata,
 * rounded-2xl cards, warm borders #e7e5dc / dark #2a2a2a.
 * Selected card: lime left border + tinted bg.
 */

import { useState, useMemo, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { templatesService } from '../../templates/service';
import type {
  AudiencePlacementTemplate,
  AudiencePlacementPayload,
  APLocation,
  APInterest,
} from '../../templates/types';

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface TemplatePanelViewProps {
  templates: AudiencePlacementTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onFilterOpen: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const PLACEMENT_CHIPS: { key: string; label: string }[] = [
  { key: 'advantage', label: 'Auto' },
  { key: 'manual', label: 'Manual' },
];

const OPTIMIZATION_GOAL_LABELS: Record<string, string> = {
  OFFSITE_CONVERSIONS: 'Conversions',
  LINK_CLICKS: 'Link Clicks',
  REACH: 'Reach',
  VALUE: 'Value',
  IMPRESSIONS: 'Impressions',
  LANDING_PAGE_VIEWS: 'Landing Page Views',
  VIDEO_VIEWS: 'Video Views',
  POST_ENGAGEMENT: 'Post Engagement',
  APP_INSTALLS: 'App Installs',
  LEAD_GENERATION: 'Lead Gen',
};

const MANUAL_PLACEMENT_KEYS: Array<keyof AudiencePlacementPayload['manualPlacements']> = [
  'fbFeed', 'fbStories', 'fbReels', 'fbMarketplace',
  'igFeed', 'igStories', 'igReels', 'igExplore',
  'anNative', 'anRewarded',
  'msInbox', 'msStories',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatAbsolute(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function genderLabel(g: 'all' | 'men' | 'women'): string {
  return g === 'all' ? 'All genders' : g === 'men' ? 'Men' : 'Women';
}

function goalLabel(goal: string): string {
  return OPTIMIZATION_GOAL_LABELS[goal] ?? goal;
}

function friendlyPlacementName(key: string): string {
  const map: Record<string, string> = {
    fbFeed: 'FB Feed', fbStories: 'FB Stories', fbReels: 'FB Reels',
    fbMarketplace: 'Marketplace', fbRightColumn: 'FB Right Col',
    fbVideoFeeds: 'FB Video', fbSearch: 'FB Search',
    igFeed: 'IG Feed', igStories: 'IG Stories', igReels: 'IG Reels',
    igExplore: 'IG Explore', igSearch: 'IG Search',
    anNative: 'AN Native', anRewarded: 'AN Rewarded',
    msInbox: 'MS Inbox', msStories: 'MS Stories',
  };
  return map[key] ?? key;
}

/* ------------------------------------------------------------------ */
/*  Left list card                                                      */
/* ------------------------------------------------------------------ */

function TemplateListCard({
  template,
  selected,
  onClick,
}: {
  template: AudiencePlacementTemplate;
  selected: boolean;
  onClick: () => void;
}) {
  const { payload } = template;
  const isManual = payload.placementMode === 'manual';
  const visibleLocations = payload.locations.slice(0, 2);
  const moreLocations = Math.max(0, payload.locations.length - 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border cursor-pointer transition-all px-3 py-2.5 space-y-1.5',
        selected
          ? 'border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09] border-l-[3px]'
          : 'border-[#e7e5dc] dark:border-[#2a2a2a] hover:border-[#8FB821]/50 hover:bg-[#FAFAF7] dark:hover:bg-[#18181B]'
      )}
    >
      {/* Row 1: placement mode chip */}
      <div className="flex items-center gap-1 justify-end">
        <span
          className={cn(
            'font-mono text-[9px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full leading-none',
            isManual
              ? 'bg-[rgba(22,119,255,0.1)] text-[#1677ff] dark:bg-[rgba(22,119,255,0.15)] dark:text-[#4096ff]'
              : 'bg-[rgba(143,184,33,0.12)] text-[#5B7611] dark:bg-[rgba(195,225,101,0.12)] dark:text-[#C3E165]'
          )}
        >
          {isManual ? 'Manual' : 'Auto'}
        </span>
      </div>

      {/* Row 2: name */}
      <p className="text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight line-clamp-2">
        {template.name}
      </p>

      {/* Row 3: age + gender */}
      <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none tabular-nums">
        {payload.ageMin}–{payload.ageMax} · {genderLabel(payload.gender)}
      </p>

      {/* Row 4: locations */}
      {visibleLocations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleLocations.map((loc: APLocation) => (
            <span
              key={loc.key}
              className="font-mono text-[9px] uppercase tracking-[0.05em] font-semibold px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] leading-none"
            >
              {loc.name}
            </span>
          ))}
          {moreLocations > 0 && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)] leading-none">
              +{moreLocations}
            </span>
          )}
        </div>
      )}

      {/* Row 5: goal */}
      <p className="font-mono text-[9px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] leading-none">
        {goalLabel(payload.optimizationGoal)} · Updated {relativeTime(template.updatedAt)}
      </p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Right panel — summary card                                         */
/* ------------------------------------------------------------------ */

function TemplateSummaryCard({
  template,
  editing,
  onToggleEdit,
  onDelete,
}: {
  template: AudiencePlacementTemplate;
  editing: boolean;
  onToggleEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const { payload } = template;
  const isManual = payload.placementMode === 'manual';
  const activeManualCount = isManual
    ? Object.values(payload.manualPlacements).filter(Boolean).length
    : 0;

  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            Audience Template
          </span>
          <h2 className="text-[15px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight tracking-[-0.01em]">
            {template.name}
          </h2>
          <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
            Created {formatAbsolute(template.createdAt)} · Updated {relativeTime(template.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {/* placeholder — wired from launch flow */}}
            className="h-8 rounded-full bg-[#8FB821] px-4 text-[12px] font-semibold text-[#121212] hover:bg-[#AACF32] transition-colors leading-none"
          >
            Use in launch
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className="h-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-3 text-[12px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 transition-colors leading-none"
          >
            {editing ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-full leading-none',
            isManual
              ? 'bg-[rgba(22,119,255,0.1)] text-[#1677ff] dark:bg-[rgba(22,119,255,0.15)] dark:text-[#4096ff]'
              : 'bg-[rgba(143,184,33,0.12)] text-[#5B7611] dark:bg-[rgba(195,225,101,0.12)] dark:text-[#C3E165]'
          )}
        >
          {isManual ? 'Manual' : 'Advantage+'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
          {genderLabel(payload.gender)}
        </span>
        <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
          Age {payload.ageMin}–{payload.ageMax}
        </span>
        {isManual && (
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
            {activeManualCount} placements
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-0.5 rounded-full bg-[rgba(143,184,33,0.12)] text-[#5B7611] dark:text-[#C3E165] leading-none">
          {goalLabel(payload.optimizationGoal)}
        </span>
      </div>

      {/* Locations row */}
      {payload.locations.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">
            Locations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {payload.locations.map((loc: APLocation) => (
              <span
                key={loc.key}
                className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none"
              >
                {loc.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests row */}
      {payload.detailedTargeting.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">
            Targeting
          </p>
          <div className="flex flex-wrap gap-1.5">
            {payload.detailedTargeting.slice(0, 6).map((item: APInterest) => (
              <span
                key={item.id}
                className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none"
              >
                {item.name}
              </span>
            ))}
            {payload.detailedTargeting.length > 6 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[#efeee7] dark:border-[#1f1f1f] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] leading-none">
                +{payload.detailedTargeting.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {payload.notes && (
        <p className="font-mono text-[11px] leading-[19px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] border-t border-[#e7e5dc] dark:border-[#2a2a2a] pt-3">
          {payload.notes}
        </p>
      )}

      {/* Danger zone */}
      <div className="flex gap-2 pt-1 border-t border-[#e7e5dc] dark:border-[#2a2a2a]">
        <button
          type="button"
          onClick={() => onDelete(template.id)}
          className="text-[11px] font-mono text-red-500/70 hover:text-red-500 transition-colors ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right panel — detail editor                                        */
/* ------------------------------------------------------------------ */

function TemplateDetailEditor({
  template,
  onSave,
  onCancel,
}: {
  template: AudiencePlacementTemplate;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AudiencePlacementPayload>({ ...template.payload });
  const [draftName, setDraftName] = useState(template.name);
  const [locInput, setLocInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const patchDraft = (patch: Partial<AudiencePlacementPayload>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const removeLoc = (key: string) => {
    setDraft((prev) => ({ ...prev, locations: prev.locations.filter((l) => l.key !== key) }));
  };

  const addLoc = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraft((prev) => {
      const key = trimmed.toUpperCase().replace(/\s+/g, '_');
      if (prev.locations.some((l) => l.key === key)) return prev;
      return { ...prev, locations: [...prev.locations, { key, name: trimmed, type: 'country' as const }] };
    });
  };

  const removeInterest = (id: string) => {
    setDraft((prev) => ({ ...prev, detailedTargeting: prev.detailedTargeting.filter((i) => i.id !== id) }));
  };

  const addInterest = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraft((prev) => ({
      ...prev,
      detailedTargeting: [
        ...prev.detailedTargeting,
        { id: Date.now().toString(), name: trimmed, type: 'interest' as const },
      ],
    }));
  };

  const toggleManualPlacement = (key: keyof AudiencePlacementPayload['manualPlacements']) => {
    setDraft((prev) => ({
      ...prev,
      manualPlacements: { ...prev.manualPlacements, [key]: !prev.manualPlacements[key] },
    }));
  };

  const handleSave = () => {
    templatesService.updateAudiencePlacement(template.id, draft);
    if (draftName.trim() && draftName.trim() !== template.name) {
      templatesService.renameAudiencePlacement(template.id, draftName.trim());
    }
    onSave();
  };

  const inputCls = cn(
    'h-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a]',
    'bg-white dark:bg-[#18181B] text-[13px] px-3 font-mono',
    'text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]',
    'outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 transition-all',
  );

  const selectCls = cn(inputCls, 'appearance-none pr-7 cursor-pointer');

  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] overflow-hidden">
      {/* Editor header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a] border-b-2 border-b-[#8FB821]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B7611] dark:text-[#C3E165]">
          Editing Template
        </span>
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className={cn(
            'mt-1.5 w-full border-b border-[#e7e5dc] bg-transparent pb-0.5',
            'text-[15px] font-bold leading-[23px] tracking-[-0.01em]',
            'text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]',
            'outline-none focus:border-[#8FB821]',
            'dark:border-[#2a2a2a]',
          )}
          placeholder="Template name"
        />
      </div>

      <div className="p-5 space-y-5">
        {/* ── Audience section ── */}
        <EditorSection icon={<UsersIcon className="h-3.5 w-3.5" />} title="Audience">
          <div className="space-y-3">
            {/* Age range */}
            <div>
              <EditorLabel>Age Range</EditorLabel>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={13}
                  max={65}
                  value={draft.ageMin}
                  onChange={(e) => patchDraft({ ageMin: parseInt(e.target.value, 10) || 18 })}
                  className={cn(inputCls, 'w-14 text-center tabular-nums')}
                />
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">–</span>
                <input
                  type="number"
                  min={13}
                  max={65}
                  value={draft.ageMax}
                  onChange={(e) => patchDraft({ ageMax: parseInt(e.target.value, 10) || 65 })}
                  className={cn(inputCls, 'w-14 text-center tabular-nums')}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <EditorLabel>Gender</EditorLabel>
              <div className="flex gap-1.5">
                {(['all', 'men', 'women'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => patchDraft({ gender: g })}
                    className={cn(
                      'rounded-full px-3 py-0.5 font-mono text-[11px] font-semibold transition-all',
                      draft.gender === g
                        ? 'bg-[#8FB821] text-[#121212]'
                        : 'border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] hover:border-[#8FB821] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)]',
                    )}
                  >
                    {g === 'all' ? 'All' : g === 'men' ? 'Men' : 'Women'}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <EditorLabel>Locations</EditorLabel>
              {draft.locations.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {draft.locations.map((loc) => (
                    <span
                      key={loc.key}
                      className="flex items-center gap-1 rounded-full bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] dark:bg-[#1B1B1F]"
                    >
                      {loc.name}
                      <button
                        type="button"
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
                  if (e.key === 'Enter') { e.preventDefault(); addLoc(locInput); setLocInput(''); }
                }}
                placeholder="Add location and press Enter…"
                className={cn(inputCls, 'w-full')}
              />
            </div>

            {/* Detailed targeting */}
            <div>
              <EditorLabel>Detailed Targeting</EditorLabel>
              {draft.detailedTargeting.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {draft.detailedTargeting.map((item) => (
                    <span
                      key={item.id}
                      className="flex items-center gap-1 rounded-full bg-[#F0F0EC] px-2 py-0.5 font-mono text-[10px] dark:bg-[#1B1B1F]"
                    >
                      {item.name}
                      <button
                        type="button"
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
                  if (e.key === 'Enter') { e.preventDefault(); addInterest(interestInput); setInterestInput(''); }
                }}
                placeholder="Add interest and press Enter…"
                className={cn(inputCls, 'w-full')}
              />
            </div>

            {/* Advantage+ Audience toggle */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
                Advantage+ Audience
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={draft.advantageAudience}
                onClick={() => patchDraft({ advantageAudience: !draft.advantageAudience })}
                className={cn(
                  'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  draft.advantageAudience ? 'bg-[#8FB821]' : 'bg-[#e7e5dc] dark:bg-[#2a2a2a]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] focus-visible:ring-offset-1',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                    draft.advantageAudience ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>
        </EditorSection>

        <div className="h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Placement section ── */}
        <EditorSection icon={<GridIcon className="h-3.5 w-3.5" />} title="Placement">
          <div className="space-y-2.5">
            <div className="flex gap-1.5">
              {(['advantage', 'manual'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => patchDraft({ placementMode: mode })}
                  className={cn(
                    'rounded-full px-3 py-0.5 font-mono text-[11px] font-semibold transition-all',
                    draft.placementMode === mode
                      ? 'bg-[#8FB821] text-[#121212]'
                      : 'border border-[#e7e5dc] text-[rgba(15,15,12,0.55)] hover:border-[#8FB821] dark:border-[#2a2a2a] dark:text-[rgba(255,255,255,0.55)]',
                  )}
                >
                  {mode === 'advantage' ? 'Advantage+' : 'Manual'}
                </button>
              ))}
            </div>

            {draft.placementMode === 'manual' && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {MANUAL_PLACEMENT_KEYS.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-1.5">
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
        </EditorSection>

        <div className="h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Optimization section ── */}
        <EditorSection icon={<TargetIcon className="h-3.5 w-3.5" />} title="Optimization">
          <div className="space-y-2.5">
            <div>
              <EditorLabel>Goal</EditorLabel>
              <div className="relative">
                <select
                  value={draft.optimizationGoal}
                  onChange={(e) => patchDraft({ optimizationGoal: e.target.value })}
                  className={cn(selectCls, 'w-full')}
                >
                  {[
                    'OFFSITE_CONVERSIONS', 'LINK_CLICKS', 'REACH', 'IMPRESSIONS',
                    'LANDING_PAGE_VIEWS', 'VALUE', 'LEAD_GENERATION', 'APP_INSTALLS', 'VIDEO_VIEWS',
                  ].map((g) => (
                    <option key={g} value={g}>{goalLabel(g)}</option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
              </div>
            </div>

            {/* Attribution windows */}
            <div className="flex gap-2">
              <div className="flex-1">
                <EditorLabel>Click window</EditorLabel>
                <div className="relative">
                  <select
                    value={draft.attributionClickWindow}
                    onChange={(e) => patchDraft({ attributionClickWindow: parseInt(e.target.value, 10) })}
                    className={cn(selectCls, 'w-full')}
                  >
                    {[1, 7, 28].map((d) => <option key={d} value={d}>{d}d</option>)}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
                </div>
              </div>
              <div className="flex-1">
                <EditorLabel>View window</EditorLabel>
                <div className="relative">
                  <select
                    value={draft.attributionViewWindow}
                    onChange={(e) => patchDraft({ attributionViewWindow: parseInt(e.target.value, 10) })}
                    className={cn(selectCls, 'w-full')}
                  >
                    {[0, 1].map((d) => <option key={d} value={d}>{d}d</option>)}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" />
                </div>
              </div>
            </div>
          </div>
        </EditorSection>

        <div className="h-px bg-[#e7e5dc] dark:bg-[#2a2a2a]" />

        {/* ── Notes section ── */}
        <EditorSection icon={<NoteIcon className="h-3.5 w-3.5" />} title="Notes">
          <textarea
            rows={3}
            value={draft.notes ?? ''}
            onChange={(e) => patchDraft({ notes: e.target.value })}
            placeholder="Notes about this template…"
            className={cn(
              'w-full rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a]',
              'bg-[#FAFAF7] dark:bg-[#18181B] px-3 py-2 font-mono text-[11px]',
              'text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]',
              'placeholder:text-[rgba(15,15,12,0.38)] dark:placeholder:text-[rgba(255,255,255,0.38)]',
              'outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20',
              'resize-none',
            )}
          />
        </EditorSection>

        {/* Footer actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-9 rounded-full bg-[#8FB821] px-4 text-[13px] font-semibold text-[#121212] hover:bg-[#AACF32] transition-colors"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] px-4 text-[13px] font-medium text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] hover:border-[#c8c5ba] hover:bg-[#F0F0EC] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor sub-components                                               */
/* ------------------------------------------------------------------ */

function EditorSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
        {icon}
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function EditorLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function TemplatePanelView({
  templates,
  selectedId,
  onSelect,
  onRefresh,
  onFilterOpen,
}: TemplatePanelViewProps) {
  const [searchQ, setSearchQ] = useState('');
  const [activePlacementFilters, setActivePlacementFilters] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);

  const filtered = useMemo(() => {
    let list = templates;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (activePlacementFilters.size > 0) {
      list = list.filter((t) => activePlacementFilters.has(t.payload.placementMode));
    }
    return list;
  }, [templates, searchQ, activePlacementFilters]);

  const selectedTemplate = selectedId
    ? templates.find((t) => t.id === selectedId) ?? null
    : null;

  // Reset editing when selection changes
  const handleSelect = useCallback((id: string) => {
    setEditing(false);
    onSelect(id);
  }, [onSelect]);

  function togglePlacementFilter(key: string) {
    setActivePlacementFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function clearFilters() {
    setSearchQ('');
    setActivePlacementFilters(new Set());
  }

  const handleDelete = useCallback((id: string) => {
    templatesService.removeAudiencePlacement(id);
    if (selectedId === id) onSelect('');
    onRefresh();
  }, [selectedId, onSelect, onRefresh]);

  const handleSaveEdit = useCallback(() => {
    setEditing(false);
    onRefresh();
  }, [onRefresh]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-[260px] flex-shrink-0 border-r border-[#e7e5dc] dark:border-[#2a2a2a] overflow-hidden flex flex-col">
        {/* Search + filter bar */}
        <div className="p-3 border-b border-[#e7e5dc] dark:border-[#2a2a2a] space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search templates…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 h-8 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-transparent px-3 text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 transition-all"
            />
            <button
              type="button"
              onClick={onFilterOpen}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:border-[#8FB821]/60 hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors flex-shrink-0"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Placement quick-filter chips */}
          <div className="flex flex-wrap gap-1">
            {PLACEMENT_CHIPS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => togglePlacementFilter(c.key)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wide border transition-colors leading-none',
                  activePlacementFilters.has(c.key)
                    ? 'bg-[#8FB821] text-[#121212] border-[#8FB821]'
                    : 'border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:border-[#8FB821]/60'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable template list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                No templates found
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 font-mono text-[11px] text-[#5B7611] dark:text-[#C3E165] underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((t) => (
              <TemplateListCard
                key={t.id}
                template={t}
                selected={selectedId === t.id}
                onClick={() => handleSelect(t.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col gap-4 p-5">
        {!selectedTemplate ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-xl border-[1.5px] border-[#e7e5dc] dark:border-[#2a2a2a]" />
                <div className="absolute inset-[6px] rounded-lg border-[1.5px] border-[#c8c5ba] dark:border-[#3a3a3a]" />
                <UsersIcon className="relative z-10 h-4 w-4 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)]" />
              </div>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                Select a template to view details
              </p>
            </div>
          </div>
        ) : (
          <>
            <TemplateSummaryCard
              template={selectedTemplate}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
              onDelete={handleDelete}
            />

            {editing && (
              <TemplateDetailEditor
                key={selectedTemplate.id}
                template={selectedTemplate}
                onSave={handleSaveEdit}
                onCancel={() => setEditing(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                    */
/* ------------------------------------------------------------------ */

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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
