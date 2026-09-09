import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Copy,
  Layers,
  Pencil,
  Sparkles,
  Wand2,
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
import { CREDITS_REMAINING, creditsLabel, formatCredits } from "../lib/credits";
import { AnalysisOverview } from "./components/AnalysisOverview";
import { ElementEditor } from "./components/ElementEditor";
import { SourcePicker } from "./components/SourcePicker";
import { VARIATION_ELEMENTS, getVariationElement } from "./data/variationElements";
import {
  COUNT_MAX,
  COUNT_MIN,
  type UseVariationsFlowReturn,
} from "./state/useVariationsFlow";
import type {
  AdAnalysis,
  PickedSource,
  VariationElementDef,
  VariationElementId,
} from "./types";

/**
 * Version A — Generate Variations as ONE inline screen.
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
 *   · Manual editing opens in a right drawer. ElementEditor at "individual"
 *     scope with N=20 is a chip rail plus a textarea plus notices; inline that
 *     would shove the run summary and Generate off-screen and reflow the page
 *     on every scope change. The drawer keeps the one screen dimensionally
 *     still. It never dismisses on outside click — SheetContent enforces that.
 *
 * Owns no rules: every decision it renders comes off `flow`.
 */

interface VariationsFlowAProps {
  flow: UseVariationsFlowReturn;
}

/** What a source change is about to destroy, held until the user confirms. */
type PendingSourceChange =
  | { kind: "clear" }
  | { kind: "pick"; picked: PickedSource };

/** Kind-scoped, because an output id and a flow-ref id can be the same string. */
function sourceKey(picked: PickedSource): string {
  if (picked.kind === "genie-output") return `genie-output:${picked.output.id}`;
  if (picked.kind === "flow-ref") return `flow-ref:${picked.ref.id}`;
  return `upload:${picked.file.id}`;
}

/** What the analysis found for the row an element edits. Never a fabricated value. */
function detectedText(analysis: AdAnalysis, def: VariationElementDef): string {
  const field = analysis[def.field];
  if (!field || field.provenance === "not-found" || !field.value) return "N/F";
  return String(field.value);
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

export function VariationsFlowA({ flow }: VariationsFlowAProps) {
  const { state, analysis, recommendations, credits } = flow;
  const { count, picked } = state;

  /** Which element the manual drawer is open on. */
  const [openElement, setOpenElement] = useState<VariationElementId | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  /**
   * The source the user confirmed a count for. Comparing it to the live source
   * key is what makes stage 2 a gate: a new pick re-arms it automatically.
   */
  const [analysedKey, setAnalysedKey] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<PendingSourceChange | null>(null);

  const countAnswered = !!picked && analysedKey === sourceKey(picked);
  const showAnalysis = countAnswered && !!analysis;

  const openDef = openElement ? getVariationElement(openElement) : null;

  /** Reads how an element will actually be applied, for the run summary. */
  function statusOf(id: VariationElementId): string | null {
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
   * The spine clears every quick action and manual edit when `picked` changes,
   * because they were made against the old ad's analysis. That's correct, so it
   * is warned about rather than worked around.
   */
  const applySourceChange = (change: PendingSourceChange) => {
    setOpenElement(null);
    if (change.kind === "clear") flow.clearSource();
    else flow.pick(change.picked);
  };

  const requestSourceChange = (change: PendingSourceChange) => {
    if (!flow.hasChanges) {
      applySourceChange(change);
      return;
    }
    setPendingSource(change);
  };

  const touchedLabels = flow.touchedElements.map((id) => getVariationElement(id).label);

  const blockedReason = !picked
    ? "Pick a source ad first."
    : !countAnswered
      ? "Say how many variations you want, then Genie reads the ad."
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
            Take one ad that already works and make more of it. Genie reads the ad
            first and tells you what it found, so you only change what you mean to.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        {/* ============================================================ main */}
        <div className="flex flex-col gap-7">
          {/* -------------------------------------------------- 1 · source */}
          <Stage
            n={1}
            title="The ad you're varying"
            hint={
              picked
                ? undefined
                : "One whole ad — your own generations, an ad from another module, or a file."
            }
          >
            <SourcePicker
              picked={picked}
              onPick={(p) => requestSourceChange({ kind: "pick", picked: p })}
              onClear={() => requestSourceChange({ kind: "clear" })}
            />
          </Stage>

          {/* Zero-data — the screen's first impression. Not an empty shell:
              it states the order the flow actually runs in, which is the one
              thing a single-screen flow can't show by layout alone. */}
          {!picked ? (
            <section className="ml-8 rounded-g6-xl border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-4">
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
                    title: "Genie reads the ad",
                    body: "Ten rows of what it found — type, angle, avatar, voice, script, ratio — each marked stored, detected or not found.",
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
                  {count === 1 ? "1 variation" : `${count} variations`} of this ad
                </span>
                {!countAnswered ? (
                  <Button
                    type="button"
                    onClick={() => setAnalysedKey(sourceKey(picked))}
                    className="h-9 gap-1.5 bg-g6-primary px-4 text-g6-sm font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover focus-visible:ring-g6-primary-border"
                  >
                    Read the ad
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
                <AnalysisOverview analysis={analysis} />
              </div>
            </Stage>
          ) : null}

          {/* ------------------------------------------ 4 · recommendations */}
          {showAnalysis ? (
            <Stage
              n={4}
              title="Suggested changes for this ad"
              hint={`Each one applies to all ${count}, and asks nothing. Tap more than one — they stack.`}
            >
              {recommendations.length === 0 ? (
                <p className="rounded-g6-base border border-g6-border bg-g6-bg-muted px-3 py-2.5 text-g6-sm text-g6-text-secondary">
                  Too little was readable off this ad to suggest anything honestly.
                  Pick an element below and write the change yourself.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {recommendations.map((rec) => {
                    const def = getVariationElement(rec.element);
                    const on = flow.isQuickAction(rec.element);
                    const manual = !!flow.editFor(rec.element);
                    return (
                      <button
                        key={rec.element}
                        type="button"
                        aria-pressed={on}
                        onClick={() => flow.toggleQuickAction(rec.element)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-g6-card border p-3 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
                          on
                            ? "border-g6-primary-border bg-g6-primary-bg"
                            : "border-g6-border bg-g6-bg-container hover:border-g6-primary-border hover:bg-g6-bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-g6-sm",
                            on ? "bg-g6-primary/15" : "bg-g6-bg-muted",
                          )}
                        >
                          <def.Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              on ? "text-g6-primary" : "text-g6-text-secondary",
                            )}
                            aria-hidden
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-g6-sm font-semibold leading-tight text-g6-text">
                              {rec.label}
                            </span>
                            {on ? (
                              <span className="shrink-0 rounded-g6-pill bg-g6-primary px-1.5 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-on-accent">
                                On
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-g6-xs leading-snug text-g6-text-secondary">
                            {rec.reason}
                          </span>
                          {manual ? (
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
              <div className="grid grid-cols-3 gap-2">
                {VARIATION_ELEMENTS.map((def) => {
                  const status = statusOf(def.id);
                  const touched = !!status;
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
                          title={detectedText(analysis, def)}
                          className="mt-0.5 block truncate text-g6-xs text-g6-text-secondary"
                        >
                          {detectedText(analysis, def)}
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
              Nothing to price yet. Pick the ad you want to vary and the cost
              appears here, broken down.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-g6-base font-semibold leading-tight text-g6-text">
                  {count === 1 ? "1 variation" : `${count} variations`}
                </p>
                <p className="truncate text-g6-xs text-g6-text-secondary" title={analysis?.source.title}>
                  of {analysis?.source.title ?? "the picked ad"}
                </p>
                <p className="text-g6-xs text-g6-text-tertiary">
                  {analysis?.source.originLabel}
                </p>
              </div>

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
                      No element named. Genie varies the ad as it stands — that&apos;s a
                      valid run, not an unfinished one.
                    </span>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {flow.touchedElements.map((id) => {
                      const def = getVariationElement(id);
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

              {/* Credits — the lines, never just the number (§21.2). */}
              <div className="flex flex-col gap-1.5 border-t border-g6-border-secondary pt-3">
                <p className="font-g6-mono text-[9px] font-bold uppercase tracking-[0.12em] text-g6-text-tertiary">
                  Cost
                </p>
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
                      "font-g6-mono text-g6-base font-semibold tabular-nums",
                      credits.overdrawn ? "text-warning-text" : "text-g6-text",
                    )}
                  >
                    {creditsLabel(credits.total)}
                  </span>
                </div>
                <p className="text-g6-xs text-g6-text-tertiary">
                  {formatCredits(CREDITS_REMAINING)} left in your balance
                </p>
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
                ? `Generate ${count} · ${creditsLabel(credits.total)}`
                : "Generate"}
            </Button>
            {blockedReason ? (
              <p
                className={cn(
                  "text-g6-xs leading-snug",
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
            {openElement && analysis ? (
              <ElementEditor
                element={openElement}
                count={count}
                analysis={analysis}
                edit={flow.editFor(openElement)}
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
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-g6-border px-5 py-3">
            <p className="min-w-0 truncate text-g6-xs text-g6-text-secondary">
              {openElement && statusOf(openElement)
                ? statusOf(openElement)
                : openDef
                  ? `${openDef.label} is unchanged so far`
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
              {touchedLabels.length === 1
                ? `Your change to ${touchedLabels[0]} was made against this ad's analysis.`
                : `Your changes to ${touchedLabels.join(", ")} were made against this ad's analysis.`}{" "}
              A different ad reads differently, so they can&apos;t carry over and
              will be dropped. Your count of {count} stays, and Genie reads the new
              ad once you confirm it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSource(null)}>
              Keep this ad
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
