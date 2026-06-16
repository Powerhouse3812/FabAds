/**
 * Step 1 — Start V2  (Objective-first redesign).
 *
 * Layout:
 *   §1  "What's your campaign goal?" — 6 objective cards, 2-col grid. Always visible.
 *   §2  "Start from a saved setup"  — slides in after objective is picked.
 *         Contextual subtext + recently-used horizontal scroll strip only.
 *         No full-grid, no search, no sort — keep Step 1 fast and uncluttered.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Eye,
  MessageSquare,
  MousePointer2,
  Pencil,
  Rocket,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Contextual subtext for §2 based on selected objective + how many recent setups exist. */
function recentSubtext(objective: Objective | null, count: number): string {
  if (!objective || count === 0) return "Pre-fills every step. Edit anything on the way.";
  const label = OBJECTIVE_LABEL[objective] ?? prettifyObjective(objective);
  if (count === 1) return `1 recent ${label} setup — apply it to skip manual config.`;
  return `${count} recent ${label} setups — pick one to pre-fill every step.`;
}

/* ------------------------------------------------------------------ */
/*  Strategy card (compact — strip only)                               */
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

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col gap-2 rounded-2xl border bg-card p-2.5 text-left transition-colors",
        selected
          ? "border-2 border-foreground bg-foreground/[0.03]"
          : "border border-border hover:border-foreground/30",
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
      <div className="min-w-0 pr-5">
        <h3 className="truncate text-[12px] font-semibold text-foreground">
          {strategy.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {objective} · {fmt} · {budget}
        </p>
      </div>
      {/* Tags — max 2 */}
      {(strategy.tags ?? []).length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {(strategy.tags ?? []).slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              #{t}
            </span>
          ))}
          {(strategy.tags ?? []).length > 2 && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{(strategy.tags ?? []).length - 2}
            </span>
          )}
        </div>
      )}
      {partial && (
        <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Partial
        </span>
      )}
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

  /* ── selection — Custom is default ── */
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(CUSTOM_ID);
  const [prefillNotice, setPrefillNotice] = useState(false);

  /* ── section 2 scroll target ── */
  const section2Ref = useRef<HTMLDivElement>(null);

  /* ── reset to Custom when objective changes ── */
  const prevObjective = useRef<typeof objective>(undefined);
  useEffect(() => {
    if (prevObjective.current !== undefined && prevObjective.current !== objective) {
      setSelectedStrategyId(CUSTOM_ID);
      setPrefillNotice(false);
    }
    prevObjective.current = objective;
  }, [objective]);

  /* ── recently used strip — filtered by selected objective ── */
  const recentlyUsed = useMemo(() => {
    return [...strategies]
      .filter((s) => {
        if (!s.lastUsedAt) return false;
        if (objective && s.plan.objective && s.plan.objective !== objective) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.lastUsedAt ?? 0).getTime() -
          new Date(a.lastUsedAt ?? 0).getTime(),
      )
      .slice(0, 8);
  }, [strategies, objective]);

  /* ── handlers ── */

  const handleObjective = (o: Objective) => {
    flow.chooseObjectiveFormat(o, null);
    setTimeout(() => {
      section2Ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const handleStrategySelect = (id: string) => {
    setSelectedStrategyId(id);
    if (id === CUSTOM_ID) {
      // Custom — keep objective, clear any prior strategy prefill
      if (objective) flow.chooseObjectiveFormat(objective as Objective, null);
      setPrefillNotice(false);
      return;
    }
    const s = strategies.find((x) => x.id === id);
    if (s?.plan) {
      flow.patch(s.plan);
      setPrefillNotice(true);
    }
  };

  /* ── render ── */

  return (
    <div data-screen="lv2-step1-start-v2" className="space-y-7">

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §1 — Objective                                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
              1
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">
              What's your campaign goal?
            </h2>
          </div>
          <p className="pl-7 text-xs text-muted-foreground">
            Choose the objective that matches what you want to achieve.
          </p>
        </div>

        {/* 2-col icon card grid */}
        <div className="grid grid-cols-2 gap-2.5">
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
                  "relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    selected ? "bg-primary/15" : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{o.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                    {desc}
                  </p>
                </div>
                {selected && (
                  <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* §2 — Recently used setups (reveals after objective pick)    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section
        ref={section2Ref}
        className={cn(
          "space-y-3 transition-all duration-300 ease-out",
          objective
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-1.5 pointer-events-none select-none",
        )}
        aria-hidden={!objective}
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-foreground">
              2
            </span>
            <h2 className="text-[15px] font-semibold text-foreground">
              Start from a saved setup
            </h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Optional
            </span>
          </div>
          <p className="pl-7 text-[11px] text-muted-foreground leading-relaxed">
            {recentSubtext(objective as Objective | null, recentlyUsed.length)}
          </p>
        </div>

        {/* Prefill confirmation */}
        {prefillNotice && (
          <div
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
            role="status"
            aria-live="polite"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
              Setup applied — all fields pre-filled. Edit any step on the way.
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

        {/* Recently used strip */}
        {loading ? (
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] w-[196px] shrink-0 animate-pulse rounded-2xl border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentlyUsed.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recently used
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {/* Custom card — always first, default selected */}
              <div className="w-[196px] shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => handleStrategySelect(CUSTOM_ID)}
                  aria-pressed={selectedStrategyId === CUSTOM_ID}
                  className={cn(
                    "flex h-full w-full flex-col gap-2 rounded-2xl border p-2.5 text-left transition-colors",
                    selectedStrategyId === CUSTOM_ID
                      ? "border-2 border-foreground bg-foreground/[0.03]"
                      : "border-dashed border-border bg-card hover:border-foreground/30",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg",
                      selectedStrategyId === CUSTOM_ID ? "bg-foreground/10" : "bg-muted",
                    )}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {selectedStrategyId === CUSTOM_ID && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Custom</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Configure every step manually</p>
                  </div>
                </button>
              </div>
              {/* Recently used strategy cards */}
              {recentlyUsed.map((s) => (
                <div key={s.id} className="w-[196px] shrink-0 snap-start">
                  <StrategyCard
                    strategy={s}
                    selected={selectedStrategyId === s.id}
                    onSelect={() => handleStrategySelect(s.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
