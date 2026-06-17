/**
 * LaunchV2Flow — the 4-step orchestrator. Pattern A: Steps 1–3 are focused
 * centered screens; Step 4 (Review & Launch) is a full-height Meta two-pane.
 * Chrome: running-context chips + step progress + footer (Back/Next/Launch).
 * Step bodies are filled by build agents; this owns the shell + flow control.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FeedbackSheet from "../feedback/FeedbackSheet";
import { useFlowV2, type StepV2, type DeepLinkState } from "../state/useFlowV2";
import { useUIState } from "../state/useUIState";
import { useLaunchV2 } from "../state/LaunchV2Context";
import { estimateAds } from "../deriveV2";
import { planReady } from "../reducer";
import type { PlanV2 } from "../types";
import { getTemplate, getStrategy } from "../data";
import { buildIssues, canLaunch, readiness } from "./review/reviewModel";
import type { ReviewIssue } from "./review/reviewModel";
import { formatMoney } from "@/launch2/utils/time";
import Step1Start from "./steps/Step1StartV2";
import Step2Setup from "./steps/Step2Setup";
import Step4Review from "./steps/Step4Review";
import Step3AdDistributionV3 from "./steps/Step3AdDistributionV3";
import LaunchConfirmModal from "../components/LaunchConfirmModal";

type SaveState = "saving" | "saved" | "failed";

const STEP_TITLES_V3: Record<number, string> = {
  1: "Start",
  2: "Setup",
  3: "Ad & Dist.",
  4: "Review",
};

function stepValid(plan: PlanV2, step: StepV2): boolean {
  return planReady(plan, step);
}

export default function LaunchV2Flow() {
  const [sp, setSearchParams] = useSearchParams();

  // Decode deep-link state ONCE on mount — intentionally not re-run on sp changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialDeepLink = useMemo<DeepLinkState | undefined>(() => {
    const raw = sp.get('s');
    if (!raw) return undefined;
    try { return JSON.parse(atob(raw)) as DeepLinkState; } catch { return undefined; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once

  const flow = useFlowV2(sp.get('draft') ?? undefined, initialDeepLink);
  const uiHook = useUIState(initialDeepLink?.ui);
  const service = useLaunchV2();
  const navigate = useNavigate();
  const { plan, step } = flow;
  const [saveAsStrategy, setSaveAsStrategy] = useState(false);

  // FeedbackSheet retained as a passive surface — the floating Feedback button
  // is the single trigger now (footer button removed). Kept open=false always
  // here; future deep-links to feedback can reuse this hook.
  const [fbOpen, setFbOpen] = useState(false);
  void setFbOpen; // suppress unused-var warning while we keep the sheet mounted

  // ── Autosave tri-state (◐ Saving / ● Saved / ⚠ Failed) ──────────────
  // Mirrors the useFlowV2 internal autosave debounce. We can't observe its
  // promise, but we mirror the 500ms cadence and stamp "saved" after settle.
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number>(Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRef = useRef(plan);

  const variant = 'v3' as const;

  // Write full state to URL on every change so any URL can restore exact state
  useEffect(() => {
    const state: DeepLinkState = {
      plan,
      step,
      variant,
      ui: uiHook.state,
    };
    try {
      setSearchParams({ s: btoa(JSON.stringify(state)) }, { replace: true });
    } catch {
      // ignore if plan too large to encode
    }
  // setSearchParams is a stable ref from react-router; uiHook.state is object so
  // we track the individual shape via plan/step/variant triggers intentionally.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, step, uiHook.state]);

  // Track plan changes → flip to "saving", and after debounce → "saved".
  useEffect(() => {
    if (planRef.current === plan) return;
    planRef.current = plan;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        // useFlowV2 already writes sessionStorage on its own debounce; we
        // optimistically mark "saved" since sessionStorage rarely fails. If
        // a future backend persist is wired, that promise should drive this.
        setSaveState("saved");
        setSavedAt(Date.now());
      } catch {
        setSaveState("failed");
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [plan]);

  const issues = buildIssues(plan);
  const ready = useMemo(() => readiness(issues), [issues]);
  const adsTotal = useMemo(() => estimateAds(plan), [plan]);
  // Per-campaign budget on a single account = the entered budget; the day-1
  // figure is the actual per-account daily spend cap. Multi-account split
  // (CBO across N accounts) is shown in the confirm modal, not the footer.
  const perAccountDaily = plan.budgetAmount;

  const valid = stepValid(plan, step);
  // structural-only check (per-step progression). Doesn't consider blocking issues.
  const stepsAllValid = ([1, 2, 3, 4] as StepV2[]).every((s) => stepValid(plan, s));
  // the REAL launch gate — structural readiness + zero tier="error" issues.
  const launchGate = canLaunch(plan);
  const allValid = stepsAllValid && launchGate.ok;
  const twoPane = step === 4;

  // ── Launch confirmation modal state ─────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  const currency = "USD"; // lock #5 — USD-only display; accounts may have native currencies but UI always shows $

  const openConfirm = () => {
    if (!allValid || launching) return;
    setConfirmOpen(true);
  };

  /**
   * Async confirm handler. service.launch is sync in mock — wrapped in
   * Promise.resolve to keep the contract future-proof for a real Meta API
   * call. Errors bubble back to the modal so its launching state resets.
   */
  const handleConfirmLaunch = async () => {
    setLaunching(true);
    try {
      const run = await Promise.resolve(service.launch(plan));
      setConfirmOpen(false);
      navigate(`/launchv2/${run.id}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Step progress */}
      <div className="flex-shrink-0 border-b border-border bg-background px-5 py-3">
        <Progress
          step={step}
          steps={[1, 2, 3, 4] as StepV2[]}
          titles={STEP_TITLES_V3}
          onJump={(s) => s <= step && flow.setStep(s)}
          issues={issues}
        />
      </div>

      {/* Persistent breadcrumb strip — locked upstream state + autosave.
         Sticky so it stays visible while the body scrolls. */}
      <StepBreadcrumb
        plan={plan}
        step={step}
        setStep={flow.setStep}
        saveState={saveState}
        savedAt={savedAt}
        onRetry={() => {
          setSaveState("saving");
          setTimeout(() => {
            setSaveState("saved");
            setSavedAt(Date.now());
          }, 400);
        }}
      />

      {/* Body */}
      <div className={cn("flex-1 min-h-0", twoPane ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn(twoPane ? "h-full" : "mx-auto max-w-4xl px-5 py-6")}>
          <>
            {step === 1 && <Step1Start flow={flow} saveAsStrategy={saveAsStrategy} onSaveAsStrategyChange={setSaveAsStrategy} />}
            {step === 2 && <Step2Setup flow={flow} />}
            {step === 3 && <Step3AdDistributionV3 flow={flow} />}
            {step === 4 && <Step4Review flow={flow} />}
          </>
        </div>
      </div>

      {/* Feedback sheet — triggered only from FloatingFeedbackButton now. */}
      <FeedbackSheet
        open={fbOpen}
        onOpenChange={setFbOpen}
        initialScreenshot={null}
        captureFailed={false}
      />

      {/* Footer — two-column. Back on left, Next/Launch on right.
         Feedback button removed (FloatingFeedbackButton is single source).
         Autosave whisper removed (moved to breadcrumb strip). */}
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-5 py-3">
        <Button variant="outline" onClick={flow.back} disabled={step === 1}>Back</Button>

        {/* Skip & Launch — only on step 1, enabled when a template strategy is applied */}
        {step === 1 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => flow.setStep(4)}
                    disabled={plan.flowMode !== "template"}
                    className={cn(
                      "rounded-full text-[12px] gap-1.5",
                      plan.flowMode !== "template" && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Skip &amp; Launch
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-[12px]">
                {plan.flowMode === "template"
                  ? "Strategy applied — skip to Review & Launch"
                  : "Apply a saved strategy first to unlock this shortcut"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {step < 4 ? (
          <Button onClick={flow.next} disabled={!valid}>Next</Button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Inline blocker count when launch is gated. Click → scroll to Issues. */}
            {ready.errors > 0 && (
              <button
                type="button"
                onClick={() => {
                  document
                    .querySelector('[data-screen="lv2-step4-review"] [data-lv2-issues-tab]')
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  // also activate Issues tab via custom event the screen listens for
                  window.dispatchEvent(new CustomEvent("lv2:open-issues-tab"));
                }}
                className="fab-focus inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/5 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-500/10"
                aria-label={`${ready.errors} blockers — fix to launch`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {ready.errors} blocker{ready.errors === 1 ? "" : "s"} — fix to launch
              </button>
            )}
            <Button
              onClick={openConfirm}
              disabled={!allValid || launching}
              className={cn(
                "h-12 px-5 font-semibold",
                allValid && !launching && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {launching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Launching…
                </>
              ) : (
                <>
                  Launch <span className="opacity-60">·</span>{" "}
                  <span className="font-mono tabular-nums">{adsTotal} ads</span>
                  <span className="opacity-60">·</span>{" "}
                  <span className="font-mono tabular-nums">
                    {formatMoney(perAccountDaily, currency)}/account
                  </span>
                  <span className="opacity-60">·</span>{" "}
                  <span className="font-mono">day-1</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Launch confirmation modal — final gate before real Meta API calls. */}
      <LaunchConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        flow={flow}
        onConfirm={handleConfirmLaunch}
      />
    </div>
  );
}

/* ---- chrome ---- */

/* ------------------------------------------------------------------ */
/*  Persistent breadcrumb strip — overview chips + autosave status    */
/* ------------------------------------------------------------------ */

type Chip = {
  /** Short label rendered in the chip. */
  label: string;
  /** Full tooltip text (longer description). */
  tooltip: string;
  /** Owning step — clicking the chip deep-links there. */
  step: StepV2;
};

/** Build the breadcrumb chips from the locked upstream state of the plan. */
function buildChips(plan: PlanV2): Chip[] {
  const chips: Chip[] = [];

  // Step 1 — objective + format
  if (plan.objective) {
    const objShort = labelShort(plan.objective);
    const fmtShort = plan.format ? labelShort(plan.format) : null;
    chips.push({
      label: fmtShort ? `${objShort} · ${fmtShort}` : objShort,
      tooltip: `Objective: ${humanize(plan.objective)}${plan.format ? ` · Format: ${humanize(plan.format)}` : ""}`,
      step: 1,
    });
  }

  // Step 2 — accounts + budget
  if (plan.targets.length > 0) {
    const accounts = new Set(plan.targets.map((t) => t.accountId)).size;
    chips.push({
      label: `${accounts} ad account${accounts === 1 ? "" : "s"}`,
      tooltip: plan.targets
        .map((t) => `${t.accountName ?? t.accountId} · ${t.pageName ?? "page"}`)
        .join("\n"),
      step: 2,
    });
  }
  if (plan.budgetAmount > 0) {
    const currency = "USD"; // lock #5
    chips.push({
      label: `${formatMoney(plan.budgetAmount, currency)}/account · ${plan.budgetMode}`,
      tooltip: `Budget: ${formatMoney(plan.budgetAmount, currency)} per ${plan.budgetMode === "CBO" ? "campaign (CBO)" : "ad set (ABO)"}`,
      step: 2,
    });
  }

  // Step 2 — audience (Targeting Template)
  const tmpl = getTemplate(plan.targetingTemplateId);
  if (tmpl) {
    chips.push({
      label: tmpl.name.length > 24 ? `${tmpl.name.slice(0, 22)}…` : tmpl.name,
      tooltip: `Audience template: ${tmpl.name}`,
      step: 2,
    });
  }

  // Step 1 — strategy preset (if used)
  const strat = getStrategy(plan.strategyId);
  if (strat) {
    chips.push({
      label: `Strategy: ${strat.name}`,
      tooltip: `Strategy preset: ${strat.name}`,
      step: 1,
    });
  }

  return chips;
}

/** Sentence-case a SCREAMING_SNAKE token. */
function humanize(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

/** Very short label for a chip (no underscores, capped). */
function labelShort(s: string): string {
  const h = humanize(s);
  return h.length > 14 ? `${h.slice(0, 12)}…` : h;
}

const MAX_VISIBLE_CHIPS = 4;

function StepBreadcrumb({
  plan,
  step: _step, // present for future "highlight chip owning current step" logic
  setStep,
  saveState,
  savedAt,
  onRetry,
}: {
  plan: PlanV2;
  step: StepV2;
  setStep: (s: StepV2) => void;
  saveState: SaveState;
  savedAt: number;
  onRetry: () => void;
}) {
  const chips = buildChips(plan);
  const visible = chips.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = chips.length - visible.length;

  // Recompute the "Saved 12s ago" string each second.
  const [, force] = useState(0);
  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, [saveState]);

  const sinceLabel = (() => {
    const s = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    return `${m}m ago`;
  })();

  // Empty-chip handling: don't render the strip at all when nothing is set.
  if (chips.length === 0 && saveState === "saved") return null;

  return (
    <div className="sticky top-0 z-20 flex flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-5 py-1.5 backdrop-blur">
      {/* Center: overview chips (left-justified on overflow, truncates) */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        <TooltipProvider>
          {visible.map((chip, idx) => (
            <Tooltip key={`${chip.step}-${idx}-${chip.label}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setStep(chip.step)}
                  className="fab-focus inline-flex max-w-[200px] items-center gap-1 truncate rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground"
                >
                  <span className="truncate">{chip.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                {chip.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="fab-focus inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  +{overflow} more
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs whitespace-pre-line">
                {chips
                  .slice(MAX_VISIBLE_CHIPS)
                  .map((c) => `• ${c.label}`)
                  .join("\n")}
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {/* Right: autosave tri-state */}
      <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        {saveState === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving…</span>
          </>
        )}
        {saveState === "saved" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span>Saved {sinceLabel}</span>
          </>
        )}
        {saveState === "failed" && (
          <>
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            <span>Save failed</span>
            <button
              type="button"
              onClick={onRetry}
              className="fab-focus rounded-full px-1.5 text-[11px] font-medium text-foreground underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Map a step number to the issues that are visible in that step. */
function issuesForStep(stepNum: StepV2, issues: ReviewIssue[]): ReviewIssue[] {
  switch (stepNum) {
    case 2:
      return issues.filter(
        (i) =>
          i.id.startsWith("cap:") ||
          ["warn:CBO_70", "warn:ADSET_200", "warn:FRAGMENT"].includes(i.id),
      );
    case 3:
      return issues.filter((i) => i.id === "info:copy");
    default:
      return [];
  }
}

function Progress({ step, steps, titles, onJump, issues }: {
  step: StepV2;
  steps: StepV2[];
  titles: Record<number, string>;
  onJump: (s: StepV2) => void;
  issues: ReviewIssue[];
}) {
  const lastStep = steps[steps.length - 1];
  return (
    <div className="flex items-center gap-1">
      {steps.map((s) => {
        const done = step > s;
        const active = step === s;
        const stepIssues = done ? issuesForStep(s, issues) : [];
        const hasError = stepIssues.some((i) => i.tier === "error");
        const hasWarning = stepIssues.some((i) => i.tier === "warning" || i.tier === "info");
        return (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => onJump(s)}
              className="fab-focus flex items-center gap-1.5 group min-w-0 rounded-md"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                    : done && hasError
                      ? "bg-red-500/20 text-red-500 ring-2 ring-red-500/40 ring-offset-1"
                      : done && hasWarning
                        ? "bg-amber-500/20 text-amber-600 ring-2 ring-amber-500/40 ring-offset-1"
                        : done
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground",
                )}
              >
                {/* 7.3: each state has a distinct glyph so it's not color-only —
                   done = Check, error = AlertTriangle (red), warning = AlertCircle
                   (amber), active/pending = step number. */}
                {done && hasError ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : done && hasWarning ? (
                  <AlertCircle className="h-3 w-3" />
                ) : done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  s
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs transition-colors",
                  active
                    ? "max-w-[72px] font-semibold text-foreground"
                    : "max-w-[48px] text-muted-foreground group-hover:text-foreground",
                )}
              >
                {titles[s]}
              </span>
            </button>
            {s < lastStep && (
              <span className={cn("h-px flex-1 min-w-[8px]", done ? "bg-primary/40" : "bg-border")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
