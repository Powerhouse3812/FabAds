/**
 * StrategiesLibrary — Launch v2
 *
 * Two-panel layout:
 *   Left  — searchable, filterable, sortable card grid of saved strategies
 *   Right — 320px sticky preview rail (selected strategy detail + actions)
 *
 * Design: FabFunnel v1.2
 *   Lime #8FB821 · bg #FAFAF7 light / #18181B dark
 *   Geist Mono for ALL numbers/metadata · Geist Sans for labels/names
 */

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { strategiesService, type LaunchStrategy, type StrategySummary } from "../../services/strategiesService";

/* ─────────────────────── tiny helpers ───────────────────────── */

function relativeTime(iso?: string): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
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

const OBJECTIVE_COLOURS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Sales:       { bg: "#EBF6BF", text: "#5B7611", darkBg: "#1D2A09", darkText: "#C3E165" },
  Awareness:   { bg: "#EFF6FF", text: "#1D4ED8", darkBg: "#1E2A4A", darkText: "#93C5FD" },
  Traffic:     { bg: "#FDF4FF", text: "#7E22CE", darkBg: "#2D1B4A", darkText: "#C4B5FD" },
  Leads:       { bg: "#FFF7ED", text: "#C2410C", darkBg: "#3D1E0A", darkText: "#FDB07A" },
  Engagement:  { bg: "#F0FDF4", text: "#166534", darkBg: "#0D2A1A", darkText: "#86EFAC" },
  "App promotion": { bg: "#FEF9C3", text: "#854D0E", darkBg: "#2D200A", darkText: "#FDE047" },
};

function objectivePill(objective: string) {
  const colours = OBJECTIVE_COLOURS[objective] ?? { bg: "#F0F0EC", text: "#3F3F46", darkBg: "#27272A", darkText: "#A1A1AA" };
  return colours;
}

function intentPill(intent: string) {
  const map: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    Scale:  { bg: "#EBF6BF", text: "#5B7611", darkBg: "#1D2A09",  darkText: "#C3E165" },
    Test:   { bg: "#FEF9C3", text: "#854D0E", darkBg: "#2D200A",  darkText: "#FDE047" },
    Custom: { bg: "#F0F0EC", text: "#3F3F46", darkBg: "#27272A",  darkText: "#A1A1AA" },
  };
  return map[intent] ?? map.Custom;
}

type SortKey = "recently-used" | "most-used" | "name";

/* ─────────────────────── sub-components ─────────────────────── */

/** Accent bar color by objective */
const ACCENT_COLOURS: Record<string, string> = {
  Sales:            "#8FB821",
  Awareness:        "#3B82F6",
  Traffic:          "#8B5CF6",
  Leads:            "#F97316",
  Engagement:       "#22C55E",
  "App promotion":  "#EAB308",
};

function accentColour(objective: string): string {
  return ACCENT_COLOURS[objective] ?? "#94A3B8";
}

/** Format icon SVGs — 18×18, colored rgba(15,15,12,0.38) */
function FormatIcon({ format }: { format: string }) {
  const cls = "flex-shrink-0";
  const color = "rgba(15,15,12,0.38)";

  switch (format) {
    case "single_image":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="1.5" y="3.5" width="15" height="11" rx="1.5" stroke={color} strokeWidth="1.4" />
          <path d="M1.5 11.5l4-4 3 3 2.5-2.5 4 4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "single_video":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="1.5" y="3.5" width="15" height="11" rx="1.5" stroke={color} strokeWidth="1.4" />
          <path d="M7 6.5l5 2.5-5 2.5V6.5z" fill={color} />
        </svg>
      );
    case "carousel":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="3.5" y="4" width="9" height="10" rx="1.2" stroke={color} strokeWidth="1.4" />
          <rect x="5.5" y="5.5" width="9" height="10" rx="1.2" stroke={color} strokeWidth="1.1" strokeDasharray="2 1" />
          <rect x="7.5" y="7" width="9" height="10" rx="1.2" stroke={color} strokeWidth="0.9" strokeDasharray="2 1.5" />
        </svg>
      );
    case "dpa":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="2" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
          <rect x="10" y="2" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
          <rect x="2" y="10" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
          <rect x="10" y="10" width="6" height="6" rx="1" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case "collection":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="2" y="2" width="14" height="8" rx="1.2" stroke={color} strokeWidth="1.4" />
          <rect x="2" y="12" width="6" height="4" rx="1" stroke={color} strokeWidth="1.4" />
          <rect x="10" y="12" width="6" height="4" rx="1" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case "flexible":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <path d="M9 2l1.7 3.5 3.8.55-2.75 2.68.65 3.77L9 10.7l-3.4 1.8.65-3.77L3.5 6.05l3.8-.55L9 2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={cls}>
          <rect x="2" y="2" width="14" height="14" rx="1.5" stroke={color} strokeWidth="1.4" />
        </svg>
      );
  }
}

/** Budget amount + mode extracted separately for hero display */
function parseBudget(plan: LaunchStrategy["plan"]): { amount: string; mode: string } {
  const raw = plan.budgetAmount;
  const currency = plan.targets?.[0]?.currency;
  const mode = plan.budgetMode ?? "";
  if (!raw) return { amount: "—", mode: mode };
  const sym = currency === "USD" ? "$" : "₹";
  return {
    amount: `${sym}${Math.round(raw).toLocaleString("en-IN")}/day`,
    mode,
  };
}

/** Structure micro-indicator: 2C · 4A · 5Ad */
function StructureMicro({ plan }: { plan: LaunchStrategy["plan"] }) {
  const s = plan.structure;
  if (!s) return null;
  const totalAdSets = s.campaigns * s.adSetsPerCampaign;
  const totalAds = totalAdSets * s.adsPerAdSet;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums leading-none">
      {s.campaigns}C&nbsp;·&nbsp;{totalAdSets}A&nbsp;·&nbsp;{totalAds}Ad
    </span>
  );
}

/** Strategy card in the grid */
function StrategyCard({
  strategy,
  selected,
  onClick,
}: {
  strategy: LaunchStrategy;
  selected: boolean;
  onClick: () => void;
}) {
  const summary = strategiesService.summarize(strategy);
  const isPartial = (strategy.plan.targets?.length ?? 0) === 0;
  const tags = strategy.tags ?? [];
  const shownTags = tags.slice(0, 3);
  const extraTags = tags.length - 3;
  const objColours = objectivePill(summary.objective);
  const intColours = intentPill(summary.intent);
  const accent = accentColour(summary.objective);
  const budget = parseBudget(strategy.plan);

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
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      {/* Format icon — top right */}
      <span className="absolute top-3 right-3">
        <FormatIcon format={strategy.plan.format ?? ""} />
      </span>

      {/* Name row */}
      <div className="flex items-start justify-between gap-2 mb-2 pr-6">
        <span
          className="text-[13px] font-semibold leading-snug text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] line-clamp-2 flex-1 min-w-0"
          title={strategy.name}
        >
          {strategy.name}
        </span>
        {isPartial && (
          <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 leading-none">
            Partial
          </span>
        )}
      </div>

      {/* Budget hero */}
      <p className="font-mono text-[18px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight mb-0.5">
        {budget.amount}
      </p>
      {budget.mode && (
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-none mb-3">
          {budget.mode}
        </p>
      )}

      {/* Separator */}
      <div className="border-b border-[#e7e5dc]/60 dark:border-[#2a2a2a]/60 mb-2.5" />

      {/* Objective + intent pills + structure micro */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: objColours.bg, color: objColours.text }}
        >
          {summary.objective}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: intColours.bg, color: intColours.text }}
        >
          {summary.intent}
        </span>
        <span className="ml-auto">
          <StructureMicro plan={strategy.plan} />
        </span>
      </div>

      {/* Tags — max 3 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {shownTags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
        <span>{strategy.useCount ?? 0} uses</span>
        <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40" />
        <span>{relativeTime(strategy.lastUsedAt)}</span>
      </div>
    </button>
  );
}

/** Section eyebrow in preview rail */
function RailSection({ label }: { label: string }) {
  return (
    <div className="pb-2 mb-3 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
        {label}
      </span>
    </div>
  );
}

/** Metadata row in preview rail */
function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] flex-shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] text-right">
        {value}
      </span>
    </div>
  );
}

/** Budget progress bar — max 50k INR / 1k USD */
function BudgetBar({ plan }: { plan: LaunchStrategy["plan"] }) {
  const amount = plan.budgetAmount ?? 0;
  const currency = plan.targets?.[0]?.currency;
  const maxVal = currency === "USD" ? 1000 : 50000;
  const pct = Math.min(100, Math.round((amount / maxVal) * 100));
  const sym = currency === "USD" ? "$" : "₹";
  const mode = plan.budgetMode ?? "";

  return (
    <div className="rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] p-3 mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="font-mono text-[15px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]">
          {amount ? `${sym}${Math.round(amount).toLocaleString("en-IN")}/day` : "—"}
        </span>
        {mode && (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
            {mode}
          </span>
        )}
      </div>
      {/* Track */}
      <div className="h-1.5 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#8FB821] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** 3-stat structure boxes */
function StructureStats({ plan }: { plan: LaunchStrategy["plan"] }) {
  const s = plan.structure;
  if (!s) return null;
  const totalAdSets = s.campaigns * s.adSetsPerCampaign;
  const totalAds = totalAdSets * s.adsPerAdSet;
  const items = [
    { num: s.campaigns, label: "camps" },
    { num: totalAdSets, label: "sets" },
    { num: totalAds, label: "ads" },
  ];
  return (
    <div className="flex gap-2 mb-4">
      {items.map(({ num, label }) => (
        <div
          key={label}
          className="flex-1 rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] p-3 text-center"
        >
          <p className="font-mono text-[20px] font-bold tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] leading-tight">
            {num}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mt-0.5">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Preview rail — right panel */
function PreviewRail({
  strategy,
  onClose,
  onRefresh,
}: {
  strategy: LaunchStrategy | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const [duplicating, setDuplicating] = useState(false);
  const [duplicated, setDuplicated] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Edit mode state ──────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localBudget, setLocalBudget] = useState<number>(0);
  const [localMode, setLocalMode] = useState<string>("CBO");
  const [localNotes, setLocalNotes] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Reset local state when strategy changes
  useEffect(() => {
    setDuplicated(false);
    setRenaming(false);
    setDeleteConfirm(false);
    setEditing(false);
    if (strategy) {
      setRenameValue(strategy.name);
      resetEditState(strategy);
    }
  }, [strategy?.id]);

  function resetEditState(s: LaunchStrategy) {
    setLocalTags(s.tags ?? []);
    setLocalBudget(s.plan.budgetAmount ?? 0);
    setLocalMode(s.plan.budgetMode ?? "CBO");
    setLocalNotes((s.plan as { notes?: string }).notes ?? "");
    setTagInput("");
  }

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        {/* dot grid bg */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #8FB821 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative">
          {/* Bookmark icon in lime circle */}
          <div className="w-12 h-12 rounded-full bg-[#F5FBE2] dark:bg-[#1D2A09] flex items-center justify-center mb-4 mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8FB821" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="10" y1="10" x2="14" y2="10" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] mb-1">
            Select a strategy to preview
          </p>
          <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] leading-snug">
            Details, actions, and apply controls
            <br />appear here on selection
          </p>
        </div>
      </div>
    );
  }

  const summary: StrategySummary = strategiesService.summarize(strategy);
  const currency = strategy.plan.targets?.[0]?.currency;
  const currSym = currency === "USD" ? "$" : "₹";

  function handleApply() {
    strategiesService.markUsed(strategy!.id);
    sessionStorage.setItem("launchv2:pendingStrategy", JSON.stringify(strategy!.plan));
    navigate("/launchv2/new");
  }

  async function handleDuplicate() {
    if (duplicating) return;
    setDuplicating(true);
    const copy = strategiesService.duplicate(strategy!.id);
    if (copy) {
      onRefresh();
      setDuplicated(true);
      setTimeout(() => setDuplicated(false), 2500);
    }
    setDuplicating(false);
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== strategy!.name) {
      strategiesService.rename(strategy!.id, trimmed);
      onRefresh();
    }
    setRenaming(false);
  }

  function handleRenameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") setRenaming(false);
  }

  function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    strategiesService.remove(strategy!.id);
    onRefresh();
    onClose();
  }

  // ── Edit mode handlers ───────────────────────────────────────────
  function handleEditOpen() {
    resetEditState(strategy!);
    setEditing(true);
  }

  function handleEditSave() {
    if (localBudget < 1) return;
    strategiesService.updatePlan(strategy!.id, {
      budgetAmount: localBudget,
      budgetMode: localMode,
      notes: localNotes,
    } as Partial<typeof strategy.plan>);
    strategiesService.updateTags(strategy!.id, localTags);
    onRefresh();
    setEditing(false);
  }

  function handleEditCancel() {
    resetEditState(strategy!);
    setEditing(false);
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Escape") {
      setTagInput("");
      tagInputRef.current?.blur();
    }
  }

  function commitTag() {
    const val = tagInput.trim().replace(/^,+|,+$/g, "");
    if (val && !localTags.includes(val) && localTags.length < 8) {
      setLocalTags([...localTags, val]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setLocalTags(localTags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className={[
          "flex items-start justify-between gap-2 px-5 py-4 border-b flex-shrink-0 transition-colors",
          editing
            ? "border-b-2 border-[#8FB821]"
            : "border-[#e7e5dc] dark:border-[#2a2a2a]",
        ].join(" ")}
      >
        <div className="flex-1 min-w-0">
          {editing && (
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[#8FB821] mb-0.5">
              Editing strategy
            </p>
          )}
          {renaming ? (
            <input
              ref={renameInputRef}
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
              {strategy.name}
            </h2>
          )}
          <p className="font-mono text-[10px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mt-0.5 tabular-nums">
            {relativeTime(strategy.updatedAt)} · {strategy.useCount ?? 0} uses
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit pencil button — hidden during edit mode */}
          {!editing && (
            <button
              type="button"
              onClick={handleEditOpen}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] hover:bg-[#F0F0EC] dark:hover:bg-[#27272A] hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
              aria-label="Edit strategy"
              title="Edit strategy"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
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

      {/* Metadata / Edit form */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {editing ? (
          /* ── EDIT FORM ────────────────────────────────────── */
          <div className="space-y-5">

            {/* Budget amount + mode */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-2">
                Budget
              </p>
              {/* Amount row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[13px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  {currSym}
                </span>
                <input
                  type="number"
                  min={1}
                  value={localBudget || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setLocalBudget(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="h-8 w-28 px-2.5 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] font-mono text-[13px] tabular-nums text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 transition-all"
                  style={{ MozAppearance: "textfield" } as React.CSSProperties}
                />
                <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)]">
                  /day
                </span>
              </div>
              {/* Budget mode toggle */}
              <div className="flex gap-1.5">
                {(["ABO", "CBO"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocalMode(mode)}
                    className={[
                      "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-[0.06em] font-semibold transition-colors leading-none border",
                      localMode === mode
                        ? "bg-[#8FB821] text-[#121212] border-[#8FB821]"
                        : "border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50",
                    ].join(" ")}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {localTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-1 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              {localTags.length < 8 && (
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={commitTag}
                  placeholder="Add tag..."
                  className="h-7 px-2.5 rounded-full border border-dashed border-[#e7e5dc] dark:border-[#2a2a2a] bg-transparent font-mono text-[10px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] placeholder:text-[rgba(15,15,12,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-[#8FB821] transition-colors w-full max-w-[160px]"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] mb-2">
                Notes
              </p>
              <textarea
                rows={3}
                value={localNotes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocalNotes(e.target.value)}
                placeholder="Add notes about this strategy..."
                className="w-full px-3 py-2 rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] font-mono text-[11px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.35)] dark:placeholder:text-[rgba(255,255,255,0.35)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Read-only campaign info */}
            <div>
              <RailSection label="Campaign (read-only)" />
              <div className="space-y-0 opacity-60">
                <MetaRow label="Objective" value={summary.objective} />
                <MetaRow label="Intent" value={summary.intent} />
                <MetaRow label="Format" value={summary.format} />
                <MetaRow label="Spread" value={summary.spreadMode} />
              </div>
            </div>
          </div>
        ) : (
          /* ── READ-ONLY VIEW ───────────────────────────────── */
          <>
            {/* Budget bar */}
            <BudgetBar plan={strategy.plan} />

            {/* Notes — shown if present */}
            {(strategy.plan as { notes?: string }).notes && (
              <div className="mb-4 px-3 py-2.5 rounded-xl border border-[#e7e5dc] dark:border-[#2a2a2a] bg-[#FAFAF7] dark:bg-[#18181B]">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] mb-1">
                  Notes
                </p>
                <p className="font-mono text-[11px] text-[rgba(15,15,12,0.72)] dark:text-[rgba(255,255,255,0.72)] leading-relaxed whitespace-pre-wrap">
                  {(strategy.plan as { notes?: string }).notes}
                </p>
              </div>
            )}

            {/* Campaign section */}
            <RailSection label="Campaign" />
            <div className="mb-4 space-y-0">
              <MetaRow label="Objective" value={summary.objective} />
              <MetaRow label="Intent" value={summary.intent} />
              <MetaRow label="Format" value={summary.format} />
              <MetaRow label="Spread" value={summary.spreadMode} />
            </div>

            {/* Structure section */}
            {strategy.plan.structure && (
              <>
                <RailSection label="Structure" />
                <StructureStats plan={strategy.plan} />
              </>
            )}

            {/* Audience section */}
            <RailSection label="Audience" />
            <div className="mb-4 space-y-0">
              <MetaRow label="Pages" value={summary.destinationsCount === 0 ? "—" : `${summary.destinationsCount} account${summary.destinationsCount > 1 ? "s" : ""}`} />
              <MetaRow label="Audience" value={summary.audienceSummary} />
            </div>

            {/* Tags section */}
            {(strategy.tags ?? []).length > 0 && (
              <>
                <RailSection label="Tags" />
                <div className="flex flex-wrap gap-1 mb-4">
                  {(strategy.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] uppercase tracking-[0.05em] font-semibold px-2 py-1 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-[#e7e5dc] dark:border-[#2a2a2a] space-y-2">
        {editing ? (
          /* Edit mode action buttons */
          <>
            <button
              type="button"
              onClick={handleEditSave}
              disabled={localBudget < 1}
              className="w-full h-9 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleEditCancel}
              className="w-full h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              Cancel
            </button>
          </>
        ) : (
          /* Normal action buttons */
          <>
            {/* Apply */}
            <button
              type="button"
              onClick={handleApply}
              className="w-full h-9 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors shadow-sm"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              Apply to new launch
            </button>

            {/* Secondary row: Duplicate + Rename */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex-1 h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors disabled:opacity-50"
                style={{ fontFamily: "Geist, system-ui, sans-serif" }}
              >
                {duplicated ? (
                  <span className="text-[#5B7611] dark:text-[#C3E165] font-semibold">Copied!</span>
                ) : duplicating ? (
                  "..."
                ) : (
                  "Duplicate"
                )}
              </button>

              {!renaming && (
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="flex-1 h-9 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[13px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] hover:border-[#8FB821]/60 hover:bg-[#F5FBE2] dark:hover:bg-[#1D2A09] transition-colors"
                  style={{ fontFamily: "Geist, system-ui, sans-serif" }}
                >
                  Rename
                </button>
              )}
            </div>

            {/* Delete — two-tap */}
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
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Zero-data state ───────────────────── */

function ZeroState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 text-center relative overflow-hidden">
      {/* dot grid */}
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
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="10" y1="10" x2="14" y2="10" />
          </svg>
        </div>
        <h3
          className="text-[15px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] mb-1"
          style={{ fontFamily: "Geist, system-ui, sans-serif", letterSpacing: "-0.01em" }}
        >
          No strategies saved yet
        </h3>
        <p className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] leading-relaxed max-w-[260px] mb-6">
          Save one from the Launch flow after configuring your settings — it'll appear here instantly.
        </p>
        <button
          type="button"
          onClick={() => navigate("/launchv2/new")}
          className="inline-flex items-center gap-1.5 h-9 px-5 rounded-full bg-[#8FB821] text-[#121212] text-[13px] font-semibold hover:bg-[#AACF32] active:bg-[#5B7611] transition-colors shadow-sm"
          style={{ fontFamily: "Geist, system-ui, sans-serif" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Start a launch
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export function StrategiesLibrary() {
  const [strategies, setStrategies] = useState<LaunchStrategy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recently-used");

  const refresh = () => setStrategies(strategiesService.list());

  useEffect(() => {
    refresh();
  }, []);

  /* Derived: all unique tags */
  const allTags = Array.from(
    new Set(strategies.flatMap((s) => s.tags ?? []))
  ).sort();

  /* Filter + sort */
  const filtered = strategies
    .filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (s.plan.objective ?? "").toLowerCase().includes(q) ||
        (s.plan.intent ?? "").toLowerCase().includes(q);
      const matchesTag = !activeTag || (s.tags ?? []).includes(activeTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sort === "recently-used") {
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : -Infinity;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : -Infinity;
        return bTime - aTime;
      }
      if (sort === "most-used") {
        return (b.useCount ?? 0) - (a.useCount ?? 0);
      }
      // name
      return a.name.localeCompare(b.name);
    });

  const selected = selectedId ? strategies.find((s) => s.id === selectedId) ?? null : null;
  const showRail = selectedId !== null;

  // Close rail if selected strategy was deleted
  useEffect(() => {
    if (selectedId && !strategies.find((s) => s.id === selectedId)) {
      setSelectedId(null);
    }
  }, [strategies, selectedId]);

  return (
    <div className="flex flex-col h-full bg-[#FAFAF7] dark:bg-[#18181B] min-h-[100dvh]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-[#e7e5dc] dark:border-[#2a2a2a]">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1
            className="text-[29px] font-bold text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)]"
            style={{ fontFamily: "Geist, system-ui, sans-serif", letterSpacing: "-0.01em" }}
          >
            Strategies
          </h1>
          <span className="font-mono text-[11px] text-[rgba(15,15,12,0.55)] dark:text-[rgba(255,255,255,0.55)] tabular-nums">
            {strategies.length} saved
          </span>
        </div>

        {/* Search + sort row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[380px]">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)] pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search strategies..."
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[13px] text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] placeholder:text-[rgba(15,15,12,0.38)] dark:placeholder:text-[rgba(255,255,255,0.38)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 transition-all"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(15,15,12,0.38)] dark:text-[rgba(255,255,255,0.38)] hover:text-[rgba(15,15,12,0.62)] dark:hover:text-[rgba(255,255,255,0.62)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 pl-3 pr-8 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] text-[12px] font-medium text-[rgba(15,15,12,0.92)] dark:text-[rgba(255,255,255,0.92)] outline-none focus:border-[#8FB821] focus:ring-2 focus:ring-[#8FB821]/20 appearance-none cursor-pointer transition-all font-mono"
            >
              <option value="recently-used">Recently used</option>
              <option value="most-used">Most used</option>
              <option value="name">Name</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]"
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={[
                "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-[0.06em] font-semibold transition-colors leading-none",
                activeTag === null
                  ? "bg-[#8FB821] text-[#121212]"
                  : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50 hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)]",
              ].join(" ")}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={[
                  "h-7 px-3 rounded-full font-mono text-[10px] uppercase tracking-[0.06em] font-semibold transition-colors leading-none",
                  activeTag === tag
                    ? "bg-[#8FB821] text-[#121212]"
                    : "border border-[#e7e5dc] dark:border-[#2a2a2a] text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50 hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)]",
                ].join(" ")}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body: card grid + preview rail ──────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Card grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {strategies.length === 0 ? (
            <ZeroState />
          ) : filtered.length === 0 ? (
            /* Empty search state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 rounded-full bg-[#F0F0EC] dark:bg-[#27272A] flex items-center justify-center mb-3 mx-auto">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] mb-1">
                No strategies match
              </p>
              <p className="font-mono text-[11px] text-[rgba(15,15,12,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                Try a different search or clear the tag filter
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setActiveTag(null); }}
                className="mt-4 h-8 px-4 rounded-full border border-[#e7e5dc] dark:border-[#2a2a2a] text-[12px] font-medium text-[rgba(15,15,12,0.62)] dark:text-[rgba(255,255,255,0.62)] hover:border-[#8FB821]/50 hover:text-[rgba(15,15,12,0.92)] dark:hover:text-[rgba(255,255,255,0.92)] transition-colors"
                style={{ fontFamily: "Geist, system-ui, sans-serif" }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  selected={selectedId === strategy.id}
                  onClick={() =>
                    setSelectedId(selectedId === strategy.id ? null : strategy.id)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Preview rail — 320px fixed right */}
        {showRail && (
          <div className="flex-shrink-0 w-[320px] border-l border-[#e7e5dc] dark:border-[#2a2a2a] bg-white dark:bg-[#1E1E23] overflow-hidden flex flex-col">
            <PreviewRail
              strategy={selected}
              onClose={() => setSelectedId(null)}
              onRefresh={refresh}
            />
          </div>
        )}
      </div>
    </div>
  );
}
