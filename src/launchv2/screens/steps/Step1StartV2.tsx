/**
 * Step 1 — Start V2  (Strategy-first redesign).
 *
 * Locked flow (meeting decisions):
 *   §1  "Start from a strategy"  — MANDATORY, FIRST. Search + filter chips +
 *        overflow "More". A "Custom" card = start fresh / configure manually.
 *        Picking is required to proceed.
 *          • Custom  → flowMode = "custom"; reveals §2 objective picker.
 *          • Saved   → flowMode = "template"; objective taken from the template
 *                      (shown as a read-only chip); no separate objective step.
 *   §2  "Campaign goal" — objective grid. Always visible; interactive only on
 *        the Custom branch (disabled with opacity on Template/none).
 *
 *   Fast launch: done via footer "Skip & Launch" button — disabled on Custom.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Eye,
  Filter,
  MessageSquare,
  MousePointer2,
  Pencil,
  Rocket,
  Search,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES } from "../../data";
import { strategiesService } from "../../services/strategiesService";
import type { LaunchStrategy } from "../../services/strategiesService";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface Step1StartV2Props {
  flow: UseFlowV2;
  /** Kept for API compatibility — save checkbox lives on Step 4. */
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Objective metadata                                                  */
/* ------------------------------------------------------------------ */

type ObjIcon = React.ComponentType<{ className?: string }>;

const OBJECTIVE_META: Record<Objective, { Icon: ObjIcon; desc: string }> = {
  OUTCOME_SALES: {
    Icon: ShoppingCart,
    desc: "Drive purchases on website or app",
  },
  OUTCOME_AWARENESS: {
    Icon: Eye,
    desc: "Reach people most likely to recall your brand",
  },
  OUTCOME_TRAFFIC: {
    Icon: MousePointer2,
    desc: "Send people to a website or landing page",
  },
  OUTCOME_ENGAGEMENT: {
    Icon: MessageSquare,
    desc: "Get more reactions, comments, and shares",
  },
  OUTCOME_APP_PROMOTION: {
    Icon: Smartphone,
    desc: "Increase installs and in-app actions",
  },
  OUTCOME_LEADS: {
    Icon: Rocket,
    desc: "Collect leads for your business",
  },
};

const OBJECTIVE_LABEL: Record<Objective, string> = {
  OUTCOME_SALES: "Sales",
  OUTCOME_AWARENESS: "Awareness",
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_APP_PROMOTION: "App installs",
  OUTCOME_LEADS: "Lead gen",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "DPA",
};

const CURRENCY_SYM: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function prettifyObjective(o?: string | null): string {
  if (!o) return "—";
  const raw = o.replace(/^OUTCOME_/, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function formatBudget(s: LaunchStrategy): string {
  const { budgetAmount, targets, budgetMode } = s.plan;
  if (!budgetAmount) return "—";
  const ccy = targets?.[0]?.currency;
  const sym = ccy ? (CURRENCY_SYM[ccy] ?? `${ccy} `) : "";
  return `${sym}${Math.round(budgetAmount).toLocaleString("en-IN")}/d · ${budgetMode ?? "—"}`;
}

function isPartial(s: LaunchStrategy): boolean {
  return !(s.plan.targets?.length);
}

/* ------------------------------------------------------------------ */
/*  Filter model                                                        */
/* ------------------------------------------------------------------ */

type FilterKind = "budgetMode" | "objective" | "tag";
interface FilterChip {
  id: string; // unique key e.g. "budgetMode:CBO"
  kind: FilterKind;
  label: string; // display label
  value: string; // raw value matched against strategy
}

/** Build the available filter chips from the strategy corpus (dynamic). */
function buildFilterChips(strategies: LaunchStrategy[]): FilterChip[] {
  const chips: FilterChip[] = [];

  // Budget mode (CBO / ABO) — fixed order, only if present.
  const modes = new Set(strategies.map((s) => s.plan.budgetMode).filter(Boolean) as string[]);
  for (const m of ["CBO", "ABO"]) {
    if (modes.has(m)) chips.push({ id: `budgetMode:${m}`, kind: "budgetMode", label: m, value: m });
  }

  // Objective — derived from corpus, in OBJECTIVES order.
  const objs = new Set(strategies.map((s) => s.plan.objective).filter(Boolean) as string[]);
  for (const o of OBJECTIVES) {
    if (objs.has(o.id)) {
      chips.push({ id: `objective:${o.id}`, kind: "objective", label: o.label, value: o.id });
    }
  }

  // Strategy tags — the derived test/scale/custom/DPA/video/etc. tags.
  const tagCounts = new Map<string, number>();
  for (const s of strategies) {
    for (const t of s.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  // Stable order: most-common first, then alpha.
  const tags = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  for (const [t] of tags) {
    chips.push({ id: `tag:${t}`, kind: "tag", label: `#${t}`, value: t });
  }

  return chips;
}

/** Does a strategy satisfy a single chip? */
function matchesChip(s: LaunchStrategy, chip: FilterChip): boolean {
  if (chip.kind === "budgetMode") return s.plan.budgetMode === chip.value;
  if (chip.kind === "objective") return s.plan.objective === chip.value;
  return (s.tags ?? []).includes(chip.value);
}

/**
 * Apply the active filter set. Chips of the SAME kind are OR'd (any match);
 * different kinds are AND'd (must satisfy each active kind). Plus a text query
 * over name + objective + tags.
 */
function applyFilters(
  strategies: LaunchStrategy[],
  query: string,
  active: Set<string>,
  chipById: Map<string, FilterChip>,
): LaunchStrategy[] {
  const q = query.trim().toLowerCase();
  const activeChips = [...active].map((id) => chipById.get(id)).filter(Boolean) as FilterChip[];

  // Group active chips by kind for AND-across-kinds / OR-within-kind.
  const byKind = new Map<FilterKind, FilterChip[]>();
  for (const c of activeChips) {
    const arr = byKind.get(c.kind) ?? [];
    arr.push(c);
    byKind.set(c.kind, arr);
  }

  return strategies.filter((s) => {
    // Text query
    if (q) {
      const hay = [
        s.name,
        prettifyObjective(s.plan.objective),
        ...(s.tags ?? []),
        s.plan.budgetMode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    // Each active kind must have at least one matching chip.
    for (const [, chips] of byKind) {
      if (!chips.some((c) => matchesChip(s, c))) return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Strategy card (compact strip card with Fast-launch action)         */
/* ------------------------------------------------------------------ */

function StrategyCard({
  strategy,
  selected,
  onSelect,
}: {
  strategy: LaunchStrategy;
  selected: boolean;
  onSelect: () => void;
}) {
  const objective = prettifyObjective(strategy.plan.objective);
  const budget = formatBudget(strategy);
  const fmt = strategy.plan.format ? FORMAT_LABELS[strategy.plan.format] : "—";
  const partial = isPartial(strategy);
  const tags = strategy.tags ?? [];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "fab-focus relative flex w-full items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-foreground/20 hover:bg-muted/30",
      )}
    >
      {/* Selection ring */}
      {selected && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      {/* Text block */}
      <div className="min-w-0 flex-1 pr-5">
        <p className="truncate text-[12px] font-semibold text-foreground leading-tight">
          {strategy.name}
        </p>
        <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
          {objective} · {fmt} · {budget}
        </p>
      </div>
      {/* Right-side chips: tags + partial */}
      <div className="flex shrink-0 items-center gap-1">
        {partial && (
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
            Partial
          </span>
        )}
        {tags.slice(0, 1).map((t) => (
          <span key={t} className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
            #{t}
          </span>
        ))}
        {tags.length > 1 && (
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
            +{tags.length - 1}
          </span>
        )}
      </div>
    </button>
  );
}

/* ── Custom sentinel — "start from scratch" card always first ── */
const CUSTOM_ID = "__custom__";

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step1StartV2({ flow }: Step1StartV2Props) {
  const { plan } = flow;
  const { objective, flowMode } = plan;

  /* ── strategy data ── */
  const [strategies, setStrategies] = useState<LaunchStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setStrategies(strategiesService.list());
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, []);

  /* ── selection — nothing picked until the user acts (mandatory).
     Seed from existing plan so returning to Step 1 (e.g. Back from Review)
     restores the branch the user was on. Custom flow with an objective set,
     or any objective with flowMode "custom", counts as the Custom branch. */
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(() => {
    if (plan.flowMode === "custom" && plan.objective) return CUSTOM_ID;
    return null;
  });
  const [prefillNotice, setPrefillNotice] = useState(false);

  /* When strategies load, if the plan is on a template branch try to match the
     applied snapshot back to a card so the selection ring restores on return. */
  useEffect(() => {
    if (selectedStrategyId !== null || strategies.length === 0) return;
    if (plan.flowMode === "template" && plan.objective) {
      const match = strategies.find(
        (s) =>
          s.plan.objective === plan.objective &&
          s.plan.budgetMode === plan.budgetMode &&
          s.plan.format === plan.format,
      );
      if (match) setSelectedStrategyId(match.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after load
  }, [strategies]);

  /* ── search + filters ── */
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  /* ── objective section scroll target (Custom branch) ── */
  const objectiveRef = useRef<HTMLDivElement>(null);

  const allFilterChips = useMemo(() => buildFilterChips(strategies), [strategies]);
  const chipById = useMemo(
    () => new Map(allFilterChips.map((c) => [c.id, c] as const)),
    [allFilterChips],
  );

  /* Group chips by kind for the filter popover. */
  const chipsByKind = useMemo(() => {
    const groups = new Map<FilterKind, FilterChip[]>();
    for (const c of allFilterChips) {
      const arr = groups.get(c.kind) ?? [];
      arr.push(c);
      groups.set(c.kind, arr);
    }
    return groups;
  }, [allFilterChips]);

  /* ── filtered list (Custom card prepended separately) ── */
  const filtered = useMemo(
    () => applyFilters(strategies, query, activeFilters, chipById),
    [strategies, query, activeFilters, chipById],
  );

  /* ── handlers ── */

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setQuery("");
  };

  const handleObjective = (o: Objective) => {
    flow.chooseObjectiveFormat(o, null);
  };

  /** Pick the Custom card → manual flow, reveal objective picker. */
  const handlePickCustom = () => {
    setSelectedStrategyId(CUSTOM_ID);
    setPrefillNotice(false);
    flow.chooseCustomFlow();
    window.setTimeout(() => {
      objectiveRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  /** Pick a saved strategy → template flow (objective comes from the template). */
  const handlePickStrategy = (s: LaunchStrategy) => {
    setSelectedStrategyId(s.id);
    flow.applySavedStrategy(s.plan);
    setPrefillNotice(true);
  };

  const isCustom = selectedStrategyId === CUSTOM_ID;
  const showObjective = isCustom; // objective picker only on the Custom branch
  const filtersActive = activeFilters.size > 0 || query.trim().length > 0;

  /* ── render ── */

  return (
    <div data-screen="lv2-step1-start-v2" className="space-y-7">

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §1 — Strategy (FIRST, mandatory)                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
                1
              </span>
              <h2 className="text-[15px] font-semibold text-foreground">
                Start from a strategy
              </h2>
            </div>
            <p className="pl-7 text-[11px] text-muted-foreground leading-relaxed">
              Pick a saved setup to pre-fill every step, or choose Custom to configure manually.
            </p>
          </div>

        </div>

        {/* Search + filter button row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved setups…"
              className="h-9 rounded-xl pl-8 text-[12px]"
            />
          </div>

          {/* Filter popover — compact chip-group layout */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "fab-focus relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  activeFilters.size > 0
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
                aria-label="Filter strategies"
              >
                <Filter className="h-3.5 w-3.5" />
                {activeFilters.size > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground font-mono text-[8px] text-background">
                    {activeFilters.size}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="space-y-3">
                {([
                  { kind: "budgetMode" as FilterKind, label: "Budget mode" },
                  { kind: "objective" as FilterKind, label: "Objective" },
                  { kind: "tag" as FilterKind, label: "Tags" },
                ] as const).map(({ kind, label }, idx) => {
                  const chips = chipsByKind.get(kind);
                  if (!chips?.length) return null;
                  return (
                    <div key={kind}>
                      {idx > 0 && <div className="mb-3 border-t border-border/50" />}
                      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {chips.map((chip) => {
                          const on = activeFilters.has(chip.id);
                          return (
                            <button
                              key={chip.id}
                              type="button"
                              onClick={() => toggleFilter(chip.id)}
                              aria-pressed={on}
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                                on
                                  ? "border-primary/30 bg-primary/15 text-foreground"
                                  : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {activeFilters.size > 0 && (
                  <div className="border-t border-border/50 pt-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear all ({activeFilters.size})
                    </button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Inline clear — only when text query is active */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="fab-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Prefill confirmation (template applied) */}
        {prefillNotice && (
          <div
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
              Setup applied — all steps pre-filled.{" "}
              {objective && (
                <span className="text-foreground">
                  Objective: {OBJECTIVE_LABEL[objective] ?? prettifyObjective(objective)}.
                </span>
              )}{" "}
              Edit any step on the way, or Skip &amp; Launch.
            </p>
            <button
              type="button"
              onClick={() => setPrefillNotice(false)}
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Strategy list — Custom card first, then filtered saved setups */}
        {/* Fixed height with inner scroll so it never blows out the page */}
        <div className="max-h-[260px] overflow-y-auto rounded-2xl pr-0.5 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[44px] animate-pulse rounded-xl border border-border bg-muted/30"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Custom card — always first, lime-tinted to stand out */}
              <button
                type="button"
                onClick={handlePickCustom}
                aria-pressed={isCustom}
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  isCustom
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-dashed border-primary/40 bg-primary/[0.04] hover:border-primary/60 hover:bg-primary/[0.07]",
                )}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 transition-colors">
                  <Pencil className="h-3 w-3 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-primary leading-tight">Custom</p>
                  <p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Configure every step manually — full control.
                  </p>
                </div>
                {isCustom ? (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-medium text-primary/70">Start fresh</span>
                )}
              </button>

              {/* Filtered saved setups */}
              {filtered.map((s) => (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  selected={selectedStrategyId === s.id}
                  onSelect={() => handlePickStrategy(s)}
                />
              ))}

              {/* Empty state when filters exclude everything */}
              {filtered.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-6 text-center">
                  <p className="text-[12px] font-medium text-foreground">No matching setups</p>
                  <p className="text-[11px] text-muted-foreground">
                    Adjust filters, clear the search, or pick Custom to start fresh.
                  </p>
                  {filtersActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="fab-focus mt-1 inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                    >
                      <X className="h-3 w-3" /> Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §2 — Campaign goal (always visible)                          */}
      {/*   • Custom selected  → all 6 cards fully interactive         */}
      {/*   • Template selected → all 6 cards shown but disabled;      */}
      {/*     strategy's objective is visually highlighted              */}
      {/*   • Nothing selected  → disabled, greyed with hint            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section
        ref={objectiveRef}
        className="space-y-3 transition-all duration-300 ease-out"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
              2
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">
              Campaign goal
            </h2>
            {/* Badge: shows context for why this section is disabled */}
            {!isCustom && flowMode === "template" && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                From strategy
              </span>
            )}
            {selectedStrategyId === null && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Select a strategy first
              </span>
            )}
          </div>
          <p className="pl-7 text-xs text-muted-foreground">
            {isCustom
              ? "Choose the objective that matches what you want to achieve."
              : "Set by your chosen strategy. Pick Custom above to change it."}
          </p>
        </div>

        {/* 3-col compact card grid — disabled overlay when not Custom */}
        <div
          className={cn(
            "grid grid-cols-3 gap-2 transition-opacity duration-200",
            !isCustom && "pointer-events-none opacity-40",
          )}
        >
          {OBJECTIVES.map((o) => {
            const { Icon, desc } = OBJECTIVE_META[o.id];
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => isCustom && handleObjective(o.id)}
                disabled={!isCustom}
                aria-pressed={selected}
                tabIndex={isCustom ? 0 : -1}
                className={cn(
                  "relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all duration-200",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
                  !isCustom && "cursor-default",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    selected ? "bg-primary/15" : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[14px] w-[14px]",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{o.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug line-clamp-2">
                    {desc}
                  </p>
                </div>
                {selected && (
                  <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
