/**
 * Step 1 — Start V2 (complete redesign).
 *
 * Design philosophy:
 *   - Objective = the most consequential choice. It gets the full canvas.
 *     Large icon-led cards, Linear-style "mode selector" feel.
 *   - Strategy = a keyboard-shortcut-style accelerator. Not a form section.
 *     Appears only after an objective is picked (CSS progressive reveal).
 *   - Progressive disclosure: Strategy section is greyed out + "locked" until
 *     objective is set. No JS animation library — CSS transition only.
 *   - Step indicators replaced with a clean numbered stepper (no circled Unicode).
 *   - Prefill summary: when a strategy preset is chosen, a compact card shows
 *     the concrete values being set (budget, structure, spread) with Geist Mono.
 */
import {
  Check,
  Eye,
  FlaskConical,
  MessageSquare,
  MousePointer2,
  Rocket,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES, STRATEGIES } from "../../data";
import { intentDefaults } from "../../reducer";

/* ------------------------------------------------------------------ */
/*  Data maps                                                           */
/* ------------------------------------------------------------------ */

const OBJECTIVE_META: Record<
  Objective,
  { icon: React.ReactNode; label: string; desc: string }
> = {
  OUTCOME_AWARENESS: {
    icon: <Eye className="h-6 w-6" />,
    label: "Awareness",
    desc: "Be remembered by the most people.",
  },
  OUTCOME_TRAFFIC: {
    icon: <MousePointer2 className="h-6 w-6" />,
    label: "Traffic",
    desc: "Send people to a destination.",
  },
  OUTCOME_ENGAGEMENT: {
    icon: <MessageSquare className="h-6 w-6" />,
    label: "Engagement",
    desc: "Messages, video views, post engagement.",
  },
  OUTCOME_LEADS: {
    icon: <Rocket className="h-6 w-6" />,
    label: "Leads",
    desc: "Collect leads for your business.",
  },
  OUTCOME_APP_PROMOTION: {
    icon: <Smartphone className="h-6 w-6" />,
    label: "App promotion",
    desc: "Drive installs and in-app events.",
  },
  OUTCOME_SALES: {
    icon: <ShoppingCart className="h-6 w-6" />,
    label: "Sales",
    desc: "Find people likely to purchase.",
  },
};

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
  preset_test: <FlaskConical className="h-4 w-4" />,
  preset_scale: <Rocket className="h-4 w-4" />,
};

/* ------------------------------------------------------------------ */
/*  Prefill summary helper                                              */
/* ------------------------------------------------------------------ */

interface PrefillValues {
  budgetMode: string;
  budgetAmount: number;
  spread: string;
  structure: string;
  advantagePlus: boolean;
}

function getPrefillValues(
  strategyId: string | null,
  objective: Objective | null,
): PrefillValues | null {
  if (!strategyId || strategyId === "custom") return null;
  const intentMap: Record<string, "test" | "scale"> = {
    preset_test: "test",
    preset_scale: "scale",
  };
  const i = intentMap[strategyId];
  if (!i) return null;
  const d = intentDefaults(i, objective);
  return {
    budgetMode: d.budgetMode,
    budgetAmount: d.budgetAmount,
    spread: d.spread.replace(/_/g, " "),
    structure: `${d.structure.campaigns}×${d.structure.adSetsPerCampaign}×${d.structure.adsPerAdSet}`,
    advantagePlus: d.advantagePlus,
  };
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function Step1StartV2({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const { objective, strategyId } = plan;

  const chooseObjective = (o: Objective) => flow.chooseObjectiveFormat(o, null);

  const handleStrategyClick = (id: string) => {
    if (strategyId === id) {
      flow.chooseStrategy(null);
    } else {
      flow.chooseStrategy(id);
    }
  };

  const activeId = strategyId ?? "custom";
  const prefill = getPrefillValues(activeId !== "custom" ? activeId : null, objective);
  const strategyUnlocked = objective !== null;

  return (
    <div data-screen="lv2-step1-start-v2" className="space-y-10">
      {/* ── Page header ───────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Start a launch
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick your objective, then optionally apply a strategy to prefill the rest.
        </p>
      </header>

      {/* ── Step 1: Objective ─────────────────────────────────── */}
      <div className="space-y-4">
        <StepLabel
          n={1}
          title="What's the goal?"
          badge={
            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-destructive">
              Required
            </span>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {OBJECTIVES.map((o) => {
            const meta = OBJECTIVE_META[o.id];
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => chooseObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-200",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-sm",
                )}
              >
                {/* Check mark — top-right corner when selected */}
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-[#121212]" />
                  </span>
                )}

                {/* Icon */}
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    selected
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                  )}
                >
                  {meta.icon}
                </span>

                {/* Label + description */}
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{meta.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* What this objective unlocks — shown after selection */}
        {objective && (
          <div
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs"
            role="status"
            aria-live="polite"
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {OBJECTIVE_META[objective].label}
              </span>{" "}
              selected — Step 2 will show destination and optimization fields for this objective.
            </span>
          </div>
        )}
      </div>

      {/* ── Step 2: Strategy ──────────────────────────────────── */}
      {/* Progressive reveal: full opacity when objective picked, greyed out + pointer-events-none otherwise */}
      <div
        className={cn(
          "space-y-4 transition-opacity duration-300",
          strategyUnlocked ? "opacity-100" : "pointer-events-none opacity-35",
        )}
        aria-disabled={!strategyUnlocked}
      >
        <StepLabel
          n={2}
          title="Strategy"
          badge={
            !strategyUnlocked ? (
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                Select an objective first
              </span>
            ) : (
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                Optional
              </span>
            )
          }
        />

        {/* Strategy pills */}
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map((s) => {
            const on = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStrategyClick(s.id)}
                aria-pressed={on}
                aria-label={`Strategy: ${s.name}`}
                disabled={!strategyUnlocked}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-150",
                  on
                    ? "border-primary bg-primary/5 font-semibold text-foreground shadow-sm"
                    : "border-border bg-card font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {STRATEGY_ICONS[s.id]}
                </span>
                {s.name}
                {on && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}

          {/* Custom pill */}
          <button
            type="button"
            onClick={() => flow.chooseStrategy(null)}
            aria-pressed={activeId === "custom"}
            aria-label="Strategy: Custom — manual configuration"
            disabled={!strategyUnlocked}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-150",
              activeId === "custom"
                ? "border-border bg-muted/50 font-semibold text-foreground"
                : "border-border bg-card font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            Custom
          </button>
        </div>

        {/* "What this sets up" summary card — only when a preset is active */}
        {prefill && strategyUnlocked && (
          <div
            className="rounded-xl border border-border/60 bg-muted/50 px-4 py-3"
            role="status"
            aria-live="polite"
          >
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              What this sets up
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
              <PrefillRow label="Budget" value={`$${prefill.budgetAmount}/day`} />
              <PrefillRow label="Mode" value={prefill.budgetMode} />
              <PrefillRow label="Structure" value={prefill.structure} />
              <PrefillRow label="Spread" value={prefill.spread} />
              {prefill.advantagePlus && (
                <PrefillRow label="Advantage+" value="Enabled" highlight />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StepLabel({
  n,
  title,
  badge,
}: {
  n: number;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Numbered step pill */}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
        {n}
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {badge}
    </div>
  );
}

function PrefillRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-xs font-medium tabular-nums",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
