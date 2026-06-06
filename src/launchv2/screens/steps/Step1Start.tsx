/**
 * Step 1 — Start (the reducer). The calm first screen of Launch v2.
 *
 * Two stacked sections (LAUNCH2_V2_PLAN.md §6c):
 *   1. Objective — sets what's available downstream.
 *   2. Intent — Test / Scale / Custom; prefills structure/budget/spread.
 *
 * Renders only the step BODY; the orchestrator owns chrome/progress/footer and
 * gates Next on objective.
 */
import {
  Sparkles,
  FlaskConical,
  Rocket,
  SlidersHorizontal,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { Intent, Objective } from "../../types";
import { INTENTS, OBJECTIVES } from "../../data";
import { intentDefaults } from "../../reducer";

/* ---- icon maps (kept local to the screen) ---- */
const INTENT_ICONS: Record<Intent, LucideIcon> = {
  test: FlaskConical,
  scale: Rocket,
  custom: SlidersHorizontal,
};

/** One-line "yeh prefill karega" hint per intent, derived from intentDefaults. */
function intentHint(intent: Intent, objective: Objective | null): string {
  if (intent === "custom") return "No preset — set every field by hand.";
  const d = intentDefaults(intent, objective);
  const struct = `${d.structure.campaigns}×${d.structure.adSetsPerCampaign}×${d.structure.adsPerAdSet}`;
  const bits = [d.budgetMode, d.spread.replace(/_/g, " "), `${struct} structure`, `$${d.budgetAmount}/day`];
  if (d.advantagePlus) bits.push("Advantage+");
  return `Prefills: ${bits.join(" · ")}`;
}

export default function Step1Start({ flow }: { flow: UseFlowV2 }) {
  const { plan } = flow;
  const { objective, intent } = plan;

  const chooseObjective = (o: Objective) => {
    flow.chooseObjectiveFormat(o, null);
  };

  return (
    <div data-screen="lv2-step1-start" className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Start a launch</h1>
        <p className="text-sm text-muted-foreground">
          Pick your objective and how aggressive to launch — everything downstream prefills from here.
        </p>
      </header>

      {/* ── 1. Objective ─────────────────────────────────────────── */}
      <Section
        index={1}
        title="What's the goal?"
        hint="Required — sets what's available."
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
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30",
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

      {/* ── 2. Intent ────────────────────────────────────────────── */}
      <Section index={2} title="How aggressive?" hint="Prefills structure, budget and spread. Default is Custom.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {INTENTS.map((it) => {
            const selected = intent === it.id;
            const Icon = INTENT_ICONS[it.id];
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => flow.chooseIntent(it.id)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col gap-1.5 rounded-2xl border bg-card p-4 text-left transition-colors",
                  selected ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{it.blurb}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{intentHint(intent, objective)}</p>
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
