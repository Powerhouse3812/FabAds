import { useMemo, useState } from "react";
import { GitBranch, Lock } from "lucide-react";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel, type PromptBarContextChip } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "../FormSkeleton";
import { AdvancedDrawer } from "../AdvancedDrawer";
import { AISuggestionsDrawer } from "../AISuggestionsDrawer";
import { SourceWinnerPicker, type SourceWinner } from "../fields/SourceWinnerPicker";
import { StatusReadout, type StatusItem } from "../fields/StatusReadout";
import type { VariationSubMethod, StrictnessLevel } from "../types";

/**
 * StudioVariationForm — Variations Type form (A-11.7).
 *
 * Spec source: Genie_6.0_Form_Specs.md §4.
 *
 * STRUCTURALLY DIFFERENT from Brand/Product/Affiliate:
 *   - NO gate modal (Rule 1: skipGate=true on the CTA descriptor)
 *   - NO Output chip — auto-derived from source winner's media type
 *   - NO Saved Templates strip
 *   - NO References section (source winner IS the implicit reference)
 *   - NO BrandPill / ProductPicker / OutputChip / FormatToggle in top zone
 *   - Top sticky has different shape: Source winner picker + Sub-method
 *     chip row (5 options) + Output count chip + read-only output indicator
 *   - Form body: Lineage tree strip → Advanced drawer (Variation-specific
 *     ONLY — no Brand-Constitution, Compliance, Tone/Hook/Angle since these
 *     inherit from source) → AI Suggestions drawer
 *   - Empty state: direct to form, all 6 input methods visible. No block.
 */

const SUB_METHODS: { id: VariationSubMethod; label: string; sub: string }[] = [
  { id: "whole-ad", label: "Whole-ad", sub: "Regenerate full ad keeping winner's intent" },
  { id: "media-only", label: "Media-only", sub: "Same copy, new visuals" },
  { id: "text-only", label: "Text-only", sub: "Same visual, new copy" },
  { id: "ab-axes", label: "A/B axes", sub: "Multi-axis variation (e.g. 5 hooks × 3 visuals = 15)" },
  { id: "refresh", label: "Refresh", sub: "Winner CPA spiking — generate next batch with creative-fatigue logic" },
];

const STRICTNESS_OPTIONS: { id: StrictnessLevel; label: string }[] = [
  { id: "strict", label: "Strict" },
  { id: "balanced", label: "Balanced" },
  { id: "loose", label: "Loose" },
];

const ELEMENT_LOCKS = [
  { id: "logo", label: "Brand logo" },
  { id: "model-face", label: "Model face" },
  { id: "cta-style", label: "CTA style" },
  { id: "copy-line", label: "Specific copy line" },
];

const AB_AXIS_OPTIONS = ["hook", "visual", "CTA", "audience", "tone"] as const;

const MOCK_MODELS: PromptBarModel[] = [
  { id: "auto-source", label: "Match source", tag: "auto", costPerUnit: 1 },
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "kling-1.5", label: "Kling 1.5", tag: "video", costPerUnit: 6 },
];

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Lock logo", insert: "lock the brand logo position and color exactly" },
  { label: "Stronger hook", insert: "open with a stronger hook in the first 3 seconds" },
  { label: "Tighter CTA", insert: "tighten the CTA — direct, urgent" },
];

interface AbAxisConfig {
  axis1: typeof AB_AXIS_OPTIONS[number];
  axis2: typeof AB_AXIS_OPTIONS[number];
  cellCount: number;
}

interface RefreshConfig {
  cpaThreshold: number;
  freshnessTarget: "low" | "balanced" | "high";
  fatigueLookbackDays: number;
}

interface VariationAdvancedState {
  lineageStrength: StrictnessLevel;
  elementLocks: string[];
  abAxes: AbAxisConfig;
  refresh: RefreshConfig;
}

const DEFAULT_VARIATION_ADVANCED: VariationAdvancedState = {
  lineageStrength: "balanced",
  elementLocks: ["logo"],
  abAxes: { axis1: "hook", axis2: "visual", cellCount: 9 },
  refresh: { cpaThreshold: 1.5, freshnessTarget: "balanced", fatigueLookbackDays: 14 },
};

export function StudioVariationForm() {
  // ───────────── Top sticky state ─────────────
  const [source, setSource] = useState<SourceWinner | null>(null);
  const [subMethod, setSubMethod] = useState<VariationSubMethod>("whole-ad");

  // ───────────── Body state ─────────────
  const [advanced, setAdvanced] = useState<VariationAdvancedState>(DEFAULT_VARIATION_ADVANCED);

  // ───────────── PromptBar state ─────────────
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);
  const [modelId, setModelId] = useState<string>(MOCK_MODELS[0].id);

  // For Variations references aren't a separate panel; we still expose the
  // PromptBar's quick-attach refs for completeness but they're rarely used.
  const [references, setReferences] = useState<PromptBarReference[]>([]);

  const derivedOutputLabel = useMemo(() => {
    if (!source) return "auto-derived";
    return source.mediaType === "video" ? "Variants will be video" : "Variants will be image";
  }, [source]);

  const contextChips: PromptBarContextChip[] = [
    { label: "Variations", tone: "active" as const },
    { label: SUB_METHODS.find((m) => m.id === subMethod)?.label ?? subMethod },
    ...(source ? [{ label: source.kind, onClear: () => setSource(null) }] : []),
  ];

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "variation",
      source,
      subMethod,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
      advanced,
    };
    // eslint-disable-next-line no-console
    console.log("[Variations — mock generate]", summary);
    alert(`Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`);
  };

  const statusItems: StatusItem[] = [
    { label: source ? `Source · ${source.kind}` : "Source · pick", state: source ? "ok" : "missing" },
    { label: `Sub-method · ${subMethod}`, state: "info" },
    { label: `Output · ${source?.mediaType ?? "auto"}`, state: source ? "info" : "missing" },
    { label: `${count} variant${count === 1 ? "" : "s"}`, state: "info" },
  ];

  return (
    <FormSkeleton
      eyebrow="Studio · Variations"
      title="Generate variants from a winning ad"
      sub="Pick a source winner, choose your sub-method, generate. Type and Output are auto-derived from the source — no gate, no Output picker."
      top={
        <div className="space-y-2">
          {/* Tier 1 — Source winner (REQUIRED) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Source ·
            </span>
            <SourceWinnerPicker value={source} onChange={setSource} />
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              Output: {derivedOutputLabel}
            </span>
          </div>
          {/* Tier 2 — Sub-method */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Sub-method ·
            </span>
            <SubMethodChipRow value={subMethod} onChange={setSubMethod} />
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              <GitBranch className="h-2.5 w-2.5" />
              Variants: {count}
            </span>
          </div>
        </div>
      }
      status={<StatusReadout items={statusItems} />}
      body={
        <>
          <LineageTreeStrip source={source} />
          <AdvancedDrawer label="Variation settings">
            <VariationAdvancedFields
              state={advanced}
              onChange={setAdvanced}
              subMethod={subMethod}
            />
          </AdvancedDrawer>
          <AISuggestionsDrawer
            contextLabel="from Industry Insights · related winners"
          />
        </>
      }
      promptBar={
        <PromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          count={count}
          onCountChange={setCount}
          chips={TRY_CHIPS}
          chipPrefix="Refine:"
          chipInsertMode="append"
          models={MOCK_MODELS}
          selectedModelId={modelId}
          onModelChange={setModelId}
          references={references}
          onAddReference={(r) => setReferences([...references, r])}
          onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          contextChips={contextChips}
          onGenerate={onGenerate}
          disabled={!source}
          generateLabel="Generate variants"
        />
      }
    />
  );
}

/* ─────────────────────────────────────────────────────── */

function SubMethodChipRow({
  value,
  onChange,
}: {
  value: VariationSubMethod;
  onChange: (next: VariationSubMethod) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Sub-method" className="flex flex-wrap items-center gap-1">
      {SUB_METHODS.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.id)}
            title={m.sub}
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
              active
                ? "bg-primary text-primary-foreground ring-[1.5px] ring-primary ring-offset-2 ring-offset-background shadow-sm font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function LineageTreeStrip({ source }: { source: SourceWinner | null }) {
  return (
    <section className="space-y-2 rounded-md border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Lineage tree
        </h2>
      </div>
      {source ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
              parent
            </span>
            <span className="font-medium text-foreground truncate">{source.label}</span>
            {source.metrics && (
              <span className="font-mono text-[10px] text-muted-foreground">
                · CTR {source.metrics.ctr}% · ROAS {source.metrics.roas}×
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic ml-4">
            ↳ Past variants and their performance will appear here once you generate. Lineage tracked per-asset.
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">
          Pick a source winner to see its lineage tree (parent + past variants + their performance).
        </p>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function VariationAdvancedFields({
  state,
  onChange,
  subMethod,
}: {
  state: VariationAdvancedState;
  onChange: (next: VariationAdvancedState) => void;
  subMethod: VariationSubMethod;
}) {
  const set = <K extends keyof VariationAdvancedState>(k: K, v: VariationAdvancedState[K]) => {
    onChange({ ...state, [k]: v });
  };

  const toggleLock = (id: string) => {
    set(
      "elementLocks",
      state.elementLocks.includes(id)
        ? state.elementLocks.filter((x) => x !== id)
        : [...state.elementLocks, id],
    );
  };

  return (
    <div className="space-y-3">
      {/* Lineage anchor strength */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Lineage anchor strength</p>
        <p className="text-[10px] text-muted-foreground">
          How tightly variants stay anchored to the source winner.
        </p>
        <div className="flex items-center gap-1">
          {STRICTNESS_OPTIONS.map((s) => {
            const active = state.lineageStrength === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => set("lineageStrength", s.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Element preservation */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Element preservation</p>
        <p className="text-[10px] text-muted-foreground">Lock specific elements across variants.</p>
        <div className="flex flex-wrap items-center gap-1">
          {ELEMENT_LOCKS.map((l) => {
            const active = state.elementLocks.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLock(l.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                )}
              >
                {active && <Lock className="h-2.5 w-2.5" />}
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* A/B axes config — only when sub-method = ab-axes */}
      {subMethod === "ab-axes" && (
        <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <p className="text-[11px] font-medium text-foreground">A/B axes config</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Axis 1</label>
              <select
                value={state.abAxes.axis1}
                onChange={(e) => set("abAxes", { ...state.abAxes, axis1: e.target.value as AbAxisConfig["axis1"] })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              >
                {AB_AXIS_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Axis 2</label>
              <select
                value={state.abAxes.axis2}
                onChange={(e) => set("abAxes", { ...state.abAxes, axis2: e.target.value as AbAxisConfig["axis2"] })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              >
                {AB_AXIS_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Cells</label>
              <input
                type="number"
                min={4}
                max={100}
                value={state.abAxes.cellCount}
                onChange={(e) => set("abAxes", { ...state.abAxes, cellCount: Number(e.target.value) || 9 })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Refresh config — only when sub-method = refresh */}
      {subMethod === "refresh" && (
        <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <p className="text-[11px] font-medium text-foreground">Refresh config</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">CPA threshold (×)</label>
              <input
                type="number"
                step={0.1}
                min={1}
                value={state.refresh.cpaThreshold}
                onChange={(e) => set("refresh", { ...state.refresh, cpaThreshold: Number(e.target.value) || 1.5 })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Freshness</label>
              <select
                value={state.refresh.freshnessTarget}
                onChange={(e) => set("refresh", { ...state.refresh, freshnessTarget: e.target.value as RefreshConfig["freshnessTarget"] })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              >
                <option value="low">Low</option>
                <option value="balanced">Balanced</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Fatigue lookback (days)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={state.refresh.fatigueLookbackDays}
                onChange={(e) => set("refresh", { ...state.refresh, fatigueLookbackDays: Number(e.target.value) || 14 })}
                className="mt-0.5 block h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground italic">
        Brand-Constitution, Compliance, Tone/Hook/Angle inherit from the source winner's brand context. No need to set them here.
      </p>
    </div>
  );
}
