/**
 * StrategyEditor — full-plan editor for a saved launch strategy.
 *
 * Interaction model (B + C):
 *   • Top  — an editable summary line: every bold token is a tap-to-edit chip
 *            that opens its section. Lime = preset, dashed = "ask at launch".
 *   • Body — a grid of topic tiles (one per section). Tap a tile to expand its
 *            controls inline. Optional tiles carry a Preset / Ask-at-launch toggle.
 *
 * A strategy is a saved DRAFT of an entire launch: objective + budget are
 * required; every other section can be left blank and prompted for at launch.
 *
 * Design: FabFunnel v1.2 — lime #8FB821, Geist Mono for numerics, rounded-2xl.
 */

import { useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import type { PlanV2, TargetPair } from "../../types";
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
  TOPIC_SECTIONS,
  objectiveLabel,
  intentLabel,
  formatLabel,
  spreadLabel,
  pageSplitLabel,
  bidLabel,
  currencySymbol,
  structureTotals,
  type SectionId,
} from "./strategyEditorModel";

/* ───────────────────────── shared atoms ───────────────────────── */

const LIME = "#8FB821";

/** Selectable pill (segmented option). */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-8 px-3 rounded-full font-mono text-[11px] uppercase tracking-[0.05em] font-semibold transition-colors leading-none border",
        active
          ? "bg-[#8FB821] text-[#121212] border-[#8FB821]"
          : "border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** Styled native select. */
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
    <div className="relative inline-block">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 pl-3 pr-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 appearance-none cursor-pointer transition-all"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/** − [n] + stepper. */
function NumberStepper({ value, min = 1, max = 99, onChange, label }: { value: number; min?: number; max?: number; onChange: (n: number) => void; label: string }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">{label}</p>
      <div className="inline-flex items-center gap-0 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] overflow-hidden">
        <button type="button" onClick={() => onChange(clamp(value - 1))} className="w-8 h-8 flex items-center justify-center text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors" aria-label={`Decrease ${label}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
        <button type="button" onClick={() => onChange(clamp(value + 1))} className="w-8 h-8 flex items-center justify-center text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors" aria-label={`Increase ${label}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
    </div>
  );
}

/** Switch toggle. */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 group" aria-pressed={on}>
      <span className={["w-9 h-5 rounded-full transition-colors relative flex-shrink-0", on ? "bg-[#8FB821]" : "bg-[#e7e5dc] dark:bg-[#2a2a2a]"].join(" ")}>
        <span className={["absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", on ? "left-4" : "left-0.5"].join(" ")} />
      </span>
      <span className="text-[13px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">{label}</span>
    </button>
  );
}

/** Section field-group label. */
function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-1.5">{children}</p>;
}

/* ───────────────────────── section icons ───────────────────────── */

function SectionIcon({ id }: { id: SectionId }) {
  const c = "rgba(15,15,12,0.55)";
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "objective": return (<svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" fill={c} /></svg>);
    case "budget": return (<svg {...common}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
    case "structure": return (<svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case "distribution": return (<svg {...common}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="6" x2="9" y2="6" /><line x1="20" y1="18" x2="9" y2="18" /></svg>);
    case "audience": return (<svg {...common}><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
    case "accounts": return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>);
    case "attribution": return (<svg {...common}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></svg>);
    case "special": return (<svg {...common}><path d="M12 2l9 4.5v5c0 5-3.5 8.5-9 10.5-5.5-2-9-5.5-9-10.5v-5z" /></svg>);
  }
}

/* ───────────────────────── editor ───────────────────────── */

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
  const [plan, setPlan] = useState<Partial<PlanV2>>({ ...strategy.plan });
  const [ask, setAsk] = useState<Set<string>>(new Set(strategy.askAtLaunch ?? []));
  const [open, setOpen] = useState<SectionId | null>("objective");

  const sym = currencySymbol(plan);
  const totals = structureTotals(plan);

  function patch(p: Partial<PlanV2>) {
    setPlan((prev) => ({ ...prev, ...p }));
  }

  function toggleAsk(id: SectionId, next: boolean) {
    setAsk((prev) => {
      const s = new Set(prev);
      if (next) s.delete(id); // "Preset" → not asked
      else s.add(id); // "Ask at launch"
      return s;
    });
  }

  const objectiveSet = !!plan.objective;
  const budgetSet = (plan.budgetAmount ?? 0) > 0;
  const canSave = objectiveSet && budgetSet && name.trim().length > 0;

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

  /* live summary tokens */
  const audienceTpl = useMemo(
    () => TARGETING_TEMPLATES.find((t) => t.id === plan.targetingTemplateId),
    [plan.targetingTemplateId],
  );

  type Tok = { id: SectionId; text: string; muted: boolean };
  const tokens: Tok[] = [
    { id: "objective", text: objectiveLabel(plan.objective), muted: !objectiveSet },
    { id: "objective", text: formatLabel(plan.format), muted: !plan.format },
    { id: "budget", text: budgetSet ? `${sym}${Math.round(plan.budgetAmount as number).toLocaleString("en-IN")}/day` : "ask at launch", muted: !budgetSet },
    { id: "budget", text: plan.budgetMode ?? "—", muted: !plan.budgetMode },
    { id: "structure", text: ask.has("structure") || !plan.structure ? "ask at launch" : `${totals.campaigns}×${(plan.structure?.adSetsPerCampaign) ?? 0}×${(plan.structure?.adsPerAdSet) ?? 0}`, muted: ask.has("structure") || !plan.structure },
    { id: "audience", text: ask.has("audience") ? "ask at launch" : audienceTpl ? audienceTpl.name : plan.advantageAudience ? "Advantage+" : "ask at launch", muted: ask.has("audience") || (!audienceTpl && !plan.advantageAudience) },
    { id: "distribution", text: ask.has("distribution") || !plan.spread ? "ask at launch" : spreadLabel(plan.spread), muted: ask.has("distribution") || !plan.spread },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFAF7] dark:bg-[#18181B]">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-4 border-b-2 border-[#8FB821] flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[#5B7611] dark:text-[#C3E165] flex-shrink-0">Editing strategy</span>
        <input
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Strategy name"
          className="flex-1 min-w-0 h-9 px-3 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[14px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20"
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        />
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] transition-colors flex-shrink-0">
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={!canSave} className="h-9 px-5 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
          Save strategy
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* ── Editable summary line (B) ── */}
        <div className="mb-6 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-2">Launch summary · tap any value to edit</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[14px] leading-[2.1] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">
            {tokens.map((t, i) => (
              <button
                key={`${t.id}-${i}`}
                type="button"
                onClick={() => setOpen(t.id)}
                className={[
                  "px-2.5 py-1 rounded-full font-mono text-[12px] font-semibold transition-colors",
                  t.muted
                    ? "border border-dashed border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] hover:border-[#8FB821]/60"
                    : "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165] hover:bg-[#EBF6BF] dark:hover:bg-[#2C3F10]",
                ].join(" ")}
              >
                {t.text}
              </button>
            ))}
          </div>
          {/* live structure mini-tree */}
          {plan.structure && !ask.has("structure") && (
            <div className="mt-3 pt-3 border-t border-[#e7e5dc]/60 dark:border-[#2a2a2a]/60 flex items-center gap-4 font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
              <span>{totals.campaigns} campaign{totals.campaigns !== 1 ? "s" : ""}</span>
              <span className="text-[rgba(15,15,12,0.3)]">→</span>
              <span>{totals.adSets} ad sets</span>
              <span className="text-[rgba(15,15,12,0.3)]">→</span>
              <span className="text-[#5B7611] dark:text-[#C3E165] font-semibold">{totals.ads} ads</span>
            </div>
          )}
        </div>

        {/* ── Topic tiles (C) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOPIC_SECTIONS.map((sec) => {
            const expanded = open === sec.id;
            const asked = ask.has(sec.id);
            return (
              <div
                key={sec.id}
                className={[
                  "rounded-2xl border transition-all",
                  expanded ? "md:col-span-2 border-[#8FB821] bg-white dark:bg-[#1E1E23] shadow-sm" : "border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23]",
                  asked && !expanded ? "opacity-60" : "",
                ].join(" ")}
              >
                {/* tile header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setOpen(expanded ? null : sec.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <span className="text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] flex-shrink-0"><SectionIcon id={sec.id} /></span>
                    <span className="text-[13px] font-semibold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] truncate" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>{sec.label}</span>
                    {sec.required && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-bold px-1.5 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] flex-shrink-0">Required</span>
                    )}
                  </button>
                  {/* preset / ask toggle (optional sections only) */}
                  {!sec.required && (
                    <button
                      type="button"
                      onClick={() => toggleAsk(sec.id, asked)}
                      className={[
                        "font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2.5 py-1 rounded-full transition-colors flex-shrink-0",
                        asked
                          ? "bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]"
                          : "bg-[#F5FBE2] dark:bg-[#1D2A09] text-[#5B7611] dark:text-[#C3E165]",
                      ].join(" ")}
                      title={asked ? "Will be asked during launch" : "Preset in this strategy"}
                    >
                      {asked ? "Ask at launch" : "Preset"}
                    </button>
                  )}
                  <button type="button" onClick={() => setOpen(expanded ? null : sec.id)} className="text-[rgba(15,15,12,0.4)] dark:text-[rgba(255,255,255,0.4)] flex-shrink-0" aria-label={expanded ? "Collapse" : "Expand"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>

                {/* expanded controls */}
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#e7e5dc]/60 dark:border-[#2a2a2a]/60">
                    {asked ? (
                      <div className="py-4 flex items-center gap-2 font-mono text-[12px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></svg>
                        This section will be filled during launch. Flip to <span className="text-[#5B7611] dark:text-[#C3E165] font-semibold">Preset</span> to set it now.
                      </div>
                    ) : (
                      <div className="pt-3">{renderSection(sec.id)}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tags ── */}
        <div className="mt-6 rounded-2xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] px-4 py-4">
          <FieldLabel>Tags</FieldLabel>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-1 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-0.5 opacity-60 hover:opacity-100" aria-label={`Remove ${t}`}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </span>
            ))}
            {tags.length < 8 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={tagKey}
                onBlur={commitTag}
                placeholder="Add tag…"
                className="h-7 px-2.5 rounded-full border border-dashed border-[#e7e5dc] dark:border-[#2a2a2a] bg-transparent font-mono text-[10px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] placeholder:text-[rgba(15,15,12,0.35)] outline-none focus:border-[#8FB821] w-[140px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ───────── per-section control renderers ───────── */
  function renderSection(id: SectionId) {
    switch (id) {
      case "objective":
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Objective</FieldLabel>
              <FieldSelect value={plan.objective ?? ""} options={OBJECTIVE_OPTIONS} placeholder="Choose objective" onChange={(v) => patch({ objective: v })} />
            </div>
            <div>
              <FieldLabel>Intent</FieldLabel>
              <div className="flex gap-1.5">
                {INTENT_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.intent === o.value} onClick={() => patch({ intent: o.value })}>{o.label}</Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Format</FieldLabel>
              <FieldSelect value={plan.format ?? ""} options={FORMAT_OPTIONS} placeholder="Choose format" onChange={(v) => patch({ format: v })} />
            </div>
          </div>
        );
      case "budget":
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Daily budget</FieldLabel>
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
                <span className="font-mono text-[12px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">/day</span>
              </div>
            </div>
            <div>
              <FieldLabel>Budget mode</FieldLabel>
              <div className="flex gap-1.5">
                {BUDGET_MODE_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.budgetMode === o.value} onClick={() => patch({ budgetMode: o.value })}>{o.label}</Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Bid strategy</FieldLabel>
              <FieldSelect value={plan.bidStrategy ?? ""} options={BID_OPTIONS} placeholder="Choose bid strategy" onChange={(v) => patch({ bidStrategy: v })} />
            </div>
            {plan.bidStrategy && BID_NEEDS_VALUE.has(plan.bidStrategy) && (
              <div>
                <FieldLabel>{plan.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS" ? "ROAS target" : "Cap value"}</FieldLabel>
                <div className="flex items-center gap-2">
                  {plan.bidStrategy !== "LOWEST_COST_WITH_MIN_ROAS" && <span className="font-mono text-[14px] text-[rgba(15,15,12,0.55)]">{sym}</span>}
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
            <Toggle on={plan.advantagePlus === true} onChange={(v) => patch({ advantagePlus: v })} label="Advantage+ campaign budget" />
          </div>
        );
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
              = <span className="text-[#5B7611] dark:text-[#C3E165] font-bold">{s.campaigns * s.adSetsPerCampaign * s.adsPerAdSet}</span> ads total ({s.campaigns} × {s.adSetsPerCampaign} × {s.adsPerAdSet})
            </p>
          </div>
        );
      }
      case "distribution":
        return (
          <div className="space-y-4">
            <div>
              <FieldLabel>Creative spread</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {SPREAD_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.spread === o.value} onClick={() => patch({ spread: o.value })}>{o.label}</Pill>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Page split</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {PAGE_SPLIT_OPTIONS.map((o) => (
                  <Pill key={o.value} active={plan.pageDistribution === o.value} onClick={() => patch({ pageDistribution: o.value })}>{o.label}</Pill>
                ))}
              </div>
            </div>
          </div>
        );
      case "audience":
        return (
          <div className="space-y-4">
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
                    <span key={s} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]">{s}</span>
                  ))}
                </div>
              )}
            </div>
            <Toggle on={plan.advantageAudience === true} onChange={(v) => patch({ advantageAudience: v })} label="Advantage+ audience" />
          </div>
        );
      case "accounts":
        return (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {ACCOUNTS.map((acc) => {
              const checked = selectedAccountIds.has(acc.id);
              const target = targets.find((t) => t.accountId === acc.id);
              return (
                <div key={acc.id} className={["rounded-xl border px-3 py-2.5 transition-colors", checked ? "border-[#8FB821]/50 bg-[#F5FBE2]/50 dark:bg-[#1D2A09]/40" : "border-[#e7e5dc] dark:border-[#2a2a2a]"].join(" ")}>
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
      case "attribution":
        return (
          <div>
            <FieldLabel>Attribution window</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {ATTRIBUTION_OPTIONS.map((o) => (
                <Pill key={o.value} active={plan.attribution === o.value} onClick={() => patch({ attribution: o.value })}>{o.label}</Pill>
              ))}
            </div>
          </div>
        );
      case "special":
        return (
          <div className="space-y-3">
            <Toggle on={plan.specialAdDeclared === true} onChange={(v) => patch({ specialAdDeclared: v, specialAdCategories: v ? plan.specialAdCategories ?? [] : [] })} label="This launch is a special ad category" />
            {plan.specialAdDeclared && (
              <div className="grid grid-cols-1 gap-1.5 pl-1">
                {SPECIAL_CATEGORY_OPTIONS.map((o) => {
                  const cats = plan.specialAdCategories ?? [];
                  const on = cats.includes(o.value);
                  return (
                    <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={on} onChange={() => patch({ specialAdCategories: on ? cats.filter((c) => c !== o.value) : [...cats, o.value] })} className="accent-[#8FB821] w-4 h-4" />
                      <span className="text-[13px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)]">{o.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  }
}
