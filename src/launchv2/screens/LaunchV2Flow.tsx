/**
 * LaunchV2Flow — the 4-step orchestrator. Pattern A: Steps 1–3 are focused
 * centered screens; Step 4 (Review & Launch) is a full-height Meta two-pane.
 * Chrome: running-context chips + step progress + footer (Back/Next/Launch).
 * Step bodies are filled by build agents; this owns the shell + flow control.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { captureScreen } from "../feedback/screenshot";
import FeedbackSheet from "../feedback/FeedbackSheet";
import { useFlowV2, type StepV2, type DeepLinkState } from "../state/useFlowV2";
import { useUIState } from "../state/useUIState";
import { useLaunchV2 } from "../state/LaunchV2Context";
import { dailyTotalBudget } from "../deriveV2";
import { planReady } from "../reducer";
import type { PlanV2 } from "../types";
import { buildIssues, canLaunch } from "./review/reviewModel";
import type { ReviewIssue } from "./review/reviewModel";
import { formatMoney } from "@/launch2/utils/time";
import Step1Start from "./steps/Step1Start";
import Step2Setup from "./steps/Step2Setup";
import Step4Review from "./steps/Step4Review";
import Step3AdDistributionV3 from "./steps/Step3AdDistributionV3";
import LaunchConfirmModal from "../components/LaunchConfirmModal";

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

  // Feedback trigger — inline in footer so it never occludes the Next button.
  const [fbCapturing, setFbCapturing] = useState(false);
  const [fbOpen, setFbOpen] = useState(false);
  const [fbShot, setFbShot] = useState<string | null>(null);
  const [fbFailed, setFbFailed] = useState(false);

  const handleFeedback = async () => {
    if (fbCapturing || fbOpen) return;
    setFbCapturing(true);
    let shot: string | null = null;
    try { shot = await captureScreen(); } catch { shot = null; }
    setFbShot(shot);
    setFbFailed(shot === null);
    setFbCapturing(false);
    setFbOpen(true);
  };

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

  const issues = buildIssues(plan);

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

  const dailyTotal = useMemo(() => dailyTotalBudget(plan), [plan]);
  const currency = plan.targets[0]?.currency ?? "USD";

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

      {/* Feedback sheet — triggered from footer icon */}
      <FeedbackSheet
        open={fbOpen}
        onOpenChange={setFbOpen}
        initialScreenshot={fbShot}
        captureFailed={fbFailed}
      />

      {/* Footer */}
      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-background px-5 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={flow.back} disabled={step === 1}>Back</Button>
          <Button
            variant="outline"
            onClick={handleFeedback}
            disabled={fbCapturing}
          >
            {fbCapturing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Capturing…</>
            ) : (
              <><MessageSquare className="h-4 w-4" /> Feedback</>
            )}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Autosaved</span>
        {step < 4 ? (
          <Button onClick={flow.next} disabled={!valid}>Next</Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={openConfirm} disabled={!allValid || launching}>
              {launching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Launching…
                </>
              ) : (
                <>
                  Launch <span className="opacity-60">·</span>{" "}
                  <span className="font-mono tabular-nums">{formatMoney(dailyTotal, currency)}</span>
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
