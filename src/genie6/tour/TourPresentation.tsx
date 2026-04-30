import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  X,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourStep } from "./tourSteps";

/**
 * TourPresentation — guided tour of Genie 6.0 (R-1).
 *
 * Two phases auto-driven by the step kind:
 *   - kind: "slide"  full-page narrative, prev/next/skip
 *   - kind: "walk"   navigates to the live route, floats a step panel
 *                    over the actual UI so audiences see the screen + the
 *                    why simultaneously.
 *
 * Replaces the previous WizardTour stub. Mounted at /iq/genie6/wizard.
 * "Tour" sidebar item routes here. Use ◀ / ▶ or arrow keys to navigate,
 * Esc to exit (drops user back to the dashboard).
 */
export function TourPresentation() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);

  const step = TOUR_STEPS[idx];
  const isLast = idx >= TOUR_STEPS.length - 1;
  const isFirst = idx === 0;

  // Drive route nav on every walk step
  useEffect(() => {
    if (!started || step.kind !== "walk") return;
    navigate(step.route);
  }, [started, step, navigate]);

  // Keyboard
  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        exit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, idx]);

  const next = () => {
    if (isLast) {
      exit();
      return;
    }
    setIdx((i) => i + 1);
  };
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const exit = () => {
    setStarted(false);
    setIdx(0);
    navigate("/iq/genie6");
  };

  /* ─────────────── Splash ─────────────── */
  if (!started) {
    return (
      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-g6-2xl bg-g6-primary-bg shadow-g6-glow">
          <Sparkles className="h-9 w-9 text-g6-primary-active" />
        </div>
        <div className="space-y-2">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            Genie 6.0 · guided tour
          </p>
          <h1 className="text-g6-h1 font-black tracking-tight text-g6-text">
            From the brief to the build — in 12 stops.
          </h1>
          <p className="mx-auto max-w-xl text-g6-base text-g6-text-secondary">
            5 minute intro · 2 minute overview · then a storytelling walkthrough of every
            screen, why it's there, what's locked, what's open. For Marketing · CEO · Engineering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="inline-flex h-11 items-center gap-2 rounded-g6-pill bg-g6-primary px-6 text-g6-base font-bold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Play className="h-4 w-4" /> Start tour
          </button>
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setIdx(TOUR_STEPS.findIndex((s) => s.kind === "walk"));
            }}
            className="inline-flex h-11 items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container px-5 text-g6-sm font-medium text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
          >
            Skip slides → walk the app
          </button>
        </div>
        <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
          ← / → to navigate · Esc to exit
        </p>
      </div>
    );
  }

  /* ─────────────── Slide phase ─────────────── */
  if (step.kind === "slide") {
    return (
      <SlideView
        step={step}
        idx={idx}
        total={TOUR_STEPS.length}
        onPrev={prev}
        onNext={next}
        onExit={exit}
        isFirst={isFirst}
        isLast={isLast}
      />
    );
  }

  /* ─────────────── Walk phase ─────────────── */
  return (
    <WalkOverlay
      step={step}
      idx={idx}
      total={TOUR_STEPS.length}
      onPrev={prev}
      onNext={next}
      onExit={exit}
      isFirst={isFirst}
      isLast={isLast}
    />
  );
}

/* ─────────────────────────────────────────────────── */

function SlideView({
  step,
  idx,
  total,
  onPrev,
  onNext,
  onExit,
  isFirst,
  isLast,
}: {
  step: Extract<TourStep, { kind: "slide" }>;
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="g6-halo relative flex min-h-full flex-col px-12 py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          {step.eyebrow ?? "Genie 6.0 · tour"}
        </p>
        <div className="flex items-center gap-3">
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="text-g6-text-tertiary hover:text-g6-text"
            aria-label="Exit tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="g6-fade-up relative z-10 my-auto flex max-w-5xl flex-col gap-6 py-8">
        <h1 className="text-[clamp(2rem,4vw,3.4rem)] font-black tracking-[-0.025em] leading-[1.05] text-g6-text">
          {step.title}
        </h1>
        {step.subtitle && (
          <p className="max-w-3xl text-g6-h5 leading-snug text-g6-text-secondary">
            {step.subtitle}
          </p>
        )}

        {step.bullets && (
          <ul className="space-y-2 text-g6-base text-g6-text-secondary">
            {step.bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 g6-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-g6-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {step.sections && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {step.sections.map((sec, i) => (
              <div
                key={i}
                className="g6-fade-up rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <p className="font-g6-mono text-[11px] uppercase tracking-wider text-g6-primary mb-2">
                  {sec.title}
                </p>
                <ul className="space-y-1.5 text-g6-sm text-g6-text-secondary">
                  {sec.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 leading-snug">
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-g6-text-tertiary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {step.footnote && (
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-primary">
            {step.footnote}
          </p>
        )}
      </div>

      {/* Footer nav */}
      <NavBar
        onPrev={onPrev}
        onNext={onNext}
        isFirst={isFirst}
        isLast={isLast}
        progress={(idx + 1) / total}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────── */

function WalkOverlay({
  step,
  idx,
  total,
  onPrev,
  onNext,
  onExit,
  isFirst,
  isLast,
}: {
  step: Extract<TourStep, { kind: "walk" }>;
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-[60] inline-flex h-11 items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-elevated/95 px-4 font-g6-sans text-g6-sm font-semibold text-g6-text shadow-g6-lg backdrop-blur-md hover:bg-g6-bg-elevated"
      >
        <Sparkles className="h-3.5 w-3.5 text-g6-primary" />
        Tour · {idx + 1}/{total}
        <Maximize2 className="h-3 w-3 text-g6-text-tertiary" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "g6-fade-up fixed bottom-6 right-6 z-[60] w-[420px] max-w-[calc(100vw-2rem)] rounded-g6-card border border-g6-border bg-g6-bg-elevated/97 p-5 shadow-g6-lg backdrop-blur-xl"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-primary">
          {step.eyebrow}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-g6-mono text-[10px] text-g6-text-tertiary tabular-nums">
            {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="text-g6-text-tertiary hover:text-g6-text"
            aria-label="Collapse"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
          </button>
          <button
            type="button"
            onClick={onExit}
            className="text-g6-text-tertiary hover:text-g6-text"
            aria-label="Exit tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h2 className="mt-1 text-g6-h4 font-bold leading-tight text-g6-text">
        {step.title}
      </h2>
      <p className="mt-2 text-g6-sm leading-snug text-g6-text-secondary">
        {step.description}
      </p>

      {step.tips && step.tips.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-g6-border-secondary pt-3 text-g6-xs text-g6-text-secondary">
          {step.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-g6-primary" />
              <span className="leading-snug">{t}</span>
            </li>
          ))}
        </ul>
      )}

      <NavBar
        onPrev={onPrev}
        onNext={onNext}
        isFirst={isFirst}
        isLast={isLast}
        progress={(idx + 1) / total}
        compact
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────── */

function NavBar({
  onPrev,
  onNext,
  isFirst,
  isLast,
  progress,
  compact,
}: {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center justify-between gap-3",
        compact && "mt-4"
      )}
    >
      <div className="flex-1">
        <div className="h-1 w-full rounded-full bg-g6-border-secondary">
          <div
            className="h-1 rounded-full bg-g6-primary transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text disabled:opacity-40",
            compact && "h-8 w-8"
          )}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            "inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-bold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:scale-[1.02] active:scale-[0.99]",
            compact ? "h-8" : "h-9"
          )}
        >
          {isLast ? "Finish" : "Next"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
