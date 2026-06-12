/**
 * Step 1 — Start (Launch 2.0 redesign).
 *
 * Strategies LEAD (~70% of viewport). Objective is the fallback "start fresh"
 * path below the fold (~30%). Default state = nothing pre-selected. Save-as-
 * strategy moved to Step 4 — no checkbox here.
 *
 * Layout:
 *   [Title + subhead]
 *   [Your strategies][Start fresh ↓ link]
 *   [Search] [Tag pills row] [Sort dropdown]
 *   — Recently used —      (max 8 cards)
 *   — All strategies (N) — (grid, paginated)
 *   — Or start fresh — pick objective —
 *   [Awareness][Traffic][Engagement][Leads][App][Sales]
 *
 * Selection state = mono 2px foreground border + bg-foreground/[0.03] + check
 * dot. Lime is reserved for the primary CTA elsewhere in the flow.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES } from "../../data";
import { strategiesService } from "../../services/strategiesService";
import type { LaunchStrategy } from "../../services/strategiesService";

/* ---- props ---- */
interface Step1StartProps {
  flow: UseFlowV2;
  /** Kept for parent compatibility — the checkbox lives on Step 4 now. */
  saveAsStrategy: boolean;
  onSaveAsStrategyChange: (v: boolean) => void;
}

/* ---- helpers ---- */

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "DPA",
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
  const SYM: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const sym = ccy ? (SYM[ccy] ?? `${ccy} `) : "";
  return `${sym}${Math.round(budgetAmount).toLocaleString("en-IN")}/d · ${budgetMode ?? "—"}`;
}

/** Render up to 3 tag chips + "+N more" overflow per locked decision #21. */
function TagChipsRow({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, 3);
  const overflow = tags.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <span
          key={t}
          className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          #{t}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          title={tags.slice(3).map((t) => `#${t}`).join("  ")}
        >
          +{overflow} more
        </span>
      )}
    </div>
  );
}

/** Compute "completeness" for a strategy. Used purely for the "Partial" hint. */
function isPartial(s: LaunchStrategy): boolean {
  const p = s.plan;
  const hasTargets = (p.targets?.length ?? 0) > 0;
  // Catalogue strategies don't need an explicit creative source picked yet.
  const needsTemplate = p.objective !== "OUTCOME_SALES" || p.format !== "dpa";
  const hasTemplate = !!p.targetingTemplateId;
  if (!hasTargets) return true;
  if (needsTemplate && !hasTemplate && (p.format === "dpa" || p.objective === "OUTCOME_LEADS")) return true;
  return false;
}

/* ---- strategy card ---- */

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
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "fab-focus group relative flex flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-colors",
        selected
          ? "border-foreground bg-foreground/[0.03] border-2"
          : "border border-border hover:border-foreground/30",
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
      <div className="min-w-0">
        <h3 className="truncate text-[13px] font-semibold text-foreground">
          {strategy.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {objective} · {fmt} · {budget}
        </p>
      </div>
      <TagChipsRow tags={strategy.tags ?? []} />
      {partial && (
        <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Partial · lands at first missing step
        </span>
      )}
    </button>
  );
}

/* ---- screen ---- */

type SortKey = "recently_used" | "most_used" | "name";

export default function Step1Start({ flow }: Step1StartProps) {
  const { plan } = flow;
  const { objective } = plan;

  const [strategies, setStrategies] = useState<LaunchStrategy[]>(() => strategiesService.list());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setStrategies(strategiesService.list());
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  // Default state: nothing pre-selected (no Custom Launch auto-pick).
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recently_used");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Auto-scroll target for "Start fresh ↓"
  const objectiveRowRef = useRef<HTMLDivElement | null>(null);
  const scrollToObjectives = () => {
    objectiveRowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---- derived data ---- */

  const allTags = useMemo(() => {
    const set = new Set<string>();
    strategies.forEach((s) => (s.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [strategies]);

  // AND-logic: a strategy must have every active tag.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return strategies.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (activeTags.length > 0) {
        const tagSet = new Set(s.tags ?? []);
        for (const t of activeTags) if (!tagSet.has(t)) return false;
      }
      return true;
    });
  }, [strategies, search, activeTags]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "most_used":
        return arr.sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "recently_used":
      default:
        return arr.sort((a, b) => {
          const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          return tb - ta;
        });
    }
  }, [filtered, sort]);

  // Recently-used row: ignore search/tag filters so it stays stable & contextual.
  const recentlyUsed = useMemo(() => {
    return [...strategies]
      .filter((s) => !!s.lastUsedAt)
      .sort(
        (a, b) =>
          new Date(b.lastUsedAt ?? 0).getTime() -
          new Date(a.lastUsedAt ?? 0).getTime(),
      )
      .slice(0, 8);
  }, [strategies]);

  const paged = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page]);
  const totalCount = strategies.length;
  const filteredCount = sorted.length;
  const hasMore = paged.length < filteredCount;

  /* ---- handlers ---- */

  const handleStrategySelect = (id: string) => {
    setSelectedStrategyId(id);
    const s = strategies.find((x) => x.id === id);
    if (s?.plan) flow.patch(s.plan);
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setPage(1);
  };

  const clearFilters = () => {
    setActiveTags([]);
    setSearch("");
    setPage(1);
  };

  const chooseObjective = (o: Objective) => {
    setSelectedStrategyId(null);
    flow.chooseObjectiveFormat(o, null);
  };

  /* ---- render ---- */

  return (
    <div data-screen="lv2-step1-start" className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Start a launch
        </h1>
        <p className="text-sm text-muted-foreground">
          Reuse a strategy or pick an objective to start fresh.
        </p>
      </header>

      {/* Section header — strategies lead */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Your strategies</h2>
          <p className="text-[11px] text-muted-foreground">
            Pre-fills every step. Edit anything on the way.
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToObjectives}
          className="fab-focus inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Start fresh
          <ArrowDownToLine className="h-3 w-3" />
        </button>
      </div>

      {/* Search + tag rail + sort */}
      <div className="space-y-2">
        {/* Search + sort row */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search strategies by name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="shrink-0 text-muted-foreground/60 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort"
              className="h-7 cursor-pointer appearance-none rounded-md border border-border/60 bg-transparent pr-6 pl-2 text-[11px] font-medium text-foreground outline-none hover:border-foreground/30"
            >
              <option value="recently_used">Recently used</option>
              <option value="most_used">Most used</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Tag rail */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {allTags.map((t) => {
              const active = activeTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "fab-focus inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  #{t}
                  {active && <X className="h-2.5 w-2.5" />}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="fab-focus ml-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recently used row — bypasses tag/search filters so it stays stable. */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : recentlyUsed.length > 0 && activeTags.length === 0 && !search ? (
        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Recently used
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyUsed.map((s) => (
              <StrategyCard
                key={s.id}
                strategy={s}
                selected={selectedStrategyId === s.id}
                onSelect={() => handleStrategySelect(s.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* All strategies grid */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {activeTags.length > 0 || search
            ? `Results (${filteredCount})`
            : `All strategies (${totalCount})`}
        </h3>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : strategies.length === 0 ? (
          <EmptyState
            title="No Strategies yet."
            body="Save one from Step 4 — the last step of a launch."
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No Strategies match."
            body=""
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="fab-focus inline-flex items-center rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {paged.map((s) => (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  selected={selectedStrategyId === s.id}
                  onSelect={() => handleStrategySelect(s.id)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="fab-focus inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Load {Math.min(PAGE_SIZE, filteredCount - paged.length)} more
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Objective fallback — start fresh */}
      <section
        ref={objectiveRowRef}
        className="space-y-2 border-t border-border/60 pt-5"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Or start fresh — pick objective
          </h3>
          <p className="text-[11px] text-muted-foreground">
            No preset applied. You'll configure every step yourself.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OBJECTIVES.map((o) => {
            const selected = objective === o.id && selectedStrategyId === null;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => chooseObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "fab-focus inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  selected
                    ? "border-2 border-foreground bg-foreground/[0.03] text-foreground"
                    : "border border-border bg-background text-foreground hover:border-foreground/30",
                )}
                title={o.desc}
              >
                {o.label}
                {selected && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---- subcomponents ---- */

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading strategies"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[120px] animate-pulse rounded-2xl border border-border bg-muted/30"
        />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {body && <p className="text-[11px] text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}
