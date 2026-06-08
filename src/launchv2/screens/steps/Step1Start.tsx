/**
 * Step 1 — Start. Two sections:
 *   1. Objective (required) — 6-card grid.
 *   2. Strategy (optional soft accelerator) — pill row: Test · Scale · Custom
 *      + any user-saved strategies. Clicking a preset prefills structure/budget/
 *      spread/bid/advantage+. Visually optional — no "required" marker.
 */
import { Check, FlaskConical, Rocket, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Objective } from "../../types";
import { OBJECTIVES, STRATEGIES } from "../../data";
import { intentDefaults } from "../../reducer";

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
      <Section index={1} title="What's the goal?" hint="Required">
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
                  <span className="text-sm font-medium text-foreground">{o.label}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{o.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── 2. Strategy (optional) ───────────────────────────────── */}
      <Section index={2} title="Strategy" hint="Optional — prefills budget, structure and spread">
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
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  on
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
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
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeId === "custom"
                ? "border-border bg-muted/50 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Custom
          </button>
        </div>

        {/* Prefill hint — only shown when a preset is active */}
        {activeId !== "custom" && (
          <p className="text-xs text-muted-foreground">
            {strategyHint(activeId, objective)}
          </p>
        )}
      </Section>
    </div>
  );
}

/* ---- section shell ---- */
function Section({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-mono tabular-nums font-semibold text-muted-foreground">
          {index}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
