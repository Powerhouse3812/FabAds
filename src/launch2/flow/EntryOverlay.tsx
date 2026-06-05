import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap, LayoutGrid, Sliders, ArrowLeft, ArrowRight, Check, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LaunchMode, LaunchObjective, StrategyKey } from "@/launch2/types";
import { useLaunchFlow } from "@/launch2/store/launchFlowStore";
import { STRATEGY_ORDER, STRATEGY_PRESETS } from "@/launch2/lib/strategyPresets";
import { winners, drafts } from "@/launch2/mocks";
import { StrategyBadge } from "@/launch2/components";
import { Thumb } from "@/launch2/components/Thumb";
import { relativeTime, formatCurrency } from "@/launch2/lib/format";

/* ───────────────────────── Internal step machine ───────────────────────── */

type InnerStep = "a" | "b" | "c";

const MODE_CARDS: { mode: LaunchMode; icon: typeof Zap; label: string; blurb: string }[] = [
  { mode: "quick", icon: Zap, label: "Quick", blurb: "Clone a winner or draft — inherit everything, jump to Review." },
  { mode: "preset", icon: LayoutGrid, label: "Preset", blurb: "Pick a proven playbook — structure & budget auto-configured." },
  { mode: "custom", icon: Sliders, label: "Custom", blurb: "Full control, strategy optional." },
];

const OBJECTIVE_CARDS: { objective: LaunchObjective; label: string; blurb: string }[] = [
  { objective: "sales", label: "Sales", blurb: "Drive purchases / conversions. Unlocks the Catalogue (DPA) option." },
  { objective: "leads", label: "Leads", blurb: "Collect lead-form or on-site sign-ups." },
  { objective: "traffic", label: "Traffic", blurb: "Send people to a destination — link clicks / landing views." },
  { objective: "engagement", label: "Engagement", blurb: "Maximise interactions, messages or video views." },
];

/** Mono structure summary like "50 × 1 × $1". */
function structureSummary(key: StrategyKey): string {
  const p = STRATEGY_PRESETS[key];
  return `${p.adsetCount} × ${p.creativesPerAdset} × ${formatCurrency(p.perUnitBudget)}`;
}

/* ───────────────────────── EntryOverlay ───────────────────────── */

export function EntryOverlay({
  initialMode,
  onClose,
}: {
  initialMode: LaunchMode | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useLaunchFlow();
  const navigate = useNavigate();

  // Fresh draft on open (unless we are dropping straight into Quick-clone, which
  // also wants a fresh state but immediately patches it). RESET is correct for all.
  useEffect(() => {
    dispatch({ type: "RESET" });
    if (initialMode) dispatch({ type: "SET_MODE", mode: initialMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [innerStep, setInnerStep] = useState<InnerStep>("a");

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mode = state.mode;

  // ─── Quick: clone a winner / draft → land on Review ───
  const handleQuickWinner = (winnerId: string) => {
    const winner = winners.find((w) => w.id === winnerId);
    if (!winner) return;
    dispatch({ type: "SET_MODE", mode: "quick" });
    dispatch({ type: "PATCH", patch: { cloneSourceId: winnerId, currentStep: 5, strategy: winner.strategy } });
    if (winner.strategy) dispatch({ type: "SET_STRATEGY", strategy: winner.strategy });
    onClose();
    navigate("/launch2/new");
  };

  const handleQuickDraft = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;
    dispatch({ type: "SET_MODE", mode: "quick" });
    dispatch({ type: "PATCH", patch: { cloneSourceId: draftId, currentStep: 5, strategy: draft.strategy } });
    if (draft.strategy) dispatch({ type: "SET_STRATEGY", strategy: draft.strategy });
    onClose();
    navigate("/launch2/new");
  };

  // ─── Mode card click ───
  const handlePickMode = (next: LaunchMode) => {
    dispatch({ type: "SET_MODE", mode: next });
    // Quick reveals the picker inline (stay on step A); preset/custom advance.
    if (next !== "quick") setInnerStep("b");
  };

  // ─── Strategy ───
  const handlePickStrategy = (key: StrategyKey | null) => {
    dispatch({ type: "SET_STRATEGY", strategy: key });
  };

  // ─── Objective ───
  const handlePickObjective = (obj: LaunchObjective) => {
    dispatch({ type: "SET_OBJECTIVE", objective: obj });
  };

  // ─── Navigation between inner steps ───
  const canContinue = (): boolean => {
    if (innerStep === "a") return mode !== null && mode !== "quick";
    if (innerStep === "b") {
      // Preset must choose a strategy; Custom may skip.
      if (mode === "preset") return state.strategy !== null;
      return true;
    }
    if (innerStep === "c") return state.objective !== null;
    return false;
  };

  const handleBack = () => {
    if (innerStep === "c") setInnerStep("b");
    else if (innerStep === "b") setInnerStep("a");
  };

  const handleContinue = () => {
    if (innerStep === "a") {
      setInnerStep("b");
      return;
    }
    if (innerStep === "b") {
      setInnerStep("c");
      return;
    }
    // step c — finalize
    dispatch({ type: "PATCH", patch: { currentStep: 2 } });
    onClose();
    navigate("/launch2/new");
  };

  // The visible inner-step index for the progress dots (Quick collapses to A only).
  const steps: InnerStep[] = ["a", "b", "c"];
  const activeIndex = steps.indexOf(innerStep);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm font-g6-sans"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="New Launch"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="font-g6-sans text-base font-semibold text-foreground">New Launch</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {innerStep === "a" && "How do you want to start?"}
              {innerStep === "b" && (mode === "preset" ? "Pick a playbook" : "Pick a playbook (optional)")}
              {innerStep === "c" && "What is this launch for?"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tiny progress indicator */}
            <div className="hidden items-center gap-1.5 sm:flex">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === activeIndex ? "bg-primary" : i < activeIndex ? "bg-foreground/40" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body (scrollable) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {innerStep === "a" && (
            <StepMode mode={mode} onPick={handlePickMode} onQuickWinner={handleQuickWinner} onQuickDraft={handleQuickDraft} />
          )}
          {innerStep === "b" && (
            <StepStrategy mode={mode} selected={state.strategy} onPick={handlePickStrategy} />
          )}
          {innerStep === "c" && (
            <StepObjective selected={state.objective} onPick={handlePickObjective} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={innerStep === "a"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              innerStep === "a"
                ? "cursor-not-allowed text-muted-foreground/50"
                : "text-foreground hover:bg-muted"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {innerStep === "c" ? "Start launch" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Step A — Mode ───────────────────────── */

function StepMode({
  mode,
  onPick,
  onQuickWinner,
  onQuickDraft,
}: {
  mode: LaunchMode | null;
  onPick: (mode: LaunchMode) => void;
  onQuickWinner: (id: string) => void;
  onQuickDraft: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {MODE_CARDS.map((c) => {
          const Icon = c.icon;
          const active = mode === c.mode;
          return (
            <button
              key={c.mode}
              type="button"
              onClick={() => onPick(c.mode)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors",
                active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-foreground">{c.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">{c.blurb}</span>
            </button>
          );
        })}
      </div>

      {/* Quick picker — winners + drafts */}
      {mode === "quick" && (
        <div className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Winners</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {winners.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onQuickWinner(w.id)}
                  className="group w-36 shrink-0 overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary"
                >
                  <Thumb src={w.thumbUrl} seed={w.id} alt={w.name} className="aspect-[4/5] w-full" />
                  <div className="space-y-1 p-2">
                    <p className="truncate text-xs font-semibold text-foreground" title={w.name}>
                      {w.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <StrategyBadge strategy={w.strategy} />
                      <span className="font-g6-mono text-[10px] text-muted-foreground">×{w.relaunchCount}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Drafts</p>
            <div className="space-y-1.5">
              {drafts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onQuickDraft(d.id)}
                  className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary hover:bg-muted/50"
                >
                  <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{d.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      Step {d.step} · updated {relativeTime(d.updatedAt)}
                    </span>
                  </span>
                  {d.strategy && <StrategyBadge strategy={d.strategy} />}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Selecting inherits everything and drops you straight on Review.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Step B — Strategy ───────────────────────── */

function StepStrategy({
  mode,
  selected,
  onPick,
}: {
  mode: LaunchMode | null;
  selected: StrategyKey | null;
  onPick: (key: StrategyKey | null) => void;
}) {
  const skippable = mode === "custom";
  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {STRATEGY_ORDER.map((key) => {
          const p = STRATEGY_PRESETS[key];
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{p.label}</span>
                <span
                  className={cn(
                    "font-g6-mono text-[9px] uppercase",
                    p.verified ? "text-[hsl(var(--success-text))]" : "text-muted-foreground"
                  )}
                  title={p.verified ? "Verified from workspace" : "Inferred default — confirm"}
                >
                  {p.verified ? "[V]" : "[I]"}
                </span>
              </div>
              <span className="text-xs leading-snug text-muted-foreground">{p.tagline}</span>
              <span className="font-g6-mono text-[11px] text-foreground">{structureSummary(key)}</span>
            </button>
          );
        })}
      </div>

      {skippable && (
        <button
          type="button"
          onClick={() => onPick(null)}
          aria-pressed={selected === null}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-left text-sm transition-colors",
            selected === null
              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted/50"
          )}
        >
          <span className="font-medium">Skip — no preset</span>
          <span className="text-xs">Configure structure & budget manually downstream.</span>
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Step C — Objective ───────────────────────── */

function StepObjective({
  selected,
  onPick,
}: {
  selected: LaunchObjective | null;
  onPick: (obj: LaunchObjective) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OBJECTIVE_CARDS.map((c) => {
        const active = selected === c.objective;
        return (
          <button
            key={c.objective}
            type="button"
            onClick={() => onPick(c.objective)}
            aria-pressed={active}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
              active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{c.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{c.blurb}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
