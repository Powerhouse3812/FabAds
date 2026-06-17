/**
 * Step 1 — Goal-first layout variant.
 *
 * §1 Campaign goal — Required, always active. User picks objective first.
 * §2 Strategy     — Optional. Search + filter + 3-col grid. Prefills everything.
 *
 * This is a standalone component. Filter utilities are duplicated inline
 * (they are not exported from Step1StartV2.tsx).
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

interface GoalFirstLayoutProps {
  flow: UseFlowV2;
}

/* ------------------------------------------------------------------ */
/*  Objective metadata (duplicated — not exported from Step1StartV2)   */
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

const SPREAD_LABELS: Record<string, string> = {
  one_per_adset: "1:1",
  round_robin: "Round-robin",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

const PAGE_DIST_LABELS: Record<string, string> = {
  fill_first: "Fill first",
  equal: "Equal",
  duplicate: "Duplicate",
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
/*  Filter model (duplicated — not exported from Step1StartV2)         */
/* ------------------------------------------------------------------ */

type FilterKind = "budgetMode" | "objective" | "tag" | "pageDist" | "format";
interface FilterChip {
  id: string;
  kind: FilterKind;
  label: string;
  value: string;
}

function buildFilterChips(strategies: LaunchStrategy[]): FilterChip[] {
  const chips: FilterChip[] = [];

  const modes = new Set(strategies.map((s) => s.plan.budgetMode).filter(Boolean) as string[]);
  for (const m of ["CBO", "ABO"]) {
    if (modes.has(m)) chips.push({ id: `budgetMode:${m}`, kind: "budgetMode", label: m, value: m });
  }

  const objs = new Set(strategies.map((s) => s.plan.objective).filter(Boolean) as string[]);
  for (const o of OBJECTIVES) {
    if (objs.has(o.id)) {
      chips.push({ id: `objective:${o.id}`, kind: "objective", label: o.label, value: o.id });
    }
  }

  const tagCounts = new Map<string, number>();
  for (const s of strategies) {
    for (const t of s.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const tags = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  for (const [t] of tags) {
    chips.push({ id: `tag:${t}`, kind: "tag", label: `#${t}`, value: t });
  }

  // Page distribution — static chips, only show values actually used in corpus
  const pageDists: Array<{ value: string; label: string }> = [
    { value: "one_page", label: "One page" },
    { value: "fill_first", label: "Fill first" },
    { value: "equal", label: "Equal" },
    { value: "duplicate", label: "Duplicate" },
    { value: "custom", label: "Custom" },
  ];
  const usedPageDists = new Set(strategies.map(s => s.plan.pageDistribution).filter(Boolean));
  for (const { value, label } of pageDists) {
    if (usedPageDists.has(value as typeof strategies[0]["plan"]["pageDistribution"])) {
      chips.push({ id: `pageDist:${value}`, kind: "pageDist", label, value });
    }
  }

  // Format — derive from corpus
  const formats = new Set(strategies.map(s => s.plan.format).filter(Boolean) as string[]);
  const formatOrder = ["single_image", "single_video", "carousel", "collection", "dpa", "flexible"];
  for (const f of formatOrder) {
    if (formats.has(f)) {
      chips.push({
        id: `format:${f}`,
        kind: "format",
        label: FORMAT_LABELS[f] ?? f,
        value: f,
      });
    }
  }

  return chips;
}

function matchesChip(s: LaunchStrategy, chip: FilterChip): boolean {
  if (chip.kind === "budgetMode") return s.plan.budgetMode === chip.value;
  if (chip.kind === "objective") return s.plan.objective === chip.value;
  if (chip.kind === "pageDist") return s.plan.pageDistribution === chip.value;
  if (chip.kind === "format") return s.plan.format === chip.value;
  return (s.tags ?? []).includes(chip.value);
}

function applyFilters(
  strategies: LaunchStrategy[],
  query: string,
  active: Set<string>,
  chipById: Map<string, FilterChip>,
): LaunchStrategy[] {
  const q = query.trim().toLowerCase();
  const activeChips = [...active].map((id) => chipById.get(id)).filter(Boolean) as FilterChip[];

  const byKind = new Map<FilterKind, FilterChip[]>();
  for (const c of activeChips) {
    const arr = byKind.get(c.kind) ?? [];
    arr.push(c);
    byKind.set(c.kind, arr);
  }

  return strategies.filter((s) => {
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
    for (const [, chips] of byKind) {
      if (!chips.some((c) => matchesChip(s, c))) return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Strategy grid card (compact, for 3-col grid)                       */
/* ------------------------------------------------------------------ */

function StrategyGridCard({
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
        "fab-focus relative flex flex-col gap-1.5 rounded-xl border bg-card p-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-foreground/20 hover:bg-muted/30",
      )}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      <p className="truncate pr-5 text-[11px] font-semibold text-foreground leading-tight">
        {strategy.name}
      </p>
      <p className="truncate text-[10px] text-muted-foreground leading-tight">
        {objective} · {fmt} · {budget}
      </p>
      {/* Tags at bottom */}
      <div className="flex flex-wrap items-center gap-1 mt-0.5">
        {partial && (
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
            Partial
          </span>
        )}
        {tags.slice(0, 2).map((t) => (
          <span key={t} className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
            #{t}
          </span>
        ))}
        {tags.length > 2 && (
          <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
            +{tags.length - 2}
          </span>
        )}
      </div>
      {/* Mini key-value row — spread · structure · page split */}
      <div className="mt-1.5 flex items-center gap-2 border-t border-border/40 pt-1.5">
        {/* Spread */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Spread</span>
          <span className="text-[10px] font-mono font-semibold text-foreground/80">
            {SPREAD_LABELS[strategy.plan.spread ?? ""] ?? "—"}
          </span>
        </div>
        <span className="text-muted-foreground/30 text-[9px]">·</span>
        {/* Structure */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Struct</span>
          <span className="text-[10px] font-mono font-semibold text-foreground/80">
            {(() => {
              const struct = strategy.plan.structure;
              return struct
                ? `${struct.campaigns}·${struct.adSetsPerCampaign}·${struct.adsPerAdSet}`
                : "—";
            })()}
          </span>
        </div>
        <span className="text-muted-foreground/30 text-[9px]">·</span>
        {/* Page split */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Split</span>
          <span className="text-[10px] font-mono font-semibold text-foreground/80">
            {strategy.plan.pageDistribution
              ? PAGE_DIST_LABELS[strategy.plan.pageDistribution] ?? strategy.plan.pageDistribution
              : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Custom sentinel ── */
const CUSTOM_ID = "__custom__";
/** Cards per page before "View more" */
const PAGE_SIZE = 9;

/* ── Strategy variant toggle ── */
type StrategyVariant = "A" | "B";
const VARIANT_LS_KEY = "lv2:step1:strategy-variant";

function readVariant(): StrategyVariant {
  try {
    const v = localStorage.getItem(VARIANT_LS_KEY);
    if (v === "A" || v === "B") return v;
  } catch {
    /* ignore */
  }
  return "B";
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function GoalFirstLayout({ flow }: GoalFirstLayoutProps) {
  const { plan } = flow;
  const { objective } = plan;

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

  /* ── selection state — seed from existing plan on return ── */
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(() => {
    if (plan.flowMode === "custom" && plan.objective) return CUSTOM_ID;
    return null;
  });
  const [prefillNotice, setPrefillNotice] = useState(false);
  const [objectiveFilterActive, setObjectiveFilterActive] = useState(true);
  const [mismatchNotice, setMismatchNotice] = useState<{ from: string; to: string } | null>(null);

  /* Restore template selection when strategies load */
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

  /* ── "view more" pagination ── */
  const [showAll, setShowAll] = useState(false);

  /* ── strategy section scroll ref ── */
  const strategyRef = useRef<HTMLDivElement>(null);

  const allFilterChips = useMemo(() => buildFilterChips(strategies), [strategies]);
  const chipById = useMemo(
    () => new Map(allFilterChips.map((c) => [c.id, c] as const)),
    [allFilterChips],
  );

  const chipsByKind = useMemo(() => {
    const groups = new Map<FilterKind, FilterChip[]>();
    for (const c of allFilterChips) {
      const arr = groups.get(c.kind) ?? [];
      arr.push(c);
      groups.set(c.kind, arr);
    }
    return groups;
  }, [allFilterChips]);

  /* ── effective filters: include auto-applied objective chip ── */
  const effectiveFilters = useMemo(() => {
    if (objectiveFilterActive && plan.objective) {
      const s = new Set(activeFilters);
      s.add(`objective:${plan.objective}`);
      return s;
    }
    return activeFilters;
  }, [activeFilters, objectiveFilterActive, plan.objective]);

  const filtered = useMemo(
    () => applyFilters(strategies, query, effectiveFilters, chipById),
    [strategies, query, effectiveFilters, chipById],
  );

  const visibleStrategies = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const hiddenCount = filtered.length - PAGE_SIZE;
  const filtersActive = activeFilters.size > 0 || query.trim().length > 0 || (objectiveFilterActive && !!plan.objective);

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

  /** §1 — objective tile clicked. Always active. */
  const handleObjective = (o: Objective) => {
    flow.chooseObjectiveFormat(o, null);
    // If no strategy branch selected, set flowMode = "custom" so Next is enabled.
    if (selectedStrategyId === null) {
      flow.chooseCustomFlow();
    }
    setObjectiveFilterActive(true); // re-enable auto-filter when goal changes
    setMismatchNotice(null);
  };

  /** §2 — Custom card clicked */
  const handlePickCustom = () => {
    setSelectedStrategyId(CUSTOM_ID);
    setPrefillNotice(false);
    flow.chooseCustomFlow();
  };

  /** §2 — Saved strategy card clicked */
  const handlePickStrategy = (s: LaunchStrategy) => {
    const prevObjective = flow.plan.objective;
    setSelectedStrategyId(s.id);
    flow.applySavedStrategy(s.plan);
    setPrefillNotice(true);
    setMismatchNotice(null);
    // Warn if strategy overrides the user's objective selection
    if (s.plan.objective && prevObjective && s.plan.objective !== prevObjective) {
      setMismatchNotice({
        from: OBJECTIVE_LABEL[prevObjective as keyof typeof OBJECTIVE_LABEL] ?? prevObjective,
        to: OBJECTIVE_LABEL[s.plan.objective as keyof typeof OBJECTIVE_LABEL] ?? s.plan.objective,
      });
    }
  };

  const isCustom = selectedStrategyId === CUSTOM_ID;

  /**
   * Deselect custom — clears local selection + resets strategyId.
   * PlanV2.flowMode only allows "custom" | "template" — there is no undefined/
   * neutral state, so we keep flowMode as "custom" (the plan default) and just
   * clear the local selectedStrategyId so the UI shows nothing selected.
   */
  const handleDeselectCustom = () => {
    setSelectedStrategyId(null);
    flow.patch({ strategyId: null });
  };

  /* ── strategy variant toggle — A (merged inline) / B (compact card above search) ── */
  const [strategyVariant, setStrategyVariant] = useState<StrategyVariant>(readVariant);

  const switchVariant = (v: StrategyVariant) => {
    setStrategyVariant(v);
    try {
      localStorage.setItem(VARIANT_LS_KEY, v);
    } catch {
      /* ignore */
    }
  };

  /* ── render ── */

  return (
    <div className="space-y-7">

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §1 — Campaign goal (Required, ALWAYS ACTIVE)                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
              1
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">
              Campaign goal
            </h2>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Required
            </span>
          </div>
          <p className="pl-7 text-[11px] text-muted-foreground leading-relaxed">
            Choose what you want to achieve with this campaign.
          </p>
        </div>

        {/* 3-per-row objective grid — always interactive */}
        <div className="grid grid-cols-3 gap-2">
          {OBJECTIVES.map((o) => {
            const { Icon, desc } = OBJECTIVE_META[o.id];
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => handleObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "fab-focus relative flex flex-col gap-2 rounded-xl border p-2.5 text-left transition-all duration-200",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
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
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {o.label}
                  </p>
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

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §2 — Strategy (Optional)                                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section ref={strategyRef} className="space-y-3">

        {/* ── §2 header row ── */}
        <div className="flex items-center gap-2">
          {/* Step badge */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
            2
          </span>

          {/* Title */}
          <h2 className="text-[15px] font-semibold text-foreground">
            Strategy
          </h2>

          {/* Optional badge */}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Optional
          </span>

          {/* Variant A — inline skip text link */}
          {strategyVariant === "A" && (
            <>
              <span className="text-[10px] text-muted-foreground/40 select-none">·</span>
              {isCustom ? (
                /* Active: lime label + × to deselect */
                <span className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-primary">
                    Set up myself
                  </span>
                  <button
                    type="button"
                    onClick={handleDeselectCustom}
                    aria-label="Clear manual setup selection"
                    className="flex h-3.5 w-3.5 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ) : (
                /* Inactive: muted underline text button */
                <button
                  type="button"
                  onClick={handlePickCustom}
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:underline hover:text-foreground cursor-pointer transition-colors"
                >
                  Skip — set it up myself
                </button>
              )}
            </>
          )}

          {/* Spacer — pushes toggle to far right */}
          <div className="flex-1" />

          {/* A / B segmented pill toggle */}
          <div className="flex items-center rounded-full border border-border bg-muted/40 overflow-hidden">
            {(["A", "B"] as StrategyVariant[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => switchVariant(v)}
                aria-pressed={strategyVariant === v}
                className={cn(
                  "px-2 py-0.5 text-[10px] transition-colors",
                  strategyVariant === v
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Variant B: compact "No strategy" card above the search row ── */}
        {strategyVariant === "B" && (
          <button
            type="button"
            onClick={isCustom ? handleDeselectCustom : handlePickCustom}
            aria-pressed={isCustom}
            className={cn(
              "fab-focus flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
              isCustom
                ? "border-primary/35 bg-primary/[0.07]"
                : "border-border bg-muted hover:border-foreground/20 hover:bg-muted/70",
            )}
          >
            {/* Icon — lime dot when selected, pencil when not */}
            {isCustom ? (
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>
            ) : (
              <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}

            {/* Title */}
            <span className="text-[12px] font-medium text-foreground shrink-0">
              No strategy
            </span>

            {/* Separator dot */}
            <span className="text-[11px] text-muted-foreground/40 select-none shrink-0">·</span>

            {/* Body */}
            <span className="text-[11px] text-muted-foreground min-w-0 truncate">
              Skip presets — configure every step from scratch.
            </span>

            {/* × deselect when active */}
            {isCustom && (
              <X className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}

        {/* Search + filter row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center gap-1.5 h-9 rounded-xl border border-border bg-card px-2.5 focus-within:border-primary/50">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {/* Objective chip — shown when filter active */}
            {objectiveFilterActive && plan.objective && (
              <div className="flex items-center gap-1 shrink-0 rounded-full bg-primary/15 border border-primary/20 px-2 py-0.5">
                <span className="text-[10px] font-semibold text-primary font-mono">
                  {OBJECTIVE_LABEL[plan.objective]}
                </span>
                <button
                  type="button"
                  onClick={() => setObjectiveFilterActive(false)}
                  className="text-primary/60 hover:text-primary"
                  aria-label="Remove objective filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {/* Text input — placeholder changes when chip is active */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={objectiveFilterActive && plan.objective ? "Search within…" : "Search saved setups…"}
              className="flex-1 min-w-0 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Filter popover */}
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
            <PopoverContent align="end" className="w-64 p-3">
              <div className="space-y-3">
                {([
                  { kind: "budgetMode" as FilterKind, label: "Budget mode" },
                  { kind: "objective" as FilterKind, label: "Objective" },
                  { kind: "tag" as FilterKind, label: "Tags" },
                  { kind: "pageDist" as FilterKind, label: "Page distribution" },
                  { kind: "format" as FilterKind, label: "Format" },
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

        {/* Prefill notice */}
        {prefillNotice && (
          <div
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
              Setup applied — all fields pre-filled.{" "}
              {plan.objective && (
                <span className="text-foreground">
                  Objective:{" "}
                  {OBJECTIVE_LABEL[plan.objective] ?? prettifyObjective(plan.objective)}.
                </span>
              )}{" "}
              Edit any step, or Skip &amp; Launch.
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

        {/* Mismatch warning pill */}
        {mismatchNotice && (
          <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2" role="status">
            <span className="text-[11px] text-yellow-700 dark:text-yellow-400 font-mono">
              Goal changed: {mismatchNotice.from} → {mismatchNotice.to} (from this strategy)
            </span>
            <button type="button" onClick={() => setMismatchNotice(null)} className="ml-auto shrink-0 text-muted-foreground/60 hover:text-muted-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Strategy grid — 3-per-row */}
        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[80px] animate-pulse rounded-xl border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-6 text-center">
            <p className="text-[12px] font-medium text-foreground">No matching strategies</p>
            <p className="text-[11px] text-muted-foreground">
              {strategyVariant === "A"
                ? "Adjust filters, clear the search, or use Skip above."
                : "Adjust filters, clear the search, or use No strategy above."}
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
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto">
              {visibleStrategies.map((s) => (
                <StrategyGridCard
                  key={s.id}
                  strategy={s}
                  selected={selectedStrategyId === s.id}
                  onSelect={() => handlePickStrategy(s)}
                />
              ))}
            </div>

            {/* View more / less toggle */}
            {!showAll && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="fab-focus w-full rounded-xl border border-dashed border-border py-2 text-[11px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
              >
                View {hiddenCount} more
              </button>
            )}
            {showAll && filtered.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="fab-focus w-full rounded-xl border border-dashed border-border py-2 text-[11px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
              >
                Show less
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
