/**
 * LaunchV2Flow — the 4-step orchestrator. Pattern A: Steps 1–3 are focused
 * centered screens; Step 4 (Review & Launch) is a full-height Meta two-pane.
 * Chrome: running-context chips + step progress + footer (Back/Next/Launch).
 * Step bodies are filled by build agents; this owns the shell + flow control.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FeedbackSheet from "../feedback/FeedbackSheet";
import { useFlowV2, type StepV2, type DeepLinkState, type UseFlowV2 } from "../state/useFlowV2";
import { useUIState } from "../state/useUIState";
import { useLaunchV2 } from "../state/LaunchV2Context";
import { estimateAds } from "../deriveV2";
import { planReady } from "../reducer";
import type { PlanV2 } from "../types";
import { getTemplate, getStrategy } from "../data";
import { buildIssues, canLaunch, readiness } from "./review/reviewModel";
import type { ReviewIssue } from "./review/reviewModel";
import { runPreflight } from "../preflight";
import { formatMoney } from "@/launch2/utils/time";
import Step1Start from "./steps/Step1StartV2";
import Step2Setup from "./steps/Step2Setup";
import Step4Review from "./steps/Step4Review";
import Step3AdDistributionV3 from "./steps/Step3AdDistributionV3";
import LaunchConfirmModal from "../components/LaunchConfirmModal";
import { SetupTemplateBar } from "./steps/setup/SetupTemplateBar";

type SaveState = "saving" | "saved" | "failed";

const STEP_TITLES_V3: Record<number, string> = {
  1: "Start",
  2: "Setup",
  3: "Ad & Distribution",
  4: "Review & Launch",
};

function stepValid(plan: PlanV2, step: StepV2): boolean {
  return planReady(plan, step);
}

export default function LaunchV2Flow() {
  const [sp, setSearchParams] = useSearchParams();

  // ── Draft UUID — stable for this launch session ────────────────────────
  // Generated once on first visit; read from URL on subsequent visits/refreshes.
  const draftId = useMemo<string>(() => {
    const existing = sp.get('draft');
    if (existing) return existing;
    return crypto.randomUUID();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — generate once, never re-derive

  // Push draft + step=1 into URL on first mount if ?draft is missing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sp.get('draft')) {
      setSearchParams(
        (prev) => { prev.set('draft', draftId); if (!prev.get('step')) prev.set('step', '1'); return prev; },
        { replace: true }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Decode deep-link state ONCE on mount — intentionally not re-run on sp changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialDeepLink = useMemo<DeepLinkState | undefined>(() => {
    const raw = sp.get('s');
    if (!raw) return undefined;
    try {
      // Reverse of encodeURIComponent → unescape → btoa to handle Unicode chars.
      return JSON.parse(decodeURIComponent(escape(atob(raw)))) as DeepLinkState;
    } catch { return undefined; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once

  const flow = useFlowV2(sp.get('draft') ?? draftId, initialDeepLink);
  const uiHook = useUIState(initialDeepLink?.ui);
  const service = useLaunchV2();
  const navigate = useNavigate();
  const { plan, step } = flow;

  // ── localStorage key for this draft ───────────────────────────────────
  const LS_KEY = `lv2:draft:${draftId}`;

  // Restore from localStorage on mount (only when no ?s= deep-link is active,
  // so the deep-link always wins). Runs once after draftId is stable.
  useEffect(() => {
    if (initialDeepLink) return; // deep-link takes precedence
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) return;
    try {
      const { plan: savedPlan, step: savedStep } = JSON.parse(saved) as { plan: PlanV2; step: number };
      if (savedPlan && typeof savedStep === 'number') {
        flow.restorePlan(savedPlan, savedStep);
        setSearchParams(
          (prev) => { prev.set('draft', draftId); prev.set('step', String(savedStep)); return prev; },
          { replace: true }
        );
      }
    } catch {
      // corrupted — silently ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Save plan + step to localStorage on every change — debounced 300ms.
  // Keep the draft in localStorage across navigations so a refresh restores state.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ plan, step }));
      } catch {
        // quota exceeded — silently ignore
      }
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, step]);

  // ── Navigation action ref — drives push vs replace in the URL sync ─────
  // 'next' → push (gives user a meaningful browser Back button entry per step)
  // 'back' | 'jump' | 'plan' → replace (avoid polluting history)
  type NavAction = 'next' | 'back' | 'jump' | 'plan';
  const lastNavAction = useRef<NavAction>('plan');

  // Wrapped nav handlers — set the intent before mutating flow state so the
  // URL-sync effect below can read the correct replace/push flag.
  const handleNext = useCallback(() => {
    lastNavAction.current = 'next';
    flow.next();
  }, [flow]);

  const handleBack = useCallback(() => {
    lastNavAction.current = 'back';
    flow.back();
  }, [flow]);

  const handleSetStep = useCallback((s: StepV2) => {
    lastNavAction.current = 'jump';
    flow.setStep(s);
  }, [flow]);

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

  // Write full state to URL on every change so any URL can restore exact state.
  // Also syncs ?draft and ?step so the URL is human-readable and refresh-safe
  // without needing to decode the base64 ?s= blob.
  // Uses push (replace: false) only for forward navigation (Next button) so the
  // browser Back button gives the user meaningful per-step history entries.
  // All other mutations (back, jump, plan edits) use replace to avoid pollution.
  useEffect(() => {
    const state: DeepLinkState = {
      plan,
      step,
      variant,
      ui: uiHook.state,
    };
    const action = lastNavAction.current;
    // Reset to 'plan' after consuming — prevents stale action on the next plan edit
    lastNavAction.current = 'plan';
    const shouldPush = action === 'next';
    try {
      setSearchParams(
        (prev) => {
          prev.set('draft', draftId);
          prev.set('step', String(step));
          try {
            // btoa can't handle non-Latin1 chars (e.g. ₹ in strategy names).
            // encodeURIComponent → unescape produces a Latin1-safe intermediate.
            const json = JSON.stringify(state);
            prev.set('s', btoa(unescape(encodeURIComponent(json))));
          } catch { /* plan too large or unencodable */ }
          return prev;
        },
        { replace: !shouldPush }
      );
    } catch {
      // ignore serialization errors
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
  // Pre-flight issues — memoised; any tier="error" blocks the confirm modal.
  const preflightIssues = useMemo(() => runPreflight(plan), [plan]);
  const preflightBlocked = preflightIssues.some((i) => i.tier === "error");
  // allValid gates the footer Launch button — must include preflight.
  const allValid = stepsAllValid && launchGate.ok && !preflightBlocked;
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
      {/* Step progress — single canonical stepper (Figma-aligned) */}
      <div className="flex-shrink-0 border-b border-border bg-background px-6 py-3">
        <Progress
          step={step}
          steps={[1, 2, 3, 4] as StepV2[]}
          titles={STEP_TITLES_V3}
          onJump={(s) => s <= step && handleSetStep(s)}
          issues={issues}
        />
      </div>

      {/* Persistent breadcrumb strip — locked upstream state + autosave.
         Sticky so it stays visible while the body scrolls. */}
      <StepBreadcrumb
        plan={plan}
        step={step}
        setStep={handleSetStep}
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

      {/* Setup template bar (step 2 only) */}
      {step === 2 && (
        <div className="flex-shrink-0 border-b border-border/60 bg-background px-5 py-2">
          <SetupTemplateBar flow={flow} />
        </div>
      )}

      {/* Body */}
      <div className={cn("flex-1 min-h-0", (twoPane || step === 3) ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn((twoPane || step === 3) ? "h-full" : "mx-auto max-w-4xl px-5 py-6")}>
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
        <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>

        {step < 4 ? (
          <div className="flex items-center gap-2">
            {step === 1 && plan.flowMode === "template" && (
              <Button
                variant="outline"
                onClick={() => handleSetStep(4)}
                className="rounded-full text-[12px] gap-1.5"
              >
                <Rocket className="h-3.5 w-3.5" />
                Skip &amp; Launch
              </Button>
            )}
            <Button onClick={handleNext} disabled={!valid} className="min-w-[90px]">Next</Button>
          </div>
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
        preflightBlocked={preflightBlocked}
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
    <div className="flex w-full items-center">
      {steps.map((s) => {
        const done = step > s;
        const active = step === s;
        const clickable = s <= step;
        const stepIssues = done ? issuesForStep(s, issues) : [];
        const hasError = stepIssues.some((i) => i.tier === "error");
        const hasWarning = stepIssues.some((i) => i.tier === "warning" || i.tier === "info");
        return (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => onJump(s)}
              disabled={!clickable}
              className={cn(
                "fab-focus group flex shrink-0 items-center gap-2 rounded-full",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-all duration-150",
                  active
                    ? "bg-[#8FB821] text-[#121212]"
                    : done && hasError
                      ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/40"
                      : done && hasWarning
                        ? "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/40"
                        : done
                          ? "bg-[#8FB821] text-[#121212]"
                          : "border border-border bg-muted text-muted-foreground",
                )}
              >
                {/* Each state has a distinct glyph so it's not color-only —
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
                  "whitespace-nowrap text-[13px] tracking-[-0.01em] transition-colors",
                  active
                    ? "font-semibold text-foreground"
                    : done
                      ? "font-medium text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {titles[s]}
              </span>
            </button>
            {s < lastStep && (
              <span
                className={cn(
                  "mx-3 h-px min-w-[16px] flex-1 transition-colors",
                  done ? "bg-[#8FB821]/50" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
