/**
 * Step 1 — Start (the reducer). The calm first screen of Launch v2.
 *
 * Two stacked sections (LAUNCH2_V2_PLAN.md §6c):
 *   1. Objective + format (GATED) — objective unlocks the allowed formats.
 *   2. Intent — Test / Scale / Custom; prefills structure/budget/spread.
 *
 * Renders only the step BODY; the orchestrator owns chrome/progress/footer and
 * gates Next on objective + format.
 */
import {
  Sparkles,
  FlaskConical,
  Rocket,
  SlidersHorizontal,
  Image as ImageIcon,
  Video,
  GalleryHorizontalEnd,
  Layers,
  Boxes,
  ShoppingBag,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFlowV2 } from "../../state/useFlowV2";
import type { AdFormat, Intent, Objective } from "../../types";
import { INTENTS, OBJECTIVES, FORMATS } from "../../data";
import { allowedFormats, defaultDestination, intentDefaults } from "../../reducer";

/* ---- icon maps (kept local to the screen) ---- */
const FORMAT_ICONS: Record<AdFormat, LucideIcon> = {
  single_image: ImageIcon,
  single_video: Video,
  carousel: GalleryHorizontalEnd,
  collection: Layers,
  flexible: Boxes,
  dpa: ShoppingBag,
};

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
  const { objective, format, intent } = plan;

  // Formats are gated on a chosen objective. Once chosen, only allowed ones show.
  const formatOptions: AdFormat[] = objective
    ? allowedFormats(objective, defaultDestination(objective), null)
    : [];
  const formatSet = new Set(formatOptions);
  const formatsLocked = !objective;

  const chooseObjective = (o: Objective) => {
    // Re-validate the current format against the new objective's allowed set.
    const allowed = allowedFormats(o, defaultDestination(o), null);
    const keep = format && allowed.includes(format) ? format : null;
    flow.chooseObjectiveFormat(o, keep);
  };

  const chooseFormat = (f: AdFormat) => {
    if (!objective) return;
    flow.chooseObjectiveFormat(objective, f);
  };

  return (
    <div data-screen="lv2-step1-start" className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Start a launch</h1>
        <p className="text-sm text-muted-foreground">
          Pick your goal and launch intent — everything downstream prefills from here.
        </p>
      </header>

      {/* ── 1. Objective + format (combined, gated) ──────────────── */}
      <Section
        index={1}
        title="What's the goal?"
        hint="Objective then format. Required."
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

        {/* Format — gated on objective */}
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Format</span>
            <span className="text-xs text-muted-foreground">
              {formatsLocked ? "Pick an objective first" : "Choose one"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const enabled = !formatsLocked && formatSet.has(f.id);
              const selected = format === f.id;
              const Icon = FORMAT_ICONS[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => chooseFormat(f.id)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : enabled
                        ? "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        : "border-border/60 text-muted-foreground/40",
                    !enabled && "cursor-not-allowed",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {f.label}
                </button>
              );
            })}
          </div>
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
