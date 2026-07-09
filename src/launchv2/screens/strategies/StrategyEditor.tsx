/**
 * StrategyEditor — full-plan editor for a saved launch strategy.
 *
 * Layout: sidebar nav (13 sections) + scrollable detail pane.
 * Each section can be "Preset" (values set now) or "Ask at launch" (prompted
 * when user kicks off a launch using this strategy).
 *
 * Design: FabFunnel v1.2 — lime #8FB821, Geist Mono for numerics, rounded-2xl.
 */

import { useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import type { AdCopy, PlanV2, TargetPair } from "../../types";
import { ACCOUNTS, makeTargetV2, TARGETING_TEMPLATES } from "../../data";
import type { LaunchStrategy } from "../../services/strategiesService";
import {
  OBJECTIVE_OPTIONS,
  INTENT_OPTIONS,
  FORMAT_OPTIONS,
  BUDGET_MODE_OPTIONS,
  BID_OPTIONS,
  SPREAD_OPTIONS,
  PAGE_SPLIT_OPTIONS,
  ATTRIBUTION_OPTIONS,
  SPECIAL_CATEGORY_OPTIONS,
  DESTINATION_TYPE_OPTIONS,
  OPTIMIZATION_GOAL_OPTIONS,
  BUDGET_PERIOD_OPTIONS,
  ACCOUNT_DISTRIBUTION_OPTIONS,
  CTA_OPTIONS,
  PLACEMENT_MODE_OPTIONS,
  TOPIC_SECTIONS,
  currencySymbol,
  structureTotals,
  type SectionId,
} from "./strategyEditorModel";

/* ──────────────────────── cn helper ──────────────────────── */
function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ──────────────────────── shared atoms ──────────────────────── */

/** Selectable pill (segmented option). */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full font-mono text-[11px] uppercase tracking-[0.05em] font-semibold transition-colors leading-none border",
        active
          ? "bg-[#8FB821] text-[#121212] border-[#8FB821]"
          : "border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
      )}
    >
      {children}
    </button>
  );
}

/** Styled native select — full width. */
function FieldSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | "" | null | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full h-9 pl-3 pr-8 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 appearance-none cursor-pointer transition-all"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
        width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/** − [n] + stepper. */
function NumberStepper({
  value, min = 1, max = 99, onChange, label,
}: {
  value: number; min?: number; max?: number; onChange: (n: number) => void; label: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">{label}</p>
      <div className="inline-flex items-center gap-0 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          className="w-8 h-8 flex items-center justify-center text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors"
          aria-label={`Decrease ${label}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(parseInt(e.target.value || "0", 10)))}
          className="w-10 h-8 text-center bg-transparent font-mono text-[14px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none"
          style={{ MozAppearance: "textfield" } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          className="w-8 h-8 flex items-center justify-center text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors"
          aria-label={`Increase ${label}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Switch toggle. */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 group" aria-pressed={on}>
      <span className={cn("w-9 h-5 rounded-full transition-colors relative flex-shrink-0", on ? "bg-[#8FB821]" : "bg-[#e7e5dc] dark:bg-[#2a2a2a]")}>
        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5")} />
      </span>
      <span className="text-[13px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">{label}</span>
    </button>
  );
}

/** Section field-group label. */
function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">
      {children}
    </p>
  );
}

/* ──────────────────────── status dot ──────────────────────── */

type SectionStatus = "preset" | "ask" | "empty";

function StatusDot({ status }: { status: SectionStatus }) {
  if (status === "preset") {
    return <span className="w-1.5 h-1.5 rounded-full bg-[#8FB821] flex-shrink-0" />;
  }
  if (status === "ask") {
    return <span className="w-3 h-3 rounded-full border border-dashed border-[rgba(15,15,12,0.3)] dark:border-[rgba(255,255,255,0.3)] flex-shrink-0" />;
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-[#e7e5dc] dark:bg-[#2a2a2a] flex-shrink-0" />;
}

/* ──────────────────────── section icons ──────────────────────── */

function SectionIcon({ id, size = 16 }: { id: SectionId; size?: number }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.9,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "objective":
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" fill="currentColor" /></svg>);
    case "creative":
      return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>);
    case "conversion":
      return (<svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>);
    case "budget":
      return (<svg {...common}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
    case "audience":
      return (<svg {...common}><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    case "placements":
      return (<svg {...common}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>);
    case "accounts":
      return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>);
    case "structure":
      return (<svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case "distribution":
      return (<svg {...common}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="6" x2="9" y2="6" /><line x1="20" y1="18" x2="9" y2="18" /></svg>);
    case "scheduling":
      return (<svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
    case "attribution":
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></svg>);
    case "naming":
      return (<svg {...common}><path d="M4 7V4h16v3" /><path d="M9 20h6" /><line x1="12" y1="4" x2="12" y2="20" /></svg>);
    case "special":
      return (<svg {...common}><path d="M12 2l9 4.5v5c0 5-3.5 8.5-9 10.5-5.5-2-9-5.5-9-10.5v-5z" /></svg>);
    default:
      return (<svg {...common}><circle cx="12" cy="12" r="9" /></svg>);
  }
}

/* ──────────────────────── getSectionPreview helper ──────────────────────── */

function getSectionPreview(id: SectionId, plan: Partial<PlanV2>): string {
  switch (id) {
    case 'objective':
      return [plan.objective, plan.intent].filter(Boolean).join(' · ') || '';
    case 'creative':
      return [
        plan.format,
        plan.adCopy?.headline ? `"${plan.adCopy.headline}"` : null,
        plan.adCopy?.cta,
      ].filter(Boolean).join(' · ') || '';
    case 'conversion':
      return [plan.optimizationGoal, plan.conversionEvent].filter(Boolean).join(' · ') || '';
    case 'budget': {
      const budgetStr = plan.budgetAmount ? `₹${Number(plan.budgetAmount).toLocaleString('en-IN')}` : null;
      return [budgetStr, plan.budgetMode, plan.budgetPeriod].filter(Boolean).join(' · ') || '';
    }
    case 'audience':
      return plan.targetingTemplateId ? `Template: ${plan.targetingTemplateId}`
        : plan.advantageAudience ? 'Advantage+ audience'
        : plan.useCustomAudience ? 'Custom audience'
        : '';
    case 'placements':
      return plan.placementMode === 'advantage' ? 'Advantage+ placements'
        : plan.placementMode === 'manual' ? 'Manual placements'
        : '';
    case 'accounts': {
      const count = plan.targets?.length ?? 0;
      return count > 0 ? `${count} account${count !== 1 ? 's' : ''}` : '';
    }
    case 'structure': {
      const s = plan.structure;
      return s ? `${s.campaigns ?? 1}C × ${s.adSetsPerCampaign ?? 1}AS × ${s.adsPerAdSet ?? 1}Ads` : '';
    }
    case 'distribution':
      return [plan.spread, plan.pageDistribution].filter(Boolean).join(' · ') || '';
    case 'scheduling':
      return plan.scheduledFor ? new Date(plan.scheduledFor).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    case 'attribution':
      return plan.attribution ? String(plan.attribution) : '';
    case 'naming': {
      const np = plan.namingPatterns as any;
      return np?.campaign || plan.namingPattern || '';
    }
    case 'special':
      return (plan.specialAdCategories?.length ?? 0) > 0
        ? plan.specialAdCategories!.join(', ')
        : '';
    default:
      return '';
  }
}

/* ──────────────────────── isSectionPresetFromPlan helper ──────────────────────── */

function isSectionPresetFromPlan(id: SectionId, plan: Partial<PlanV2>): boolean {
  switch (id) {
    case 'objective': return !!plan.objective;
    case 'creative': return !!(plan.format || plan.adCopy?.primaryText || plan.adCopy?.headline);
    case 'conversion': return !!(plan.optimizationGoal || plan.destinationType);
    case 'budget': return (plan.budgetAmount ?? 0) > 0;
    case 'audience': return !!(plan.targetingTemplateId || plan.advantageAudience || plan.useCustomAudience);
    case 'placements': return !!plan.placementMode;
    case 'accounts': return (plan.targets?.length ?? 0) > 0;
    case 'structure': return !!plan.structure;
    case 'distribution': return !!(plan.spread || plan.pageDistribution);
    case 'scheduling': return !!plan.scheduledFor;
    case 'attribution': return !!plan.attribution;
    case 'naming': return !!((plan.namingPatterns as any)?.campaign || plan.namingPattern);
    case 'special': return (plan.specialAdCategories?.length ?? 0) > 0;
    default: return false;
  }
}

/* ──────────────────────── StrategyOverview component ──────────────────────── */

function StrategyOverview({
  plan,
  ask,
  onNavigate,
}: {
  plan: Partial<PlanV2>;
  ask: Set<SectionId>;
  onNavigate: (id: SectionId) => void;
}) {
  return (
    <div className="space-y-1.5">
      {TOPIC_SECTIONS.map(sec => {
        const isPreset = isSectionPresetFromPlan(sec.id, plan);
        const isAsk = ask.has(sec.id);
        const preview = getSectionPreview(sec.id, plan);

        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onNavigate(sec.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] hover:border-[#8FB821]/50 hover:bg-[#F5FBE2]/40 dark:hover:bg-[#1D2A09]/40 transition-colors text-left group"
          >
            {/* Section icon */}
            <span className="flex-shrink-0 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
              <SectionIcon id={sec.id} size={14} />
            </span>

            {/* Section name + preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[rgba(15,15,12,0.88)] dark:text-[rgba(255,255,255,0.88)]">
                {sec.label}
              </p>
              {preview && (
                <p className="font-mono text-[10px] text-[rgba(15,15,12,0.50)] dark:text-[rgba(255,255,255,0.50)] truncate mt-0.5">
                  {preview}
                </p>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {isAsk ? (
                <span className="font-mono text-[8px] uppercase tracking-[0.05em] font-bold px-1.5 py-0.5 rounded-full border border-dashed border-[rgba(15,15,12,0.25)] text-[rgba(15,15,12,0.40)] dark:border-[rgba(255,255,255,0.25)] dark:text-[rgba(255,255,255,0.40)]">
                  Ask
                </span>
              ) : isPreset ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#8FB821]" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[#e7e5dc] dark:bg-[#2a2a2a]" />
              )}
              {/* Arrow — shows on hover */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(15,15,12,0.25)" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────── editor ──────────────────────── */

export interface StrategyEditorProps {
  strategy: LaunchStrategy;
  onSave: (patch: { name: string; tags: string[]; plan: Partial<PlanV2>; askAtLaunch: string[] }) => void;
  onCancel: () => void;
}

const BID_NEEDS_VALUE = new Set(["COST_CAP", "LOWEST_COST_WITH_BID_CAP", "LOWEST_COST_WITH_MIN_ROAS"]);

export function StrategyEditor({ strategy, onSave, onCancel }: StrategyEditorProps) {
  const [name, setName] = useState(strategy.name);
  const [tags, setTags] = useState<string[]>(strategy.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [plan, setPlan] = useState<Partial<PlanV2>>({
    ...strategy.plan,
    adCopy: strategy.plan?.adCopy ?? {
      primaryText: "",
      headline: "",
      description: "",
      cta: "LEARN_MORE",
      destinationUrl: "",
      displayLink: "",
      utmTemplate: "",
    },
  });
  const [ask, setAsk] = useState<Set<SectionId>>(new Set((strategy.askAtLaunch ?? []) as SectionId[]));
  const [activeSection, setActiveSection] = useState<SectionId | 'overview'>('overview');

  const sym = currencySymbol(plan);
  const totals = structureTotals(plan);

  function patch(p: Partial<PlanV2>) {
    setPlan((prev) => ({ ...prev, ...p }));
  }

  function patchCopy(p: Partial<AdCopy>) {
    setPlan((prev) => ({ ...prev, adCopy: { ...(prev.adCopy ?? {}), ...p } as AdCopy }));
  }

  function toggleAsk(id: SectionId, currentlyAsked: boolean) {
    setAsk((prev) => {
      const s = new Set(prev);
      if (currentlyAsked) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const canSave = !!plan.objective && (plan.budgetAmount ?? 0) > 0 && name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({ name: name.trim(), tags, plan, askAtLaunch: Array.from(ask) });
  }

  /* tags */
  function commitTag() {
    const v = tagInput.trim().replace(/^,+|,+$/g, "");
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput("");
  }
  function tagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commitTag(); }
  }

  /* accounts */
  const targets: TargetPair[] = plan.targets ?? [];
  const selectedAccountIds = new Set(targets.map((t) => t.accountId));

  function toggleAccount(accId: string) {
    if (selectedAccountIds.has(accId)) {
      patch({ targets: targets.filter((t) => t.accountId !== accId) });
    } else {
      const acc = ACCOUNTS.find((a) => a.id === accId);
      const first = acc?.pages[0];
      const tp = first ? makeTargetV2(accId, first.id) : null;
      if (tp) patch({ targets: [...targets, tp] });
    }
  }
  function setPage(accId: string, pageId: string) {
    const tp = makeTargetV2(accId, pageId);
    if (!tp) return;
    patch({ targets: [...targets.filter((t) => t.accountId !== accId), tp] });
  }

  /* audience template lookup */
  const audienceTpl = useMemo(
    () => TARGETING_TEMPLATES.find((t) => t.id === plan.targetingTemplateId),
    [plan.targetingTemplateId],
  );

  /* section status */
  function sectionStatus(id: SectionId): SectionStatus {
    if (ask.has(id)) return "ask";
    switch (id) {
      case "objective":    return plan.objective ? "preset" : "empty";
      case "creative":     return (plan.format || plan.adCopy?.primaryText) ? "preset" : "empty";
      case "conversion":   return (plan.optimizationGoal || plan.destinationType) ? "preset" : "empty";
      case "budget":       return (plan.budgetAmount ?? 0) > 0 ? "preset" : "empty";
      case "audience":     return (plan.targetingTemplateId || plan.advantageAudience || plan.useCustomAudience) ? "preset" : "empty";
      case "placements":   return plan.placementMode ? "preset" : "empty";
      case "accounts":     return (plan.targets?.length ?? 0) > 0 ? "preset" : "empty";
      case "structure":    return plan.structure ? "preset" : "empty";
      case "distribution": return plan.spread ? "preset" : "empty";
      case "scheduling":   return plan.scheduledFor ? "preset" : "empty";
      case "attribution":  return plan.attribution ? "preset" : "empty";
      case "naming":       return (plan.namingPatterns?.campaign || plan.namingPattern) ? "preset" : "empty";
      case "special":      return (plan.specialAdCategories?.length ?? 0) > 0 ? "preset" : "empty";
      default:             return "empty";
    }
  }

  const currentSec = activeSection !== 'overview' ? TOPIC_SECTIONS.find((s) => s.id === activeSection) ?? null : null;
  const isAsked = activeSection !== 'overview' && ask.has(activeSection);

  /* ── render ── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFAF7] dark:bg-[#18181B]">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-5 py-3 border-b-2 border-[#8FB821] flex items-center gap-3 bg-[#FAFAF7] dark:bg-[#18181B] z-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[#5B7611] dark:text-[#C3E165] flex-shrink-0">
          Editing strategy
        </span>
        <input
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Strategy name"
          className="flex-1 min-w-0 h-9 px-3 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[14px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        />
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors flex-shrink-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-9 px-5 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          Save strategy
        </button>
      </div>

      {/* ── Body: sidebar + detail pane ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="w-48 flex-shrink-0 border-r border-[#e7e5dc] dark:border-[#2a2a2a] overflow-y-auto py-2 px-2 space-y-0.5 bg-[#FAFAF7] dark:bg-[#18181B]">

          {/* Overview item */}
          <button
            onClick={() => setActiveSection('overview')}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-colors',
              activeSection === 'overview'
                ? 'bg-[#F5FBE2] dark:bg-[#1D2A09]'
                : 'hover:bg-[#F0F0EC] dark:hover:bg-[#27272A]'
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeSection === 'overview' ? '#5B7611' : 'rgba(15,15,12,0.45)'} strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            <span className={cn('text-[12px] font-medium flex-1', activeSection === 'overview' ? 'text-[#5B7611] dark:text-[#C3E165] font-semibold' : 'text-[rgba(15,15,12,0.75)] dark:text-[rgba(255,255,255,0.75)]')}>
              Overview
            </span>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#e7e5dc] dark:border-[#2a2a2a]" />

          {/* Section nav items */}
          {TOPIC_SECTIONS.map((sec) => {
            const active = activeSection === sec.id;
            const status = sectionStatus(sec.id);
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-colors",
                  active
                    ? "bg-[#F5FBE2] dark:bg-[#1D2A09]"
                    : "hover:bg-[#F0F0EC] dark:hover:bg-[#27272A]",
                )}
              >
                <span className={cn(
                  "flex-shrink-0",
                  active
                    ? "text-[#5B7611] dark:text-[#C3E165]"
                    : "text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]",
                )}>
                  <SectionIcon id={sec.id} size={14} />
                </span>
                <span className={cn(
                  "text-[12px] font-medium flex-1 truncate",
                  active
                    ? "text-[#3D5A0A] dark:text-[#C3E165]"
                    : "text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]",
                )}>
                  {sec.label}
                </span>
                <StatusDot status={status} />
              </button>
            );
          })}

          {/* Tags at bottom of sidebar */}
          <div className="pt-3 mt-3 border-t border-[#e7e5dc] dark:border-[#2a2a2a] px-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] font-bold text-[rgba(15,15,12,0.35)] dark:text-[rgba(255,255,255,0.35)] mb-2 px-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-[0.04em] font-semibold px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                    aria-label={`Remove ${t}`}
                  >
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              {tags.length < 8 && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={tagKey}
                  onBlur={commitTag}
                  placeholder="Add…"
                  className="h-5 px-1.5 rounded-full border border-dashed border-[#e7e5dc] dark:border-[#2a2a2a] bg-transparent font-mono text-[9px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] placeholder:text-[rgba(15,15,12,0.3)] outline-none focus:border-[#8FB821] w-[60px]"
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Detail pane ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Pane header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a] flex items-center gap-3 bg-white dark:bg-[#1E1E23]">
            {activeSection === 'overview' ? (
              <>
                <span className="flex-shrink-0 text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </span>
                <h3 className="text-[14px] font-semibold flex-1 text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  Overview
                </h3>
                <span className="font-mono text-[10px] text-[rgba(15,15,12,0.40)] dark:text-[rgba(255,255,255,0.40)]">
                  {TOPIC_SECTIONS.filter(s => isSectionPresetFromPlan(s.id, plan)).length} of {TOPIC_SECTIONS.length} configured
                </span>
              </>
            ) : currentSec ? (
              <>
                <span className="text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] flex-shrink-0">
                  <SectionIcon id={activeSection as SectionId} size={18} />
                </span>
                <h3 className="text-[14px] font-semibold flex-1 text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                  {currentSec.label}
                </h3>
                {currentSec.required && (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                    Required
                  </span>
                )}
                {!currentSec.required && (
                  <button
                    type="button"
                    onClick={() => toggleAsk(activeSection as SectionId, isAsked)}
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2.5 py-1 rounded-full transition-colors",
                      isAsked
                        ? "bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
                        : "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165]",
                    )}
                    title={isAsked ? "Will be asked during launch" : "Preset in this strategy"}
                  >
                    {isAsked ? "Ask at launch" : "Preset"}
                  </button>
                )}
              </>
            ) : null}
          </div>

          {/* Pane body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#FAFAF7] dark:bg-[#18181B]">
            {activeSection === 'overview' ? (
              <StrategyOverview
                plan={plan}
                ask={ask}
                onNavigate={(id) => setActiveSection(id)}
              />
            ) : isAsked ? (
              <div className="py-6 flex items-start gap-3 text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
                </svg>
                <div>
                  <p className="font-mono text-[12px] font-semibold text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] mb-1">Ask at launch</p>
                  <p className="font-mono text-[11px]">
                    This section will be filled when the user kicks off a launch with this strategy.{" "}
                    <button
                      type="button"
                      onClick={() => toggleAsk(activeSection as SectionId, true)}
                      className="text-[#5B7611] dark:text-[#C3E165] font-semibold hover:underline"
                    >
                      Switch to Preset
                    </button>{" "}
                    to set values now.
                  </p>
                </div>
              </div>
            ) : (
              renderSection(activeSection as SectionId)
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ───────────────────── per-section renders ───────────────────── */
  function renderSection(id: SectionId): ReactNode {
    switch (id) {

      /* ── Objective ── */
      case "objective":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Objective</FieldLabel>
              <FieldSelect
                value={plan.objective ?? ""}
                options={OBJECTIVE_OPTIONS}
                placeholder="Choose objective"
                onChange={(v) => patch({ objective: v })}
              />
            </div>
            <div>
              <FieldLabel>Intent</FieldLabel>
              <div className="flex gap-1.5 flex-wrap">
                {INTENT_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.intent === o.value} onClick={() => patch({ intent: o.value })}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── Creative & copy ── */
      case "creative":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Ad format</FieldLabel>
              <FieldSelect
                value={plan.format ?? ""}
                options={FORMAT_OPTIONS}
                placeholder="Choose format"
                onChange={(v) => patch({ format: v })}
              />
            </div>
            <div>
              <FieldLabel>Primary text</FieldLabel>
              <textarea
                value={plan.adCopy?.primaryText ?? ""}
                onChange={(e) => patchCopy({ primaryText: e.target.value })}
                placeholder="Main ad copy…"
                className="w-full h-20 px-3 py-2.5 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 resize-none"
              />
            </div>
            <div>
              <FieldLabel>Headline</FieldLabel>
              <input
                type="text"
                value={plan.adCopy?.headline ?? ""}
                onChange={(e) => patchCopy({ headline: e.target.value })}
                placeholder="Headline…"
                className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <input
                type="text"
                value={plan.adCopy?.description ?? ""}
                onChange={(e) => patchCopy({ description: e.target.value })}
                placeholder="Description (optional)…"
                className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
            </div>
            <div>
              <FieldLabel>Call to action</FieldLabel>
              <FieldSelect
                value={plan.adCopy?.cta ?? ""}
                options={CTA_OPTIONS as { value: string; label: string }[]}
                placeholder="Choose CTA"
                onChange={(v) => patchCopy({ cta: v })}
              />
            </div>
            <div>
              <FieldLabel>Destination URL</FieldLabel>
              <input
                type="url"
                value={plan.adCopy?.destinationUrl ?? ""}
                onChange={(e) => patchCopy({ destinationUrl: e.target.value })}
                placeholder="https://…"
                className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] font-mono text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
            </div>
            <div>
              <FieldLabel>UTM template</FieldLabel>
              <input
                type="text"
                value={plan.adCopy?.utmTemplate ?? ""}
                onChange={(e) => patchCopy({ utmTemplate: e.target.value })}
                placeholder="utm_source=facebook&utm_medium=paid…"
                className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[12px] font-mono text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
            </div>
            <Toggle
              on={plan.advantageCreative === true}
              onChange={(v) => patch({ advantageCreative: v })}
              label="Advantage+ creative (auto-enhance assets)"
            />
          </div>
        );

      /* ── Conversion & pixel ── */
      case "conversion":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Destination type</FieldLabel>
              <FieldSelect
                value={plan.destinationType ?? ""}
                options={DESTINATION_TYPE_OPTIONS as { value: string; label: string }[]}
                placeholder="Choose destination"
                onChange={(v) => patch({ destinationType: v as PlanV2["destinationType"] })}
              />
            </div>
            <div>
              <FieldLabel>Optimization goal</FieldLabel>
              <FieldSelect
                value={plan.optimizationGoal ?? ""}
                options={OPTIMIZATION_GOAL_OPTIONS as { value: string; label: string }[]}
                placeholder="Choose goal"
                onChange={(v) => patch({ optimizationGoal: v as PlanV2["optimizationGoal"] })}
              />
            </div>
            <div>
              <FieldLabel>Conversion event</FieldLabel>
              <input
                type="text"
                value={plan.conversionEvent ?? ""}
                onChange={(e) => patch({ conversionEvent: e.target.value || null })}
                placeholder="e.g. Purchase, Lead, ViewContent…"
                className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
              <p className="mt-1.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Pixel event name from your dataset
              </p>
            </div>
          </div>
        );

      /* ── Budget & bidding ── */
      case "budget":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Budget period</FieldLabel>
              <div className="flex gap-1.5">
                {BUDGET_PERIOD_OPTIONS.map((o) => (
                  <Pill
                    key={o.value}
                    active={(plan.budgetPeriod ?? "daily") === o.value}
                    onClick={() => patch({ budgetPeriod: o.value as "daily" | "lifetime" })}
                  >
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>
                {(plan.budgetPeriod ?? "daily") === "lifetime" ? "Lifetime budget" : "Daily budget"}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">{sym}</span>
                <input
                  type="number"
                  min={1}
                  value={plan.budgetAmount || ""}
                  onChange={(e) => patch({ budgetAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="h-9 w-32 px-3 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] font-mono text-[14px] tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
                  style={{ MozAppearance: "textfield" } as React.CSSProperties}
                />
                <span className="font-mono text-[12px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  {(plan.budgetPeriod ?? "daily") === "lifetime" ? "total" : "/day"}
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>Budget mode</FieldLabel>
              <div className="flex gap-1.5">
                {BUDGET_MODE_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.budgetMode === o.value} onClick={() => patch({ budgetMode: o.value })}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Bid strategy</FieldLabel>
              <FieldSelect
                value={plan.bidStrategy ?? ""}
                options={BID_OPTIONS}
                placeholder="Choose bid strategy"
                onChange={(v) => patch({ bidStrategy: v })}
              />
            </div>
            {plan.bidStrategy && BID_NEEDS_VALUE.has(plan.bidStrategy) && (
              <div>
                <FieldLabel>
                  {plan.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" ? "ROAS target" : "Cap value"}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  {plan.bidStrategy !== "LOWEST_COST_WITH_MIN_ROAS" && (
                    <span className="font-mono text-[14px] text-[rgba(15,15,12,0.55)]">{sym}</span>
                  )}
                  <input
                    type="number"
                    min={0}
                    step={plan.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" ? 0.1 : 1}
                    value={plan.bidValue ?? ""}
                    onChange={(e) => patch({ bidValue: e.target.value === "" ? null : parseFloat(e.target.value) })}
                    placeholder={plan.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" ? "e.g. 2.0" : "0"}
                    className="h-9 w-28 px-3 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] font-mono text-[14px] tabular-nums outline-none focus:border-[#8FB821]"
                    style={{ MozAppearance: "textfield" } as React.CSSProperties}
                  />
                </div>
              </div>
            )}
            <Toggle
              on={plan.advantagePlus === true}
              onChange={(v) => patch({ advantagePlus: v })}
              label="Advantage+ campaign budget"
            />
          </div>
        );

      /* ── Audience ── */
      case "audience":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Targeting template</FieldLabel>
              <FieldSelect
                value={plan.targetingTemplateId ?? ""}
                options={TARGETING_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="No template (broad)"
                onChange={(v) => patch({ targetingTemplateId: v || null })}
              />
              {audienceTpl && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {audienceTpl.summary.map((s) => (
                    <span key={s} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Toggle
              on={plan.advantageAudience === true}
              onChange={(v) => patch({ advantageAudience: v })}
              label="Advantage+ audience"
            />
            <div className="border-t border-[#e7e5dc] dark:border-[#2a2a2a] pt-4">
              <Toggle
                on={plan.useCustomAudience === true}
                onChange={(v) => patch({ useCustomAudience: v, customAudienceId: v ? plan.customAudienceId : null })}
                label="Use custom audience"
              />
              {plan.useCustomAudience && (
                <div className="mt-3">
                  <FieldLabel>Custom audience ID</FieldLabel>
                  <input
                    type="text"
                    value={plan.customAudienceId ?? ""}
                    onChange={(e) => patch({ customAudienceId: e.target.value || null })}
                    placeholder="Audience ID from Meta Ads Manager"
                    className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] font-mono text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821]"
                  />
                </div>
              )}
            </div>
          </div>
        );

      /* ── Placements ── */
      case "placements":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Placement mode</FieldLabel>
              <div className="space-y-2">
                {PLACEMENT_MODE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => patch({ placementMode: o.value as "advantage" | "manual" })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors",
                      plan.placementMode === o.value
                        ? "border-[#8FB821] bg-[#F5FBE2] dark:bg-[#1D2A09]"
                        : "border-[#e7e5dc] dark:border-[#2a2a2a] hover:border-[#8FB821]/50",
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                      plan.placementMode === o.value
                        ? "border-[#8FB821]"
                        : "border-[#e7e5dc] dark:border-[#2a2a2a]",
                    )}>
                      {plan.placementMode === o.value && (
                        <div className="w-2 h-2 rounded-full bg-[#8FB821]" />
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
                      {o.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {plan.placementMode === "manual" && (
              <div>
                <FieldLabel>Manual placements</FieldLabel>
                <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  Specific placement selection will be configured at launch.
                </p>
              </div>
            )}
          </div>
        );

      /* ── Accounts & pages ── */
      case "accounts":
        return (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {ACCOUNTS.map((acc) => {
              const checked = selectedAccountIds.has(acc.id);
              const target = targets.find((t) => t.accountId === acc.id);
              return (
                <div
                  key={acc.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 transition-colors",
                    checked
                      ? "border-[#8FB821]/50 bg-[#F5FBE2]/50 dark:bg-[#1D2A09]/40"
                      : "border-[#e7e5dc] dark:border-[#2a2a2a]",
                  )}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleAccount(acc.id)} className="accent-[#8FB821] w-4 h-4" />
                    <span className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] flex-1 truncate">{acc.name}</span>
                    <span className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">{acc.currency}</span>
                  </label>
                  {checked && acc.pages.length > 0 && (
                    <div className="mt-2 pl-6">
                      <FieldSelect
                        value={target?.pageId ?? acc.pages[0].id}
                        options={acc.pages.map((p) => ({ value: p.id, label: p.name }))}
                        onChange={(v) => setPage(acc.id, v)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      /* ── Structure ── */
      case "structure": {
        const s = plan.structure ?? { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 };
        const setS = (k: keyof typeof s, n: number) => patch({ structure: { ...s, [k]: n } });
        return (
          <div>
            <div className="flex flex-wrap items-end gap-5">
              <NumberStepper label="Campaigns" value={s.campaigns} onChange={(n) => setS("campaigns", n)} />
              <NumberStepper label="Ad sets / campaign" value={s.adSetsPerCampaign} onChange={(n) => setS("adSetsPerCampaign", n)} />
              <NumberStepper label="Ads / ad set" value={s.adsPerAdSet} onChange={(n) => setS("adsPerAdSet", n)} />
            </div>
            <p className="mt-4 font-mono text-[12px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
              = <span className="text-[#5B7611] dark:text-[#C3E165] font-bold">{totals.ads}</span> ads total ({s.campaigns} × {s.adSetsPerCampaign} × {s.adsPerAdSet})
            </p>
          </div>
        );
      }

      /* ── Distribution ── */
      case "distribution":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Creative spread</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {SPREAD_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.spread === o.value} onClick={() => patch({ spread: o.value })}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Page split</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {PAGE_SPLIT_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.pageDistribution === o.value} onClick={() => patch({ pageDistribution: o.value })}>
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Account distribution</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_DISTRIBUTION_OPTIONS.map((o) => (
                  <Pill
                    key={o.value}
                    active={(plan.accountDistribution as string | undefined) === o.value}
                    onClick={() => patch({ accountDistribution: o.value as PlanV2["accountDistribution"] })}
                  >
                    {o.label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── Scheduling ── */
      case "scheduling":
        return (
          <div className="space-y-5">
            <div>
              <FieldLabel>Scheduled start</FieldLabel>
              <input
                type="datetime-local"
                value={plan.scheduledFor ?? ""}
                onChange={(e) => patch({ scheduledFor: e.target.value || null })}
                className="h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] font-mono text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
              />
              <p className="mt-1.5 font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Leave empty to start immediately at launch
              </p>
            </div>
          </div>
        );

      /* ── Attribution ── */
      case "attribution":
        return (
          <div>
            <FieldLabel>Attribution window</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {ATTRIBUTION_OPTIONS.map((o) => (
                <Pill key={o.value} active={plan.attribution === o.value} onClick={() => patch({ attribution: o.value })}>
                  {o.label}
                </Pill>
              ))}
            </div>
          </div>
        );

      /* ── Naming ── */
      case "naming":
        return (
          <div className="space-y-5">
            <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
              Use tokens like{" "}
              <code className="bg-[#F0F0EC] dark:bg-[#27272A] px-1 rounded text-[#5B7611] dark:text-[#C3E165]">{"{{objective}}"}</code>,{" "}
              <code className="bg-[#F0F0EC] dark:bg-[#27272A] px-1 rounded text-[#5B7611] dark:text-[#C3E165]">{"{{date}}"}</code>,{" "}
              <code className="bg-[#F0F0EC] dark:bg-[#27272A] px-1 rounded text-[#5B7611] dark:text-[#C3E165]">{"{{brand}}"}</code>
            </p>
            {(["campaign", "adset", "ad"] as const).map((level) => (
              <div key={level}>
                <FieldLabel>{level.charAt(0).toUpperCase() + level.slice(1)} name pattern</FieldLabel>
                <input
                  type="text"
                  value={(plan.namingPatterns as unknown as Record<string, string> | undefined)?.[level] ?? ""}
                  onChange={(e) => patch({
                    namingPatterns: {
                      campaign: plan.namingPatterns?.campaign ?? "",
                      adset: plan.namingPatterns?.adset ?? "",
                      ad: plan.namingPatterns?.ad ?? "",
                      [level]: e.target.value,
                    },
                  })}
                  placeholder={`e.g. {{brand}}_{{objective}}_{{date}}_${level}`}
                  className="w-full h-9 px-3 rounded-[28px] border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[12px] font-mono text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
                />
              </div>
            ))}
          </div>
        );

      /* ── Special categories ── */
      case "special":
        return (
          <div className="space-y-3">
            <Toggle
              on={plan.specialAdDeclared === true}
              onChange={(v) => patch({ specialAdDeclared: v, specialAdCategories: v ? plan.specialAdCategories ?? [] : [] })}
              label="This launch is a special ad category"
            />
            {plan.specialAdDeclared && (
              <div className="grid grid-cols-1 gap-1.5 pl-1 mt-2">
                {SPECIAL_CATEGORY_OPTIONS.map((o) => {
                  const cats = plan.specialAdCategories ?? [];
                  const on = cats.includes(o.value);
                  return (
                    <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => patch({ specialAdCategories: on ? cats.filter((c) => c !== o.value) : [...cats, o.value] })}
                        className="accent-[#8FB821] w-4 h-4"
                      />
                      <span className="text-[13px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">{o.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }
}
