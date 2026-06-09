/**
 * Step 1 — Start (V1 corrected). Two sections:
 *   1. Objective (required) — 6-card grid with per-objective Lucide icons.
 *   2. Strategy (optional soft accelerator) — pill row: Test · Scale · Custom
 *      + any user-saved strategies. Clicking a preset prefills structure/budget/
 *      spread/bid/advantage+. Visually optional — no "required" marker.
 *
 * V1 changes:
 *   - Objective cards: Lucide icon per objective (left of label).
 *   - Required/Optional badge styling: pill for Required, dimmer for Optional.
 *   - Strategy prefill hint: wrapped in a callout box instead of bare text.
 *   - Active strategy pill: font-semibold text-foreground for stronger pop.
 */
import {
  Check,
  Eye,
  FlaskConical,
  MousePointer2,
  MessageSquare,
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

/** Map each Meta ODAX objective to a Lucide icon. */
const OBJECTIVE_ICONS: Record<Objective, React.ReactNode> = {
  OUTCOME_AWARENESS: <Eye className="h-4 w-4 shrink-0" />,
  OUTCOME_TRAFFIC: <MousePointer2 className="h-4 w-4 shrink-0" />,
  OUTCOME_ENGAGEMENT: <MessageSquare className="h-4 w-4 shrink-0" />,
  OUTCOME_LEADS: <Rocket className="h-4 w-4 shrink-0" />,
  OUTCOME_APP_PROMOTION: <Smartphone className="h-4 w-4 shrink-0" />,
  OUTCOME_SALES: <ShoppingCart className="h-4 w-4 shrink-0" />,
};

/** One-line prefill hint shown below the strategy pills. */
function strategyHint(strategyId: string | null, objective: Objective | null): string {
  if (!strategyId || strategyId === "custom") return "No preset — fill every field yourself.";
  const intentMap: Record<string, "test" | "scale"> = {
    preset_test: "test",
    preset_scale: "scale",
  };
  const i = intentMap[strategyId];
  if (!i) return "";
  const d = intentDefaults(i, objective);
  const struct = `${d.structure.campaigns}×${d.structure.adSetsPerCampaign}×${d.structure.adsPerAdSet}`;
  const bits = [d.budgetMode, d.spread.replace(/_/g, " "), `${struct} structure`, `$${d.budgetAmount}/day`];
  if (d.advantagePlus) bits.push("Advantage+");
  return `Prefills: ${bits.join(" · ")}`;
}

const STRATEGY_ICONS: Record<string, React.ReactNode> = {
  preset_test: <FlaskConical className="h-3.5 w-3.5" />,
  preset_scale: <Rocket className="h-3.5 w-3.5" />,
};

export default function Step1Start({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const { objective, strategyId } = plan;

  const chooseObjective = (o: Objective) => flow.chooseObjectiveFormat(o, null);

  // Custom = no preset; toggle: click active preset → deselect → custom
  const handleStrategyClick = (id: string) => {
    if (strategyId === id) {
      flow.chooseStrategy(null); // deselect → custom
    } else {
      flow.chooseStrategy(id);
    }
  };

  const activeId = strategyId ?? "custom";

  return (
    <div data-screen="lv2-step1-start" className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Start a launch</h1>
        <p className="text-sm text-muted-foreground">
          Pick your objective. Strategy is optional — select a preset to prefill budget and structure.
        </p>
      </header>

      {/* ── 1. Objective ─────────────────────────────────────────── */}
      <Section
        index={1}
        title="What's the goal?"
        badgeSlot={
          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
            Required
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OBJECTIVES.map((o) => {
            const selected = objective === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => chooseObjective(o.id)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col gap-0.5 rounded-2xl border bg-card p-3 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {OBJECTIVE_ICONS[o.id]}
                    {o.label}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                <span className="mt-0.5 text-xs text-muted-foreground">{o.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── 2. Strategy (optional) ───────────────────────────────── */}
      <Section
        index={2}
        title="Strategy"
        badgeSlot={
          <span className="text-[10px] text-muted-foreground/60">
            Optional — prefills budget, structure and spread
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {/* Preset strategy pills */}
          {STRATEGIES.map((s) => {
            const on = activeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStrategyClick(s.id)}
                aria-pressed={on}
                aria-label={`Strategy: ${s.name}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  on
                    ? "border-primary bg-primary/5 font-semibold text-foreground"
                    : "font-medium border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {STRATEGY_ICONS[s.id]}
                {s.name}
                {on && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}

          {/* Custom pill — always visible, active when no preset selected */}
          <button
            type="button"
            onClick={() => flow.chooseStrategy(null)}
            aria-pressed={activeId === "custom"}
            aria-label="Strategy: Custom — manual configuration"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              activeId === "custom"
                ? "border-border bg-muted/50 font-semibold text-foreground"
                : "font-medium border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom
          </button>
        </div>

        {/* Prefill hint — callout box when a preset is active */}
        {activeId !== "custom" && (
          <div
            className="rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {strategyHint(activeId, objective)}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ---- section shell ---- */
function Section({
  index,
  title,
  badgeSlot,
  children,
}: {
  index: number;
  title: string;
  /** Optional slot for the Required/Optional badge — rendered next to title. */
  badgeSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
          {index}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {badgeSlot}
      </div>
      {children}
    </section>
  );
}
