import { useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Clapperboard,
  Copy,
  FileText,
  Gift,
  Layers,
  Lightbulb,
  Lock,
  Pencil,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getBrand } from "@/mocks/shared/brands";
import { getCategory } from "@/mocks/shared/categories";
import { getProduct } from "@/mocks/shared/products";
import { CREDITS_REMAINING, creditsLabel, formatCredits } from "../lib/credits";
import { AnalysisOverview } from "./components/AnalysisOverview";
import { AssetAnalysisOverview } from "./components/AssetAnalysisOverview";
import { ElementEditor } from "./components/ElementEditor";
import { EntityControl } from "./components/EntityControl";
import { SourcePicker } from "./components/SourcePicker";
import { ASSET_ELEMENTS, assetActionLabel, isMandatoryFor } from "./data/assetElements";
import { VARIATION_ELEMENTS } from "./data/variationElements";
import {
  COUNT_MAX,
  COUNT_MIN,
  type UseVariationsFlowReturn,
} from "./state/useVariationsFlow";
import type {
  AdAnalysis,
  AnalysedField,
  AnyElementId,
  AssetAnalysis,
  AssetElementDef,
  AssetKind,
  AssetOutputKind,
  EntitySelection,
  PickedThing,
  VariationElementDef,
} from "./types";

/**
 * Version A — Generate Variations as ONE inline screen, for BOTH families.
 *
 * The locked order (source → count → analysis → recommended actions → manual
 * editing → generate) is kept without steps by disclosing each stage only once
 * the one above it is answered, and by numbering the stages so the sequence
 * stays readable on a page that shows all of it at once.
 *
 * Two disclosure decisions carry the whole design:
 *   · Count is a REAL gate, not a default sitting on screen. `analysedKey`
 *     records which source the user confirmed a count for, so the analysis
 *     cannot appear before N is answered and re-arms itself when the source
 *     changes — no effect, nothing to keep in sync.
 *   · Manual editing opens in a right drawer. An editor at "individual" scope
 *     with N=20 is a chip rail plus a textarea plus notices; inline that would
 *     shove the run summary and Generate off-screen and reflow the page on
 *     every scope change. The drawer keeps the one screen dimensionally still.
 *     It never dismisses on outside click — SheetContent enforces that.
 *
 * PART 2 — the same six stages vary an ASSET. The families are branched, never
 * blended: `flow.family` picks the analysis component, the element roster, the
 * editor and the rail's pricing, and every noun on screen follows the source
 * ("Read the script", not "Read the ad"). The one thing this screen says that
 * no other surface does is the CONSEQUENCE: adding visuals to a script means
 * the run comes back as storyboards, so `flow.outputKind` is stated in the
 * stage where that is decided and again in the run summary.
 *
 * Owns no rules: every decision it renders comes off `flow`.
 */

interface VariationsFlowAProps {
  flow: UseVariationsFlowReturn;
}

/** What a source change is about to destroy, held until the user confirms. */
type PendingSourceChange =
  | { kind: "clear" }
  | { kind: "pick"; picked: PickedThing };

const ASSET_NOUN: Record<AssetKind, string> = {
  script: "script",
  concept: "concept",
  storyboard: "storyboard",
};

const OUTPUT_ICON: Record<AssetOutputKind, React.ElementType> = {
  script: FileText,
  concept: Lightbulb,
  storyboard: Clapperboard,
};

function plural(noun: string, n: number): string {
  return n === 1 ? noun : `${noun}s`;
}

/** "A", "A and B", "A, B and C" — the dropped-changes list is read as prose. */
function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Kind-scoped, because an output id and a flow-ref id can be the same string,
 *  and a saved asset id can collide with its generated twin. */
function sourceKey(picked: PickedThing): string {
  if (picked.family === "asset") {
    const asset = picked.asset;
    if (asset.kind === "uploaded-asset") return `uploaded-asset:${asset.file.id}`;
    if (asset.kind === "pasted-asset") return `pasted-asset:${asset.text.id}`;
    return `${asset.kind}:${asset.assetKind}:${asset.id}`;
  }
  const ad = picked.ad;
  if (ad.kind === "genie-output") return `genie-output:${ad.output.id}`;
  if (ad.kind === "flow-ref") return `flow-ref:${ad.ref.id}`;
  return `upload:${ad.file.id}`;
}

/**
 * The element registries are separate and their id unions only partly overlap
 * ("angle" exists in both, "framework" only on an asset), so resolution goes
 * through the exported rosters. A `find` narrows honestly and returns null for
 * the other family's id — no cast, and no lookup that can throw.
 */
function adElementFor(id: AnyElementId): VariationElementDef | null {
  return VARIATION_ELEMENTS.find((e) => e.id === id) ?? null;
}

function assetElementFor(id: AnyElementId): AssetElementDef | null {
  return ASSET_ELEMENTS.find((e) => e.id === id) ?? null;
}

/** What the analysis found for a row. Never a fabricated value. */
function fieldText(field: AnalysedField<string | number> | undefined): string {
  if (
    !field ||
    field.provenance === "not-found" ||
    field.value === null ||
    field.value === undefined ||
    field.value === ""
  ) {
    return "N/F";
  }
  return String(field.value);
}

/** The attached entity, as rows. Empty array means Auto — a real answer. */
function entityRowsOf(entity: EntitySelection): { kind: string; name: string }[] {
  const rows: { kind: string; name: string }[] = [];
  const brand = entity.brandId ? getBrand(entity.brandId) : undefined;
  if (brand) rows.push({ kind: "Brand", name: brand.name });
  const category = entity.categoryId ? getCategory(entity.categoryId) : undefined;
  if (category) rows.push({ kind: "Category", name: category.name });
  const product = entity.productId ? getProduct(entity.productId) : undefined;
  if (product) rows.push({ kind: "Product", name: product.name });
  return rows;
}

/* ────────────────────────────────────────────────────────── *
 *  CountStepper — local equivalent of PromptReferenceBar's
 *  NumberStepper (file-local there, so not importable). Same
 *  behaviour and shape, painted in g6 tokens for this route.
 * ────────────────────────────────────────────────────────── */
function CountStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-g6-pill border border-g6-border bg-g6-bg-container px-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="One less variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-g6-lg leading-none">−</span>
      </button>
      <input
        id="variation-count"
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={min}
        max={max}
        className="w-10 bg-transparent text-center font-g6-mono text-g6-base font-semibold tabular-nums text-g6-text outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="One more variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-g6-base leading-none">+</span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Stage — the numbered band. The number is what replaces a
 *  stepper: the order stays legible with everything on screen.
 * ────────────────────────────────────────────────────────── */
function Stage({
  n,
  title,
  hint,
  action,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-g6-pill border border-g6-border bg-g6-bg-muted font-g6-mono text-[10px] font-bold tabular-nums text-g6-text-secondary"
        >
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-g6-sans text-g6-base font-semibold leading-tight text-g6-text">
            {title}
          </h2>
          {hint ? <p className="mt-0.5 text-g6-xs text-g6-text-secondary">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="pl-8">{children}</div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  OutputBand — the owner's ruling, made consequential.
 *
 *  "Storyboard is nothing but script with visual directions"
 *  (Maalik, 2026-09-09), so a script that gains visuals comes
 *  back as STORYBOARDS. `flow.outputKind` decides it; this
 *  band states it in the stage where the user makes that
 *  choice, and the rail says it again before they buy.
 * ────────────────────────────────────────────────────────── */
function OutputBand({
  analysis,
  outputKind,
  count,
  visualsRequested,
}: {
  analysis: AssetAnalysis;
  outputKind: AssetOutputKind;
  count: number;
  /** True when a quick action or a manual edit is adding the visuals. */
  visualsRequested: boolean;
}) {
  const Icon = OUTPUT_ICON[outputKind];
  const becomesStoryboard =
    analysis.assetKind === "script" && outputKind === "storyboard" && !analysis.hasVisuals;
  const body = becomesStoryboard
    ? "You asked for visuals, and a storyboard is exactly this script plus a look for every beat — so that is what comes back, not scripts."
    : analysis.assetKind === "script"
      ? "Add visuals — from the suggestion here or by editing Visual Direction below — and they come back as storyboards instead."
      : analysis.assetKind === "storyboard"
        ? "Visuals are what makes a storyboard a storyboard, so they stay. You can re-direct them; you can't take them off."
        : "A concept stays a concept. Visuals here change the look, not what the run produces.";

  return (
    <div
      className={cn(
        "mb-3 flex items-start gap-2.5 rounded-g6-card border px-3 py-2.5",
        becomesStoryboard
          ? "border-g6-primary-border bg-g6-primary-bg"
          : "border-g6-border bg-g6-bg-muted",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          becomesStoryboard ? "text-g6-primary" : "text-g6-text-tertiary",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-g6-sm font-semibold leading-tight text-g6-text">
          Coming back as {count} {plural(outputKind, count)}
          {visualsRequested && becomesStoryboard ? " — because you're adding visuals" : ""}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-g6-text-secondary">{body}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  The screen
 * ────────────────────────────────────────────────────────── */

export function VariationsFlowA({ flow }: VariationsFlowAProps) {
  const { state, family, analysis, assetAnalysis, recommendations, credits } = flow;
  const { count, picked } = state;

  /** Which element the manual drawer is open on — either family's id. */
  const [openElement, setOpenElement] = useState<AnyElementId | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  /**
   * The source the user confirmed a count for. Comparing it to the live source
   * key is what makes stage 2 a gate: a new pick re-arms it automatically, for
   * an ad and an asset alike.
   */
  const [analysedKey, setAnalysedKey] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingSourceChange | null>(null);
  /** The entity control, so an "attach an entity" suggestion can reach it. */
  const entitySectionRef = useRef<HTMLDivElement | null>(null);

  const isAsset = family === "asset";
  /** The live analysis, whichever family. Both carry `source`. */
  const live = analysis ?? assetAnalysis;
  const assetKind = assetAnalysis?.assetKind ?? null;
  /** "ad" / "script" — every noun on screen follows the source. */
  const sourceNoun = assetKind ? ASSET_NOUN[assetKind] : "ad";

  const countAnswered = !!picked && analysedKey === sourceKey(picked);
  const showAnalysis = countAnswered && !!live;

  const entityRows = entityRowsOf(state.entity);
  const entityAttached = entityRows.length > 0;
  const visualsRequested = flow.touchedElements.includes("visual-direction");

  /** Elements the manual grid offers. Entity has a real control, not a prompt. */
  const assetGridElements = flow.assetElements.filter((def) => def.id !== "entity");

  const openAdDef = openElement && !isAsset ? adElementFor(openElement) : null;
  const openAssetDef = openElement && isAsset ? assetElementFor(openElement) : null;
  const openLabel = openAdDef?.label ?? openAssetDef?.label ?? null;

  /** An element's label, resolved in whichever registry is live. */
  function labelOf(id: AnyElementId): string {
    const def = isAsset ? assetElementFor(id) : adElementFor(id);
    return def?.label ?? id;
  }

  /** Reads how an element will actually be applied, for the run summary. */
  function statusOf(id: AnyElementId): string | null {
    if (flow.isQuickAction(id)) return `Recommended · all ${count}`;
    const edit = flow.editFor(id);
    if (!edit) return null;
    if (edit.scope === "all") return `Manual · all ${count}`;
    if (edit.scope === "multiple") {
      const n = edit.variationIndexes?.length ?? 0;
      return n === 0 ? "Manual · no variations picked" : `Manual · ${n} of ${count}`;
    }
    return "Manual · one by one";
  }

  /**
   * The spine clears every quick action, manual edit AND the attached entity
   * when `picked` changes, because they were all chosen against the old
   * source's analysis. That's correct, so it is warned about rather than
   * worked around.
   */
  const applySourceChange = (change: PendingSourceChange) => {
    setOpenElement(null);
    if (change.kind === "clear") flow.clearSource();
    else flow.pick(change.picked);
  };

  const requestSourceChange = (change: PendingSourceChange) => {
    if (!flow.hasChanges && !entityAttached) {
      applySourceChange(change);
      return;
    }
    setPendingSource(change);
  };

  const revealEntityControl = () => {
    const node = entitySectionRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.focus();
  };

  const droppedLabels = [
    ...flow.touchedElements.map(labelOf),
    ...entityRows.map((r) => `the ${r.kind.toLowerCase()} you attached (${r.name})`),
  ];

  const blockedReason = !picked
    ? "Pick an ad or an asset first."
    : !countAnswered
      ? `Say how many variations you want, then Genie reads the ${sourceNoun}.`
      : credits.overdrawn
        ? `This run needs ${creditsLabel(credits.total)} and only ${formatCredits(
            CREDITS_REMAINING,
          )} are left. Drop a variation or an element change.`
        : null;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-6 font-g6-sans text-g6-text">
      {/* ------------------------------------------------------------ header */}
      <header className="mb-6 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-g6-base border border-g6-primary-border bg-g6-primary-bg">
          <Layers className="h-4 w-4 text-g6-primary" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-g6-sans text-g6-h4 font-semibold leading-tight text-g6-text">
            Generate Variations
          </h1>
          <p className="mt-1 max-w-2xl text-g6-sm text-g6-text-secondary">
            Take one whole ad — or one script, concept or storyboard — that already
            works, and make more of it. Genie reads the source first and tells you
            what it found, so you only change what you mean to.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        {/* ============================================================ main */}
        <div className="flex flex-col gap-7">
          {/* -------------------------------------------------- 1 · source */}
          <Stage
            n={1}
            title={picked ? `The ${sourceNoun} you're varying` : "What you're varying"}
            hint={
              picked
                ? undefined
                : "One whole ad, or one asset — a script, a concept or a storyboard."
            }
          >
            <SourcePicker
              picked={picked}
              onPick={(p) => requestSourceChange({ kind: "pick", picked: p })}
              onClear={() => requestSourceChange({ kind: "clear" })}
            />
          </Stage>

          {/* Zero-data — the screen's first impression. Not an empty shell:
              it names BOTH families and what each produces, then states the
              order the flow actually runs in — the one thing a single-screen
              flow can't show by layout alone. */}
          {!picked ? (
            <section className="ml-8 flex flex-col gap-4 rounded-g6-xl border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-4">
              <div>
                <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                  Two things can be varied
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1.5 text-g6-sm font-semibold leading-tight text-g6-text">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" aria-hidden />
                      A whole ad
                    </dt>
                    <dd className="text-g6-xs leading-snug text-g6-text-secondary">
                      Your own generations, an ad from another module, or a file you
                      upload. Comes back as more ads, priced per variation.
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-1.5 text-g6-sm font-semibold leading-tight text-g6-text">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" aria-hidden />
                      One asset
                    </dt>
                    <dd className="text-g6-xs leading-snug text-g6-text-secondary">
                      A script, a concept or a storyboard — saved, generated, pasted
                      or uploaded. Free, and a script that gains visuals comes back
                      as storyboards.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-g6-border pt-3">
                <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                  What happens after you pick
                </p>
                <ol className="mt-3 grid grid-cols-3 gap-4">
                  {[
                    {
                      n: 2,
                      title: "You say how many",
                      body: `Anything from ${COUNT_MIN} to ${COUNT_MAX}. Asked before anything is analysed, so the analysis already knows the size of the run.`,
                    },
                    {
                      n: 3,
                      title: "Genie reads it",
                      body: "Every row of what it found — angle, concept, language, the look — each marked stored, detected or not found.",
                    },
                    {
                      n: 4,
                      title: "You change nothing, or a little",
                      body: "Tap a suggested change and it applies to every variation. Or open one element and write the instruction yourself.",
                    },
                  ].map((s) => (
                    <li key={s.n} className="flex flex-col gap-1">
                      <span className="font-g6-mono text-[10px] font-bold tabular-nums text-g6-primary">
                        {s.n}
                      </span>
                      <span className="text-g6-sm font-semibold leading-tight text-g6-text">
                        {s.title}
                      </span>
                      <span className="text-g6-xs leading-snug text-g6-text-secondary">
                        {s.body}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}

          {/* --------------------------------------------------- 2 · count */}
          {picked ? (
            <Stage
              n={2}
              title="How many variations?"
              hint={
                countAnswered
                  ? "Change it any time — the cost and every per-variation edit follow it."
                  : `Between ${COUNT_MIN} and ${COUNT_MAX}. Asked before the analysis, on purpose.`
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="variation-count" className="sr-only">
                  Number of variations
                </label>
                <CountStepper
                  value={count}
                  onChange={flow.setCount}
                  min={COUNT_MIN}
                  max={COUNT_MAX}
                />
                <span className="text-g6-sm text-g6-text-secondary">
                  {count === 1 ? "1 variation" : `${count} variations`} of this {sourceNoun}
                </span>
                {!countAnswered ? (
                  <Button
                    type="button"
                    onClick={() => setAnalysedKey(sourceKey(picked))}
                    className="h-9 gap-1.5 bg-g6-primary px-4 text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover focus-visible:ring-g6-primary-border"
                  >
                    {/* "Read the ad" is wrong for a script. The verb is the
                        same; the noun follows the source. */}
                    Read the {sourceNoun}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </Stage>
          ) : null}

          {/* ------------------------------------------------ 3 · analysis */}
          {showAnalysis ? (
            <Stage
              n={3}
              title="What Genie found in it"
              hint="Read it before you change anything — a Detected value is derived, not stored."
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-expanded={analysisOpen}
                  aria-controls="variations-analysis"
                  onClick={() => setAnalysisOpen((v) => !v)}
                  className="h-7 shrink-0 gap-1 px-2 text-g6-xs text-g6-text-secondary hover:bg-g6-bg-muted hover:text-g6-text"
                >
                  {analysisOpen ? "Collapse" : "Expand"}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", analysisOpen && "rotate-180")}
                    aria-hidden
                  />
                </Button>
              }
            >
              <div id="variations-analysis" hidden={!analysisOpen}>
                {assetAnalysis ? (
                  <AssetAnalysisOverview analysis={assetAnalysis} />
                ) : analysis ? (
                  <AnalysisOverview analysis={analysis} />
                ) : null}
              </div>
            </Stage>
          ) : null}

          {/* ------------------------------------------ 4 · recommendations */}
          {showAnalysis ? (
            <Stage
              n={4}
              title={`Suggested changes for this ${sourceNoun}`}
              hint={`Each one applies to all ${count}, and asks nothing. Tap more than one — they stack.`}
            >
              {/* The consequence, stated where the choice is made. */}
              {assetAnalysis && flow.outputKind ? (
                <OutputBand
                  analysis={assetAnalysis}
                  outputKind={flow.outputKind}
                  count={count}
                  visualsRequested={visualsRequested}
                />
              ) : null}

              {recommendations.length === 0 ? (
                <p className="rounded-g6-base border border-g6-border bg-g6-bg-muted px-3 py-2.5 text-g6-sm text-g6-text-secondary">
                  Too little was readable off this {sourceNoun} to suggest anything
                  honestly. Pick an element below and write the change yourself.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {recommendations.map((rec) => {
                    const def = isAsset
                      ? assetElementFor(rec.element)
                      : adElementFor(rec.element);
                    if (!def) return null;
                    const on = flow.isQuickAction(rec.element);
                    const manual = !!flow.editFor(rec.element);
                    /* Entity is a CONTROL, not a quick action: Genie already
                       infers one on Auto, so "let Genie pick" would be a no-op
                       chip. This card sends the user to the real control. */
                    const isEntity = isAsset && rec.element === "entity";
                    const makesStoryboards =
                      isAsset &&
                      rec.element === "visual-direction" &&
                      assetAnalysis?.assetKind === "script" &&
                      !assetAnalysis.hasVisuals;
                    return (
                      <button
                        key={rec.element}
                        type="button"
                        aria-pressed={isEntity ? undefined : on}
                        onClick={
                          isEntity ? revealEntityControl : () => flow.toggleQuickAction(rec.element)
                        }
                        className={cn(
                          "flex items-start gap-2.5 rounded-g6-card border p-3 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
                          on && !isEntity
                            ? "border-g6-primary-border bg-g6-primary-bg"
                            : "border-g6-border bg-g6-bg-container hover:border-g6-primary-border hover:bg-g6-bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-g6-sm",
                            on && !isEntity ? "bg-g6-primary/15" : "bg-g6-bg-muted",
                          )}
                        >
                          <def.Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              on && !isEntity ? "text-g6-primary" : "text-g6-text-secondary",
                            )}
                            aria-hidden
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-g6-sm font-semibold leading-tight text-g6-text">
                              {rec.label}
                            </span>
                            {on && !isEntity ? (
                              <span className="shrink-0 rounded-g6-pill bg-g6-primary px-1.5 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-on-accent">
                                On
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-g6-xs leading-snug text-g6-text-secondary">
                            {rec.reason}
                          </span>
                          {makesStoryboards ? (
                            <span className="mt-1.5 block text-[11px] font-semibold leading-4 text-g6-primary">
                              Turns the run&apos;s output into {plural("storyboard", count)}.
                            </span>
                          ) : null}
                          {isEntity ? (
                            <span className="mt-1.5 block text-[11px] leading-4 text-g6-text-tertiary">
                              Opens the Brand / Product / Category control below — Genie
                              can&apos;t pick who this is for.
                            </span>
                          ) : null}
                          {manual && !isEntity ? (
                            <span className="mt-1.5 block text-g6-xs text-warning-text">
                              You wrote this one by hand below — tapping this replaces
                              your instruction.
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Stage>
          ) : null}

          {/* ------------------------------------------ 5 · manual editing */}
          {showAnalysis ? (
            <Stage
              n={5}
              title="Or change an element yourself"
              hint="Opens the scope question — all, some, or one by one — then the instruction as editable text."
            >
              {/* ------------------------------------------------ the AD grid */}
              {analysis ? (
                <div className="grid grid-cols-3 gap-2">
                  {VARIATION_ELEMENTS.map((def) => {
                    const status = statusOf(def.id);
                    const touched = !!status;
                    const detected = fieldText(analysis[def.field]);
                    return (
                      <button
                        key={def.id}
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => setOpenElement(def.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-g6-base border p-2.5 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
                          touched
                            ? "border-g6-primary-border bg-g6-primary-bg"
                            : "border-g6-border bg-g6-bg-container hover:border-g6-primary-border hover:bg-g6-bg-muted",
                        )}
                      >
                        <def.Icon
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            touched ? "text-g6-primary" : "text-g6-text-tertiary",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-g6-sm font-semibold leading-tight text-g6-text">
                            {def.label}
                          </span>
                          <span
                            title={detected}
                            className="mt-0.5 block truncate text-g6-xs text-g6-text-secondary"
                          >
                            {detected}
                          </span>
                          {status ? (
                            <span className="mt-1 block truncate font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary">
                              {status}
                            </span>
                          ) : null}
                        </span>
                        <Pencil
                          className="mt-0.5 h-3 w-3 shrink-0 text-g6-text-tertiary"
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* --------------------------------------------- the ASSET grid */}
              {/* Only what the kind can actually carry (`flow.assetElements`):
                  no framework on a concept, and no "rewrite the text" — the
                  body is deliberately not varyable. */}
              {assetAnalysis ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {assetGridElements.map((def) => {
                      const status = statusOf(def.id);
                      const touched = !!status;
                      const detected = fieldText(assetAnalysis[def.field]);
                      const mandatory = isMandatoryFor(def.id, assetAnalysis.assetKind);
                      return (
                        <button
                          key={def.id}
                          type="button"
                          aria-haspopup="dialog"
                          onClick={() => setOpenElement(def.id)}
                          className={cn(
                            "flex items-start gap-2.5 rounded-g6-base border p-2.5 text-left transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
                            touched
                              ? "border-g6-primary-border bg-g6-primary-bg"
                              : "border-g6-border bg-g6-bg-container hover:border-g6-primary-border hover:bg-g6-bg-muted",
                          )}
                        >
                          <def.Icon
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              touched ? "text-g6-primary" : "text-g6-text-tertiary",
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="min-w-0 truncate text-g6-sm font-semibold leading-tight text-g6-text">
                                {assetActionLabel(def.id, assetAnalysis)}
                              </span>
                              {mandatory ? (
                                <span
                                  title="Required on a storyboard — changeable, never removable"
                                  className="inline-flex shrink-0 items-center gap-0.5 rounded-g6-pill border border-g6-border bg-g6-bg-muted px-1 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-tertiary"
                                >
                                  <Lock className="h-2.5 w-2.5" aria-hidden />
                                  Required
                                </span>
                              ) : null}
                            </span>
                            <span
                              title={detected}
                              className="mt-0.5 block truncate text-g6-xs text-g6-text-secondary"
                            >
                              {detected}
                            </span>
                            {status ? (
                              <span className="mt-1 block truncate font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary">
                                {status}
                              </span>
                            ) : null}
                          </span>
                          <Pencil
                            className="mt-0.5 h-3 w-3 shrink-0 text-g6-text-tertiary"
                            aria-hidden
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Entity — the fifth element, and the one that is a control
                      rather than a prompt. Optional throughout: add, remove or
                      change it, and empty means Auto. */}
                  <div ref={entitySectionRef} tabIndex={-1} className="focus:outline-none">
                    <EntityControl
                      value={state.entity}
                      onChange={flow.setEntity}
                      detectedLabel={assetAnalysis.entityName.value}
                      detectedIsCompetitor={assetAnalysis.source.competitorOwned}
                    />
                  </div>
                </div>
              ) : null}
            </Stage>
          ) : null}
        </div>

        {/* ============================================================ rail */}
        {/* Stage 6 lives here, in view the whole way down: one place that says
            what the run is and what it costs before you buy it. */}
        <aside className="sticky top-6 flex flex-col gap-3 rounded-g6-xl border border-g6-border bg-g6-bg-container p-4">
          <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
            This run
          </p>

          {!picked ? (
            <p className="text-g6-sm leading-snug text-g6-text-secondary">
              Nothing to price yet. Pick the ad or the asset you want to vary and
              what the run produces — and what it costs — appears here.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                {/* An asset run is named by what it PRODUCES, because that is
                    the thing the visuals decision changes. */}
                <p className="text-g6-base font-semibold leading-tight text-g6-text">
                  {flow.outputKind
                    ? `${count} ${plural(flow.outputKind, count)}`
                    : count === 1
                      ? "1 variation"
                      : `${count} variations`}
                </p>
                <p className="truncate text-g6-xs text-g6-text-secondary" title={live?.source.title}>
                  from {live?.source.title ?? `the picked ${sourceNoun}`}
                </p>
                <p className="text-g6-xs text-g6-text-tertiary">{live?.source.originLabel}</p>
                {assetAnalysis && flow.outputKind === "storyboard" && !assetAnalysis.hasVisuals ? (
                  <p className="mt-1 flex items-start gap-1.5 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-2 py-1.5 text-[11px] font-medium leading-4 text-g6-text">
                    <Clapperboard className="mt-px h-3 w-3 shrink-0 text-g6-primary" aria-hidden />
                    <span>
                      Adding visuals to a script means it comes back as{" "}
                      {plural("storyboard", count)}, not scripts.
                    </span>
                  </p>
                ) : null}
              </div>

              {/* Asset runs only — who the variations are for. Auto is a real
                  answer, so it is stated rather than left blank. */}
              {isAsset ? (
                <div className="flex flex-col gap-1.5 border-t border-g6-border-secondary pt-3">
                  <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                    Made for
                  </p>
                  {!entityAttached ? (
                    <p className="text-g6-xs leading-snug text-g6-text-secondary">
                      <span className="font-semibold text-g6-text">Auto</span> — nothing
                      attached, so generation infers the brand, product or category from
                      the source.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {entityRows.map((row) => (
                        <li key={`${row.kind}-${row.name}`} className="min-w-0">
                          <span className="block font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
                            {row.kind}
                          </span>
                          <span
                            title={row.name}
                            className="block truncate text-g6-xs font-semibold leading-tight text-g6-text"
                          >
                            {row.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {/* What's actually being changed — quick actions and manual edits
                  in one list, since the user has to buy them as one run. */}
              <div className="flex flex-col gap-1.5 border-t border-g6-border-secondary pt-3">
                <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                  Changing
                </p>
                {!flow.hasChanges ? (
                  <p className="flex items-start gap-1.5 text-g6-xs leading-snug text-g6-text-secondary">
                    <Copy className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    <span>
                      No element named. Genie varies the {sourceNoun} as it stands —
                      that&apos;s a valid run, not an unfinished one.
                    </span>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {flow.touchedElements.map((id) => {
                      const def = isAsset ? assetElementFor(id) : adElementFor(id);
                      if (!def) return null;
                      return (
                        <li key={id} className="flex items-start gap-2">
                          <def.Icon
                            className="mt-0.5 h-3 w-3 shrink-0 text-g6-primary"
                            aria-hidden
                          />
                          <span className="min-w-0">
                            <span className="block text-g6-xs font-semibold leading-tight text-g6-text">
                              {def.label}
                            </span>
                            <span className="block text-g6-xs leading-tight text-g6-text-secondary">
                              {statusOf(id)}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Cost — the lines, never just the number (§21.2). A free run has
                  no lines and no total BY DESIGN, so it says so in words rather
                  than rendering an empty table under a "0 credits" total. */}
              <div className="flex flex-col gap-1.5 border-t border-g6-border-secondary pt-3">
                <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                  Cost
                </p>
                {flow.free ? (
                  <>
                    <p className="flex items-start gap-1.5 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-2.5 py-2 text-[11px] leading-4 text-g6-text">
                      <Gift className="mt-px h-3 w-3 shrink-0 text-g6-primary" aria-hidden />
                      <span>
                        <span className="font-semibold">Free.</span> Varying an asset
                        doesn&apos;t use credits — however many you ask for, and whatever
                        you change.
                      </span>
                    </p>
                    <p className="text-g6-xs text-g6-text-tertiary">
                      Your balance stays at {formatCredits(CREDITS_REMAINING)}.
                    </p>
                  </>
                ) : (
                  <>
                    {credits.lines.map((line, i) => (
                      <div
                        key={`${line.label}-${i}`}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="min-w-0 truncate text-g6-xs text-g6-text-secondary">
                          {line.label}
                          {line.note ? ` · ${line.note}` : ""}
                        </span>
                        <span className="shrink-0 font-g6-mono text-g6-xs tabular-nums text-g6-text">
                          {line.op === "base" ? line.factor : `× ${line.factor}`}
                        </span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-g6-border-secondary pt-2">
                      <span className="text-g6-sm font-semibold text-g6-text">Total</span>
                      <span
                        className={cn(
                          /* `text-[14px] leading-[22px]` and not the `text-g6-base`
                             token (same values) ON PURPOSE: tailwind-merge can't
                             tell a custom `text-g6-*` key is a size, files it under
                             text-COLOR, and the conditional colour below then wins
                             and deletes it — the total silently renders at 16px. */
                          "font-g6-mono text-[14px] leading-[22px] font-semibold tabular-nums",
                          credits.overdrawn ? "text-warning-text" : "text-g6-text",
                        )}
                      >
                        {creditsLabel(credits.total)}
                      </span>
                    </div>
                    <p className="text-g6-xs text-g6-text-tertiary">
                      {formatCredits(CREDITS_REMAINING)} left in your balance
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 border-t border-g6-border-secondary pt-3">
            <Button
              type="button"
              onClick={flow.generate}
              disabled={!flow.canGenerate || !countAnswered}
              className="h-10 w-full gap-1.5 bg-g6-primary text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover focus-visible:ring-g6-primary-border"
            >
              <Wand2 className="h-3.5 w-3.5" aria-hidden />
              {picked && countAnswered
                ? `Generate ${count} · ${flow.free ? "Free" : creditsLabel(credits.total)}`
                : "Generate"}
            </Button>
            {blockedReason ? (
              <p
                className={cn(
                  /* `text-[11px]` not `text-g6-xs` — see the note on the total above. */
                  "text-[11px] leading-snug",
                  credits.overdrawn ? "text-warning-text" : "text-g6-text-secondary",
                )}
              >
                {blockedReason}
              </p>
            ) : (
              <p className="flex items-start gap-1.5 text-g6-xs leading-snug text-g6-text-tertiary">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                <span>Generating leaves this page for the run queue.</span>
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------- manual edit drawer */}
      {/* SheetContent already prevents outside-click dismiss and ships the only
          close control, per the app-wide rule. */}
      <Sheet
        open={!!openElement}
        onOpenChange={(open) => {
          if (!open) setOpenElement(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-[560px] flex-col gap-0 border-g6-border bg-g6-bg-container p-0 sm:max-w-none"
        >
          <SheetHeader className="shrink-0 space-y-1 border-b border-g6-border px-5 py-3.5 pr-14 text-left">
            <SheetTitle className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
              Manual edit
            </SheetTitle>
            <SheetDescription className="text-g6-xs text-g6-text-secondary">
              Nothing here leaves the page — close this and the rest of your run is
              exactly where you left it.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {openAdDef && analysis ? (
              <ElementEditor
                def={openAdDef}
                count={count}
                seed={openAdDef.promptFrom(analysis)}
                detected={analysis[openAdDef.field]}
                edit={flow.editFor(openAdDef.id)}
                onBeginEdit={flow.beginEdit}
                onScopeChange={flow.setEditScope}
                onPromptChange={flow.setEditPrompt}
                onIndexesChange={flow.setEditIndexes}
                onPromptForIndexChange={flow.setEditPromptForIndex}
                onCancel={(element) => {
                  flow.cancelEdit(element);
                  setOpenElement(null);
                }}
              />
            ) : null}
            {openAssetDef && assetAnalysis ? (
              <div className="flex flex-col gap-4">
                {/* The consequence again, at the moment of writing it. */}
                {openAssetDef.id === "visual-direction" &&
                assetAnalysis.assetKind === "script" &&
                !assetAnalysis.hasVisuals ? (
                  <p className="flex items-start gap-1.5 rounded-g6-base border border-g6-primary-border bg-g6-primary-bg px-3 py-2 text-xs leading-snug text-g6-text">
                    <Clapperboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden />
                    <span>
                      Writing a visual direction here turns this run&apos;s output into{" "}
                      {plural("storyboard", count)} — a storyboard is this script plus a
                      look for every beat.
                    </span>
                  </p>
                ) : null}
                <ElementEditor
                  def={openAssetDef}
                  count={count}
                  seed={openAssetDef.promptFrom(assetAnalysis)}
                  detected={assetAnalysis[openAssetDef.field]}
                  edit={flow.editFor(openAssetDef.id)}
                  title={assetActionLabel(openAssetDef.id, assetAnalysis)}
                  mandatory={isMandatoryFor(openAssetDef.id, assetAnalysis.assetKind)}
                  mandatoryNote={
                    <>
                      Required on a storyboard. You can re-direct the look for every beat
                      — you can&apos;t take the visuals off, or it stops being a
                      storyboard.
                    </>
                  }
                  onBeginEdit={flow.beginEdit}
                  onScopeChange={flow.setEditScope}
                  onPromptChange={flow.setEditPrompt}
                  onIndexesChange={flow.setEditIndexes}
                  onPromptForIndexChange={flow.setEditPromptForIndex}
                  onCancel={(element) => {
                    flow.cancelEdit(element);
                    setOpenElement(null);
                  }}
                />
              </div>
            ) : null}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-g6-border px-5 py-3">
            <p className="min-w-0 truncate text-g6-xs text-g6-text-secondary">
              {openElement && statusOf(openElement)
                ? statusOf(openElement)
                : openLabel
                  ? `${openLabel} is unchanged so far`
                  : ""}
            </p>
            <Button
              type="button"
              onClick={() => setOpenElement(null)}
              className="h-9 shrink-0 bg-g6-primary px-4 text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover focus-visible:ring-g6-primary-border"
            >
              Done
            </Button>
          </footer>
        </SheetContent>
      </Sheet>

      {/* ---------------------- source change = the one destructive act */}
      <AlertDialog
        open={!!pendingSource}
        onOpenChange={(open) => {
          if (!open) setPendingSource(null);
        }}
      >
        <AlertDialogContent className="border-g6-border bg-g6-bg-elevated">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-g6-sans text-g6-text">
              Changing the source clears your changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-g6-text-secondary">
              {droppedLabels.length === 1
                ? `Your change to ${droppedLabels[0]} was made against this ${sourceNoun}'s analysis.`
                : `Your changes to ${joinList(droppedLabels)} were made against this ${sourceNoun}'s analysis.`}{" "}
              A different source reads differently, so they can&apos;t carry over and
              will be dropped. Your count of {count} stays, and Genie reads the new
              source once you confirm it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSource(null)}>
              Keep this {sourceNoun}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSource) applySourceChange(pendingSource);
                setPendingSource(null);
              }}
            >
              Change the source
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default VariationsFlowA;
