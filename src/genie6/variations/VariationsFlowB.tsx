import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Pencil,
  Plus,
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
  VariationEdit,
  VariationElementId,
} from "./types";

/**
 * VariationsFlowB — Generate Variations as a THREE-step flow.
 *
 * Why three and not two: the locked order asks for N *before* the analysis is
 * shown. A two-step split has to put count and analysis on the same screen
 * (which lets the eye read them together and quietly undoes that ordering) or
 * else pile analysis + recommendations + nine manual editors + credits into one
 * scroll — which is Version A with a prelude, not a stepped flow. Three steps
 * give each decision its own screen and keep the sequence honest:
 *
 *   1  Source & count      pick ONE ad, then how many variations
 *   2  What we found       the analysis overview + the contextual quick actions
 *   3  Review & generate   optional manual editing, the credit lines, Generate
 *
 * Steps are local to this component on purpose — useWizard's machine is a
 * closed 0-5 union with semantically hardcoded steps and none of them is one of
 * these. Every RULE still comes off the shared `flow` spine.
 */

interface VariationsFlowBProps {
  flow: UseVariationsFlowReturn;
}

type FlowStep = 1 | 2 | 3;

const STEPS: { id: FlowStep; label: string }[] = [
  { id: 1, label: "Source & count" },
  { id: 2, label: "What we found" },
  { id: 3, label: "Review & generate" },
];

/** What a source change is about to destroy, held until the user confirms. */
type PendingSourceChange =
  | { kind: "clear" }
  | { kind: "pick"; picked: PickedSource };

/* ------------------------------------------------------------------ helpers */

function detectedText(analysis: AdAnalysis, element: VariationElementId): string {
  const field = analysis[getVariationElement(element).field];
  if (!field || field.provenance === "not-found" || !field.value) return "N/F";
  return String(field.value);
}

/** How an edit's scope reads in a summary line. */
function scopeSummary(edit: VariationEdit, count: number): string {
  if (edit.scope === "all") return `all ${count}`;
  if (edit.scope === "individual") return `each of the ${count}, written one by one`;
  const n = edit.variationIndexes?.length ?? 0;
  return n === 0 ? "no variations yet" : `${n} of ${count}`;
}

/* ------------------------------------------------------------- step chrome */

/**
 * Breadcrumb chevrons in the house grammar (AlphaProgressIndicator): done steps
 * muted and clickable, current bold with a dot, future faint. Painted in g6
 * tokens because this flow only ever renders on a Genie route.
 */
function StepBreadcrumb({
  step,
  furthest,
  onJumpTo,
}: {
  step: FlowStep;
  /** The highest step reached, so a future step is never clickable. */
  furthest: FlowStep;
  onJumpTo: (step: FlowStep) => void;
}) {
  return (
    <nav aria-label="Generate Variations progress" className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isCurrent = s.id === step;
        const isDone = s.id < step;
        const canJump = s.id !== step && s.id <= furthest;
        return (
          <Fragment key={s.id}>
            {i > 0 && (
              <span aria-hidden className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                ›
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {isCurrent && (
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-g6-pill bg-g6-primary" />
              )}
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onJumpTo(s.id)}
                  className="rounded-g6-sm px-0.5 font-g6-sans text-g6-sm font-medium text-g6-text-secondary transition-colors hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                >
                  {s.label}
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "font-g6-sans text-g6-sm",
                    isCurrent
                      ? "font-bold text-g6-text"
                      : isDone
                        ? "font-medium text-g6-text-secondary"
                        : "font-medium text-g6-text-disabled",
                  )}
                >
                  {s.label}
                </span>
              )}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Shared step frame: eyebrow, title, one line of orientation, then content. */
function StepPanel({
  step,
  title,
  intro,
  children,
}: {
  step: FlowStep;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
          Step {step} of {STEPS.length}
        </p>
        <h2 className="font-g6-sans text-g6-h4 font-semibold text-g6-text">{title}</h2>
        <p className="max-w-2xl text-g6-sm text-g6-text-secondary">{intro}</p>
      </header>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------ count control */

/** Local equivalent of studio-v4's file-local NumberStepper, same 1-20 contract. */
function CountStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.max(COUNT_MIN, Math.min(COUNT_MAX, n));
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-1.5">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= COUNT_MIN}
        aria-label="One fewer variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <input
        id="variation-count"
        type="number"
        value={value}
        min={COUNT_MIN}
        max={COUNT_MAX}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        className="w-10 bg-transparent text-center font-g6-mono text-g6-base font-semibold tabular-nums text-g6-text outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= COUNT_MAX}
        aria-label="One more variation"
        className="inline-flex h-7 w-7 items-center justify-center rounded-g6-pill text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function WarnNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-g6-base border border-warning-text/30 bg-warning-text/10 px-2.5 py-2 text-g6-xs leading-snug text-warning-text">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** One recommended action. Stackable toggle — applies to all N, asks nothing. */
function QuickActionCard({
  actionLabel,
  reason,
  Icon,
  active,
  count,
  onToggle,
}: {
  actionLabel: string;
  reason: string;
  Icon: React.ElementType;
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-g6-card border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        active
          ? "border-g6-primary-border bg-g6-primary-bg"
          : "border-g6-border-secondary bg-g6-bg-container hover:border-g6-primary-border hover:shadow-g6-sm",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-g6-sm",
            active ? "bg-g6-primary text-g6-text-on-accent" : "bg-g6-bg-muted text-g6-text-secondary",
          )}
        >
          {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1 truncate font-g6-sans text-g6-base font-semibold text-g6-text">
          {actionLabel}
        </span>
      </span>
      {/* The reason is the whole point of these being contextual — never hide it. */}
      <span className="text-g6-xs leading-snug text-g6-text-secondary">{reason}</span>
      <span
        className={cn(
          "font-g6-mono text-[9px] uppercase tracking-[0.12em]",
          active ? "text-g6-primary" : "text-g6-text-tertiary",
        )}
      >
        {active ? `On · applies to all ${count}` : `Applies to all ${count} · no extra questions`}
      </span>
    </button>
  );
}

/** The charged total, always with the multipliers that produced it (§21.2). */
function CreditPanel({
  lines,
  total,
  overdrawn,
}: {
  lines: UseVariationsFlowReturn["credits"]["lines"];
  total: number;
  overdrawn: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-g6-card border border-g6-border bg-g6-bg-container p-3">
      <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
        What this run costs
      </p>
      <dl className="flex flex-col gap-1">
        {lines.map((l, i) => (
          <div key={`${l.label}-${i}`} className="flex items-baseline justify-between gap-4">
            <dt className="min-w-0 truncate text-g6-sm text-g6-text-secondary">
              {l.label}
              {l.note ? <span className="ml-1 text-g6-text-tertiary">({l.note})</span> : null}
            </dt>
            <dd className="shrink-0 font-g6-mono text-g6-sm tabular-nums text-g6-text">
              {l.op === "base" ? formatCredits(l.factor) : `× ${l.factor}`}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between gap-4 border-t border-g6-border-secondary pt-2">
        <dt className="font-g6-sans text-g6-base font-semibold text-g6-text">Total</dt>
        <dd
          className={cn(
            "font-g6-mono text-g6-base font-bold tabular-nums",
            overdrawn ? "text-warning-text" : "text-g6-text",
          )}
        >
          {creditsLabel(total)}
        </dd>
      </div>
      <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
        {formatCredits(CREDITS_REMAINING)} left on your balance
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- the flow */

export function VariationsFlowB({ flow }: VariationsFlowBProps) {
  const {
    state,
    pick,
    clearSource,
    setCount,
    analysis,
    recommendations,
    toggleQuickAction,
    isQuickAction,
    beginEdit,
    setEditScope,
    setEditPrompt,
    setEditIndexes,
    setEditPromptForIndex,
    cancelEdit,
    editFor,
    hasChanges,
    touchedElements,
    credits,
    canGenerate,
    generate,
  } = flow;

  const [rawStep, setRawStep] = useState<FlowStep>(1);
  const [furthest, setFurthest] = useState<FlowStep>(1);
  /** Rows opened for manual editing but still on the scope question. */
  const [manualOpen, setManualOpen] = useState<VariationElementId[]>([]);
  const [pending, setPending] = useState<PendingSourceChange | null>(null);

  // Clearing the source from a later step would leave the flow on a step that
  // has nothing to show, so the step is derived rather than trusted.
  const step: FlowStep = state.picked ? rawStep : 1;

  const goTo = (next: FlowStep) => {
    setRawStep(next);
    setFurthest((f) => (next > f ? next : f));
  };

  /** Stated reason forward is blocked, or null when it isn't. */
  const blockedReason: string | null = useMemo(() => {
    if (step === 1) {
      if (!state.picked) return "Pick the one ad you want to vary — everything after this reads off it.";
      return null;
    }
    if (step === 2) {
      if (!analysis) return "We couldn't read this ad. Go back and pick another source.";
      return null;
    }
    if (!state.picked) return "No source ad. Go back to step 1 and pick one.";
    if (credits.overdrawn) {
      return `This run costs ${creditsLabel(credits.total)} but only ${formatCredits(
        CREDITS_REMAINING,
      )} are left. Lower the count or drop a change.`;
    }
    return null;
  }, [step, state.picked, analysis, credits.overdrawn, credits.total]);

  /* -------------------------------------------------- source-change guard */

  /**
   * Back is free everywhere EXCEPT changing the source: the spine clears every
   * quick action and manual edit when `picked` changes, because they were made
   * against the old ad's analysis. That's correct, so it is warned about rather
   * than worked around.
   */
  const applySourceChange = (change: PendingSourceChange) => {
    setManualOpen([]);
    setFurthest(1);
    setRawStep(1);
    if (change.kind === "clear") clearSource();
    else pick(change.picked);
  };

  const requestSourceChange = (change: PendingSourceChange) => {
    if (!hasChanges) {
      applySourceChange(change);
      return;
    }
    setPending(change);
  };

  /* ------------------------------------------------------- manual editing */

  const openManual = (element: VariationElementId) => {
    setManualOpen((prev) => (prev.includes(element) ? prev : [...prev, element]));
  };

  const closeManual = (element: VariationElementId) => {
    setManualOpen((prev) => prev.filter((e) => e !== element));
    cancelEdit(element);
  };

  const touchedLabels = touchedElements.map((e) => getVariationElement(e).label);

  /* ------------------------------------------------------------- rendering */

  return (
    <div className="flex flex-col gap-6 font-g6-sans text-g6-text">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-col gap-3 border-b border-g6-border-secondary pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
              Genie · Studio
            </p>
            <h1 className="mt-1 font-g6-sans text-g6-h3 font-semibold text-g6-text">
              Generate Variations
            </h1>
          </div>
          <StepBreadcrumb step={step} furthest={furthest} onJumpTo={goTo} />
        </div>
      </header>

      {/* ------------------------------------------------- step 1: source + N */}
      {step === 1 && (
        <StepPanel
          step={1}
          title="Pick the ad, then say how many"
          intro="One whole ad in, several versions of it out. We read the ad after you've told us how many you want — the count changes what the next two steps can offer."
        >
          <SourcePicker
            picked={state.picked}
            onPick={(p) => requestSourceChange({ kind: "pick", picked: p })}
            onClear={() => requestSourceChange({ kind: "clear" })}
          />

          {/* Locked order: the count question exists only once a source does. */}
          {state.picked ? (
            <div className="flex flex-col gap-3 rounded-g6-card border border-g6-border bg-g6-bg-container p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor="variation-count"
                    className="font-g6-sans text-g6-base font-semibold text-g6-text"
                  >
                    How many variations of this ad?
                  </label>
                  <p className="mt-0.5 text-g6-sm text-g6-text-secondary">
                    Between {COUNT_MIN} and {COUNT_MAX}. Type a number or use the steppers.
                  </p>
                </div>
                <CountStepper value={state.count} onChange={setCount} />
              </div>
              {hasChanges && (
                <WarnNote>
                  You&apos;ve already set up{" "}
                  {touchedElements.length === 1 ? "1 change" : `${touchedElements.length} changes`}.
                  Lowering the count below a per-variation instruction drops the
                  instructions for the variations that no longer exist.
                </WarnNote>
              )}
            </div>
          ) : (
            /* Zero-data — the flow's first impression. Say what happens next
               rather than showing a control that can't be used yet. */
            <div className="rounded-g6-card border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-3">
              <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
                Next on this step
              </p>
              <p className="mt-1 text-g6-sm text-g6-text-secondary">
                How many variations you want. Then step 2 shows what we read off
                the ad, and step 3 is where you change anything by hand.
              </p>
            </div>
          )}
        </StepPanel>
      )}

      {/* --------------------------------------- step 2: analysis + actions */}
      {step === 2 && analysis && (
        <StepPanel
          step={2}
          title="What we found in this ad"
          intro={`Read it over. Tap any of the suggestions below and we'll apply that change across all ${state.count} variations — or change nothing and every variation stays a straight copy.`}
        >
          <AnalysisOverview analysis={analysis} />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-g6-sans text-g6-lg font-semibold text-g6-text">
                  Suggested for this ad
                </h3>
                <p className="mt-0.5 text-g6-sm text-g6-text-secondary">
                  Picked from what we actually found above. Tap as many as you
                  like — they stack, and none of them asks a follow-up question.
                </p>
              </div>
              <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
                {state.quickActions.length} of {recommendations.length} on
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="rounded-g6-card border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-6 text-center">
                <Sparkles className="mx-auto h-4 w-4 text-g6-text-tertiary" aria-hidden />
                <p className="mt-2 font-g6-sans text-g6-sm font-semibold text-g6-text">
                  Nothing to suggest for this ad
                </p>
                <p className="mx-auto mt-1 max-w-md text-g6-xs text-g6-text-secondary">
                  Too little was readable off it to recommend a change honestly.
                  You can still write your own instruction on the next step.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recommendations.map((r) => {
                  const def = getVariationElement(r.element);
                  return (
                    <QuickActionCard
                      key={r.element}
                      actionLabel={r.label}
                      reason={r.reason}
                      Icon={def.Icon}
                      active={isQuickAction(r.element)}
                      count={state.count}
                      onToggle={() => toggleQuickAction(r.element)}
                    />
                  );
                })}
              </div>
            )}

            <p className="flex items-start gap-1.5 text-g6-xs text-g6-text-tertiary">
              <Pencil className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>
                Want to write the instruction yourself, or change something that
                isn&apos;t suggested here? All nine elements are editable by hand
                on the next step.
              </span>
            </p>
          </div>
        </StepPanel>
      )}

      {/* ------------------------------------- step 3: manual edits + generate */}
      {step === 3 && analysis && (
        <StepPanel
          step={3}
          title="Review, then generate"
          intro="This is the last stop. Change nothing and we produce straight copies; go manual on any element to write its instruction and choose which variations it applies to."
        >
          {/* ------------------------------------------------- what changes */}
          <div className="flex flex-col gap-2 rounded-g6-card border border-g6-border bg-g6-bg-container p-4">
            <p className="font-g6-mono text-[9px] uppercase tracking-[0.12em] text-g6-text-tertiary">
              The run
            </p>
            <p className="font-g6-sans text-g6-base font-semibold text-g6-text">
              {state.count} {state.count === 1 ? "variation" : "variations"} of{" "}
              <span className="text-g6-primary">{analysis.source.title}</span>
            </p>
            {hasChanges ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {touchedElements.map((e) => {
                  const edit = editFor(e);
                  const def = getVariationElement(e);
                  return (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary-bg px-2 py-0.5 font-g6-mono text-[9px] font-semibold uppercase tracking-wider text-g6-primary"
                    >
                      <def.Icon className="h-2.5 w-2.5" aria-hidden />
                      {def.label} ·{" "}
                      {edit ? scopeSummary(edit, state.count) : `all ${state.count}`}
                    </span>
                  );
                })}
              </div>
            ) : (
              /* Partial state — a legitimate, deliberate way to finish. */
              <p className="text-g6-sm text-g6-text-secondary">
                Nothing changed yet, so every variation will be a fresh take on
                the same brief — same product, same angle, same script. That is a
                valid run; it just re-rolls the ad.
              </p>
            )}
          </div>

          {/* ------------------------------------------- the nine elements */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-g6-sans text-g6-lg font-semibold text-g6-text">
                Change something by hand
              </h3>
              <p className="mt-0.5 text-g6-sm text-g6-text-secondary">
                Every element of the ad, whether or not we suggested it. Going
                manual asks which variations it applies to, then hands you the
                instruction as editable text.
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {VARIATION_ELEMENTS.map((def) => {
                const edit = editFor(def.id);
                const quick = isQuickAction(def.id);
                const open = !!edit || manualOpen.includes(def.id);
                return (
                  <li
                    key={def.id}
                    className={cn(
                      "rounded-g6-card border bg-g6-bg-container p-3",
                      open
                        ? "border-g6-primary-border"
                        : quick
                          ? "border-g6-primary-border/60"
                          : "border-g6-border-secondary",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-g6-sm bg-g6-bg-muted">
                          <def.Icon className="h-4 w-4 text-g6-text-secondary" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-g6-sans text-g6-base font-semibold text-g6-text">
                            <span className="truncate">{def.label}</span>
                            {quick && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-on-accent">
                                <Wand2 className="h-2.5 w-2.5" aria-hidden />
                                Quick action
                              </span>
                            )}
                            {edit && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill bg-g6-primary-bg px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary">
                                <Pencil className="h-2.5 w-2.5" aria-hidden />
                                {scopeSummary(edit, state.count)}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-g6-sm text-g6-text-secondary">
                            {def.desc}
                          </p>
                          <p
                            title={detectedText(analysis, def.id)}
                            className="mt-0.5 truncate font-g6-mono text-g6-xs text-g6-text-tertiary"
                          >
                            Now: {detectedText(analysis, def.id)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {quick && (
                          <button
                            type="button"
                            onClick={() => toggleQuickAction(def.id)}
                            className="inline-flex h-8 items-center rounded-g6-pill border border-g6-border bg-g6-bg-container px-3 font-g6-sans text-g6-xs font-semibold text-g6-text-secondary transition-colors hover:bg-g6-bg-muted hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                          >
                            Turn off
                          </button>
                        )}
                        {!open && (
                          <button
                            type="button"
                            onClick={() => openManual(def.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill border border-g6-border bg-g6-bg-container px-3 font-g6-sans text-g6-xs font-semibold text-g6-text transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                          >
                            <Pencil className="h-3 w-3" aria-hidden />
                            {quick ? "Write my own instead" : "Edit manually"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* A stepped flow has the room, so the editor lives inline
                        in the row it belongs to rather than in an overlay. */}
                    {open && (
                      <div className="mt-3 border-t border-g6-border-secondary pt-3">
                        {quick && !edit && (
                          <div className="mb-3">
                            <WarnNote>
                              Picking a scope replaces the quick action on{" "}
                              {def.label} with your own instruction — one element
                              can&apos;t do both.
                            </WarnNote>
                          </div>
                        )}
                        <ElementEditor
                          element={def.id}
                          count={state.count}
                          analysis={analysis}
                          edit={edit}
                          onBeginEdit={beginEdit}
                          onScopeChange={setEditScope}
                          onPromptChange={setEditPrompt}
                          onIndexesChange={setEditIndexes}
                          onPromptForIndexChange={setEditPromptForIndex}
                          onCancel={closeManual}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <CreditPanel lines={credits.lines} total={credits.total} overdrawn={credits.overdrawn} />
        </StepPanel>
      )}

      {/* ------------------------------------------------------------ footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-g6-border-secondary pt-4">
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goTo((step - 1) as FlowStep)}
              className="inline-flex h-10 items-center gap-1.5 rounded-g6-pill border border-g6-border bg-g6-bg-container px-4 font-g6-sans text-g6-sm font-semibold text-g6-text transition-colors hover:bg-g6-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to {STEPS[step - 2].label}
            </button>
          ) : null}
          {step > 1 && (
            <p className="text-g6-xs text-g6-text-tertiary">
              Going back keeps everything you&apos;ve set up.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Never a dead control — the reason travels with the button. */}
          {blockedReason && (
            <p
              id="variations-blocked-reason"
              role="status"
              className="max-w-sm text-right text-g6-xs leading-snug text-warning-text"
            >
              {blockedReason}
            </p>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => goTo((step + 1) as FlowStep)}
              disabled={!!blockedReason}
              aria-describedby={blockedReason ? "variations-blocked-reason" : undefined}
              className="inline-flex h-10 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-5 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:bg-g6-bg-muted disabled:text-g6-text-disabled"
            >
              Continue to {STEPS[step].label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate}
              aria-describedby={blockedReason ? "variations-blocked-reason" : undefined}
              className="inline-flex h-10 items-center gap-2 rounded-g6-pill bg-g6-primary px-5 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-colors hover:bg-g6-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border disabled:cursor-not-allowed disabled:bg-g6-bg-muted disabled:text-g6-text-disabled"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Generate {state.count} {state.count === 1 ? "variation" : "variations"} ·{" "}
              {creditsLabel(credits.total)}
            </button>
          )}
        </div>
      </footer>

      {/* -------------------------------- source change = the one destructive act */}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
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
              will be dropped. Your count of {state.count} stays.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPending(null)}>Keep this ad</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) applySourceChange(pending);
                setPending(null);
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

export default VariationsFlowB;
