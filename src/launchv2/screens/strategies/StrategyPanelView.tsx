/**
 * StrategyPanelView — 2-pane panel view for the Strategies screen.
 *
 * Left 260px: search + objective quick-filter chips + scrollable strategy list.
 * Right flex: summary card + inline StrategyEditor when editing=true.
 *
 * Design: FabFunnel v1.2 — lime #8FB821, Geist Mono for numerics/metadata,
 * rounded-2xl cards, warm borders #e7e5dc / dark #2a2a2a.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanV2 } from '../../types';
import type { LaunchStrategy } from '../../services/strategiesService';
import { stepCompletion } from './strategyEditorModel';
import { StrategyEditor } from './StrategyEditor';

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface StrategyPanelViewProps {
  strategies: LaunchStrategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onApply: (strategy: LaunchStrategy) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (
    id: string,
    patch: {
      name?: string;
      tags?: string[];
      plan?: Partial<PlanV2>;
      askAtLaunch?: string[];
    }
  ) => void;
  onFilterOpen: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const OBJECTIVE_CHIPS: { key: string; label: string }[] = [
  { key: 'OUTCOME_SALES', label: 'Sales' },
  { key: 'OUTCOME_LEADS', label: 'Leads' },
  { key: 'OUTCOME_TRAFFIC', label: 'Traffic' },
  { key: 'OUTCOME_AWARENESS', label: 'Awareness' },
  { key: 'OUTCOME_ENGAGEMENT', label: 'Engage' },
  { key: 'OUTCOME_APP_PROMOTION', label: 'App' },
];

const OBJECTIVE_COLORS: Record<string, { bg: string; text: string }> = {
  OUTCOME_SALES: { bg: '#F0FDF4', text: '#16A34A' },
  OUTCOME_LEADS: { bg: '#EFF6FF', text: '#2563EB' },
  OUTCOME_TRAFFIC: { bg: '#FFF7ED', text: '#EA580C' },
  OUTCOME_AWARENESS: { bg: '#FAF5FF', text: '#9333EA' },
  OUTCOME_ENGAGEMENT: { bg: '#FFF1F2', text: '#E11D48' },
  OUTCOME_APP_PROMOTION: { bg: '#F0F9FF', text: '#0284C7' },
};

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_SALES: 'Sales',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_TRAFFIC: 'Traffic',
  OUTCOME_AWARENESS: 'Awareness',
  OUTCOME_ENGAGEMENT: 'Engage',
  OUTCOME_APP_PROMOTION: 'App',
};

const STEP_LABELS = ['Start', 'Setup', 'Ad & Dist', 'Review'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatBudgetDisplay(plan: Partial<PlanV2>): string {
  const amount = plan.budgetAmount;
  const currency = plan.targets?.[0]?.currency;
  const mode = plan.budgetMode;
  if (!amount) return '—';
  const SYMBOLS: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ',
  };
  const sym = currency ? (SYMBOLS[currency] ?? `${currency} `) : '₹';
  const formatted = `${sym}${Math.round(amount).toLocaleString('en-IN')}/day`;
  return mode ? `${formatted} · ${mode}` : formatted;
}

function structureLabel(plan: Partial<PlanV2>): string {
  const s = plan.structure;
  if (!s) return '—';
  return `${s.campaigns}×${s.adSetsPerCampaign}×${s.adsPerAdSet}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

/** 4-step strip used in both the list card and the summary card. */
function StepStrip({
  strategy,
  size = 'sm',
}: {
  strategy: LaunchStrategy;
  size?: 'sm' | 'md';
}) {
  const { step1, step2, step3, step4 } = stepCompletion(strategy);
  const steps = [step1, step2, step3, step4];
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const trackH = size === 'sm' ? 'h-0.5' : 'h-0.5';

  return (
    <div className="flex items-center gap-0">
      {steps.map((done, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className={cn(
                'rounded-full transition-colors',
                dotSize,
                done
                  ? 'bg-[#8FB821]'
                  : 'bg-[#e7e5dc] dark:bg-[#2a2a2a]'
              )}
            />
            {size === 'md' && (
              <span className="font-mono text-[9px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] leading-none whitespace-nowrap">
                {STEP_LABELS[i]}
              </span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-1',
                trackH,
                'w-6 rounded-full',
                done && steps[i + 1]
                  ? 'bg-[#8FB821]'
                  : done
                  ? 'bg-[#8FB821]/40'
                  : 'bg-[#e7e5dc] dark:bg-[#2a2a2a]'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** Compact card in the left strategy list. */
function StrategyListCard({
  strategy,
  selected,
  onClick,
}: {
  strategy: LaunchStrategy;
  selected: boolean;
  onClick: () => void;
}) {
  const objective = strategy.plan?.objective ?? '';
  const colors = OBJECTIVE_COLORS[objective];
  const budgetStr = formatBudgetDisplay(strategy.plan ?? {});
  const tags = strategy.tags ?? [];

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
      {/* Row 1: pills */}
      <div className="flex items-center gap-1 justify-end">
        {colors && objective && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: colors.bg, color: colors.text }}
          >
            {OBJECTIVE_LABELS[objective] ?? objective}
          </span>
        )}
        {strategy.plan?.intent && (
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {strategy.plan.intent}
          </span>
        )}
      </div>

      {/* Row 2: name */}
      <p className="text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight line-clamp-2">
        {strategy.name}
      </p>

      {/* Row 3: budget */}
      {budgetStr !== '—' && (
        <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none tabular-nums">
          {budgetStr}
        </p>
      )}

    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ReportDataBadge                                                     */
/* ------------------------------------------------------------------ */

function ReportDataBadge({ strategy }: { strategy: LaunchStrategy }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive "has report data" from useCount + lastUsedAt
  // In production this would check a real reports API
  const hasData = (strategy.useCount ?? 0) >= 1 && !!strategy.lastUsedAt;

  // Mock performance data proportional to useCount for demo
  const mockStats = {
    impressions: Math.round((strategy.useCount ?? 1) * 47_382),
    reach: Math.round((strategy.useCount ?? 1) * 31_209),
    spend: Math.round((strategy.useCount ?? 1) * 8_430),
    roas: (1.8 + ((strategy.useCount ?? 1) % 5) * 0.4).toFixed(1),
    currency: strategy.plan?.targets?.[0]?.currency ?? 'INR',
  };

  const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const sym = SYMBOLS[mockStats.currency] ?? '₹';

  function handleMouseEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(true);
  }

  function handleMouseLeave() {
    timerRef.current = setTimeout(() => setShowTooltip(false), 120);
  }

  if (!hasData) {
    return (
      <span
        className="font-mono text-[9px] text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)] flex items-center gap-1"
        title="No report data yet"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        No data
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-1 font-mono text-[9px] text-[#5B7611] dark:text-[#C3E165] hover:opacity-80 transition-opacity"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#8FB821] animate-pulse" />
        Report data
      </button>
      {showTooltip && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute top-full left-0 mt-1 z-50 w-[200px] rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] shadow-lg p-3 space-y-2"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.06em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            Avg. per launch
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {[
              { label: 'Impressions', value: mockStats.impressions.toLocaleString('en-IN') },
              { label: 'Reach', value: mockStats.reach.toLocaleString('en-IN') },
              { label: 'Spend', value: `${sym}${mockStats.spend.toLocaleString('en-IN')}` },
              { label: 'ROAS', value: `${mockStats.roas}×` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono text-[8px] text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] uppercase tracking-[0.05em]">{label}</p>
                <p className="font-mono text-[12px] font-semibold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">{value}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[8px] text-[rgba(15,15,12,0.30)] dark:text-[rgba(255,255,255,0.30)]">
            Based on {strategy.useCount} launch{strategy.useCount === 1 ? '' : 'es'} · {relativeTime(strategy.lastUsedAt!)}
          </p>
        </div>
      )}
    </div>
  );
}

/** Objective pill for the summary card. */
function ObjectivePill({ objective }: { objective?: string | null }) {
  if (!objective) return null;
  const colors = OBJECTIVE_COLORS[objective];
  if (!colors) return null;
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-full leading-none"
      style={{ background: colors.bg, color: colors.text }}
    >
      {OBJECTIVE_LABELS[objective] ?? objective}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Right panel — summary card                                         */
/* ------------------------------------------------------------------ */

function SummaryCard({
  strategy,
  editing,
  onToggleEdit,
  onApply,
  onDuplicate,
  onDelete,
}: {
  strategy: LaunchStrategy;
  editing: boolean;
  onToggleEdit: () => void;
  onApply: (s: LaunchStrategy) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tags = strategy.tags ?? [];
  const budgetStr = formatBudgetDisplay(strategy.plan ?? {});
  const structStr = structureLabel(strategy.plan ?? {});

  return (
    <div className="rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h2 className="text-[15px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight tracking-[-0.01em]">
            {strategy.name}
          </h2>
          <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
            Updated {relativeTime(strategy.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApply(strategy)}
            className="h-8 rounded-full bg-[#8FB821] px-4 text-[12px] font-semibold text-[#121212] hover:bg-[#AACF32] transition-colors leading-none"
          >
            Apply
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

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <ObjectivePill objective={strategy.plan?.objective} />
        {strategy.plan?.intent && (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
            {strategy.plan.intent}
          </span>
        )}
        {budgetStr !== '—' && (
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
            {budgetStr}
          </span>
        )}
        {structStr !== '—' && (
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-0.5 rounded bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none">
            {structStr}
          </span>
        )}
      </div>

      {/* Step completion strip with labels */}
      <div>
        <StepStrip strategy={strategy} size="md" />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Launch count + report data availability */}
      {(strategy.useCount ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {strategy.useCount} launch{strategy.useCount === 1 ? '' : 'es'}
          </span>
          <ReportDataBadge strategy={strategy} />
        </div>
      )}

      {/* Danger zone */}
      <div className="flex gap-2 pt-1 border-t border-[#e7e5dc] dark:border-[#2a2a2a]">
        <button
          type="button"
          onClick={() => onDuplicate(strategy.id)}
          className="text-[11px] font-mono text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
        >
          Duplicate
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-[11px] text-red-500">Delete?</span>
            <button type="button" onClick={() => { onDelete(strategy.id); setConfirmDelete(false); }} className="font-mono text-[11px] text-red-500 hover:text-red-600 font-semibold transition-colors">Yes, delete</button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] hover:text-foreground transition-colors">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-[11px] font-mono text-red-500/70 hover:text-red-500 transition-colors ml-auto">Delete</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function StrategyPanelView({
  strategies,
  selectedId,
  onSelect,
  onApply,
  onDuplicate,
  onDelete,
  onSave,
  onFilterOpen,
}: StrategyPanelViewProps) {
  const [searchQ, setSearchQ] = useState('');
  const [activeObjectives, setActiveObjectives] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(true);

  // Reset editing when selection changes
  useEffect(() => {
    setEditing(true);
  }, [selectedId]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = strategies;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (activeObjectives.size > 0) {
      list = list.filter((s) => activeObjectives.has(s.plan?.objective ?? ''));
    }
    return list;
  }, [strategies, searchQ, activeObjectives]);

  const selectedStrategy = selectedId
    ? strategies.find((s) => s.id === selectedId) ?? null
    : null;

  function toggleObjectiveFilter(key: string) {
    setActiveObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearchQ('');
    setActiveObjectives(new Set());
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-[260px] flex-shrink-0 border-r border-[#e7e5dc] dark:border-[#2a2a2a] overflow-hidden flex flex-col">
        {/* Search + filter bar */}
        <div className="p-3 border-b border-[#e7e5dc] dark:border-[#2a2a2a] space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search strategies…"
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

          {/* Objective quick-filter chips */}
          <div className="flex flex-wrap gap-1">
            {OBJECTIVE_CHIPS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => toggleObjectiveFilter(o.key)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wide border transition-colors leading-none',
                  activeObjectives.has(o.key)
                    ? 'bg-[#8FB821] text-[#121212] border-[#8FB821]'
                    : 'border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] hover:border-[#8FB821]/60'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable strategy list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                No strategies found
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
            filtered.map((s) => (
              <StrategyListCard
                key={s.id}
                strategy={s}
                selected={selectedId === s.id}
                onClick={() => onSelect(s.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col gap-4 p-5">
        {!selectedStrategy ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)]">Select a strategy to view details</p>
          </div>
        ) : editing ? (
          // ── Edit mode: compact header + full editor ──
          <div className="flex flex-col gap-3 h-full">
            {/* Compact header — name + Apply + Close */}
            <div className="flex items-center gap-3 px-1 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-[14px] font-bold text-foreground truncate">{selectedStrategy.name}</h2>
                <p className="font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">Updated {relativeTime(selectedStrategy.updatedAt)}</p>
                {(selectedStrategy.useCount ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                      {selectedStrategy.useCount} launch{selectedStrategy.useCount === 1 ? '' : 'es'}
                    </span>
                    <ReportDataBadge strategy={selectedStrategy} />
                  </div>
                )}
              </div>
              <button onClick={() => onApply(selectedStrategy)} className="h-8 rounded-full bg-[#8FB821] px-4 text-[12px] font-semibold text-[#121212] hover:bg-[#AACF32] transition-colors flex-shrink-0">Apply</button>
              <button onClick={() => setEditing(false)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.55)] hover:border-[#8FB821]/60 transition-colors flex-shrink-0" aria-label="Close editor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Full editor */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <StrategyEditor
                key={selectedStrategy.id}
                strategy={selectedStrategy}
                onSave={(patch) => { onSave(selectedStrategy.id, patch); }}
                onCancel={() => setEditing(false)}
              />
            </div>
          </div>
        ) : (
          // ── View mode: full SummaryCard ──
          <SummaryCard
            strategy={selectedStrategy}
            editing={false}
            onToggleEdit={() => setEditing(true)}
            onApply={onApply}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
